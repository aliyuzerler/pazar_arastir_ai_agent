/**
 * Fiyat geçmişi istatistikleri (saf fonksiyonlar).
 * Kuyruk/medyan hesapları sayısal olarak yapılır; parasal hesaplar Faz 6'da
 * Decimal.js ile yapılır. Farklı para birimleri karıştırılmaz (TEST_05 md-8).
 */
export interface PricePoint {
  observedAt: string; // ISO
  priceAmount: string;
  currency: string;
  availabilityStatus?: string;
  stockQuantity?: number | null;
}

export interface PriceStats {
  count: number;
  first?: PricePoint;
  last?: PricePoint;
  min?: number;
  max?: number;
  median?: number;
  changePercent?: number | null;
  currency?: string;
}

export function computePriceStats(points: PricePoint[]): PriceStats {
  if (points.length === 0) return { count: 0 };
  const sorted = [...points].sort(
    (a, b) => new Date(a.observedAt).getTime() - new Date(b.observedAt).getTime(),
  );
  const prices = sorted.map((point) => Number(point.priceAmount));
  const currencies = new Set(sorted.map((point) => point.currency));
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const sortedPrices = [...prices].sort((a, b) => a - b);
  const mid = Math.floor(sortedPrices.length / 2);
  const median =
    sortedPrices.length % 2 === 0
      ? (sortedPrices[mid - 1] + sortedPrices[mid]) / 2
      : sortedPrices[mid];
  const firstPrice = Number(first.priceAmount);
  const lastPrice = Number(last.priceAmount);

  return {
    count: sorted.length,
    first,
    last,
    min: Math.min(...prices),
    max: Math.max(...prices),
    median,
    changePercent:
      firstPrice === 0 ? null : Number((((lastPrice - firstPrice) / firstPrice) * 100).toFixed(2)),
    currency: currencies.size === 1 ? sorted[0].currency : undefined,
  };
}

/**
 * Gözlem dedupe politikası: aynı teklif + aynı UTC gün + aynı fiyat + aynı
 * bulunabilirlik → yeni kayıt açılmaz (veri hacmi politikası, docs/03 §3).
 */
export function isDuplicateObservation(
  existing: { observedAt: Date | string; priceAmount: string; availabilityStatus: string; offerId: string | null }[],
  candidate: { observedAt: string; priceAmount: string; availabilityStatus: string; offerId: string | null },
): boolean {
  const candidateDay = candidate.observedAt.slice(0, 10);
  return existing.some(
    (row) =>
      row.offerId === candidate.offerId &&
      // numeric sürücüye göre string veya number dönebilir; sayısal karşılaştır.
      Number(row.priceAmount) === Number(candidate.priceAmount) &&
      row.availabilityStatus === candidate.availabilityStatus &&
      (typeof row.observedAt === "string" ? row.observedAt : row.observedAt.toISOString()).slice(0, 10) ===
        candidateDay,
  );
}
