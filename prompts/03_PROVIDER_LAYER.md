# FAZ 3 — Provider abstraction ve DemoProvider

`provider-integration` skill ve `docs/04_DATA_SOURCES_AND_LIMITATIONS.md` oku.

## Hedef
Provider adapter altyapısı ve gerçek anahtarsız çalışan deterministik DemoProvider oluştur. DataForSEO adaptörünün server-side temelini de ekle; credential yoksa disabled/not-configured görünmeli.

## Yapılacaklar
1. Provider contract/capability types ve Zod schemas.
2. NormalizedOffer/Availability/Price types.
3. DemoProvider fixtures: exact GTIN, MPN exact, likely exact, substitute, wrong variant, unknown stock, stock quantity, no shipping, price changes, empty search, provider error.
4. DataForSEO adapter for Google Shopping search/detail task lifecycle (server-side, timeout/rate limit; response mapping fixture based).
5. Provider registry/factory.
6. Provider settings/status page; credentials are server env only, key never returned.
7. Contract tests for fixture mapping, missing fields, 429/auth/timeout.
8. Provider result metadata: source, URL, observed_at, currency, `is_demo`.
9. Partial provider failure model.
10. Add sanitized provider logs.

## Sınırlar
- Yetkisiz scraping yok.
- Provider credentials DB/client'a yazılmayacak.
- API key yoksa canlı çağrı yapmaya çalışma; status açıklayıcı.
- Demo ve live results karışırsa provenance preserved.
