# 09 — Yerel çalıştırma ve Vercel yayın mimarisi

## 1. Yerel geliştirme

Tek komutla PostgreSQL çalıştırmak için `docker-compose.yml` kullanılır. Uygulama Next.js üzerinde `localhost` adresinden açılır. Gerçek provider anahtarı yoksa DemoProvider çalışmaya devam eder.

Hedef:

```bash
docker compose up -d
cp .env.example .env
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

## 2. Neden yerel SQLite dosyası değil?

Vercel Functions'ın dosya sistemi read-only kabul edilir; geçici yazılabilir `/tmp` alanı kalıcı/ortak DB değildir. SQLite tek kalıcı dosya gerektirdiğinden Vercel production DB olarak kullanılmamalıdır. Bu nedenle PostgreSQL'i hem local hem cloud kullan.

## 3. Vercel yayın hedefi

- Next.js web + route handlers: Vercel.
- PostgreSQL: Vercel Marketplace entegrasyonu üzerinden Neon veya başka yönetilen PostgreSQL.
- Dosya yükleme: Vercel Blob veya S3 uyumlu object storage.
- Fiyat geçmişi: PostgreSQL.
- Zamanlanmış fiyat kontrolü: Vercel Cron endpoint'i; secret ile korunan küçük batch.
- Provider keys: Vercel environment variables.

## 4. Vercel'e çıkış öncesi

- Auth yoksa public deployment açma. Local-only kullanım ve deployment gate uygula.
- DB migration ve seed production'da kontrollü çalışmalı.
- `DATABASE_URL` doğru region/pooling bağlantısı.
- DB connection pool serverless uyumlu olmalı.
- Provider request timeout/limitler function max duration'a göre ayarlanmalı.
- Büyük toplu işler request içinde tamamlanmaya zorlanmamalı.
- Cron her tetiklemede küçük job batch almalı; ilerlemeyi DB'ye kaydetmeli.
- Cron endpoint `CRON_SECRET` ile doğrulamalı.
- Loglar secret redaction yapmalı.
- Vercel preview/production environment variables ayrı olmalı.

## 5. Vercel veri saklama tercihi

2026 itibarıyla Vercel Postgres yeni projelerde ayrı bir ürün olarak sunulmuyor; Vercel Marketplace üzerinden harici Postgres sağlayıcıları, örneğin Neon, bağlanıyor. Projeye doğrudan Vercel Postgres varmış gibi mimari kurma.

## 6. Maliyet kontrolü

- Provider çağrısı başına tahmini maliyet/credit metadata sakla.
- Kullanıcının araştırma başına sonuç limiti ve günlük limit ayarı olsun.
- Aynı ürün kısa zaman aralığında tekrar araştırılırsa cache/last observation kullan.
- DataForSEO/SerpApi/Keepa token/kredi fiyatlarını kaynak planından güncel kontrol et; kod içine fiyat tarifesi hard-code etme.
- Araştırma öncesinde kullanıcıya “kaynak çağrısı yapılacak” bilgisini ver; gelecekte ücretli SaaS'da limit aşımını engelle.

## 7. Deployment seçenekleri

MVP önerisi: Önce localhost; sonra Vercel + hosted PostgreSQL. Tamamen Vercel'de kalmak mümkün olsa da uzun süren yoğun scraping/job worker işleri için ayrı worker/queue servisi gerekebilir. MVP küçük batch ve cron ile başlayabilir.
