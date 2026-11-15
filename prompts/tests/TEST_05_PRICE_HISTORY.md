# TEST FAZ 5 — Price history and availability

1. Each completed research produces price observation with source_kind=our_snapshot.
2. Repeated job idempotency/dedupe policy works.
3. Provider historical fixture stored separately as provider_history.
4. Listed old price is stored separately and never appears as a dated historical point.
5. Price chart displays correct min/max/median/change.
6. Missing periods remain gaps; no linear interpolation presented as observed data.
7. Price observations preserve currency and exact observed_at.
8. Currency mismatch prevents aggregate median unless FX conversion with timestamp exists.
9. Stock timeline only shown for actual observed statuses.
10. No history state has helpful empty message and first-check action.
11. Export CSV includes source, source_kind, timestamp, currency, base/shipping and availability.
12. lint/typecheck/unit/integration/e2e/build pass.
