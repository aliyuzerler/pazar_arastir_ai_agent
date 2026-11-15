/**
 * Fiyat öneri servisi: ürün + onaylı piyasa teklifleri + maliyet profili →
 * deterministik öneri (hesap girdileri anlık görüntüyle saklanır).
 */
import { and, desc, eq } from "drizzle-orm";

import type { AppDatabase } from "@/server/db/driver";
import {
  pricingRecommendations,
  pricingProfiles,
  type PricingProfile,
  type PricingRecommendation,
} from "@/server/db/schema";
import type { Product } from "@/server/db/schema";
import { listMatchesWithOffers } from "@/server/db/repositories/offer-repository";
import {
  buildRecommendation,
  computeMarketStats,
  PricingEngineError,
  type MarketOfferInput,
  type PricingStrategy,
} from "@/server/domain/pricing-engine";

/** Ürünün profilini çözer: önce ürün bağlantısı, yoksa workspace default'u. */
export async function resolvePricingProfile(
  db: AppDatabase,
  workspaceId: string,
  product: Product,
): Promise<PricingProfile | null> {
  if (product.pricingProfileId) {
    const rows = await db
      .select()
      .from(pricingProfiles)
      .where(and(eq(pricingProfiles.id, product.pricingProfileId), eq(pricingProfiles.workspaceId, workspaceId)))
      .limit(1);
    if (rows[0]) return rows[0];
  }
  const defaults = await db
    .select()
    .from(pricingProfiles)
    .where(and(eq(pricingProfiles.workspaceId, workspaceId), eq(pricingProfiles.isDefault, true)))
    .limit(1);
  return defaults[0] ?? null;
}

export interface ComputePricingResult {
  recommendations: PricingRecommendation[];
  profile: PricingProfile | null;
  marketSummary: { exactCount: number; substituteCount: number; excludedByCurrency: number };
}

/** Ürün için üç stratejiyi hesaplar ve hepsini geçmişe kaydeder. */
export async function computeAndSaveRecommendations(
  db: AppDatabase,
  workspaceId: string,
  product: Product,
  options: { researchRunId?: string | null; profileOverrideId?: string | null } = {},
): Promise<ComputePricingResult> {
  const profile = options.profileOverrideId
    ? (
        await db
          .select()
          .from(pricingProfiles)
          .where(and(eq(pricingProfiles.id, options.profileOverrideId), eq(pricingProfiles.workspaceId, workspaceId)))
          .limit(1)
      )[0] ?? null
    : await resolvePricingProfile(db, workspaceId, product);

  if (!profile) {
    throw new PricingEngineError(
      "NO_MARKET_PRICE",
      "Fiyatlandırma profili bulunamadı; önce bir profil oluşturun.",
    );
  }

  const matches = await listMatchesWithOffers(db, workspaceId, product.id);
  const marketInputs: MarketOfferInput[] = matches.map((entry) => ({
    offerId: entry.offer.id,
    priceAmount: entry.offer.priceAmount,
    currency: entry.offer.currency,
    matchType: entry.match.matchType as MarketOfferInput["matchType"],
    reviewStatus: entry.match.reviewStatus,
  }));
  const market = computeMarketStats(marketInputs, product.currency);

  const fees = {
    marketplaceFeeRate: profile.marketplaceFeeRate,
    paymentFeeRate: profile.paymentFeeRate,
    otherVariableFeeRate: profile.otherVariableFeeRate,
    fixedPerOrderCost: profile.fixedPerOrderCost,
    targetMarginRate: profile.targetMarginRate,
  };
  const costs = {
    unitCost: product.unitCost,
    inboundShippingPerUnit: product.inboundShippingPerUnit,
    packagingCost: product.packagingCost,
    otherFixedCost: product.otherFixedCost,
  };

  const strategies: PricingStrategy[] = ["competitive", "balanced", "profit"];
  const saved: PricingRecommendation[] = [];

  for (const strategy of strategies) {
    const result = buildRecommendation({
      costs,
      fees,
      market,
      strategy,
      taxMode: profile.taxMode,
      commissionBase: profile.commissionBase,
    });

    const inserted = await db
      .insert(pricingRecommendations)
      .values({
        workspaceId,
        productId: product.id,
        researchRunId: options.researchRunId ?? null,
        pricingProfileId: profile.id,
        strategy,
        recommendedPrice: result.recommendedPrice.toFixed(4),
        currency: product.currency,
        breakEvenPrice: result.breakEvenPrice.toFixed(4),
        targetPrice: result.targetPrice.toFixed(4),
        expectedContribution: result.expectedContribution.toFixed(4),
        expectedMargin: result.expectedMargin.toFixed(4),
        marketReferencePrice: result.marketReferencePrice?.toFixed(4) ?? null,
        confidenceScore: result.confidenceScore.toFixed(2),
        calculationInputs: {
          costs,
          fees,
          taxMode: profile.taxMode,
          commissionBase: profile.commissionBase,
          market: {
            exactCount: market.exact.count,
            substituteCount: market.substitute.count,
            excludedByCurrency: market.excludedByCurrency,
            exactOutlierIds: market.exact.outlierIds,
            exactMin: market.exact.min?.toFixed() ?? null,
            exactMax: market.exact.max?.toFixed() ?? null,
            reference: market.exact.reference?.toFixed() ?? null,
          },
        },
        explanation: result.explanation,
        warnings: result.warnings,
      })
      .returning();
    saved.push(inserted[0]);
  }

  return {
    recommendations: saved,
    profile,
    marketSummary: {
      exactCount: market.exact.count,
      substituteCount: market.substitute.count,
      excludedByCurrency: market.excludedByCurrency,
    },
  };
}

