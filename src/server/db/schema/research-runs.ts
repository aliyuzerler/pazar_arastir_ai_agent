import { sql } from "drizzle-orm";
import { index, jsonb, pgTable, text, timestamp, uniqueIndex, uuid, integer } from "drizzle-orm/pg-core";

import { products, workspaces } from "./index";

/**
 * Koşu başına AI asistan (Gemini) sonucu. Yalnızca yardımcı bilgiler taşır:
 * fiyat, stok, eşleşme kararı gibi alanlar ASLA buradan gelmez — bunlar
 * yalnızca sağlayıcı verisi ve deterministik motor ile üretilir.
 * Asistan devre dışıysa kolon null kalır.
 */
export interface ResearchAssistantMeta {
  /** Kullanılan model adı (ör. gemini-3.8-flash). */
  model: string;
  status: "ok" | "unavailable";
  /** status=unavailable iken sanitise edilmiş neden (ör. http_error, region). */
  reason?: string;
  /** Koşu sorgu planına eklenen AI sorgu önerisi sayısı. */
  queriesAdded: number;
  summary?: string;
  substituteNotes?: string[];
  latencyMs?: number;
}

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
    assistant: jsonb("assistant").$type<ResearchAssistantMeta | null>(),
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
