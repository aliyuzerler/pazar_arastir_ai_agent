# 11 — Release checklist

## Product/data correctness
- [ ] Demo/live data ayrımı her ekranda anlaşılır.
- [ ] Source/observed timestamp/original URL gösterilir.
- [ ] Stock quantity null ise sayı gösterilmez.
- [ ] Kargo bilinmiyorsa delivered total uydurulmaz.
- [ ] Price history source_kind ayrımı korunur.
- [ ] Match exact/substitute yanlış birleştirilmez.
- [ ] Fiyat hesabı decimal ve testli.
- [ ] Fee/margin formülü açıklanır.
- [ ] Pazar örnek sayısı ve güven seviyesi görünür.

## Security
- [ ] Secret browser bundle'a sızmıyor.
- [ ] Public deployment auth gate olmadan yayınlanmıyor.
- [ ] Workspace scoping tüm query'lerde var.
- [ ] CSV import güvenli.
- [ ] SSRF koruması (URL fetch varsa) testli.
- [ ] Cron route secret doğruluyor.
- [ ] API rate limiting aktif.

## Reliability
- [ ] Provider timeout diğer kaynakları düşürmüyor.
- [ ] Partial results korunuyor.
- [ ] Retry/idempotency testli.
- [ ] DB backup ve migration planı var.
- [ ] Monitoring cron bounded batch çalışıyor.

## UX
- [ ] Loading/empty/error/stale/partial states var.
- [ ] 1440 / 1024 / 390 viewport görsel kontrol edildi.
- [ ] Dark/light mode kontrastı yeterli.
- [ ] Keyboard ve focus kontrolü tamam.
- [ ] Table overflow mobilde yönetiliyor.
