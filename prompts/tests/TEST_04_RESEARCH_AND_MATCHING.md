# TEST FAZ 4 — Research and matching E2E

1. Create product with GTIN and run DemoProvider research.
2. Research status transitions queued -> running -> completed or partial.
3. GTIN exact candidate is in exact tab with reason.
4. MPN+brand candidate may be likely exact with explicit evidence.
5. Same model but wrong capacity/color is not exact; appears likely substitute/review with difference.
6. Alternative product with different model but same function appears only under substitutes.
7. Similar title only cannot auto-confirm exact.
8. Same provider offer repeated is deduplicated.
9. User approves and rejects matches; status persists.
10. Provider partial failure still displays successful provider results and error summary.
11. Unknown stock and missing shipping display as unknown, not zero.
12. Demo badge visible on research header and offer rows.
13. Search sort/filter, source filter and pagination work.
14. Idempotency prevents duplicate run for same key.
15. lint/typecheck/unit/integration/e2e/build pass.
