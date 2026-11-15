import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { eq } from "drizzle-orm";

import { createDb } from "@/server/db/driver";
import { runMigrations } from "@/server/db/migrator";
import {
  AuthError,
  login,
  registerUser,
  verifyEmail,
  resendVerification,
  requestPasswordReset,
  resetPassword,
  normalizeEmail,
  hashToken,
} from "@/server/application/auth-service";
import { users, workspaces, authTokens, emailOutbox } from "@/server/db/schema";

/**
 * Entegrasyon (TEST_10): kayıt → doğrulama → giriş akışı pglite üzerinde.
 * Hata kodları, bilgi sızması engelleri ve token tek kullanımlılığı test edilir.
 */
const db = createDb("pglite");

beforeAll(async () => {
  await runMigrations(db, "pglite");
  await db.delete(users);
  await db.delete(workspaces);
  // Outbox FK'sız birikir; koşu öncesi temizle.
  await db.delete(emailOutbox);
});

afterAll(async () => {
  const client = (db as unknown as { $client: { close: () => Promise<void> } }).$client;
  await client.close();
});

describe("auth akışı", () => {
  let verificationUrl = "";

  it("kayıt kullanıcı + workspace + doğrulama e-postası oluşturur", async () => {
    const { user, verificationUrl: url } = await registerUser(db, {
      email: "Uye@Example.COM",
      password: "Gizli12345",
      displayName: "Test Üyesi",
    });
    expect(user.email).toBe("uye@example.com"); // normalize edilmiş
    verificationUrl = url ?? "";

    const wss = await db.select().from(workspaces).where(eq(workspaces.id, user.workspaceId));
    expect(wss).toHaveLength(1);

    const mails = await db.select().from(emailOutbox).where(eq(emailOutbox.toEmail, "uye@example.com"));
    expect(mails).toHaveLength(1);
    expect(mails[0].kind).toBe("verification");
    expect(mails[0].bodyHtml).toContain("doğrula");
    // Token DEĞERİ e-posta gövdesinde bağlantıda olmalı ama DB'de olmamalı
    const tokenInUrl = verificationUrl.split("token=")[1];
    const hashes = await db.select().from(authTokens);
    expect(hashes[0].tokenHash).toBe(hashToken(tokenInUrl));
    expect(hashes[0].tokenHash).not.toContain(tokenInUrl);
  });

  it("aynı e-posta ikinci kez kayıt olamaz", async () => {
    await expect(
      registerUser(db, { email: "uye@example.com", password: "Gizli12345", displayName: "X" }),
    ).rejects.toMatchObject({ code: "EMAIL_TAKEN" });
  });

  it("zayıf parola politikada reddedilir", async () => {
    await expect(
      registerUser(db, { email: "weak@example.com", password: "gizli", displayName: "X" }),
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
  });

  it("doğrulanmamış hesap giriş yapamaz", async () => {
    await expect(login(db, { email: "uye@example.com", password: "Gizli12345" })).rejects.toMatchObject({
      code: "EMAIL_NOT_VERIFIED",
    });
  });

  it("e-posta doğrulama sonrası giriş başarılıdır", async () => {
    const token = verificationUrl.split("token=")[1];
    const user = await verifyEmail(db, token);
    expect(user.emailVerified).toBe(true);

    // Tek kullanımlık: aynı token tekrar çalışmaz
    await expect(verifyEmail(db, token)).rejects.toMatchObject({ code: "TOKEN_INVALID" });

    const { token: sessionToken } = await login(db, { email: "uye@example.com", password: "Gizli12345" });
    expect(sessionToken.length).toBeGreaterThan(20);
  });

  it("yanlış parola INVALID_CREDENTIALS verir (kullanıcı adı sızmadan)", async () => {
    await expect(login(db, { email: "uye@example.com", password: "Yanlis1234" })).rejects.toMatchObject({
      code: "INVALID_CREDENTIALS",
    });
  });

  it("doğrulama mailini yeniden gönderme yalnızca doğrulanmamış hesap için çalışır", async () => {
    await expect(resendVerification(db, "uye@example.com")).resolves.toBe(false); // zaten doğrulanmış
    const { verificationUrl: url2 } = await registerUser(db, {
      email: "iki@example.com",
      password: "Gizli12345",
      displayName: "İki",
    });
    await resendVerification(db, "iki@example.com");
    const mails = await db.select().from(emailOutbox).where(eq(emailOutbox.toEmail, "iki@example.com"));
    expect(mails.length).toBeGreaterThanOrEqual(2);
    expect(url2).toContain("/verify-email?token=");
  });

  it("parola sıfırlama: token tek kullanımlık, yeni parola ile giriş olur", async () => {
    await requestPasswordReset(db, "uye@example.com");
    const resets = await db.select().from(authTokens).where(eq(authTokens.type, "password_reset"));
    expect(resets).toHaveLength(1);

    // Bilinmeyen e-posta için sessiz çıkış (sızmaya karşı)
    await requestPasswordReset(db, "yok@example.com");
    expect((await db.select().from(authTokens).where(eq(authTokens.type, "password_reset")))).toHaveLength(1);

    // Token değerini e-posta gövdesinden çıkar (outbox'ta URL şifresiz taşınır)
    const mails = await db.select().from(emailOutbox).where(eq(emailOutbox.toEmail, "uye@example.com"));
    const resetMail = mails.find((mail) => mail.kind === "password_reset");
    // Sıfırlama bağlantısı doğru sayfaya işaret etmeli (Türkçe harf toleranssız)
    expect(resetMail?.bodyHtml).toContain("/reset-password?token=");
    const tokenMatch = resetMail?.bodyHtml.match(/reset-password\?token=([a-f0-9]+)/);
    expect(tokenMatch).not.toBeNull();

    await resetPassword(db, tokenMatch![1], "YeniParola123");
    await expect(resetPassword(db, tokenMatch![1], "BaskaParola123")).rejects.toMatchObject({
      code: "TOKEN_INVALID",
    });
    await expect(login(db, { email: "uye@example.com", password: "Gizli12345" })).rejects.toMatchObject({
      code: "INVALID_CREDENTIALS",
    });
    await expect(login(db, { email: "uye@example.com", password: "YeniParola123" })).resolves.toMatchObject({
      token: expect.any(String),
    });
  });
});
