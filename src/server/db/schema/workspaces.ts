import { char, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

/**
 * İşletme / çalışma alanı. SaaS dönüşümünde tenant kapsamının temelidir;
 * MVP'de tek kayıt (default workspace) seed ile oluşturulur.
 */
export const workspaces = pgTable("workspaces", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  defaultCountry: char("default_country", { length: 2 }).notNull().default("TR"),
  defaultLocale: text("default_locale").notNull().default("tr-TR"),
  defaultCurrency: char("default_currency", { length: 3 }).notNull().default("TRY"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Workspace = typeof workspaces.$inferSelect;
export type NewWorkspace = typeof workspaces.$inferInsert;
