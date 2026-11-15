import { boolean, index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { workspaces } from "./index";

/**
 * Kullanıcılar. Her kullanıcı kendi workspace'ine sahiptir (SaaS çok
 * kiracılılık); admin rolü yalnızca /admin paneline erişimi açar.
 */
export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    displayName: text("display_name").notNull(),
    role: text("role").notNull().default("user"), // user|admin
    isActive: boolean("is_active").notNull().default(true),
    emailVerified: boolean("email_verified").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("users_email_uq").on(table.email)],
);

/**
 * Tek kullanımlık kimlik doğrulama tokenları (e-posta doğrulama, parola
 * sıfırlama). Token DEĞERİ saklanmaz; yalnızca SHA-256 özeti tutulur.
 */
export const authTokens = pgTable(
  "auth_tokens",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(), // email_verification|password_reset
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("auth_tokens_hash_idx").on(table.tokenHash)],
);

/**
 * E-posta çıkış kutusu: yerel/demo modda gönderim bu tabloya yazılır;
 * RESEND_API_KEY tanımlıysa gerçek taşıyıcı ile gönderilir.
 */
export const emailOutbox = pgTable("email_outbox", {
  id: uuid("id").defaultRandom().primaryKey(),
  toEmail: text("to_email").notNull(),
  subject: text("subject").notNull(),
  kind: text("kind").notNull(), // verification|password_reset
  bodyHtml: text("body_html").notNull(),
  sentVia: text("sent_via").notNull().default("outbox"), // outbox|resend
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type AuthToken = typeof authTokens.$inferSelect;
export type EmailOutboxEntry = typeof emailOutbox.$inferSelect;
