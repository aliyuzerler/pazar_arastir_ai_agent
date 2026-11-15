/**
 * Auth servisi: kayıt, giriş, e-posta doğrulama, parola sıfırlama.
 * Güvenlik kararları (security-auth skill):
 * - Parolalar bcryptjs ile hash'lenir; düz metin asla saklanmaz/loglanmaz.
 * - Token DEĞERİ DB'ye yazılmaz; yalnızca SHA-256 özeti saklanır.
 * - Doğrulanmamış hesap giriş yapamaz; aktif olmayan hesaplar reddedilir.
 * - Parola sıfırlama tüm oturumları geçersizleştirir (token sürümü).
 */
import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt, isNull } from "drizzle-orm";

import type { AppDatabase } from "@/server/db/driver";
import {
  authTokens,
  users,
  workspaces,
  type User,
} from "@/server/db/schema";
import { createSessionToken, SESSION_MAX_AGE_SECONDS, SESSION_COOKIE } from "@/server/domain/session";
import { hashPassword, verifyPassword, validatePasswordPolicy, PasswordPolicyError } from "@/server/domain/password";
import { sendEmail, renderVerificationEmail, renderPasswordResetEmail } from "@/server/application/email-service";
import { getEnv } from "@/lib/env";

export class AuthError extends Error {
  readonly code: "INVALID_CREDENTIALS" | "EMAIL_TAKEN" | "EMAIL_NOT_VERIFIED" | "ACCOUNT_DISABLED" | "VALIDATION_ERROR" | "TOKEN_INVALID";

  constructor(code: AuthError["code"], message: string) {
    super(message);
    this.name = "AuthError";
    this.code = code;
  }
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function generateToken(): string {
  return randomBytes(32).toString("hex");
}

export interface PublicUser {
  id: string;
  email: string;
  displayName: string;
  role: string;
  emailVerified: boolean;
  workspaceId: string;
}

export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
    emailVerified: user.emailVerified,
    workspaceId: user.workspaceId,
  };
}

/** Kayıt: kullanıcı + kendi workspace'i + doğrulama tokenı + outbox e-postası. */
export async function registerUser(
  db: AppDatabase,
  input: { email: string; password: string; displayName: string },
): Promise<{ user: User; verificationUrl: string | null }> {
  const email = normalizeEmail(input.email);
  if (!isValidEmail(email)) {
    throw new AuthError("VALIDATION_ERROR", "Geçerli bir e-posta adresi girin.");
  }
  try {
    validatePasswordPolicy(input.password);
  } catch (error) {
    if (error instanceof PasswordPolicyError) {
      throw new AuthError("VALIDATION_ERROR", error.message);
    }
    throw error;
  }

  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing[0]) {
    throw new AuthError("EMAIL_TAKEN", "Bu e-posta adresi zaten kayıtlı.");
  }

  const env = getEnv();
  const slugBase = email.split("@")[0].replace(/[^a-z0-9-]/g, "-").slice(0, 30);
  const slug = `${slugBase}-${randomBytes(3).toString("hex")}`;
  const workspace = (
    await db
      .insert(workspaces)
      .values({
        name: `${input.displayName || email} Workspace`,
        slug,
        defaultCountry: env.DEFAULT_COUNTRY,
        defaultLocale: env.DEFAULT_LOCALE,
        defaultCurrency: env.DEFAULT_CURRENCY,
      })
      .returning()
  )[0];

  const user = (
    await db
      .insert(users)
      .values({
        workspaceId: workspace.id,
        email,
        passwordHash: hashPassword(input.password),
        displayName: input.displayName.trim() || email,
        role: "user",
        emailVerified: false,
      })
      .returning()
  )[0];

  const verificationUrl = await issueTokenAndNotify(db, user, "email_verification");
  return { user, verificationUrl };
}

async function issueTokenAndNotify(
  db: AppDatabase,
  user: User,
  type: "email_verification" | "password_reset",
): Promise<string> {
  const token = generateToken();
  const hours = type === "email_verification" ? 24 : 1;
  await db.insert(authTokens).values({
    userId: user.id,
    type,
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + hours * 3_600_000),
  });
  const env = getEnv();
  // Her token türü kendi sayfasına gider; sıfırlama bağlantısı asla
  // doğrulama sayfasına işaret etmez (TEST_11 E2E yol iddiası).
  const path = type === "email_verification" ? "/verify-email" : "/reset-password";
  const url = `${env.APP_BASE_URL}${path}?token=${token}`;
  await sendEmail(db, {
    to: user.email,
    kind: type === "email_verification" ? "verification" : "password_reset",
    subject:
      type === "email_verification"
        ? "Product Intelligence — e-posta doğrulama"
        : "Product Intelligence — parola sıfırlama",
    html:
      type === "email_verification"
        ? renderVerificationEmail(user.displayName, url)
        : renderPasswordResetEmail(user.displayName, url),
  });
  return url;
}

