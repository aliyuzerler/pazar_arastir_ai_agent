/**
 * Açıklanabilir fiyatlandırma motoru (pricing-engine skill).
 *
 * Formüller (bütün hesaplar Decimal.js ile; float aritmetiği YOK):
 *   C = birim alış + giriş kargo/birim + paketleme + diğer sabit
 *   F = sipariş başına sabit maliyet
 *   r = toplam değişken kesinti oranı (pazaryeri + ödeme + diğer)
 *   m = hedef katkı marjı oranı
 *   Başa baş fiyat  = (C + F) / (1 - r)          [r < 1]
 *   Hedef fiyat     = (C + F) / (1 - r - m)      [r + m < 1]
 *   Katkı           = P * (1 - r) - (C + F)
 *   Katkı marjı     = Katkı / P
 *
 * AI asla nihai fiyat yazmaz; tüm öneriler deterministiktir.
 */
import Decimal from "decimal.js";

Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

export class PricingEngineError extends Error {
  readonly code:
    | "INVALID_COST"
    | "INVALID_RATE"
    | "RATE_SUM_TOO_HIGH"
    | "ZERO_DIVISION"
    | "CURRENCY_MISMATCH"
    | "NO_MARKET_PRICE";

  constructor(code: PricingEngineError["code"], message: string) {
    super(message);
    this.name = "PricingEngineError";
    this.code = code;
  }
}

function requireNonNegativeAmount(value: string | Decimal | null | undefined, field: string): Decimal {
  const parsed = new Decimal(value === "" || value === null || value === undefined ? "0" : value);
  if (!parsed.isFinite() || parsed.isNegative()) {
    throw new PricingEngineError("INVALID_COST", `${field} negatif veya sayısal değil.`);
  }
  return parsed;
}

function requireRate(value: string | Decimal | null | undefined, field: string): Decimal {
  const parsed = new Decimal(value === "" || value === null || value === undefined ? "0" : value);
  if (!parsed.isFinite() || parsed.isNegative() || parsed.greaterThanOrEqualTo(1)) {
    throw new PricingEngineError("INVALID_RATE", `${field} 0 ile 1 arasında olmalıdır.`);
  }
  return parsed;
}

export interface CostInputs {
  unitCost: string;
  inboundShippingPerUnit: string;
  packagingCost: string;
  otherFixedCost: string;
}

export interface FeeInputs {
  marketplaceFeeRate: string;
  paymentFeeRate: string;
  otherVariableFeeRate: string;
  fixedPerOrderCost: string;
  targetMarginRate: string;
}

export function computeCostBase(inputs: CostInputs): Decimal {
  return requireNonNegativeAmount(inputs.unitCost, "Birim maliyet")
    .plus(requireNonNegativeAmount(inputs.inboundShippingPerUnit, "Giriş kargo"))
    .plus(requireNonNegativeAmount(inputs.packagingCost, "Paketleme"))
    .plus(requireNonNegativeAmount(inputs.otherFixedCost, "Diğer sabit maliyet"));
}

/** r = pazaryeri + ödeme + diğer değişken kesinti (her biri < 1, toplam < 1 zorunlu). */
export function computeVariableRate(fees: Pick<FeeInputs, "marketplaceFeeRate" | "paymentFeeRate" | "otherVariableFeeRate">): Decimal {
  const rate = requireRate(fees.marketplaceFeeRate, "Pazaryeri komisyonu")
    .plus(requireRate(fees.paymentFeeRate, "Ödeme komisyonu"))
    .plus(requireRate(fees.otherVariableFeeRate, "Diğer değişken kesinti"));
  if (rate.greaterThanOrEqualTo(1)) {
    throw new PricingEngineError(
      "RATE_SUM_TOO_HIGH",
      "Toplam değişken kesinti oranı 1'e eşit/geçti; geçerli fiyat hesaplanamaz.",
    );
  }
  return rate;
}

export function computeBreakEvenPrice(costBase: Decimal, fixedPerOrder: Decimal, variableRate: Decimal): Decimal {
  const denominator = new Decimal(1).minus(variableRate);
  if (denominator.lessThanOrEqualTo(0)) {
    throw new PricingEngineError("ZERO_DIVISION", "Kesinti oranı başa baş hesabını imkânsız kılıyor.");
  }
  return costBase.plus(requireNonNegativeAmount(fixedPerOrder.toFixed(), "Sipariş sabiti")).div(denominator);
}

export function computeTargetPrice(costBase: Decimal, fixedPerOrder: Decimal, variableRate: Decimal, targetMargin: string | Decimal): Decimal {
  const margin = requireRate(targetMargin, "Hedef marj");
  const denominator = new Decimal(1).minus(variableRate).minus(margin);
  if (denominator.lessThanOrEqualTo(0)) {
    throw new PricingEngineError(
      "RATE_SUM_TOO_HIGH",
      "Kesinti + hedef marj toplamı 1'e eşit/geçti; hedef fiyat tanımsız.",
    );
  }
  return costBase.plus(requireNonNegativeAmount(fixedPerOrder.toFixed(), "Sipariş sabiti")).div(denominator);
}

