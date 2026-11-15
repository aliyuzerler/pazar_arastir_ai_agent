import { sql } from "drizzle-orm";
import { index, jsonb, pgTable, text, timestamp, uniqueIndex, uuid, integer } from "drizzle-orm/pg-core";

import { products, workspaces } from "./index";

/**
 * Araştırma koşusu. IdempotencyKey aynı workspace'te benzersizdir; aynı key
 * ile tekrar POST yeni koşu oluşturmaz (TEST_04 md-14).
 */
export const researchRuns = pgTable(
  "research_runs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("queued"), // queued|running|partial|completed|failed|cancelled
    queryPlan: jsonb("query_plan").$type<string[]>().notNull().default([]),
    providersRequested: jsonb("providers_requested").$type<string[]>().notNull().default([]),
    providerErrors: jsonb("provider_errors")
      .$type<{ providerId: string; kind: string; message: string }[]>()
      .notNull()
      .default([]),
    totalResults: integer("total_results").notNull().default(0),
    exactCount: integer("exact_count").notNull().default(0),
    substituteCount: integer("substitute_count").notNull().default(0),
    errorSummary: text("error_summary"),
    idempotencyKey: text("idempotency_key"),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("research_runs_idempotency_uq")
      .on(table.workspaceId, table.idempotencyKey)
      .where(sql`idempotency_key is not null`),
    index("research_runs_product_idx").on(table.productId),
  ],
);

export type ResearchRun = typeof researchRuns.$inferSelect;
export type NewResearchRun = typeof researchRuns.$inferInsert;
