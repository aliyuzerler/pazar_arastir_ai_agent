# FAZ 6 — Maliyet, fiyatlandırma ve öneri motoru

`pricing-engine` skill ve `docs/05_MATCHING_AND_RECOMMENDATION_ENGINE.md` oku.

## Hedef
Kullanıcının gerçek maliyet girdilerine ve onaylanmış exact market offers istatistiklerine göre break-even, competitive, balanced, profit fiyatları üret.

## Yapılacaklar
1. Pricing profile form and persistence.
2. Decimal math library; no JS float arithmetic for money.
3. Break-even and target contribution margin formula.
4. Market stats exact vs substitute separate; outlier flag.
5. Pricing strategies configurable and deterministic.
6. Expected contribution, contribution margin, reference price and data sample count.
7. Tax mode and commission base as explicit configuration; no hard-coded tax rate.
8. Recommendation history storing calculation input snapshot.
9. Pricing UI with cost breakdown, strategy cards, chart and formula explanation.
10. Unit/property tests for invalid fees, margins, rounding, currency mismatch and no viable market price.

## Sınırlar
- Recommendation does not publish price to marketplace.
- AI does not set final price.
- Market offers in different currencies cannot be aggregated without known FX source.
- Price below break-even must be warning, not silent recommendation.
