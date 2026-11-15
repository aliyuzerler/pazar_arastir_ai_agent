/**
 * Teklif ve eşleşme repository. Tüm fonksiyonlar workspace kapsamlıdır.
 */
import { and, desc, eq } from "drizzle-orm";

import type { AppDatabase } from "@/server/db/driver";
import { offers, productMatches, products, type Offer, type ProductMatch } from "@/server/db/schema";
import type { NormalizedOffer } from "@/server/providers/contracts";
import type { MatchDecision } from "@/server/domain/matching";

function toOfferRow(
  workspaceId: string,
  productId: string,
  offer: NormalizedOffer,
): typeof offers.$inferInsert {
  return {
    workspaceId,
    productId,
    providerId: offer.providerId,
    providerOfferId: offer.providerOfferId,
    title: offer.title,
    brand: offer.brand ?? null,
    model: offer.model ?? null,
    mpn: offer.mpn ?? null,
    gtin: offer.gtin ?? null,
    sellerName: offer.sellerName,
    marketplace: offer.marketplace ?? null,
    productUrl: offer.productUrl,
    imageUrl: offer.imageUrl ?? null,
    priceAmount: offer.priceAmount,
    currency: offer.currency,
    shippingAmount: offer.shippingAmount,
    deliveredTotalAmount: offer.deliveredTotalAmount,
    availabilityStatus: offer.availabilityStatus,
    stockQuantity: offer.stockQuantity,
    rating: offer.rating,
    reviewCount: offer.reviewCount,
    condition: offer.condition ?? null,
    variantAttributes: offer.variantAttributes ?? null,
    isDemo: offer.isDemo,
    rawReference: (offer.rawReference as Record<string, unknown> | null) ?? null,
    lastObservedAt: new Date(offer.observedAt),
  };
}

/**
 * Teklifi workspace+provider+providerOfferId anahtarıyla upsert eder.
 * İlk görülme tarihi korunur; fiyat/stok son duruma güncellenir.
 */
export async function upsertOffer(
  db: AppDatabase,
  workspaceId: string,
  productId: string,
  offer: NormalizedOffer,
): Promise<Offer> {
  // Savunma katmanı: productId gerçekten bu workspace'e ait mi? (TEST_08)
  const owner = await db
    .select({ id: products.id })
    .from(products)
    .where(and(eq(products.id, productId), eq(products.workspaceId, workspaceId)))
    .limit(1);
  if (!owner[0]) {
    throw new Error("Ürün bu workspace'e ait değil; teklif yazılamaz.");
  }
  const row = toOfferRow(workspaceId, productId, offer);
  const existing = await db
    .select()
    .from(offers)
    .where(
      and(
        eq(offers.workspaceId, workspaceId),
        eq(offers.providerId, offer.providerId),
        eq(offers.providerOfferId, offer.providerOfferId),
      ),
    )
    .limit(1);

  if (existing[0]) {
    const updated = await db
      .update(offers)
      .set({
        priceAmount: row.priceAmount,
        shippingAmount: row.shippingAmount,
        deliveredTotalAmount: row.deliveredTotalAmount,
        availabilityStatus: row.availabilityStatus,
        stockQuantity: row.stockQuantity,
        title: row.title,
        sellerName: row.sellerName,
        productUrl: row.productUrl,
        lastSeenAt: new Date(),
        lastObservedAt: row.lastObservedAt,
      })
      .where(eq(offers.id, existing[0].id))
      .returning();
    return updated[0];
  }

  const inserted = await db.insert(offers).values(row).returning();
  return inserted[0];
}

export async function listOffersForProduct(
  db: AppDatabase,
  workspaceId: string,
  productId: string,
): Promise<Offer[]> {
  return db
    .select()
    .from(offers)
    .where(and(eq(offers.workspaceId, workspaceId), eq(offers.productId, productId)))
    .orderBy(desc(offers.lastSeenAt));
}

/**
 * Eşleşmeyi upsert eder. Onaylanmış/reddedilmiş kullanıcı kararı ASLA
 * otomatik sınıflandırmayla geri alınmaz (review_status korunur).
 */
export async function upsertMatch(
  db: AppDatabase,
  workspaceId: string,
  productId: string,
  offerId: string,
  decision: MatchDecision,
): Promise<ProductMatch> {
  const existing = await db
    .select()
    .from(productMatches)
    .where(and(eq(productMatches.productId, productId), eq(productMatches.offerId, offerId)))
    .limit(1);

  if (existing[0]) {
    const locked =
      existing[0].reviewStatus === "approved" || existing[0].reviewStatus === "rejected";
    const updated = await db
      .update(productMatches)
      .set(
        locked
          ? { matchScore: String(decision.matchScore) }
          : {
              matchType: decision.matchType,
              matchScore: String(decision.matchScore),
              matchMethod: decision.matchMethod,
              matchReasons: decision.matchReasons,
              differences: decision.differences,
            },
      )
      .where(eq(productMatches.id, existing[0].id))
      .returning();
    return updated[0];
  }

  const inserted = await db
    .insert(productMatches)
    .values({
      workspaceId,
      productId,
      offerId,
      matchType: decision.matchType,
      matchScore: String(decision.matchScore),
      matchMethod: decision.matchMethod,
      matchReasons: decision.matchReasons,
      differences: decision.differences,
    })
    .returning();
  return inserted[0];
}

export interface MatchWithOffer {
  match: ProductMatch;
  offer: Offer;
}

export async function listMatchesWithOffers(
  db: AppDatabase,
  workspaceId: string,
  productId: string,
): Promise<MatchWithOffer[]> {
  const rows = await db
    .select({ match: productMatches, offer: offers })
    .from(productMatches)
    .innerJoin(offers, eq(productMatches.offerId, offers.id))
    .where(and(eq(productMatches.workspaceId, workspaceId), eq(productMatches.productId, productId)))
    .orderBy(desc(productMatches.matchScore));
  return rows;
}

export async function reviewMatch(
  db: AppDatabase,
  workspaceId: string,
  matchId: string,
  decision: "approved" | "rejected",
): Promise<ProductMatch | null> {
  const updated = await db
    .update(productMatches)
    .set({
      reviewStatus: decision,
      reviewedAt: new Date(),
      matchType: decision === "rejected" ? "rejected" : undefined,
    })
    .where(and(eq(productMatches.id, matchId), eq(productMatches.workspaceId, workspaceId)))
    .returning();
  return updated[0] ?? null;
}

export async function getMatchById(
  db: AppDatabase,
  workspaceId: string,
  matchId: string,
): Promise<ProductMatch | null> {
  const rows = await db
    .select()
    .from(productMatches)
    .where(and(eq(productMatches.id, matchId), eq(productMatches.workspaceId, workspaceId)))
    .limit(1);
  return rows[0] ?? null;
}
