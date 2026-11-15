# 07 — Güvenlik ve gizlilik

## MVP güvenlik varsayımı

Yerel kullanım hedeflenir fakat local network dışına açılması veya public Vercel deployment yapılması farklı risk taşır. Kullanıcı kaydı UI'da olmasa bile public deployment auth olmadan güvenli değildir. Bu nedenle:

- Local development: single-user, loopback/localhost.
- Vercel deployment: private preview veya production öncesi authentication gate zorunlu. Auth eklenene kadar public internet'e açık şekilde yayınlama.
- SaaS release: authentication, workspace membership, RBAC, RLS ve audit tamamlanmadan yayınlama.

## Secrets

- API key environment variables veya platform secret store'da.
- Secrets client component'lere, source maps'e, browser network logs'a sızmamalı.
- Settings UI key'in tamamını göstermez; yalnızca configured/unconfigured ve maskeli son karakterler (credential DB'de tutuluyorsa encrypted).
- `.env` git'e commit edilmez; `.env.example` placeholder içerir.

## API güvenliği

- Input Zod ile doğrulanır.
- Rate limit research endpoint ve provider bağlantı testinde uygulanır.
- CSRF/session yaklaşımı deployment biçimine göre; cookie kullanılırsa secure, httpOnly, sameSite.
- CRON route `CRON_SECRET` doğrular.
- SSRF: Kullanıcıdan URL kabul edilen alanlar için scheme allowlist (`https`), private IP/local hostname engeli, redirect tekrar doğrulama, timeout ve content-type/size limitleri. MVP URL fetch yapmıyorsa bu özelliği açma.
- CSV import: file size, row count, encoding, formula injection (CSV export) ve schema doğrulama.
- HTML/Markdown render: untrusted provider text sanitization.

## Data isolation

- Workspace scope repository seviyesinde uygulanır.
- Cross-tenant foreign key relation kontrollü.
- SaaS release öncesi PostgreSQL RLS testleri.
- Audit log: ürün maliyeti/fiyat profili/entegrasyon ayarı değişikliği.

## Provider response safety

- Provider response untrusted input kabul edilir.
- URL'ler açılırken safe external link attribute kullan.
- Ham JSON'ı UI'ya doğrudan render etme.
- Hata response içindeki HTML/script kullanıcıya gösterilmez.

## Data retention

- Kullanıcıya snapshot retention ayarı sunulabilir.
- Raw provider response kısa süreli ve sanitized saklanmalı; yalnızca gereken alan normalize edilmiş kayda alınmalı.
- Kullanıcı tüm ürün ve araştırma verisini CSV/JSON dışa aktarabilmeli.
- Soft delete ve kalıcı silme akışı belgelenmeli.

## Üçüncü taraf veri ve AI

- Veri sağlayıcılarının sözleşmeleri ve ülke kapsamı kontrol edilir.
- Gemini'ye ürün ve sorgu verisi gönderiliyorsa gönderilen alanlar minimize edilir; API key server-side kalır.
- AI sonucu doğrudan data source kabul edilmez.
- AI prompt injection'e karşı provider metni talimat değil veri olarak ele alınır.
