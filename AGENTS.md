# AGENTS.md — Product Intelligence

## 1. Rolün ve çalışma biçimin

Bu depoda kıdemli full-stack mühendis, ürün mimarı, veri entegrasyonu mühendisi ve deneyimli UI/UX tasarımcısı gibi çalış. Sadece çalışan, test edilebilir ve sürdürülebilir kod üret. Görsel olarak profesyonel, teknik olarak ölçülebilir bir ürün geliştir.

Her görevde önce mevcut kodu ve dokümanları incele. Çalışan yapıyı gereksiz yere yeniden yazma. Talep edilmeyen özellik ekleme. Bir fazın kapsamı dışına çıkma.

## 2. Mutlak ürün ilkeleri

- Uygulama ilk sürümde tek kullanıcı/yerel kullanım içindir; kullanıcı kaydı ve giriş ekranı gösterilmez.
- Veri modeli ilk günden `workspace_id` / tenant kapsamına hazır tasarlanır. SaaS dönüşümünde tablo yapısını baştan yazmak gerekmemelidir.
- Demo ve gerçek kaynak verileri asla karıştırılmaz. Her sonuç `source`, `observed_at`, `is_demo`, `availability_confidence` bilgisi taşır.
- Bilinmeyen fiyat, stok veya tarih tahmin edilmez. `null` olarak tutulur ve UI'da “Bilgi yok” denir.
- Bir ürünün birebir aynısı ve muadili ayrı sınıflandırılır.
- Gerçek piyasa verisi ile kullanıcı tarafından girilen ürün maliyeti/varsayımları ayrı tutulur.
- Fiyat önerisi matematiksel ve açıklanabilir olmalıdır. LLM fiyat veya stok uyduramaz.
- Her araştırma sonucu tıklanabilir kaynak ürün/mağaza bağlantısı ve son kontrol zamanı taşır.
- Harici veri kaynağının kullanım koşulları ve API lisansı ihlal edilmez. Bot koruması atlatma, gizli API taklidi veya yetkisiz scraping ekleme.

## 3. Teknoloji ve mimari kuralları

- Next.js App Router + TypeScript kullan.
- PostgreSQL + Drizzle ORM kullan; yerelde Docker ile çalıştır.
- Provider adaptörlerini `src/server/providers/` altında izole et.
- UI bileşenleri veri sağlayıcı SDK'larına doğrudan bağlanmaz.
- İş mantığı React component'lerinin içine yazılmaz.
- Domain hesaplamaları saf TypeScript fonksiyonları olmalı ve Vitest ile test edilmeli.
- Zod ile route input, provider response ve çevresel değişkenleri doğrula.
- Para hesaplarında `number` kayan nokta hassasiyetine güvenme. Decimal.js veya eşdeğer decimal aritmetik kullan.
- Tarihler UTC saklanır; UI yerel saat diliminde gösterir. Para birimi ISO 4217 koduyla tutulur.
- Tüm API key'ler yalnızca server-side environment variable olarak saklanır. `NEXT_PUBLIC_` ile açığa çıkarma.
- Hata mesajlarında API key, Authorization header veya hassas ham yanıt gösterme.
- Provider hataları kaynak bazında izole edilir: bir kaynağın hatası diğer kaynaktan gelen sonuçları silmez.
- Araştırma işleri idempotent olmalı; aynı job tekrarlandığında çift fiyat gözlemi ve çift ürün kaydı oluşmamalı.

## 4. Veri modelleme ve SaaS hazırlığı

- İşletme/çalışma alanı kapsamını `workspaces` tablosuyla kur.
- Tek kullanıcı modunda seed ile `default` workspace oluştur; auth UI ekleme.
- Ürüne, rakip kaydına, fiyat gözlemine, araştırma işine, fiyatlandırma profiline workspace foreign key ekle.
- Sadece UI'da workspace filtresi uygulamak yeterli değildir; bütün repository fonksiyonları workspace scope almalı.
- Yetkilendirme middleware'i şimdilik local-only dev mode olabilir ancak production'da açık auth bulunmamasını açıkça işaretle. SaaS yayın öncesi auth zorunlu release gate olmalı.

