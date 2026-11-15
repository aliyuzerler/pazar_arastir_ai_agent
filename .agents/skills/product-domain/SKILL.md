# Skill: Product Intelligence Domain

## Amaç
Ürün, listing, offer, exact match, muadil, fiyat gözlemi, fiyatlandırma profili ve araştırma akışlarının domain kurallarını doğru uygulamak.

## Kurallar
- Internal product, external offer ve marketplace listing kavramlarını karıştırma.
- Aynı ürünün farklı satıcı teklifleri ayrı `offers` kaydıdır.
- GTIN/MPN/model ve varyant farkı match kararında kullanılır.
- Exact ve substitute ayrı veri kümeleri ve UI sekmeleri olarak kalır.
- Her offer kaynak, observed timestamp, URL ve currency taşır.
- Unknown değerler null/unknown olarak tutulur; tahminle doldurulmaz.
- Demo data `is_demo=true` ve görsel badge taşır.
- Ürün araştırması provider adapter üzerinden yapılır.

## Beklenen deliverable
- Tip güvenli domain type'ları.
- Pure matching/normalization functions.
- Unit test fixture'ları.
- Açıklanabilir match reason listesi.
