import { char, index, jsonb, numeric, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { pricingProfiles, products, researchRuns, workspaces } from "./index";

/**
 * Fiyat önerisi geçmişi. calculation_inputs anlık görüntüsüyle saklanır:
 * aynı girdi için öneri deterministik olarak yeniden üretilebilir.
 */
export const pricingRecommendations = pgTable(
  "pricing_recommendations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    researchRunId: uuid("research_run_id").references(() => researchRuns.id, { onDelete: "set null" }),
    pricingProfileId: uuid("pricing_profile_id").references(() => pricingProfiles.id, {
      onDelete: "set null",
    }),

    strategy: text("strategy").notNull(), // competitive|balanced|profit
    recommendedPrice: numeric("recommended_price", { precision: 18, scale: 4 }).notNull(),
    currency: char("currency", { length: 3 }).notNull(),
    breakEvenPrice: numeric("break_even_price", { precision: 18, scale: 4 }).notNull(),
    targetPrice: numeric("target_price", { precision: 18, scale: 4 }).notNull(),
    expectedContribution: numeric("expected_contribution", { precision: 18, scale: 4 }).notNull(),
    expectedMargin: numeric("expected_margin", { precision: 8, scale: 4 }).notNull(),
    marketReferencePrice: numeric("market_reference_price", { precision: 18, scale: 4 }),
    confidenceScore: numeric("confidence_score", { precision: 4, scale: 2 }).notNull(),

    calculationInputs: jsonb("calculation_inputs").$type<Record<string, unknown>>().notNull(),
    explanation: jsonb("explanation").$type<string[]>().notNull().default([]),
    warnings: jsonb("warnings").$type<string[]>().notNull().default([]),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("pricing_recommendations_product_idx").on(table.productId, table.createdAt)],
);

export type PricingRecommendation = typeof pricingRecommendations.$inferSelect;
export type NewPricingRecommendation = typeof pricingRecommendations.$inferInsert;