export async function login(
  db: AppDatabase,
  input: { email: string; password: string },
): Promise<{ token: string; user: User }> {
  const email = normalizeEmail(input.email);
  const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
  const user = rows[0];
  if (!user || !verifyPassword(input.password, user.passwordHash)) {
    throw new AuthError("INVALID_CREDENTIALS", "E-posta veya parola hatalı.");
  }
  if (!user.isActive) {
    throw new AuthError("ACCOUNT_DISABLED", "Hesabınız devre dışı bırakılmış.");
  }
  if (!user.emailVerified) {
    throw new AuthError("EMAIL_NOT_VERIFIED", "Lütfen önce e-posta adresinizi doğrulayın.");
  }
  const token = await createSessionToken({
    sub: user.id,
    email: user.email,
    role: user.role,
    wid: user.workspaceId,
  });
  return { token, user };
}

/** Doğrulama tokenını harcar; kullanıcıyı doğrulanmış işaretler. */
export async function verifyEmail(db: AppDatabase, token: string): Promise<User> {
  const rows = await db
    .select()
    .from(authTokens)
    .where(
      and(
        eq(authTokens.tokenHash, hashToken(token)),
        eq(authTokens.type, "email_verification"),
        isNull(authTokens.usedAt),
        gt(authTokens.expiresAt, new Date()),
      ),
    )
    .limit(1);
  const record = rows[0];
  if (!record) {
    throw new AuthError("TOKEN_INVALID", "Doğrulama bağlantısı geçersiz veya süresi dolmuş.");
  }
  await db.update(authTokens).set({ usedAt: new Date() }).where(eq(authTokens.id, record.id));
  const updated = await db
    .update(users)
    .set({ emailVerified: true, updatedAt: new Date() })
    .where(eq(users.id, record.userId))
    .returning();
  return updated[0];
}

export async function resendVerification(db: AppDatabase, email: string): Promise<boolean> {
  const rows = await db.select().from(users).where(eq(users.email, normalizeEmail(email))).limit(1);
  const user = rows[0];
  // Kullanıcı yoksa bilgi sızmasını önlemek için sessizce başarılı davran.
  if (!user || user.emailVerified) return false;
  await issueTokenAndNotify(db, user, "email_verification");
  return true;
}

export async function requestPasswordReset(db: AppDatabase, email: string): Promise<void> {
  const rows = await db.select().from(users).where(eq(users.email, normalizeEmail(email))).limit(1);
  const user = rows[0];
  if (!user || !user.emailVerified || !user.isActive) return; // sessiz çıkış
  await issueTokenAndNotify(db, user, "password_reset");
}

/** Sıfırlama: parola güncellenir; tüm oturumlar çerezle zaten düşer (JWT).
 *  Tek kullanımlık token harcanır; aynı token yeniden kullanılamaz. */
export async function resetPassword(db: AppDatabase, token: string, newPassword: string): Promise<void> {
  try {
    validatePasswordPolicy(newPassword);
  } catch (error) {
    if (error instanceof PasswordPolicyError) {
      throw new AuthError("VALIDATION_ERROR", error.message);
    }
    throw error;
  }
  const rows = await db
    .select()
    .from(authTokens)
    .where(
      and(
        eq(authTokens.tokenHash, hashToken(token)),
        eq(authTokens.type, "password_reset"),
        isNull(authTokens.usedAt),
        gt(authTokens.expiresAt, new Date()),
      ),
    )
    .limit(1);
  const record = rows[0];
  if (!record) {
    throw new AuthError("TOKEN_INVALID", "Sıfırlama bağlantısı geçersiz veya süresi dolmuş.");
  }
  await db.update(authTokens).set({ usedAt: new Date() }).where(eq(authTokens.id, record.id));
  await db
    .update(users)
    .set({ passwordHash: hashPassword(newPassword), updatedAt: new Date() })
    .where(eq(users.id, record.userId));
}

export const SESSION_COOKIE_MAX_AGE = SESSION_MAX_AGE_SECONDS;
export { SESSION_COOKIE };
