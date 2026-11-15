# 04 — Veri kaynakları, kapsam ve kullanım sınırları

## 1. İlkeler

Ürün araştırmasının doğruluğu kullanılan kaynağın kapsamına ve erişim hakkına bağlıdır. Her provider için `country_coverage`, `marketplace_coverage`, `history_coverage`, `stock_coverage`, `terms_url`, `rate_limit`, `estimated_cost` belgelenmelidir.

Arama sonuçlarının belirli bir sağlayıcıya göre geldiğini açıkça belirt. “Tüm Türkiye pazarı tarandı” gibi kanıtlanamayacak ifade kullanma.

## 2. Önerilen provider sırası

### A. DemoProvider — ilk günden zorunlu

- Gerçek API çağrısı yapmaz.
- Sabit, deterministik fixture seti döndürür.
- Exact, substitute, out-of-stock, unknown, shipping-known/unknown, old price ve price-history senaryolarını içermelidir.
- UI'da `DEMO DATA` etiketi görünür.
- Gerçek verilerle aynı tablo/contract yapısını kullanır.

### B. DataForSEO Merchant / Google Shopping

- Google Shopping arama sonuçlarında ürün başlığı, fiyat, mağaza/domain, link, rating/review gibi alanlar sağlar.
- Ürün bilgi detayları ve satıcı teklifleri için ek endpoint'ler vardır.
- Product info yanıtında `product_availability` sağlayıcı tarafından sunuluyorsa normalize edilir; sağlayıcı stok adedi vermiyorsa `stock_quantity=null` kalır.
- Lokasyon, dil ve ülke parametreleri araştırmanın kapsamını etkiler.
- DataForSEO standart akışında task post + sonuç alma adımları vardır; provider adaptörü bu asenkron modeli soyutlamalıdır.
- API ve fiyatlandırma değişebileceği için istek/yanıt contract test fixtures ile korunur.

### C. Keepa — Amazon özelinde

- Amazon marketplace verileri, ürün detayları, offers ve price history için değerlendirilebilir.
- Keepa yalnızca Amazon kapsamındaki veri için kullanılmalı; Trendyol/Hepsiburada geçmişi gibi gösterilmemeli.
- Token maliyeti, API planı ve marketplace parametresi dikkate alınır.

### D. SerpApi — alternatif Google Shopping

- Google Shopping sonuçlarını yapılandırılmış biçimde verir.
- Sonuçta `price`, `old_price`, seller/source, product URL ve availability benzeri uzantılar bulunabilir; ancak tüm alanlar her ürün için garanti değildir.
- `old_price` geçmiş fiyat grafiği değildir; yalnızca listede dönen eski fiyat/indirim referansı olarak ayrı gösterilir.

### E. eBay Browse API

- Keyword, GTIN, product id gibi kriterlerle eBay listing search yapılabilir.
- Offer/listing price ve buying option gibi alanlar alınabilir.
- Türkiye içi pazaryerlerinin yerine geçmez; uluslararası/alternatif ürün araştırma sağlayıcısıdır.

### F. Trendyol ve Hepsiburada

- Resmi dokümanlarda yer alan entegrasyonlar esas olarak satıcıların kendi ürün/katalog, stok, fiyat, sipariş ve mağaza operasyonlarına yöneliktir.
- Bunları rakip ürün kataloğunu serbestçe aratabilecek genel API gibi tasarlama.
- Kullanıcı kendi satıcı hesabını bağlarsa yalnızca yetkili olduğu mağaza verilerini `own_catalog` kaynağı olarak kullan.
- Rakip ürünleri için platformun resmi izin verdiği erişim, sözleşmeli data provider veya kullanıcı tarafından sağlanan kayıt/CSV gerekir.

## 3. Geçmiş fiyat stratejisi

Üç ayrı kavram tutulur:

1. `provider_historical_price`: Provider'ın geçmişe yönelik sağladığı veridir; kaynak, dönem ve sıklık belgelidir.
2. `our_snapshot`: Uygulamanın belirli tarihte canlı sorgudan gözlemlediği fiyattır.
3. `listed_old_price`: Bir sayfada/listing'de “eski fiyat” olarak gösterilen değer. Tarihsel seri değildir.

Bunlar UI'da birbiriyle karıştırılmaz.

## 4. Stok bilgisi

- `in_stock`, `limited_stock`, `out_of_stock`, `preorder`, `unknown` enum.
- Sayısal adet ayrıca `stock_quantity`.
- `in_stock` != `stock_quantity > 0` kesinliği; kaynak bazında yorumla.
- Stok bilgisi yoksa unknown.
- “Az kaldı” gibi metinler ancak kaynak orijinal olarak bildiriyorsa `limited_stock` olabilir.
- UI'da `last_observed_at` görünür; eski veri “Son kontrol: … / Güncel olmayabilir” olarak işaretlenir.

## 5. Fiyat ve kargo normalizasyonu

- Her listing original currency ve original amount değerini korur.
- Bir pazar para birimine çevrilecekse kur kaynağı ve kur timestamp'i kaydedilir.
- Kargo tutarı null ise delivered total null kalır; base price ile delivered total aynı kabul edilmez.
- Vergi dahil/hariç durumu kaynaktan bilinmiyorsa `tax_inclusion=unknown`.
- Kupon, üyelik indirimi, taksit ve sepetteki kampanya fiyatları ayrı açıklama alanlarıyla saklanır; baz fiyatla karıştırılmaz.

## 6. Kaynak durumları

UI için provider status:
- Not configured
- Ready
- Running
- Rate limited
- Temporary error
- Authentication error
- Disabled

Araştırma durumu:
- Complete
- Partial results
- No results
- Failed

## 7. Uygulama güvenliği ve kullanım koşulları

- Provider'ın Terms of Service, API lisansı, rate limit ve veri saklama koşulları incelenmeden entegrasyon production'a alınmaz.
- Login/session cookie toplayan, CAPTCHA atlatan, proxy rotasyonu ile engel aşan veya private endpoint taklit eden scraping geliştirilmez.
- Public web sayfası erişilebilir olsa dahi bu durum sınırsız otomatik scraping hakkı anlamına gelmez.
- Ürün linkleri ve veri atfı mümkün olduğunda korunur.

## 8. Provider adapter roadmap

| Öncelik | Adaptör | İlk sürüm durumu |
|---|---|---|
| P0 | DemoProvider | Tam çalışır |
| P1 | DataForSEO Google Shopping | Ana canlı arama |
| P2 | CSV/manual import | Fallback |
| P3 | Keepa | Amazon geçmişi |
| P4 | SerpApi | Provider alternatifi |
| P5 | eBay Browse | Global research |
| Later | Trendyol/Hepsiburada own seller data | Yetkili hesapla, ayrı modül |
