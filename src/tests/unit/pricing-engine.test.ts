import { describe, expect, it } from "vitest";

import {
  computeBreakEvenPrice,
  computeContribution,
  computeContributionMargin,
  computeCostBase,
  computeMarketStats,
  computeTargetPrice,
  computeVariableRate,
  buildRecommendation,
  PricingEngineError,
  roundPrice,
} from "@/server/domain/pricing-engine";
import Decimal from "decimal.js";

const COSTS = {
  unitCost: "850.00",
  inboundShippingPerUnit: "12.50",
  packagingCost: "3.00",
  otherFixedCost: "2.00",
};

const FEES = {
  marketplaceFeeRate: "0.15",
  paymentFeeRate: "0.02",
  otherVariableFeeRate: "0.01",
  fixedPerOrderCost: "10.00",
  targetMarginRate: "0.20",
};

describe("pricing engine — formüller (TEST_06 md-3)", () => {
  it("maliyet tabanı C doğru toplanır", () => {
    expect(computeCostBase(COSTS).toFixed(2)).toBe("867.50");
  });

  it("değişken kesinti oranı r toplanır", () => {
    expect(computeVariableRate(FEES).toFixed(2)).toBe("0.18");
  });

  it("başa baş fiyat = (C+F)/(1-r)", () => {
    const c = computeCostBase(COSTS);
    const r = computeVariableRate(FEES);
    const breakEven = computeBreakEvenPrice(c, new Decimal("10.00"), r);
    // (867.50 + 10) / 0.82 = 1070.1220
    expect(breakEven.toFixed(4)).toBe("1070.1220");
  });

  it("hedef fiyat = (C+F)/(1-r-m)", () => {
    const c = computeCostBase(COSTS);
    const r = computeVariableRate(FEES);
    const target = computeTargetPrice(c, new Decimal("10.00"), r, new Decimal("0.20"));
    // (877.50) / (0.62) = 1415.3226
    expect(target.toFixed(4)).toBe("1415.3226");
  });

  it("katkı ve katkı marjı tutarlı", () => {
    const c = computeCostBase(COSTS);
    const r = computeVariableRate(FEES);
    const price = new Decimal("1415.3226");
    const contribution = computeContribution(price, r, c, new Decimal("10.00"));
    const margin = computeContributionMargin(price, contribution);
    expect(margin.toFixed(4)).toBe("0.2000");
  });

  it("yuvarlama HALF_UP 2 hanedir", () => {
    expect(roundPrice(new Decimal("10.005")).toFixed(2)).toBe("10.01");
    expect(roundPrice(new Decimal("10.004")).toFixed(2)).toBe("10.00");
  });
});

describe("pricing engine — geçersiz girdiler (TEST_06 md-10)", () => {
  it("negatif maliyet reddedilir", () => {
    expect(() =>
      computeCostBase({ ...COSTS, unitCost: "-5" }),
    ).toThrowError(PricingEngineError);
  });

  it("1 ve üzeri kesinti oranı reddedilir", () => {
    expect(() => computeVariableRate({ ...FEES, marketplaceFeeRate: "1" })).toThrowError(PricingEngineError);
  });

  it("r+m >= 1 iken hedef fiyat tanımsızdır ve hataya dönüşür", () => {
    const c = computeCostBase(COSTS);
    const r = new Decimal("0.85");
    expect(() =>
      computeTargetPrice(c, new Decimal("10"), r, new Decimal("0.20")),
    ).toThrowError(PricingEngineError);
  });

  it("sıfıra bölme başa baş hesabında yakalanır", () => {
    const c = computeCostBase(COSTS);
    expect(() => computeBreakEvenPrice(c, new Decimal("10"), new Decimal("1"))).toThrowError(
      PricingEngineError,
    );
  });
});

