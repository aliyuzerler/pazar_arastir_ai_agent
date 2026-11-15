# 10 — Test stratejisi

## Test katmanları

1. Unit: matching, money math, pricing strategies, freshness, normalizer.
2. Contract: provider adapters, response schema, missing/nullable fields, rate limit and error mapping.
3. Integration: PostgreSQL migration, repositories, workspace scoping, idempotency.
4. Component: form validation, tables, filters, empty/error/loading states.
5. E2E: product create -> research -> approve match -> snapshot -> pricing recommendation.
6. Deployment smoke: env validation, health route, DB connectivity, cron secret.
7. Visual: desktop/tablet/mobile screenshots.

## Mandatory commands

Repo setup ile `package.json` script names define edilir. Hedef minimum:

```bash
npm run lint
npm run typecheck
npm run test
npm run test:integration
npm run test:e2e
npm run build
```

## Test fixtures

- GTIN exact match.
- MPN+brand exact match.
- Same model but wrong color/capacity variant.
- Substitute product with different specs.
- Duplicate offer from same seller.
- Missing stock status.
- `in_stock` with no quantity.
- Price with unknown shipping.
- Cross currency offers.
- Provider timeout and 429.
- Provider partial success.
- Demo vs live data mix.
- Historical points with gap.
- No historical data.
- Zero margin / fee boundary invalid.
- Price under cost/market lower than break-even.

## Done definition

Faz ancak karşılık gelen `prompts/tests/TEST_*.md` içindeki acceptance checks, otomatik testler, lint, typecheck ve build geçerse tamamlanır.