export function computeContribution(price: Decimal, variableRate: Decimal, costBase: Decimal, fixedPerOrder: Decimal): Decimal {
  if (price.lessThanOrEqualTo(0)) {
    throw new PricingEngineError("INVALID_COST", "Fiyat sıfırdan büyük olmalıdır.");
  }
  return price.times(new Decimal(1).minus(variableRate)).minus(costBase.plus(fixedPerOrder));
}

export function computeContributionMargin(price: Decimal, contribution: Decimal): Decimal {
  if (price.lessThanOrEqualTo(0)) {
    throw new PricingEngineError("INVALID_COST", "Fiyat sıfırdan büyük olmalıdır.");
  }
  return contribution.div(price);
}

/** Gösterim için 2 haneye HALF_UP yuvarlama (hesaplar ham Decimal ile). */
export function roundPrice(value: Decimal): Decimal {
  return value.toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
}

// ---------------------------------------------------------------------------
// Piyasa istatistikleri
// ---------------------------------------------------------------------------

export interface MarketOfferInput {
  priceAmount: string;
  currency: string;
  matchType: "exact" | "likely_exact" | "substitute" | "unreviewed" | "rejected";
  reviewStatus: string;
  offerId: string;
}

export interface MarketStats {
  currency: string;
  exact: { count: number; min: Decimal | null; max: Decimal | null; median: Decimal | null; reference: Decimal | null; outlierIds: string[] };
  substitute: { count: number; min: Decimal | null; max: Decimal | null; median: Decimal | null; outlierIds: string[] };
  excludedByCurrency: number;
}

function percentile(sorted: Decimal[], q: Decimal): Decimal {
  if (sorted.length === 0) return new Decimal(0);
  if (sorted.length === 1) return sorted[0];
  const index = q.times(sorted.length - 1);
  const lower = index.floor().toNumber();
  const upper = Math.min(lower + 1, sorted.length - 1);
  const fraction = index.minus(lower);
  return sorted[lower].plus(sorted[upper].minus(sorted[lower]).times(fraction));
}

function seriesStats(prices: { id: string; price: Decimal }[]) {
  if (prices.length === 0) {
    return { count: 0, min: null, max: null, median: null, outlierIds: [] as string[] };
  }
  const sorted = [...prices].sort((a, b) => a.price.comparedTo(b.price));
  const values = sorted.map((entry) => entry.price);
  const q1 = percentile(values, new Decimal(0.25));
  const q3 = percentile(values, new Decimal(0.75));
  const iqr = q3.minus(q1);
  const lowerBound = q1.minus(iqr.times(1.5));
  const upperBound = q3.plus(iqr.times(1.5));
  const outlierIds = prices
    .filter((entry) => entry.price.lessThan(lowerBound) || entry.price.greaterThan(upperBound))
    .map((entry) => entry.id);
  const median = percentile(values, new Decimal(0.5));
  return {
    count: prices.length,
    min: values[0],
    max: values[values.length - 1],
    median,
    outlierIds,
  };
}

/**
 * Exact ve muadil teklifler AYRI istatistiklenir; farklı para birimi
 * toplanamaz (bilinen FX yok) ve sayılır.
 */
export function computeMarketStats(offers: MarketOfferInput[], targetCurrency: string): MarketStats {
  const exactPrices: { id: string; price: Decimal }[] = [];
  const substitutePrices: { id: string; price: Decimal }[] = [];
  let excludedByCurrency = 0;

  for (const offer of offers) {
    if (offer.reviewStatus === "rejected") continue;
    if (offer.currency !== targetCurrency) {
      excludedByCurrency += 1;
      continue;
    }
    const price = new Decimal(offer.priceAmount);
    if (offer.matchType === "exact" || offer.matchType === "likely_exact") {
      exactPrices.push({ id: offer.offerId, price });
    } else if (offer.matchType === "substitute") {
      substitutePrices.push({ id: offer.offerId, price });
    }
  }

  const exact = seriesStats(exactPrices);
  const substitute = seriesStats(substitutePrices);
  // Referans fiyat: aykırı olmayan exact tekliflerin medyanı; exact yoksa muadil medyanı.
  const exactNonOutlier = exactPrices.filter((entry) => !exact.outlierIds.includes(entry.id));
  const reference =
    exactNonOutlier.length > 0
      ? seriesStats(exactNonOutlier).median
      : substitute.median;

  return {
    currency: targetCurrency,
    exact: { ...exact, reference },
    substitute,
    excludedByCurrency,
  };
}

// ---------------------------------------------------------------------------
// Strateji önerileri
// ---------------------------------------------------------------------------

export type PricingStrategy = "competitive" | "balanced" | "profit";

export interface RecommendationInput {
  costs: CostInputs;
  fees: FeeInputs;
  market: MarketStats;
  strategy: PricingStrategy;
  taxMode: string;
  commissionBase: string;
}

