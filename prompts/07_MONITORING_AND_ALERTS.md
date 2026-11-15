# FAZ 7 — Ürün izleme, periyodik snapshot ve bildirimler

`provider-integration`, `vercel-deployment` ve `e2e-quality` skill'lerini oku.

## Hedef
Kullanıcı ürünleri izlemeye alabilsin; fiyat/availability belirli aralıklarla yeniden kontrol edilsin; değişimler dashboard'da bildirim olsun.

## Yapılacaklar
1. monitoring_jobs schema and state machine.
2. Per-product tracking on/off, frequency choices with safe defaults.
3. Local worker or controlled `npm run worker` scheduler.
4. Job idempotency, lock, retry, bounded batch.
5. Vercel Cron-compatible protected route for small batch execution.
6. Price drop/rise threshold alerts configurable.
7. Availability state change alerts only when provider supports it.
8. Notifications/activity feed in UI.
9. Provider quota guard and max daily query budget.
10. Monitoring tests include repeated job, lock timeout, provider failure, cron unauthorized.

## Sınırlar
- Job worker Vercel function içinde sonsuza kadar çalışmaz.
- Do not scrape or monitor more often than provider terms/rate limits allow.
- Exact/substitute match review must remain attached to product before price alert attribution.
