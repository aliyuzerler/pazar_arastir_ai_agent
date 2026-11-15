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

import { pricingProfiles, workspaces } from "./index";

/**
 * Kullanıcının kendi ürünleri (internal product). Rakip teklifleri `offers`
 * tablosunda ayrı tutulur (Faz 4); iki kavram karıştırılmaz.
 */
export const products = pgTable(
  "products",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),

    sku: text("sku"),
    title: text("title").notNull(),
    brand: text("brand"),
    model: text("model"),
    mpn: text("mpn"),
    gtin: text("gtin"), // orijinal değer korunur
    gtinNormalized: text("gtin_normalized"), // doğrulanmışnormalize değer (14 hane)

    category: text("category"),
    description: text("description"),
    attributes: jsonb("attributes").$type<ProductAttributes>().notNull().default([]),
    productUrl: text("product_url"),
    imageUrl: text("image_url"),

    // Maliyet girdileri (numeric string; hesaplar Decimal.js ile, Faz 6)
    unitCost: numeric("unit_cost", { precision: 18, scale: 4 }).notNull(),
    currency: char("currency", { length: 3 }).notNull(),
    inboundShippingPerUnit: numeric("inbound_shipping_per_unit", { precision: 18, scale: 4 })
      .notNull()
      .default("0"),
    packagingCost: numeric("packaging_cost", { precision: 18, scale: 4 }).notNull().default("0"),
    otherFixedCost: numeric("other_fixed_cost", { precision: 18, scale: 4 }).notNull().default("0"),

    pricingProfileId: uuid("pricing_profile_id").references(() => pricingProfiles.id, {
      onDelete: "set null",
    }),

    trackingEnabled: boolean("tracking_enabled").notNull().default(false),
    trackingIntervalHours: integer("tracking_interval_hours"),

    archivedAt: timestamp("archived_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("products_workspace_idx").on(table.workspaceId),
    index("products_gtin_idx").on(table.workspaceId, table.gtinNormalized),
    uniqueIndex("products_workspace_sku_uq").on(table.workspaceId, table.sku),
  ],
);

export interface ProductAttribute {
  key: string;
  value: string;
}

export type ProductAttributes = ProductAttribute[];

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