export interface RecommendationResult {
  strategy: PricingStrategy;
  recommendedPrice: Decimal;
  breakEvenPrice: Decimal;
  targetPrice: Decimal;
  expectedContribution: Decimal;
  expectedMargin: Decimal;
  marketReferencePrice: Decimal | null;
  confidenceScore: Decimal; // 0-1
  warnings: string[];
  explanation: string[];
  belowBreakEven: boolean;
}

/** Güven skoru: örnek sayısı + exact/muadil kaynak kalitesi (deterministik). */
function computeConfidence(market: MarketStats): Decimal {
  const exactCount = market.exact.count;
  const substituteCount = market.substitute.count;
  const sampleScore = Decimal.min(1, new Decimal(exactCount).plus(substituteCount).div(5));
  const sourceCap = exactCount > 0 ? new Decimal(1) : new Decimal(0.5); // yalnız muadil → yarı güven
  return sampleScore.times(sourceCap).toDecimalPlaces(2);
}

export function buildRecommendation(input: RecommendationInput): RecommendationResult {
  const costBase = computeCostBase(input.costs);
  const fixedPerOrder = requireNonNegativeAmount(input.fees.fixedPerOrderCost, "Sipariş sabiti");
  const variableRate = computeVariableRate(input.fees);
  const breakEven = computeBreakEvenPrice(costBase, fixedPerOrder, variableRate);
  const target = computeTargetPrice(costBase, fixedPerOrder, variableRate, input.fees.targetMarginRate);

  const explanation: string[] = [
    `Maliyet tabanı C = ${costBase.toFixed(2)} (alış + giriş kargo + paketleme + diğer sabit).`,
    `Değişken kesinti r = ${variableRate.toFixed(4)} (pazaryeri + ödeme + diğer).`,
    `Başa baş fiyat = (C + F) / (1 - r) = ${breakEven.toFixed(2)}.`,
    `Hedef fiyat = (C + F) / (1 - r - m) = ${target.toFixed(2)} (m = ${input.fees.targetMarginRate}).`,
    `Vergi modu: ${input.taxMode}; komisyon tabanı: ${input.commissionBase}. Bu alanlar kullanıcı yapılandırmasıdır; sabit vergi oranı varsayılmaz.`,
  ];

  const warnings: string[] = [];
  if (input.market.excludedByCurrency > 0) {
    warnings.push(
      `${input.market.excludedByCurrency} teklif farklı para biriminde olduğu için toplamaya dahil edilmedi (bilinen FX kaynağı yok).`,
    );
  }
  if (input.market.exact.outlierIds.length > 0) {
    warnings.push(`${input.market.exact.outlierIds.length} exact teklif aykırı (IQR) işaretlendi; referans hesapta kullanılmadı.`);
  }

  let recommended: Decimal;
  if (input.strategy === "competitive") {
    if (!input.market.exact.reference) {
      throw new PricingEngineError(
        "NO_MARKET_PRICE",
        "Rekabetçi strateji için piyasa verisi yok; önce araştırma çalıştırın.",
      );
    }
    recommended = input.market.exact.reference;
    explanation.push(
      `Rekabetçi öneri = aykırı olmayan exact teklif medyanı = ${recommended.toFixed(2)} (${input.market.exact.count} örnek).`,
    );
  } else if (input.strategy === "balanced") {
    if (!input.market.exact.reference) {
      throw new PricingEngineError("NO_MARKET_PRICE", "Dengeli strateji için piyasa verisi yok.");
    }
    recommended = input.market.exact.reference.plus(target).div(2);
    explanation.push(`Dengeli öneri = (piyasa referansı + hedef fiyat) / 2 = ${recommended.toFixed(2)}.`);
  } else {
    recommended = target;
    explanation.push(`Kâr odaklı öneri = hedef katkı marjlı fiyat = ${recommended.toFixed(2)}.`);
  }

  // Fiyat asla sessizce başa başın altına inmez.
  const belowBreakEven = recommended.lessThan(breakEven);
  if (belowBreakEven) {
    warnings.push(
      `Piyasa referansı başa baş fiyatın altında; öneri başa baş fiyata çekildi (${breakEven.toFixed(2)}). Bu fiyatta satış zarar üretir.`,
    );
    recommended = breakEven;
  }

  const contribution = computeContribution(recommended, variableRate, costBase, fixedPerOrder);
  const margin = computeContributionMargin(recommended, contribution);

  return {
    strategy: input.strategy,
    recommendedPrice: roundPrice(recommended),
    breakEvenPrice: roundPrice(breakEven),
    targetPrice: roundPrice(target),
    expectedContribution: contribution.toDecimalPlaces(4),
    expectedMargin: margin.toDecimalPlaces(4),
    marketReferencePrice: input.market.exact.reference ? roundPrice(input.market.exact.reference) : null,
    confidenceScore: computeConfidence(input.market),
    warnings,
    explanation,
    belowBreakEven,
  };
}
