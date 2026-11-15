# 08 — API ve event sözleşmeleri

Endpoint adları geliştirme sırasında versioning kararıyla netleştirilebilir. Başlangıç önerisi:

## Products

- `GET /api/products?query=&category=&tracking=`
- `POST /api/products`
- `GET /api/products/:id`
- `PATCH /api/products/:id`
- `DELETE /api/products/:id` (soft delete/archive policy)
- `POST /api/products/import` (CSV)

## Research

- `POST /api/research` — `{ productId, providers?, includeSubstitutes, forceRefresh }`
- `GET /api/research/:id`
- `GET /api/products/:id/research-history`
- `POST /api/matches/:id/review` — `{ decision: approved | rejected }`

## Pricing

- `GET /api/products/:id/pricing`
- `POST /api/products/:id/pricing/calculate` — `{ profileId?, strategy? }`
- `POST /api/pricing-profiles`
- `PATCH /api/pricing-profiles/:id`

## Provider status

- `GET /api/providers`
- `POST /api/providers/:providerId/test`
- `PATCH /api/providers/:providerId/settings` (yalnızca non-secret config; secret update server-side)

## Monitoring

- `POST /api/products/:id/monitoring` — enable/disable, interval
- `POST /api/cron/monitor` — internal/CRON_SECRET only
- `GET /api/monitoring/jobs`

## Common response envelope

```json
{
  "data": {},
  "meta": {
    "requestId": "uuid",
    "generatedAt": "ISO-8601",
    "dataMode": "live | demo | mixed"
  },
  "error": null
}
```

Error:
```json
{
  "data": null,
  "meta": { "requestId": "uuid" },
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Girdi doğrulanamadı.",
    "details": []
  }
}
```

## Event types

- `product.created`
- `product.updated`
- `research.started`
- `provider.completed`
- `provider.failed`
- `research.partial`
- `research.completed`
- `match.approved`
- `match.rejected`
- `price.observed`
- `price.changed`
- `availability.changed`
- `recommendation.created`

## Idempotency

Research POST için `idempotency_key` kabul et. Same key + same workspace aynı run'ı döndürür. Offer unique key provider item id; yoksa canonicalized URL + provider. Observation dedupe policy uygulanır.

## Pagination

Ürün ve offer listelerinde cursor pagination tercih et. Max page size 100. Sorting allowlist kullan; client arbitrary SQL column göndermesin.
