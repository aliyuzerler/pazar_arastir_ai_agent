# TEST FAZ 6 — Pricing engine and recommendation

1. Test formula break-even = (C+F)/(1-r) for known fixture.
2. Test target price = (C+F)/(1-r-m).
3. Reject r+m >= 1, negative costs, invalid decimal, mismatched currency.
4. Decimal precision and rounding do not use binary floating point artifacts.
5. Fee rates sum correctly and same commission not double-counted.
6. Exact offers and substitute offers produce different references/statistics.
7. Competitive/balanced/profit recommendations are deterministic for identical inputs.
8. Recommendation cannot silently fall below break-even.
9. If market price is lower than break-even, warning explains unprofitable market.
10. Recommendation stores input snapshot and can be reproduced.
11. UI exposes costs, fee rates, target margin, reference sample count, confidence and formula.
12. AI helper output cannot change numeric price or stock fields.
13. lint/typecheck/unit/integration/e2e/build pass.
