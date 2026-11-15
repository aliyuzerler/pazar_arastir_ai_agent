import { boolean, char, date, index, integer, numeric, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

import { products, workspaces } from "./index";

/**
 * İzleme işi. Ürün başına tek kayıt; kilit alanı (lock_until) aynı işin
 * paralel/tekrarlı koşmasını engeller (TEST_07 md-4).
 */
export const monitoringJobs = pgTable(
  "monitoring_jobs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("idle"), // idle|running|failed|paused
    frequencyHours: integer("frequency_hours").notNull().default(24),
    lastRunAt: timestamp("last_run_at", { withTimezone: true }),
    nextRunAt: timestamp("next_run_at", { withTimezone: true }).notNull().defaultNow(),
    lockUntil: timestamp("lock_until", { withTimezone: true }),
    lastError: text("last_error"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("monitoring_jobs_product_uq").on(table.productId),
    index("monitoring_jobs_due_idx").on(table.status, table.nextRunAt),
  ],
);

/** Etkinlik/uyarı kaydı. Renk değil metin taşıyan tip alanı kullanılır. */
export const alerts = pgTable(
  "alerts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    offerId: uuid("offer_id"),
    type: text("type").notNull(), // price_drop|price_rise|availability_change|research_completed
    thresholdPercent: numeric("threshold_percent", { precision: 5, scale: 2 }),
    oldPrice: numeric("old_price", { precision: 18, scale: 4 }),
    newPrice: numeric("new_price", { precision: 18, scale: 4 }),
    currency: char("currency", { length: 3 }),
    message: text("message").notNull(),
    isDemo: boolean("is_demo").notNull().default(false),
    isRead: boolean("is_read").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("alerts_workspace_created_idx").on(table.workspaceId, table.createdAt)],
);

/** Günlük sağlayıcı sorgu bütçesi (kota koruması, TEST_07 md-9). */
export const providerQuotaUsage = pgTable(
  "provider_quota_usage",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    providerId: text("provider_id").notNull(),
    day: date("day").notNull(),
    usedQueries: integer("used_queries").notNull().default(0),
  },
  (table) => [
    uniqueIndex("provider_quota_day_uq").on(table.workspaceId, table.providerId, table.day),
  ],
);

export type MonitoringJob = typeof monitoringJobs.$inferSelect;
export type Alert = typeof alerts.$inferSelect;
