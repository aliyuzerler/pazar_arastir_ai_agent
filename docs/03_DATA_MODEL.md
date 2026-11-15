# 03 — Veri modeli

Aşağıdaki şema hedef modeldir. Uygulama geliştirilirken Drizzle şemasıyla birebir uyumlu tutulmalı.

## 1. Tablolar

### `workspaces`
- `id` UUID PK
- `name` text
- `slug` text unique
- `default_country` char(2), default `TR`
- `default_locale` text, default `tr-TR`
- `default_currency` char(3), default `TRY`
- `created_at`, `updated_at`

İlk local seed `Default Workspace` oluşturur. SaaS auth daha sonra `workspace_members` ile eklenebilir.

### `products`
- `id`, `workspace_id`
- `sku`, `title`, `brand`, `model`, `mpn`, `gtin`
- `category`, `description`
- `attributes` JSONB
- `product_url`, `image_url`
- `unit_cost` numeric(18,4), `currency` char(3)
- `inbound_shipping_per_unit`, `packaging_cost`, `other_fixed_cost` numeric(18,4)
- `pricing_profile_id` nullable
- `tracking_enabled` boolean
- `tracking_interval_hours` integer
- `archived_at`, timestamps

Workspace + normalized GTIN index; SKU unique per workspace if non-null.

### `providers`
- `id`, `workspace_id` nullable for global adapter config
- `provider_key`, `enabled`, `configuration_status`
- `settings` JSONB (secret değil; credential refs/flags only)
- timestamps

Secrets environment variables veya secret manager'da olmalı. DB'ye plain API key yazma.

### `research_runs`
- `id`, `workspace_id`, `product_id`
- `status`: queued/running/partial/completed/failed/cancelled
- `query_plan` JSONB
- `providers_requested` JSONB
- `started_at`, `completed_at`
- `total_results`, `exact_count`, `substitute_count`
- `error_summary` nullable
- `idempotency_key` unique per workspace

### `offers`
Normalize edilmiş mağaza ilanı/teklifi.
- `id`, `workspace_id`, `product_id` nullable (henüz eşleşmediyse)
- `provider_id`, `provider_offer_id`
- `title`, `brand`, `model`, `mpn`, `gtin`
- `seller_name`, `marketplace`, `product_url`, `image_url`
- `price_amount` numeric(18,4), `currency`
- `shipping_amount` numeric(18,4) nullable
- `delivered_total_amount` numeric(18,4) nullable
- `availability_status`: in_stock/limited_stock/out_of_stock/preorder/unknown
- `stock_quantity` integer nullable
- `rating` numeric nullable, `review_count` integer nullable
- `condition` text nullable, `variant_attributes` JSONB
- `last_observed_at`, `first_seen_at`, `last_seen_at`
- `raw_reference` JSONB sanitized, source URL
- Unique provider+provider_offer_id where possible.

### `product_matches`
- `id`, `workspace_id`, `product_id`, `offer_id`
- `match_type`: exact/likely_exact/substitute/rejected/unreviewed
- `match_score` numeric(5,2)
- `match_method`: gtin/mpn_brand/brand_model/attribute_similarity/ai_suggested/manual
- `match_reasons` JSONB
- `differences` JSONB
- `review_status`: pending/approved/rejected
- `reviewed_at`

### `price_observations`
- `id`, `workspace_id`, `offer_id`, `product_id`
- `observed_at`
- `price_amount`, `currency`
- `shipping_amount` nullable
- `delivered_total_amount` nullable
- `availability_status`, `stock_quantity` nullable
- `source_kind`: provider_history/our_snapshot/manual_import
- `source_record_id` nullable
- `is_demo` boolean

Index by workspace, offer, observed_at. Price observations are append-only except explicit correction/audit.

### `pricing_profiles`
- `id`, `workspace_id`, `name`
- `marketplace_fee_rate` numeric
- `payment_fee_rate` numeric
- `other_variable_fee_rate` numeric
- `target_margin_rate` numeric
- `fixed_per_order_cost` numeric
- `tax_mode` enum/configurable (inclusive/exclusive/not_modelled)
- `commission_base` enum (gross_price/net_price/custom)
- `currency`, `is_default`

Tax rates are user-configured; no legal tax assumption hard-coded.

### `pricing_recommendations`
- `id`, `workspace_id`, `product_id`, `research_run_id`
- `strategy`: competitive/balanced/profit
- `recommended_price`, `currency`
- `break_even_price`, `target_price`, `expected_contribution`, `expected_margin`
- `market_reference_price`, `confidence_score`
- `calculation_inputs` JSONB snapshot
- `explanation` text
- `created_at`

### `monitoring_jobs`
- `id`, `workspace_id`, `product_id`
- `job_type`: price_check/availability_check
- `scheduled_for`, `status`, `attempts`, `locked_at`, `completed_at`
- `last_error`, `idempotency_key`

### `activity_events`
- `id`, `workspace_id`, `entity_type`, `entity_id`, `event_type`
- `payload` JSONB sanitized
- `created_at`

## 2. Multi-tenant kuralları

- Her business entity `workspace_id` taşır.
- Query repository fonksiyonları `workspaceId` almadan çalışmaz.
- DB foreign key ilişkilerinde workspace uyumu kontrol edilir.
- SaaS aşamasında PostgreSQL RLS eklenir; MVP'de de repository-level scoping zorunludur.
- Public API route'ları workspace id'yi browser input'undan güvenilir kabul etmez; local single workspace context server'dan seçilir. SaaS auth gelince session membership'ten çözülür.

## 3. Veri saklama ve geçmiş

- `offers` son bilinen normalize edilmiş durumu tutar.
- `price_observations` tarihsel kayıtları tutar.
- Yeni araştırmada fiyat değişmediyse snapshot politikası: her başarılı check bir observation kaydedebilir; veri hacmini azaltmak için aynı gün aynı fiyat + aynı stok state için dedupe yapılabilir. Bu kural belgelenmeli.
- Provider'ın geçmiş fiyatı ile platformun kendi gözlemleri `source_kind` ile ayrılır.
- Demo veriler `is_demo=true` ile işaretlenir ve canlı istatistiklerden varsayılan olarak hariç tutulur.
