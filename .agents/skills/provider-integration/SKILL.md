# Skill: Product Data Provider Integration

## Amaç
Dış ürün/mağaza verilerini güvenli, normalleştirilmiş ve provider bağımsız biçimde almak.

## Zorunlu provider arayüzü
`id`, `displayName`, `capabilities`, `isConfigured`, `search`; opsiyonel `getProductDetails`, `getHistoricalPrices`.

## Kurallar
- Provider SDK/fetch kodu sadece server-side.
- Request ve response Zod ile doğrulanır.
- Unknown/null alanlar korunur.
- Source URL, source id, observed_at, country, currency ve provider id metadata olarak saklanır.
- Provider task-based/asynchronous ise adapter polling modelini kendi içinde yönetir ve timeout verir.
- 429/5xx/network/auth hataları ayrı sınıflandırılır.
- Retry bounded ve jitter'lıdır.
- Provider failure diğer provider sonuçlarını silmez.
- Ham response loglanırken secret ve kişisel veri scrub edilir.
- Terms, quota, coverage, price/cost and attribution documented.
- Yetkisiz scraping, CAPTCHA atlatma, cookie capture ve private endpoint taklidi yok.

## Contract tests
- happy path fixture
- empty results
- missing optional fields
- malformed response
- rate limit
- auth error
- timeout
- duplicate item
- currency and shipping normalization
