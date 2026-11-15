import { boolean, char, index, integer, numeric, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { offers, products, workspaces } from "./index";

/**
 * Fiyat/bulunabilirlik gözlemi — append-only.
 * source_kind ayrımı zorunludur: our_snapshot (kendi koşularımız),
 * provider_history (sağlayıcının geçmiş verisi), manual_import,
 * listed_old_price (bir listing'deki "eski fiyat" — tarih serisi DEĞİLDİR).
 */
export const priceObservations = pgTable(
  "price_observations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    // provider_history ürün bazlı olabilir; offerId nullable.
    offerId: uuid("offer_id").references(() => offers.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),

    observedAt: timestamp("observed_at", { withTimezone: true }).notNull(),
    priceAmount: numeric("price_amount", { precision: 18, scale: 4 }).notNull(),
    currency: char("currency", { length: 3 }).notNull(),
    shippingAmount: numeric("shipping_amount", { precision: 18, scale: 4 }),
    deliveredTotalAmount: numeric("delivered_total_amount", { precision: 18, scale: 4 }),
    availabilityStatus: text("availability_status").notNull().default("unknown"),
    stockQuantity: integer("stock_quantity"),

    sourceKind: text("source_kind").notNull(), // our_snapshot|provider_history|manual_import|listed_old_price
    sourceRecordId: text("source_record_id"),
    isDemo: boolean("is_demo").notNull().default(false),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("price_observations_product_idx").on(table.workspaceId, table.productId, table.observedAt),
    index("price_observations_offer_idx").on(table.offerId),
  ],
);

export type PriceObservation = typeof priceObservations.$inferSelect;
export type NewPriceObservation = typeof priceObservations.$inferInsert;
