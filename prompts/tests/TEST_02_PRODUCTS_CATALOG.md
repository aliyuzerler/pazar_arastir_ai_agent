# TEST FAZ 2 — Product catalog full journey

1. Create product with GTIN/brand/model/cost.
2. Validation rejects empty title, negative cost, malformed currency, invalid rates.
3. GTIN normalization removes allowed separators while original value is retained.
4. Edit product updates correct workspace row.
5. Archive hides product from active list; restore/unarchive if supported.
6. CSV preview identifies missing title, malformed rows, duplicate SKU/GTIN.
7. CSV import only persists valid rows and reports row-level errors.
8. CSV formula payload is neutralized on export.
9. Product list search/filter/sort/pagination works.
10. Workspace repository scope prevents access to another workspace's product via guessed ID.
11. Mobile form usable with validation feedback.
12. lint/typecheck/unit/integration/e2e/build pass.
