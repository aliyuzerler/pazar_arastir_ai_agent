# 00 — Ürün vizyonu ve kapsam

## Ürün adı

Çalışma adı: **Product Intelligence**. Marka/alan adı daha sonra belirlenebilir.

## Problem

Satıcılar aynı ürünü farklı mağazalarda bulmak, gerçek muadilleri ayırmak, güncel fiyat/teslimat/stok bilgisini karşılaştırmak, geçmiş fiyat hareketini anlamak ve kendi maliyetlerine göre doğru satış fiyatını belirlemek için çok sayıda siteyi manuel kontrol ediyor. Bu yöntem yavaş, tekrar eden ve karar kalitesi açısından tutarsız.

## Çözüm

Kullanıcının ürün kataloğunu rakip teklifleriyle eşleştiren; veri kaynağı, güncellik ve güven seviyesini gösteren; fiyat geçmişini toplayan; kârlılık ve rekabet koşullarına göre açıklanabilir satış fiyatı önerileri üreten yerel-first web uygulaması.

## Hedef kullanıcı

- Pazaryeri veya kendi e-ticaret sitesi üzerinden ürün satan küçük/orta ölçekli satıcı.
- Ürün tedarikçisi ve distribütör.
- Yeni ürün alımına karar veren ticaret işletmesi.
- Kendi portföyünde çok sayıda SKU bulunan operasyon sorumlusu.

## Birincil kullanıcı işi

“Bu ürünün aynısı ve muadilleri piyasada nerede, hangi fiyattan, ne kadar bulunabilir; benim maliyetimle hangi fiyattan satmam mantıklı?”

## MVP kapsamı

1. Yerel tek kullanıcı deneyimi; kayıt/giriş ekranı yok.
2. Workspace/tenant-aware veri modeli.
3. Ürün ekleme: manuel form; GTIN/EAN/UPC, marka, model, başlık, kategori, açıklama, özellikler, maliyetler ve URL.
4. CSV ile toplu ürün içe aktarma (başlangıçta ürün kataloğu).
5. Demo veri sağlayıcı.
6. Provider adapter altyapısı.
7. Gerçek veri sağlayıcı için DataForSEO Google Shopping adaptörü; anahtar yoksa bağlantı “kurulmamış” gösterilir.
8. Araştırma: birebir ürün adayları ve muadil adaylar ayrı listelenir.
9. Fiyat, para birimi, kargo bilgisi, mağaza, ürün URL'si, stok durumu/adedi (kaynak sağlıyorsa), kaynak ve son kontrol zamanı.
10. Kendi sisteminin fiyat snapshot geçmişi.
11. Maliyet ve fiyatlandırma profili.
12. Başa baş fiyat, hedef marj fiyatı ve 3 strateji önerisi.
13. Dashboard, ürün detay, araştırma sonucu, fiyat analiz ve ayarlar ekranları.
14. Kaynak ve veri kalitesi uyarıları.
15. Yerel PostgreSQL ve Vercel'e taşınabilir Postgres altyapısı.

## Sonraki sürümlere bırakılacaklar

- Kullanıcı kaydı, SaaS aboneliği, ekip ve rol yönetimi.
- Gerçek zamanlı stok adedi takibi; yalnızca kaynak yasal/teknik olarak sağlıyorsa.
- Trendyol/Hepsiburada rakip katalog taraması için özel sözleşmeli feed/API.
- Tarayıcı uzantısı.
- Görsel benzerlik için embedding/image matching.
- Birden fazla satıcı hesabı ve kendi satış verisi entegrasyonu.
- Satış hızı, talep tahmini, stok tükenme riski.
- Otomatik fiyat güncelleme (MVP'de yok; öneri only).
- Otomatik satın alma/tedarikçi siparişi (MVP'de yok).

## Başarı ölçütleri

- Kullanıcı 2 dakikadan kısa sürede ürün ekleyip demo araştırma başlatabilmeli.
- En az bir exact-result ve bir substitute-result senaryosu test fixture ile doğrulanmalı.
- Her teklif satırında source, observed_at, original URL ve currency bulunmalı (veri yoksa açıkça null).
- Fiyat önerisi aynı input için deterministik olmalı.
- Kullanıcı önerinin formülünü ve kullanılan piyasa verisini görebilmeli.
- API sağlayıcısı hata verirse daha önce toplanmış veriler kaybolmamalı.
- Demo, stale ve live data UI'da karıştırılmamalı.

## Ürün kapsam dışı

- Ürünü kullanıcı adına satın alma.
- Pazaryerine otomatik fiyat yazma.
- Yetkisiz veri kazıma veya bot koruması atlatma.
- Vergi/muhasebe danışmanlığı.
- Stok adedi tahminini gerçek stok gibi gösterme.