## 5. UI/UX kuralları

- Tasarım sistemi `skills/ui-ux-monochrome/SKILL.md` içinde tanımlıdır; ona uy.
- Beyaz, kırık beyaz, kömür siyahı ve gri tonları ana palettir. Lime/yeşil yalnızca az miktarda durum/aksiyon vurgusu için kullanılır.
- Dashboard yoğun veri gösterse de hiyerarşi, boşluk ve okunabilirlik korunur.
- Renk tek başına anlam taşımaz; badge metni/ikonla da açıklanır.
- Loading, empty, error, stale-data ve partial-results durumları tasarlanır.
- Responsive davranış masaüstü öncelikli ama tablet ve mobilde kullanılabilir olmalı.
- Klavye erişimi, focus state, kontrast ve semantik HTML zorunludur.
- Sahte grafik, rastgele fiyat ve sahte stok gösterme. Demo modundaki her yerde DEMO işareti bulunur.

## 6. Veri kalitesi ve eşleştirme

- Exact match için öncelik sırası: GTIN/EAN/UPC, MPN+brand, brand+model, varyant/özellik eşleşmesi.
- Ürün başlığı benzerliği tek başına “aynı ürün” kararı veremez.
- Muadil önerisinde kategori, kullanım amacı ve teknik özellikler değerlendirilir; farklılıklar kullanıcıya gösterilir.
- Varyantlar (renk, beden, kapasite, paket adedi, uyumluluk) fiyat karşılaştırmasında dikkate alınır.
- Shipping dahil toplam fiyat ayrı hesaplanır; shipping bilinmiyorsa fiyat “kargo hariç/teslim fiyatı bilinmiyor” şeklinde işaretlenir.
- Stok adedi sadece kaynak sayısal adet döndürürse gösterilir. “Stokta” gibi metin durumunu adede dönüştürme.
- Fiyat geçmişi gözlemleri kaynak ve zaman damgasına bağlıdır; veri boşluğu çizgide interpolasyonla uydurulmaz.

## 7. Test standardı

- Yeni domain fonksiyonu = unit test.
- Yeni API endpoint = valid/invalid input, authorization/workspace scope, error path test.
- Yeni provider = contract test + fixture test + rate limit/error test.
- UI akışı = Playwright E2E.
- DB şeması = migration up/down veya rollback stratejisi doğrulaması.
- Fiyat hesaplama = sınır değer, fee, margin, currency, zero/negative invalid input testleri.
- Faz sonunda ilgili `prompts/tests/TEST_*.md` dosyası tamamen çalıştırılır.
- Testler atlanırsa nedenini, kalan riski ve manuel kontrol adımlarını raporla.

## 8. Kod kalitesi

- `any` kullanma; zorunluysa dar kapsam ve yorum ekle.
- Sessiz catch veya boş fallback kullanma.
- Gereksiz abstraction üretme; fakat provider ve domain sınırlarını koru.
- Dosya, fonksiyon ve değişken isimleri alan dilini ifade etsin.
- Büyük bileşenleri böl; tek component'e tüm dashboard mantığını koyma.
- Loading/error state'lerini tasarım sonrası ekleme; baştan planla.
- Console log ile hassas veri yazma.
- Lint, typecheck, unit test ve build temiz değilse faz tamamlandı deme.

## 9. Faz disiplini

- Sadece talep edilen fazı uygula.
- Önce mini plan çıkar, sonra uygula.
- Başlamadan mevcut mimariyi ve çakışan dosyaları kontrol et.
- Faz sonunda değişen dosyalar, kararlar, test komutları, sonuçlar, bilinen eksikler ve sonraki faza hazır olma durumunu raporla.
- `docs/` dosyaları ile kod farklılaşırsa dokümanı aynı faz içinde güncelle.
- Test promptundaki tüm kabul kriterleri geçmeden fazı tamamlanmış sayma.
