import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { eq } from "drizzle-orm";

import { createDb } from "@/server/db/driver";
import { runMigrations } from "@/server/db/migrator";
import {
  getAdminOverview,
  listUsersWithWorkspaces,
  requireAdmin,
  updateUserAdmin,
} from "@/server/application/admin-service";
import { registerUser } from "@/server/application/auth-service";
import { users, workspaces } from "@/server/db/schema";

/**
 * TEST_12 — admin servisi: rol koruması, kendi hesabını kilitleme koruması,
 * kullanıcı güncelleme ve genel bakış sayıları.
 */
const db = createDb("pglite");

let admin: typeof users.$inferSelect;
let member: typeof users.$inferSelect;

beforeAll(async () => {
  await runMigrations(db, "pglite");
  await db.delete(users);
  await db.delete(workspaces);

  // Admin (doğrudan ekle)
  const ws = await db.insert(workspaces).values({ name: "Admin WS", slug: "adm-ws" }).returning();
  admin = (
    await db
      .insert(users)
      .values({
        workspaceId: ws[0].id,
        email: "admin@test.local",
        passwordHash: "x",
        displayName: "Admin",
        role: "admin",
        emailVerified: true,
      })
      .returning()
  )[0];

  // Üye (kayıt akışıyla, doğrulaması admin güncellemesiyle yapılır)
  const { user: registered } = await registerUser(db, {
    email: "uye@test.local",
    password: "UyeParola123",
    displayName: "Üye",
  });
  member = (
    await db.select().from(users).where(eq(users.id, registered.id)).limit(1)
  )[0];
});

afterAll(async () => {
  const client = (db as unknown as { $client: { close: () => Promise<void> } }).$client;
  await client.close();
});

describe("admin servisi", () => {
  it("requireAdmin admin olmayan kullanıcıyı reddeder", () => {
    expect(() => requireAdmin(member)).toThrowError(/admin yetkisi/);
    expect(() => requireAdmin(admin)).not.toThrow();
  });

  it("kullanıcı listesi workspace bilgisi ve ürün sayısıyla gelir", async () => {
    const rows = await listUsersWithWorkspaces(db);
    expect(rows.length).toBe(2);
    const memberRow = rows.find((row) => row.email === "uye@test.local");
    expect(memberRow?.workspaceName).toBeTruthy();
    expect(memberRow?.productCount).toBe(0);
  });

  it("admin kullanıcıyı doğrulanmış işaretleyebilir", async () => {
    const updated = await updateUserAdmin(db, admin, member.id, { emailVerified: true });
    expect(updated.emailVerified).toBe(true);
  });

  it("admin kendisini devre dışı bırakamaz veya rolünü düşüremez", async () => {
    await expect(updateUserAdmin(db, admin, admin.id, { isActive: false })).rejects.toThrowError(
      /kısıtlayamazsınız/,
    );
    await expect(updateUserAdmin(db, admin, admin.id, { role: "user" })).rejects.toThrowError(
      /kısıtlayamazsınız/,
    );
  });

  it("genel bakış sayıları doğru toplanır", async () => {
    const overview = await getAdminOverview(db);
    expect(overview.userCount).toBe(2);
    expect(overview.verifiedUserCount).toBe(2);
    expect(overview.workspaceCount).toBeGreaterThanOrEqual(2);
    expect(overview.productCount).toBe(0);
  });
});
