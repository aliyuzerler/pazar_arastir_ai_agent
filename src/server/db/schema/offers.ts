import {
  boolean,
  char,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { products, workspaces } from "./index";

/**
 * Normalize edilmiş mağaza teklifi. Son bilinen durumu tutar; tarihsel
 * gözlemler `price_observations` tablosuna yazılır (Faz 5).
 */
export const offers = pgTable(
  "offers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    productId: uuid("product_id").references(() => products.id, { onDelete: "cascade" }),

    providerId: text("provider_id").notNull(),
    providerOfferId: text("provider_offer_id").notNull(),

    title: text("title").notNull(),
    brand: text("brand"),
    model: text("model"),
    mpn: text("mpn"),
    gtin: text("gtin"),

    sellerName: text("seller_name").notNull(),
    marketplace: text("marketplace"),
    productUrl: text("product_url").notNull(),
    imageUrl: text("image_url"),

    priceAmount: numeric("price_amount", { precision: 18, scale: 4 }).notNull(),
    currency: char("currency", { length: 3 }).notNull(),
    shippingAmount: numeric("shipping_amount", { precision: 18, scale: 4 }),
    deliveredTotalAmount: numeric("delivered_total_amount", { precision: 18, scale: 4 }),

    availabilityStatus: text("availability_status").notNull().default("unknown"),
    stockQuantity: integer("stock_quantity"),

    rating: numeric("rating", { precision: 3, scale: 2 }),
    reviewCount: integer("review_count"),
    condition: text("condition"),
    variantAttributes: jsonb("variant_attributes").$type<Record<string, string> | null>(),

    isDemo: boolean("is_demo").notNull().default(false),
    rawReference: jsonb("raw_reference").$type<Record<string, unknown> | null>(),

    firstSeenAt: timestamp("first_seen_at", { withTimezone: true }).notNull().defaultNow(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull().defaultNow(),
    lastObservedAt: timestamp("last_observed_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    uniqueIndex("offers_provider_offer_uq").on(table.workspaceId, table.providerId, table.providerOfferId),
    index("offers_product_idx").on(table.productId),
  ],
);

export type Offer = typeof offers.$inferSelect;
export type NewOffer = typeof offers.$inferInsert;
