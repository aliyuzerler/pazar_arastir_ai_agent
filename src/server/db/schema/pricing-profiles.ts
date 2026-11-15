import {
  boolean,
  char,
  index,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { workspaces } from "./workspaces";

/**
 * Fiyatlandırma profili: komisyon/kesinti oranları ve hedef marj.
 * Vergi modu ve komisyon tabanı kullanıcının açık yapılandırmasıdır;
 * yasal vergi oranı kod içine yazılmaz (docs/05).
 */
export const pricingProfiles = pgTable(
  "pricing_profiles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    marketplaceFeeRate: numeric("marketplace_fee_rate", { precision: 8, scale: 4 }).notNull(),
    paymentFeeRate: numeric("payment_fee_rate", { precision: 8, scale: 4 }).notNull(),
    otherVariableFeeRate: numeric("other_variable_fee_rate", { precision: 8, scale: 4 }).notNull(),
    targetMarginRate: numeric("target_margin_rate", { precision: 8, scale: 4 }).notNull(),
    fixedPerOrderCost: numeric("fixed_per_order_cost", { precision: 18, scale: 4 }).notNull(),
    taxMode: text("tax_mode").notNull().default("not_modelled"), // inclusive | exclusive | not_modelled
    commissionBase: text("commission_base").notNull().default("gross_price"), // gross_price | net_price | custom
    currency: char("currency", { length: 3 }).notNull(),
    isDefault: boolean("is_default").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("pricing_profiles_workspace_idx").on(table.workspaceId)],
);

export type PricingProfile = typeof pricingProfiles.$inferSelect;
export type NewPricingProfile = typeof pricingProfiles.$inferInsert;
