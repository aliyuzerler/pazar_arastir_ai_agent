# Araştırma referansları (15 Kasım 2026 tarihinde kontrol edildi)

Bu bağlantılar API sağlayıcılarının kapsamını ve platform dağıtım kararlarını doğrulamak içindir. Entegrasyon öncesinde doküman, lisans, ülke kapsamı, kota ve fiyatlandırma tekrar kontrol edilmelidir.

## Veri kaynakları

- DataForSEO Merchant API overview: https://docs.dataforseo.com/v3/merchant-api-overview/
- DataForSEO Google Shopping overview: https://docs.dataforseo.com/v3/merchant-google-overview/
- DataForSEO Google Product Info / availability field: https://docs.dataforseo.com/v3/merchant-google-product_info-task_get-advanced/
- Keepa API documentation: https://keepa.com/api-docs/
- SerpApi Google Shopping API: https://serpapi.com/google-shopping-api
- SerpApi Google Product API: https://serpapi.com/google-product-api
- eBay Browse API: https://developer.ebay.com/develop/api/buy/browse_api
- Trendyol Developers: https://developers.trendyol.com/
- Hepsiburada Developer Portal: https://developers.hepsiburada.com/tr/

## Deployment

- Vercel Functions: https://vercel.com/docs/functions
- Vercel runtimes / read-only filesystem: https://vercel.com/docs/functions/runtimes
- Vercel Storage overview: https://vercel.com/docs/storage
- Vercel guidance on SQLite: https://vercel.com/kb/guide/is-sqlite-supported-in-vercel
- Postgres via Vercel Marketplace: https://vercel.com/docs/postgres
- Vercel Cron configuration: https://vercel.com/docs/project-configuration

## Araştırmada doğrulanan önemli noktalar

1. DataForSEO Merchant, Google Shopping ve Amazon ürün/mağaza verilerine yönelik bir e-ticaret veri API'sidir; Google Shopping kapsamındaki fiyat/satıcı/ürün bilgileri lokasyon ve dil parametrelerine bağlıdır.
2. Keepa Amazon marketplace ürünleri, offer ve geçmiş fiyat verisi için tasarlanmıştır.
3. SerpApi Google Shopping sonuçlarında ürün fiyatı, satıcı/source ve bazı sonuçlarda eski fiyat gibi alanlar sağlayabilir; bu `old_price` tek başına zamana bağlı fiyat geçmişi sayılmaz.
4. eBay Browse API listing/ürün araması sağlar; Türkiye'deki pazaryeri kataloglarının genel karşılığı değildir.
5. Trendyol ve Hepsiburada geliştirici API'lerinin incelenen dokümanları öncelikle yetkili satıcıların ürün, fiyat, stok, sipariş ve katalog entegrasyonlarını anlatır.
6. Vercel Functions yerel dosya sistemini kalıcı veritabanı olarak kullanmaya uygun değildir; Vercel SQLite rehberi de SQLite'ın kalıcı dosya gereksinimi nedeniyle uygun olmadığını açıklar.
7. Vercel Postgres yeni projeler için ayrı bir yerel ürün değildir; Marketplace üzerinden harici PostgreSQL sağlayıcıları bağlanır.
8. Vercel Cron jobs periyodik iş çağırmak için kullanılabilir; function duration ve plan sınırlarına uygun küçük, tekrar çalıştırılabilir iş parçaları tasarlanmalıdır.
