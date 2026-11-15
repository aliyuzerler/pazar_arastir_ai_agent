# 01 — Product Requirements Document (PRD)

## 1. Ana kullanıcı yolculuğu

1. Kullanıcı dashboard'u açar.
2. “Ürün ekle” ile ürün kimliği ve kendi maliyetini girer.
3. Ürünü kaydeder.
4. “Piyasayı araştır” aksiyonunu başlatır.
5. Sistem seçili provider'larda arama yapar.
6. Sonuçlar normalize edilir, tekrar eden teklifler birleştirilir.
7. Exact-match ve muadil sınıflandırması oluşturulur.
8. Kullanıcı gerekirse yanlış eşleşmeyi düzeltir.
9. Kullanıcı fiyat ve stok tekliflerini, grafik geçmişini inceler.
10. Maliyet profilini düzenleyip fiyat önerilerini karşılaştırır.
11. Ürün izlemeye alınır; zamanlanmış snapshot'lar birikir.

## 2. Ekranlar

### 2.1 Dashboard

- Takip edilen ürün sayısı.
- Bugün araştırılan ürün sayısı.
- Fiyatı düşen/yükselen izlenen ürünler.
- Kritik stok/bulunabilirlik değişimleri (yalnızca kaynak verisiyle).
- Son araştırmalar.
- Son veri güncelleme zamanı.
- Sağlayıcı bağlantı durumları.
- Araştırma başlat CTA.

### 2.2 Ürünler

- Arama, kategori, izleniyor/izlenmiyor filtresi.
- Ürün görseli (varsa), başlık, marka/model, SKU/GTIN, alış maliyeti, son araştırma.
- Ürün ekle, düzenle, arşivle, CSV içe aktar.
- Ürün silmede ilişkili snapshots ve araştırmalar için soft-delete veya cascade politikasını uygula; yanlışlıkla kalıcı veri kaybını engelle.

### 2.3 Ürün ekle/düzenle

Alanlar:
- `title` zorunlu.
- `brand`, `model`, `mpn`, `gtin`, `sku` opsiyonel.
- `category`, `description` opsiyonel.
- `attributes` key/value listesi (renk, kapasite, ölçü, materyal, paket adedi vb.).
- `product_url`, `image_url` opsiyonel.
- `unit_cost`, `currency`.
- `inbound_shipping_per_unit`, `packaging_cost`, `other_fixed_cost`.
- variable fees profile reference.
- `target_margin_percent`.

Validation: fiyat/maliyet negatif olamaz. GTIN normalize edilir ama orijinal değer korunur. Currency ISO code olmalı.

### 2.4 Araştırma sonuç ekranı

Sekmeler:
- **Birebir aynı ürün**
- **Muadil ürünler**
- **Tüm teklifler**
- **Veri kalitesi**

Teklif kartı/satırı:
- ürün title, brand/model, variant
- mağaza/satıcı adı
- fiyat + currency
- kargo ücret bilgisi / teslim toplamı (hesaplanabiliyorsa)
- stok durumu ve varsa sayısal adet
- rating/review count (varsa)
- original listing URL
- source/provider
- observed_at / freshness indicator
- exact/substitute label, match score ve kısa gerekçe

Filtreler: marketplace/source, min/max price, availability, exact/substitute, seller, last observed.
Sıralama: teslim toplam fiyat, ürün fiyatı, match score, en son görülme.

### 2.5 Fiyat geçmişi

- Kaynak sağlayıcının sunduğu geçmiş veri ile platformun kendi snapshot geçmişi ayrı çizgi/seri olarak gösterilebilir.
- İlk gözlem tarihi, son gözlem, min, max, median, değişim %.
- Eksik günler interpolasyonla doldurulmaz.
- Her data point source ve timestamp taşır.
- Eşleşme değiştiyse grafik serisi yanlış ürünle birleştirilmez.

### 2.6 Fiyat önerisi

- Maliyet özeti.
- Rakip exact-match market stats.
- Muadil market stats ayrı.
- Başa baş fiyat.
- Minimum kabul edilebilir satış fiyatı.
- Rekabetçi, dengeli, kâr odaklı fiyat önerileri.
- Beklenen katkı kârı ve katkı marjı.
- Kullanılan girdiler ve formül açıklaması.
- Güven seviyesi ve veri uyarıları.
- Kullanıcı öneriyi kaydedebilir; otomatik olarak mağazaya yazılmaz.

### 2.7 Ayarlar

- Provider bağlantıları ve anahtar durumları.
- Varsayılan pazar ülke/dil/para birimi (MVP: Türkiye, tr-TR, TRY).
- Araştırma sıklığı ve kota/harcama limitleri.
- Varsayılan fiyatlandırma profili.
- Demo data aç/kapat.
- Data retention/export.

## 3. İşlevsel gereksinimler

- FR-001: Ürün oluşturma, güncelleme, arşivleme.
- FR-002: Ürün başına bir veya çok araştırma çalıştırma.
- FR-003: Provider adapter üzerinden veri toplama.
- FR-004: Ham provider response güvenli şekilde audit/debug için sınırlı saklanabilir; secret/PII temizlenir.
- FR-005: Teklifleri normalize etme.
- FR-006: Exact ve substitute match sınıflandırma.
- FR-007: Kullanıcının eşleşmeyi onaylaması/reddetmesi.
- FR-008: Fiyat snapshot kaydı.
- FR-009: Maliyet ve fiyat önerisi hesaplama.
- FR-010: Araştırma job durumlarını gösterme.
- FR-011: Kaynak verisinin güncelliğini göstermek.
- FR-012: CSV ürün kataloğu içe aktarma.
- FR-013: Hata durumunda kısmi sonuçları koruma.
- FR-014: Bir ürünün izlemeye alınması ve izleme sıklığı.

## 4. Fonksiyonel olmayan gereksinimler

- NFR-001: API key'ler browser bundle'a çıkmayacak.
- NFR-002: Bütün DB sorguları workspace-scoped.
- NFR-003: Provider timeout, retry ve rate-limit kontrolü.
- NFR-004: Aynı job tekrarlandığında idempotency.
- NFR-005: Para hesaplarında decimal aritmetik.
- NFR-006: İlk ekranda kullanılabilir loading/empty/error state.
- NFR-007: Desktop-first responsive UI.
- NFR-008: Vitest + Playwright testleri.
- NFR-009: Structured logs; secret redaction.
- NFR-010: Vercel'e deploy edilebilir stateless web/API katmanı.

## 5. Kabul kriterleri

- Demo modunda gerçek API anahtarı olmadan tüm temel yolculuk çalışır.
- Araştırma sonuçlarında demo veri belirgin etiketlidir.
- Exact match yalnızca ad benzerliğiyle oluşmaz.
- Kargo bedeli bilinmiyorsa teslim toplamı kesin değer olarak hesaplanmaz.
- Güncel stok adedi bilinmiyorsa stok sayısı gösterilmez.
- Fiyat geçmişindeki boş dönemler veri olarak uydurulmaz.
- Önerilen fiyatın maliyet girdileri ve fee yüzdeleri kullanıcıya görünür.
- Uygulama Vercel'de SQLite dosyasına veya yerel diske kalıcı veri yazmaya çalışmaz.
