# FAZ 5 — Fiyat geçmişi ve stok gözlem kayıtları

`provider-integration`, `product-domain`, `e2e-quality` skill'lerini oku.

## Hedef
Her başarılı araştırmadan normalized price/availability observation kaydet; historical provider data varsa ayrı kaydet; grafik ve geçmiş tablosu oluştur.

## Yapılacaklar
1. price_observations schema with source_kind/provider timestamp/currency/availability/stock_quantity/is_demo.
2. Research completion writes observations idempotently.
3. Historical provider adapter hook (Keepa Amazon optional, DataForSEO or SerpApi old_price not treated as history).
4. Price history API and chart; missing days must remain gaps.
5. First/last/min/max/median/change percentage calculations.
6. Current snapshot vs provider historical vs listed old price UI labels.
7. Stock status change timeline if source observations exist.
8. CSV export of product offer price history.
9. Stale-data and no-history state.
10. Retention/deduplication policy tests.

## Sınırlar
- Backfill yoksa geçmiş icat etme.
- SerpApi `old_price` is not historical time series.
- Provider history and own snapshots visually distinguish.
