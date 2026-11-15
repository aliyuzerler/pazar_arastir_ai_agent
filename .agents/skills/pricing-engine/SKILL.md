# Skill: Explainable Pricing Engine

## Amaç
Maliyet ve rekabet verisine dayanarak deterministik satış fiyatı önerisi üretmek.

## Zorunlu girdiler
Unit acquisition cost, inbound freight/unit, packaging/unit, other fixed/unit, per-order fixed fee, commission rate, payment fee, other variable fee, target contribution margin, currency and tax/commission base configuration.

## Formül
C = unit acquisition + inbound freight/unit + packaging/unit + other fixed/unit.
F = per-order fixed fee.
r = aggregate variable fee rate.
m = target contribution margin rate.

Break-even = (C + F) / (1 - r)
Target price = (C + F) / (1 - r - m), condition r + m < 1.
Contribution = P * (1 - r) - (C + F).
Contribution margin = contribution / P.

Tax treatment configurable; no hard-coded legal rate or tax advice.

## Kurallar
- Decimal arithmetic kullan.
- Negative costs, invalid rates, zero denominator rejected.
- Fee base gross/net/custom açıkça belirtilir.
- Price recommendations exact matches based; substitute reference marked lower confidence.
- Price cannot silently be below break-even.
- Market count, currency, source freshness and confidence warnings displayed.
- AI model never writes final calculation fields.
- All formula functions unit tested with boundaries.
