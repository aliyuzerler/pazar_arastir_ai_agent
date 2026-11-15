/**
 * PriceHistoryService: araştırma koşusundan gözlem kaydı + geçmiş sorgulama.
 */
import { and, asc, eq, gte } from "drizzle-orm";

import type { AppDatabase } from "@/server/db/driver";
import { priceObservations, type PriceObservation } from "@/server/db/schema";
import { isDuplicateObservation } from "@/server/domain/price-history";
import type { NormalizedOffer, ProviderPricePoint } from "@/server/providers/contracts";

/**
 * Koşu sonunda gözlem yazar (idempotent dedupe ile). Provider geçmiş
 * noktaları ayrı source_kind ile kaydedilir; old_price asla tarih noktası
 * yapılmaz (docs/04 §3).
 */
export async function recordObservationsFromResearch(
  db: AppDatabase,
  workspaceId: string,
  productId: string,
  offers: NormalizedOffer[],
  offerRowIds: Map<string, string>,
  providerHistory: ProviderPricePoint[],
): Promise<{ snapshots: number; history: number; skipped: number }> {
  const dayStart = new Date();
  dayStart.setUTCHours(0, 0, 0, 0);

  const todays = await db
    .select({
      offerId: priceObservations.offerId,
      priceAmount: priceObservations.priceAmount,
      availabilityStatus: priceObservations.availabilityStatus,
      observedAt: priceObservations.observedAt,
    })
    .from(priceObservations)
    .where(
      and(
        eq(priceObservations.workspaceId, workspaceId),
        eq(priceObservations.productId, productId),
        gte(priceObservations.observedAt, dayStart),
        eq(priceObservations.sourceKind, "our_snapshot"),
      ),
    );

  let snapshots = 0;
  let skipped = 0;

  for (const offer of offers) {
    const offerRowId = offerRowIds.get(offer.providerOfferId);
    if (!offerRowId) continue;
    const candidate = {
      observedAt: new Date().toISOString(),
      priceAmount: offer.priceAmount,
      availabilityStatus: offer.availabilityStatus,
      offerId: offerRowId,
    };
    if (isDuplicateObservation(todays, candidate)) {
      skipped += 1;
      continue;
    }
    await db.insert(priceObservations).values({
      workspaceId,
      offerId: offerRowId,
      productId,
      observedAt: new Date(),
      priceAmount: offer.priceAmount,
      currency: offer.currency,
      shippingAmount: offer.shippingAmount,
      deliveredTotalAmount: offer.deliveredTotalAmount,
      availabilityStatus: offer.availabilityStatus,
      stockQuantity: offer.stockQuantity,
      sourceKind: "our_snapshot",
      isDemo: offer.isDemo,
    });
    snapshots += 1;
  }

  let history = 0;
  for (const point of providerHistory) {
    const exists = await db
      .select({ id: priceObservations.id })
      .from(priceObservations)
      .where(
        and(
          eq(priceObservations.workspaceId, workspaceId),
          eq(priceObservations.productId, productId),
          eq(priceObservations.sourceKind, "provider_history"),
          eq(priceObservations.observedAt, new Date(point.observedAt)),
          eq(priceObservations.priceAmount, point.priceAmount),
        ),
      )
      .limit(1);
    if (exists[0]) {
      skipped += 1;
      continue;
    }
    await db.insert(priceObservations).values({
      workspaceId,
      productId,
      observedAt: new Date(point.observedAt),
      priceAmount: point.priceAmount,
      currency: point.currency,
      sourceKind: "provider_history",
      sourceRecordId: `${point.providerId}`,
      isDemo: point.isDemo,
    });
    history += 1;
  }

  return { snapshots, history, skipped };
}

export interface HistorySeries {
  ourSnapshots: PriceObservation[];
  providerHistory: PriceObservation[];
}

export async function listObservations(
  db: AppDatabase,
  workspaceId: string,
  productId: string,
): Promise<HistorySeries> {
  const rows = await db
    .select()
    .from(priceObservations)
    .where(and(eq(priceObservations.workspaceId, workspaceId), eq(priceObservations.productId, productId)))
    .orderBy(asc(priceObservations.observedAt));
  return {
    ourSnapshots: rows.filter((row) => row.sourceKind === "our_snapshot"),
    providerHistory: rows.filter((row) => row.sourceKind === "provider_history"),
  };
}
