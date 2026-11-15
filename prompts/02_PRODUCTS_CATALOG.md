# FAZ 2 — Ürün kataloğu ve maliyet girdileri

`product-domain`, `pricing-engine` ve `security-multitenant` skill'lerini oku.

## Hedef
Kullanıcının kendi ürünlerini ekleyip yönetebileceği temel katalog oluştur.

## Yapılacaklar
1. `products` ve `pricing_profiles` Drizzle schema/migration.
2. Workspace-scoped repository/service.
3. Product create/edit/archive/list/detail API.
4. Product form: title, brand, model, MPN, GTIN, SKU, category, description, attributes, product/image URL, unit cost, currency, inbound freight, packaging, other fixed cost.
5. GTIN normalize helper; original value preserve.
6. CSV import: preview, header mapping, validation errors, duplicate handling, row limit.
7. Product list filters, sorting and pagination.
8. Product detail summary and cost fields.
9. Demo seed product set.
10. Form validation and errors Turkish language.

## Sınırlar
- Marketplace araştırması henüz yok.
- CSV import yalnızca own product catalog.
- Public URL fetch yapma; URL alanı metadata only.

## Kabul
Ürün create/edit/archive, CSV preview/import, workspace scoping, duplicate/invalid input ve mobile layout testleri geçmeli.
