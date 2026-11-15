# Product Intelligence — ZCode Geliştirme Paketi

Bu paket, yerelde çalıştırılabilen ve daha sonra Vercel üzerinde yayınlanabilecek bir **ürün araştırma, rakip fiyat takibi ve satış fiyatı karar destek sistemi** geliştirmek için hazırlanmıştır.

> Bu arşiv bir uygulama kod tabanı değil; ZCode'un uygulamayı kontrollü, faz faz üretmesi için hazırlanmış proje tanımı, mimari kurallar, skill dosyaları, geliştirme promptları ve uçtan uca test promptları paketidir.

## 1. Sistemin amacı

Kullanıcı kendi sattığı veya satmayı düşündüğü ürünü sisteme girer. Sistem:

1. Aynı ürünün farklı mağazalardaki tekliflerini bulur.
2. GTIN/EAN, marka, model ve teknik özelliklerle birebir aynı ürünleri muadillerden ayırır.
3. Aynı ihtiyacı karşılayan alternatif ürünleri ayrıca listeler.
4. Kaynağın sağladığı ölçüde fiyat, kargo, satıcı, stok/bulunabilirlik ve ürün bağlantısını toplar.
5. Kaynak tarafından sağlanan geçmiş fiyat bilgisini ve sistemin kendisinin biriktirdiği tarihsel fiyat gözlemlerini ayırır.
6. Alış maliyeti, komisyon, kargo, paketleme ve hedef kâra göre başa baş fiyatı ve önerilen satış fiyatı aralıklarını hesaplar.
7. Önerinin hangi verilere dayandığını, veri ne kadar güncel olduğunu ve güven seviyesini açıklar.

## 2. Önemli gerçekçilik ilkeleri

- Hiçbir sağlayıcı tüm pazaryerlerinin tam ürün kataloğunu, kesin stok adedini ve sınırsız geçmiş fiyat verisini sunmaz.
- İlk sürümde gerçek API anahtarı olmasa da çalışabilen `DemoProvider` bulunmalıdır. Demo verisi ekranda açıkça **DEMO** olarak işaretlenir; gerçek fiyat gibi sunulmaz.
- İlk gerçek araştırma bağlantısı için DataForSEO Google Shopping adaptörü hedeflenir. Keepa Amazon özelinde geçmiş fiyatlar/teklifler için ayrı adaptör olabilir. SerpApi alternatif sağlayıcı olarak tasarlanır.
- Trendyol ve Hepsiburada resmi satıcı API'leri, genel rakip ürün arama API'si olarak varsayılmamalıdır. Yetkili satıcı hesabının kendi katalog/stok/fiyat operasyonları için kullanılabilecekleri doğrulanmıştır. Rakip araştırması için ayrıca sözleşmeli/veri sağlayıcı çözümü veya izinli kaynak gerekir.
- İlk açılışta geçmiş fiyat grafiği boş olabilir. Kendi geçmişimiz, ilk başarılı gözlemden itibaren oluşur. Sağlayıcı geçmiş veri veriyorsa bunun kaynağı ve kapsadığı dönem ayrıca gösterilir.
- Stok adedi ile stok durumu farklı alanlardır. Kaynak yalnızca `in_stock` döndürüyorsa sayısal stok adedi uydurulmaz.
- Fiyat önerisi deterministik kurallarla ve açık formüllerle hesaplanır. Gemini/LLM varsa yalnızca sorgu genişletme, aday sınıflandırma önerisi ve açıklama üretiminde yardımcı olur; fiyat/stoğu uyduramaz ve mali hesaplamanın yerine geçemez.

## 3. Başlangıç teknik tercihleri

| Alan | Tercih |
|---|---|
| UI + server | Next.js App Router + TypeScript |
| UI | Tailwind CSS + shadcn/ui + Lucide |
| Veritabanı | PostgreSQL |
| ORM / query layer | Drizzle ORM |
| Yerel DB | Docker Compose ile PostgreSQL |
| Bulut DB | Vercel Marketplace üzerinden Neon veya başka PostgreSQL |
| Grafik | Recharts |
| Şema doğrulama | Zod |
| Test | Vitest + Testing Library + Playwright |
| AI (opsiyonel) | Gemini API, server-side only |
| İlk veri kaynağı | DemoProvider; sonra DataForSEO Google Shopping |

SQLite kullanılmamasının nedeni: Vercel Functions üzerinde yazılabilir `/tmp` alanı geçicidir ve kalıcı ortak veri deposu değildir. Yerelde ve bulutta aynı PostgreSQL kullanmak geçiş riskini azaltır.

## 4. Başlama sırası

1. Bu klasörü ZCode ile aç.
2. ZCode'a önce `AGENTS.md` dosyasını okumasını söyle.
3. `.agents/skills/` altındaki ilgili skill'leri yüklemesini/izlemesini iste.
4. `docs/` dosyalarını bir kere baştan sona incelet.
5. `prompts/PHASE_EXECUTION_PROTOCOL.md` kurallarını uygulat.
6. `prompts/00_BOOTSTRAP.md` ile başla.
7. Her faz tamamlandığında yalnızca o fazın karşılık gelen `prompts/tests/TEST_*.md` test promptunu çalıştır.
8. Test geçmeden sonraki faza geçme.

## 5. Dosya haritası

- `AGENTS.md`: ZCode için proje çapında zorunlu kurallar.
- `docs/`: Ürün gereksinimleri, mimari, veri modeli, kaynak kısıtları, fiyat motoru, UX ve yayınlama tasarımı.
- `.agents/skills/`: Tekrar kullanılabilir uzmanlık skill dosyaları.
- `prompts/`: Faz faz geliştirme talimatları.
- `prompts/tests/`: Her faz için uçtan uca test ve kabul promptları.
- `.env.example`: Yerel ortam değişkenleri örneği.
- `docker-compose.yml`: Yerel PostgreSQL.

## 6. Başlangıç komutu

ZCode'a şu talimatı ver:

> Önce AGENTS.md, docs/ ve .agents/skills/ dosyalarını incele. Henüz kod yazma. Ürün kapsamını, mimariyi, fazları ve teknik riskleri kendi cümlelerinle özetle. Ardından `prompts/00_BOOTSTRAP.md` talimatını uygula. Yalnızca FAZ 0 kapsamını gerçekleştir; sonraki fazlara geçme. Tamamladığında `prompts/tests/TEST_00_BOOTSTRAP.md` dosyasındaki testleri çalıştır ve sonuçları raporla.

## 7. Yerel çalıştırma hedefi

ZCode uygulama kodunu oluşturduktan sonra hedef komutlar:

```bash
docker compose up -d
cp .env.example .env
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

Gerçek sağlayıcılar devre dışıyken uygulama DemoProvider ile uçtan uca çalışmalıdır.
