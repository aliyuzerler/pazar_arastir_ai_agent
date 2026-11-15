# 02 — Teknik mimari

## 1. Genel yaklaşım

İlk sürüm **modüler monolit** olarak geliştirilecek. Tek Next.js uygulaması UI ve server-side API işlerini barındırır. Domain modülleri ayrıdır; provider adaptörleri ve DB erişimi domain'den izole edilir. Ürün izleme job'ları başlangıçta veritabanı tabanlı job tablosu ve bounded execution ile çalışır. Daha sonra ayrı worker/queue eklenebilir.

## 2. Katmanlar

```text
Browser UI (Next.js App Router)
  ├─ Dashboard / Product / Research / Pricing / Settings
  └─ typed server actions / route handlers
           ↓
Application Layer
  ├─ ProductService
  ├─ ResearchOrchestrator
  ├─ MatchReviewService
  ├─ PriceHistoryService
  ├─ PricingRecommendationService
  └─ MonitoringService
           ↓
Domain Layer
  ├─ Product / Offer / Match / Snapshot / PricingProfile
  ├─ ExactMatchPolicy / SubstituteMatchPolicy
  └─ PriceCalculation (pure deterministic functions)
           ↓
Infrastructure Layer
  ├─ Drizzle repositories + PostgreSQL
  ├─ Provider adapters (Demo, DataForSEO, Keepa, SerpApi)
  ├─ Gemini assistant adapter (optional)
  ├─ scheduler/job repository
  └─ external secrets/config
```

## 3. Önerilen klasör yapısı

```text
src/
  app/
    (app)/dashboard/page.tsx
    (app)/products/page.tsx
    (app)/products/[productId]/page.tsx
    (app)/research/[researchId]/page.tsx
    (app)/settings/page.tsx
    api/health/route.ts
    api/products/route.ts
    api/research/route.ts
    api/research/[id]/route.ts
    api/providers/status/route.ts
    api/cron/monitor/route.ts
  components/
    ui/
    layout/
    data-table/
    charts/
    feedback/
  features/
    dashboard/
    products/
    research/
    pricing/
    settings/
  server/
    application/
    domain/
    db/
      schema/
      repositories/
    providers/
      contracts/
      demo/
      dataforseo/
      keepa/
      serpapi/
    jobs/
    security/
  lib/
    env.ts
    money.ts
    dates.ts
    validation/
  tests/
```

## 4. Provider adapter contract

Her kaynak aynı normalize edilmiş domain çıktısını üretmelidir:

```ts
interface ProductResearchProvider {
  id: string;
  displayName: string;
  capabilities: ProviderCapabilities;
  isConfigured(): boolean;
  search(input: ProviderSearchInput): Promise<ProviderSearchResult>;
  getProductDetails?(input: ProviderProductInput): Promise<ProviderProductDetails>;
  getHistoricalPrices?(input: ProviderHistoryInput): Promise<ProviderPricePoint[]>;
}
```

Provider response -> `RawProviderResult` -> validation -> `NormalizedOffer` pipeline'ı kullanılmalı.

`ProviderCapabilities` şunları belirtir:
- keyword search
- GTIN/MPN search
- detail lookup
- stock status
- stock quantity
- shipping price
- historical prices
- seller offer grouping
- marketplace/country coverage

`null` capability yokluğu anlamına gelir; provider alanı boş döndürdü diye sıfır/false gibi uydurma değer atanmaz.

## 5. Research orchestration

1. `research_run` kaydı `queued` oluşturulur.
2. Ürün özeti ve query seti hazırlanır.
3. Aktif ve configured provider'lar paralel veya sınırlı concurrency ile çağrılır.
4. Her provider için timeout ve retry uygulanır.
5. Başarılı yanıtlar normalize edilir; başarısız provider hata kaydı bırakır.
6. Duplicate listing'ler source item id veya canonical URL ile birleştirilir.
7. Match engine exact/substitute grupları üretir.
8. Offer ve observation kayıtları idempotent şekilde upsert edilir.
9. Research run `completed`, `partial` veya `failed` olur.
10. UI partial result varsa başarıyla sonuç sunar; kaynak hata listesi ayrıca gösterilir.

## 6. Background tasks

- Local: `npm run worker` ile DB'deki queued job'ları alan hafif worker.
- MVP'de kullanıcı araştırması bounded işlemle API request içinde de çalışabilir; provider sayısı ve timeout sınırlandırılır.
- Vercel: uzun süre yaşayan worker/process varsayılmaz. Cron route veya event/task provider ile küçük batch işler çalıştırılır. Her iş DB'ye checkpoint yazar ve tekrar başlatılabilir.
- Cron endpoint `CRON_SECRET` ile korunur.
- Aynı ürün için aynı zaman penceresinde çift monitoring job oluşturulmaz.

## 7. Hata ve retry stratejisi

- 429: provider retry-after varsa uygula; exponential backoff + jitter.
- 5xx/network: sınırlı retry (ör. 2 retry).
- 4xx auth/config: retry etme; provider status `configuration_error`.
- Timeout: provider bazında başarısız; diğer provider sonuçlarını koru.
- Partial success: `partial` statüsü.
- Retry sonrası duplicate records olmaması için provider listing ID + provider ID veya normalized URL unique key.

## 8. Observability

- `request_id`, `research_run_id`, `provider_id`, latency, status, records_count, retry_count.
- API key ve raw Authorization header asla loglama.
- Provider maliyeti sağlayıcı metrik döndürüyorsa kaydet; yoksa tahmin edilen maliyeti “estimate” işaretle.
- Admin/diagnostic panelde son provider check, success rate, hata mesajının sanitised hali.

## 9. AI kullanımı

Gemini opsiyonel bir `ResearchAssistant` portu üzerinden bağlanır:
- kullanıcı ürün başlığından ilave arama sorgusu önerme;
- teknik özelliklerden muadil kategorisi/özellik farkı önermesi;
- sonuçları Türkçe özetleme.

AI çıktısı schema validation'dan geçer. AI fiyat/stock/availability alanı yazamaz; bu alanlar sadece provider verisinden alınır. Gemini kapalı olsa da core app çalışır.
