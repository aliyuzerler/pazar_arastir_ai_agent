# 05 — Ürün eşleştirme ve satış fiyatı öneri motoru

## 1. Matching sınıfları

- `exact`: Kanıtlı birebir aynı ürün/variant.
- `likely_exact`: Çok güçlü eşleşme ama GTIN/MPN kanıtı eksik; kullanıcı doğrulaması önerilir.
- `substitute`: Benzer ihtiyacı karşılayan ama model/özellik bakımından farklı ürün.
- `unreviewed`: Sınıflandırma güveni yetersiz.
- `rejected`: Kullanıcı bu adayı reddetti.

## 2. Exact match karar sırası

1. GTIN/EAN/UPC tam eşleşmesi + variant compatibility.
2. Manufacturer Part Number tam eşleşmesi + brand.
3. Brand + model tam eşleşmesi + kritik varyant özellikleri.
4. Kategoriye özgü attribute set tam/çok yakın eşleşmesi.
5. Başlık benzerliği yalnızca aday bulmak için kullanılır; tek başına exact match kanıtı değildir.

Kritik varyant alanları kategoriye göre tanımlanır: kapasite, beden, renk, ölçü, paket adedi, bağlantı tipi, bölge/voltaj, uyumluluk, model yılı vb.

## 3. Örnek deterministik skor

Match score kullanıcıya yardımcı bir sıralama skorudur; olasılık gibi sunulmaz:
- GTIN eşleşmesi: güçlü bonus / exact kuralı.
- MPN + brand eşleşmesi: güçlü bonus.
- Brand + model: güçlü bonus.
- Kritik attribute benzerliği: % ağırlık.
- Token/title similarity: düşük ağırlık.
- Çelişen kritik varyant: exact sınıfını düşürür veya substitute yapar.

Önerilen ilk puanlama ağırlıkları (category-specific tune edilebilir):
- GTIN exact: 100 (direct exact rule)
- MPN+brand exact: 95
- Brand+model: 85
- Attributes: 0–50
- Title similarity: 0–20
- Critical variant mismatch: -40 veya daha fazla

Bu skorlar kalibre edilene kadar “confidence probability” değildir. UI `Eşleşme skoru` der.

## 4. Muadil bulma

Muadil için:
- Aynı ana kategori ve kullanım amacı.
- Aynı problemi çözüyor olması.
- Temel teknik performansın makul yakınlığı.
- Farklılıkların açıkça listelenmesi.
- Tamamen farklı ürünün yalnızca ucuz diye muadil listesine girmemesi.

Gemini yardımcı sınıflandırıcı olarak kullanılabilir. Modelden JSON schema istenir: `candidate_type`, `reasons[]`, `differences[]`, `missing_attributes[]`, `review_required`. Çıktı doğrulanır; eşleşme onayını kullanıcıya bırakabilir.

## 5. Tekliflerin fiyat istatistiği

Sadece onaylı exact matches ayrı grupta istatistiğe katılır. Likely exact ayrı filtrelenir; substitute istatistikleri ayrı tutulur.

Göstergeler:
- Minimum observed price.
- Median price.
- P25 / P75.
- Trimmed mean (uç değer etkisini azaltmak için opsiyonel).
- Price spread.
- Shipping-included median (yalnızca delivered total biliniyorsa).
- Active seller count (aynı mağazanın duplicate offer'ları normalize edilir).

Outlier politikası: aşırı düşük/yüksek teklifleri otomatik silme. “Şüpheli fiyat” olarak işaretle; sebep ve filtre toggle göster.

## 6. Fiyat hesabı — tanımlar

Tüm maliyet kalemleri aynı birim (ürün/adet) ve aynı vergi bazında olmalıdır. Vergi dahil/hariç ve komisyon tabanı kullanıcı tarafından yapılandırılır. Vergi oranlarını yasal sabit gibi hard-code etme.

- `C`: birim ürün alış maliyeti + birim tedarik/kabul kargosu + paketleme + diğer birim sabit maliyet.
- `F`: sipariş başına sabit kesinti/masraf.
- `r`: satış fiyatına bağlı toplam değişken kesinti oranı (pazaryeri komisyonu + ödeme komisyonu + diğer yüzde bazlı kesintiler; aynı kalemi iki kez sayma).
- `m`: hedef katkı marjı (satış fiyatının yüzdesi olarak).

Basitleştirilmiş başa baş fiyatı:

`P_break_even = (C + F) / (1 - r)`

Hedef katkı marjı için:

`P_target = (C + F) / (1 - r - m)`

Koşul: `r + m < 1`. Aksi durumda hesap geçersizdir ve UI açıklayıcı hata verir.

Katkı kârı:

`Contribution = P * (1 - r) - (C + F)`

Katkı marjı:

`ContributionMargin = Contribution / P`

Bu hesap şirket net kârı, kurumlar vergisi, genel gider veya muhasebe kârı değildir. Fiyatlandırma desteğidir.

## 7. Pazar bazlı öneri stratejileri

Önce exact match market reference hesapla; exact veri yetersizse likely exact, sonra muadil referansı düşük güvenle kullan. UI hangi referans grubunun kullanıldığını belirtir.

- `competitive`: Exact market p25 veya median altı/çevresi, minimum başa baş fiyatına saygı.
- `balanced`: Exact market median çevresi, hedef marjı koruyarak.
- `profit`: Exact market p75/upper quartile çevresi veya fiyat toleransı; yeterli market sample yoksa agresif fiyat önerme.

Her strateji için:
- Market reference price
- Target price
- Final recommended price
- Expected contribution
- Expected margin
- Market sample count
- Confidence/quality warnings

Fiyat stratejisi parametreleri ürün/kategori bazında konfigüre edilebilir. Her zaman `recommended_price >= break_even_price` koşulunu uygula; pazarın altı başa baş fiyatının altındaysa “rekabetçi fiyatla satmak mevcut maliyetle kârlı görünmüyor” de, zararı sessizce önerme.

## 8. Güven seviyesi

Güveni yalnızca LLM'e bırakma. Deterministik veri kalite bileşenleri kullan:
- Match approved/exact mı?
- Kaç farklı mağaza/teklif var?
- Kaynak diversity nedir?
- Gözlemlerin yaşı ne?
- Kargo/variant bilgisi eksik mi?
- Fiyat dağılımı aykırı mı?
- Canlı provider mı, demo mu?
- Stock/price availability aynı anda gözlemlenmiş mi?

Örnek band:
- High: exact GTIN/MPN + en az 5 bağımsız offer + taze veri.
- Medium: güçlü match + 3–4 offer veya bazı alan eksik.
- Low: 1–2 offer, eski veri, yalnız muadil referansı veya kullanıcı onaysız eşleşme.

İlk sürümde bu eşikler yapılandırılabilir; güven “istatistiksel olasılık” diye sunulmaz.

## 9. Fiyat veri normalizasyonu

- Decimal aritmetik ve yuvarlama policy kullan.
- Currency dönüşümü için kur provider, rate date ve source kaydedilir.
- Birden fazla currency varsa dönüşüm yoksa tek tabloda karşılaştırma yapma; gruplandır.
- Kargo dahil fiyat bilinmiyorsa base price karşılaştırmasını etiketle.
- Kampanya/kupon ve taksitler ayrı field'lar.