export async function listRecommendations(
  db: AppDatabase,
  workspaceId: string,
  productId: string,
  limit = 20,
): Promise<PricingRecommendation[]> {
  return db
    .select()
    .from(pricingRecommendations)
    .where(and(eq(pricingRecommendations.workspaceId, workspaceId), eq(pricingRecommendations.productId, productId)))
    .orderBy(desc(pricingRecommendations.createdAt))
    .limit(limit);
}

// Profil CRUD (workspace kapsamlı)
export async function listProfiles(db: AppDatabase, workspaceId: string): Promise<PricingProfile[]> {
  return db.select().from(pricingProfiles).where(eq(pricingProfiles.workspaceId, workspaceId)).orderBy(pricingProfiles.name);
}

export async function createProfile(
  db: AppDatabase,
  workspaceId: string,
  values: Omit<typeof pricingProfiles.$inferInsert, "workspaceId" | "id">,
): Promise<PricingProfile> {
  // İşaretlendiyse veya workspace'te hiç default yoksa bu profil default olur.
  const existingDefault = await db
    .select({ id: pricingProfiles.id })
    .from(pricingProfiles)
    .where(and(eq(pricingProfiles.workspaceId, workspaceId), eq(pricingProfiles.isDefault, true)))
    .limit(1);
  const isDefault = values.isDefault === true || existingDefault.length === 0;

  if (isDefault) {
    await db
      .update(pricingProfiles)
      .set({ isDefault: false })
      .where(and(eq(pricingProfiles.workspaceId, workspaceId), eq(pricingProfiles.isDefault, true)));
  }
  const inserted = await db
    .insert(pricingProfiles)
    .values({ ...values, isDefault, workspaceId })
    .returning();
  return inserted[0];
}

export async function updateProfile(
  db: AppDatabase,
  workspaceId: string,
  profileId: string,
  values: Partial<Omit<typeof pricingProfiles.$inferInsert, "workspaceId" | "id">>,
): Promise<PricingProfile | null> {
  if (values.isDefault) {
    await db
      .update(pricingProfiles)
      .set({ isDefault: false })
      .where(and(eq(pricingProfiles.workspaceId, workspaceId), eq(pricingProfiles.isDefault, true)));
  }
  const updated = await db
    .update(pricingProfiles)
    .set({ ...values, updatedAt: new Date() })
    .where(and(eq(pricingProfiles.id, profileId), eq(pricingProfiles.workspaceId, workspaceId)))
    .returning();
  return updated[0] ?? null;
}
