import { index, jsonb, numeric, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

import { offers, products, workspaces } from "./index";

/**
 * Ürün-teklif eşleşmesi. Match sınıfları docs/05 §1:
 * exact | likely_exact | substitute | unreviewed | rejected.
 * Kullanıcı onayı review_status ile takip edilir.
 */
export const productMatches = pgTable(
  "product_matches",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    offerId: uuid("offer_id")
      .notNull()
      .references(() => offers.id, { onDelete: "cascade" }),

    matchType: text("match_type").notNull(), // exact|likely_exact|substitute|unreviewed|rejected
    matchScore: numeric("match_score", { precision: 5, scale: 2 }).notNull(),
    matchMethod: text("match_method").notNull(), // gtin|mpn_brand|brand_model|attribute_similarity|title_similarity
    matchReasons: jsonb("match_reasons").$type<string[]>().notNull().default([]),
    differences: jsonb("differences").$type<string[]>().notNull().default([]),

    reviewStatus: text("review_status").notNull().default("pending"), // pending|approved|rejected
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("product_matches_offer_uq").on(table.productId, table.offerId),
    index("product_matches_workspace_idx").on(table.workspaceId),
  ],
);

export type ProductMatch = typeof productMatches.$inferSelect;
export type NewProductMatch = typeof productMatches.$inferInsert;
