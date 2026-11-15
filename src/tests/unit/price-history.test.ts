import { describe, expect, it } from "vitest";

import { computePriceStats, isDuplicateObservation } from "@/server/domain/price-history";

describe("fiyat istatistikleri (TEST_05 md-5)", () => {
  const points = [
    { observedAt: "2026-11-01T09:00:00Z", priceAmount: "1200", currency: "TRY" },
    { observedAt: "2026-11-03T09:00:00Z", priceAmount: "1000", currency: "TRY" },
    { observedAt: "2026-11-05T09:00:00Z", priceAmount: "1100", currency: "TRY" },
    { observedAt: "2026-11-07T09:00:00Z", priceAmount: "1300", currency: "TRY" },
  ];

  it("ilk/son/min/max/medyan doğru hesaplanır", () => {
    const stats = computePriceStats(points);
    expect(stats.count).toBe(4);
    expect(stats.first?.observedAt).toContain("11-01");
    expect(stats.last?.observedAt).toContain("11-07");
    expect(stats.min).toBe(1000);
    expect(stats.max).toBe(1300);
    expect(stats.median).toBe(1150); // (1100+1200)/2
  });

  it("değişim yüzdesi ilk gözleme göre hesaplanır", () => {
    const stats = computePriceStats(points);
    expect(stats.changePercent).toBeCloseTo(8.33, 1);
  });

  it("boş seri hata vermez", () => {
    expect(computePriceStats([]).count).toBe(0);
  });

  it("farklı para birimleri karıştırılmaz", () => {
    const mixed = [
      ...points,
      { observedAt: "2026-11-09T09:00:00Z", priceAmount: "50", currency: "USD" },
    ];
    const stats = computePriceStats(mixed);
    expect(stats.currency).toBeUndefined(); // tek para birimi değilse tanımsız
  });
});

describe("gözlem dedupe politikası (TEST_05 md-2, md-10)", () => {
  const existing = [
    {
      offerId: "offer-1",
      priceAmount: "1299.9000",
      availabilityStatus: "in_stock",
      observedAt: "2026-11-15T09:00:00.000Z",
    },
  ];

  it("aynı gün + fiyat + stok → duplicate", () => {
    expect(
      isDuplicateObservation(existing, {
        offerId: "offer-1",
        priceAmount: "1299.9000",
        availabilityStatus: "in_stock",
        observedAt: "2026-11-15T17:30:00.000Z",
      }),
    ).toBe(true);
  });

  it("fiyat değişti → duplicate değil", () => {
    expect(
      isDuplicateObservation(existing, {
        offerId: "offer-1",
        priceAmount: "1249.0000",
        availabilityStatus: "in_stock",
        observedAt: "2026-11-15T17:30:00.000Z",
      }),
    ).toBe(false);
  });

  it("stok durumu değişti → duplicate değil", () => {
    expect(
      isDuplicateObservation(existing, {
        offerId: "offer-1",
        priceAmount: "1299.9000",
        availabilityStatus: "out_of_stock",
        observedAt: "2026-11-15T17:30:00.000Z",
      }),
    ).toBe(false);
  });

  it("ertesi gün → duplicate değil", () => {
    expect(
      isDuplicateObservation(existing, {
        offerId: "offer-1",
        priceAmount: "1299.9000",
        availabilityStatus: "in_stock",
        observedAt: "2026-11-16T09:00:00.000Z",
      }),
    ).toBe(false);
  });
});