describe("piyasa istatistikleri (TEST_06 md-4)", () => {
  const offers = [
    { offerId: "o1", priceAmount: "1000", currency: "TRY", matchType: "exact", reviewStatus: "pending" },
    { offerId: "o2", priceAmount: "1050", currency: "TRY", matchType: "exact", reviewStatus: "approved" },
    { offerId: "o3", priceAmount: "1100", currency: "TRY", matchType: "exact", reviewStatus: "pending" },
    { offerId: "o4", priceAmount: "1020", currency: "TRY", matchType: "likely_exact", reviewStatus: "pending" },
    { offerId: "o5", priceAmount: "5000", currency: "TRY", matchType: "exact", reviewStatus: "pending" }, // aykırı
    { offerId: "o6", priceAmount: "900", currency: "TRY", matchType: "substitute", reviewStatus: "pending" },
    { offerId: "o7", priceAmount: "980", currency: "TRY", matchType: "substitute", reviewStatus: "pending" },
    { offerId: "o8", priceAmount: "120", currency: "USD", matchType: "exact", reviewStatus: "pending" },
  ] as const;

  it("exact ve muadil ayrı istatistiki olarak üretilir", () => {
    const stats = computeMarketStats(offers as never, "TRY");
    expect(stats.exact.count).toBe(5);
    expect(stats.substitute.count).toBe(2);
    expect(stats.excludedByCurrency).toBe(1);
  });

  it("IQR aykırı teklif işaretlenir ama referans hesaba katılmaz", () => {
    const stats = computeMarketStats(offers as never, "TRY");
    expect(stats.exact.outlierIds).toContain("o5");
    // referans medyan aykırısız exact kümesinden: (1000,1020,1050,1100) medyanı
    expect(stats.exact.reference?.toFixed(2)).toBe("1035.00");
  });

  it("reddedilmiş teklifler istatistiğe girmez", () => {
    const stats = computeMarketStats(
      [
        { offerId: "r1", priceAmount: "999", currency: "TRY", matchType: "exact", reviewStatus: "rejected" },
        { offerId: "r2", priceAmount: "1000", currency: "TRY", matchType: "exact", reviewStatus: "pending" },
      ] as never,
      "TRY",
    );
    expect(stats.exact.count).toBe(1);
  });
});

describe("strateji önerileri (TEST_06 md-5, md-6)", () => {
  const market = computeMarketStats(
    [
      { offerId: "a", priceAmount: "1300", currency: "TRY", matchType: "exact", reviewStatus: "approved" },
      { offerId: "b", priceAmount: "1330", currency: "TRY", matchType: "exact", reviewStatus: "pending" },
      { offerId: "c", priceAmount: "1370", currency: "TRY", matchType: "exact", reviewStatus: "pending" },
      { offerId: "d", priceAmount: "1350", currency: "TRY", matchType: "exact", reviewStatus: "pending" },
      { offerId: "e", priceAmount: "1400", currency: "TRY", matchType: "substitute", reviewStatus: "pending" },
    ] as never,
    "TRY",
  );

  it("rekabetçi öneri exact medyanına eşittir ve deterministiktir", () => {
    const a = buildRecommendation({ costs: COSTS, fees: FEES, market, strategy: "competitive", taxMode: "not_modelled", commissionBase: "gross_price" });
    const b = buildRecommendation({ costs: COSTS, fees: FEES, market, strategy: "competitive", taxMode: "not_modelled", commissionBase: "gross_price" });
    expect(a.recommendedPrice.toFixed(2)).toBe("1340.00");
    expect(a.recommendedPrice.toFixed(2)).toBe(b.recommendedPrice.toFixed(2));
  });

  it("kâr odaklı öneri hedef fiyata eşittir", () => {
    const rec = buildRecommendation({ costs: COSTS, fees: FEES, market, strategy: "profit", taxMode: "not_modelled", commissionBase: "gross_price" });
    expect(rec.recommendedPrice.toFixed(2)).toBe("1415.32");
  });

  it("dengeli öneri referans ile hedef arasında olur", () => {
    const rec = buildRecommendation({ costs: COSTS, fees: FEES, market, strategy: "balanced", taxMode: "not_modelled", commissionBase: "gross_price" });
    const expected = new Decimal("1340").plus(new Decimal("1415.3226")).div(2).toDecimalPlaces(2);
    expect(rec.recommendedPrice.toFixed(2)).toBe(expected.toFixed(2));
  });

  it("beklenen katkı ve marj öneriye göre hesaplanır", () => {
    const rec = buildRecommendation({ costs: COSTS, fees: FEES, market, strategy: "competitive", taxMode: "not_modelled", commissionBase: "gross_price" });
    // 1340 * 0.82 - 877.50 = 221.30
    expect(rec.expectedContribution.toFixed(2)).toBe("221.30");
    expect(rec.expectedMargin.toFixed(4)).toBe("0.1651");
    expect(rec.confidenceScore.greaterThan(0.8)).toBe(true);
  });

  it("piyasa verisi yoksa NO_MARKET_PRICE hatası verir", () => {
    const empty = computeMarketStats([], "TRY");
    expect(() =>
      buildRecommendation({ costs: COSTS, fees: FEES, market: empty, strategy: "competitive", taxMode: "not_modelled", commissionBase: "gross_price" }),
    ).toThrowError(PricingEngineError);
  });
});
