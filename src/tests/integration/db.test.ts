import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createDb } from "@/server/db/driver";
import { runMigrations } from "@/server/db/migrator";
import { ensureDefaultWorkspace } from "@/server/db/seeding";
import { workspaces } from "@/server/db/schema";

/**
 * Entegrasyon: gömülü PostgreSQL (pglite) üzerinde gerçek migration + seed.
 * Gerçek PostgreSQL SQL diyalektiği çalışır; repository davranışı mock'lanmaz.
 */
const db = createDb("pglite");

beforeAll(async () => {
  await runMigrations(db, "pglite");
  // Deterministik izolasyon: workspace tablosunu temizle.
  await db.delete(workspaces);
});

afterAll(async () => {
  const client = (db as unknown as { $client: { close: () => Promise<void> } }).$client;
  await client.close();
});

describe("migration ve seed (pglite)", () => {
  it("migration boş veritabanından başarıyla uygulanır", async () => {
    const rows = await db.select().from(workspaces);
    expect(Array.isArray(rows)).toBe(true);
  });

  it("seed tam bir default workspace oluşturur ve tekrar çalıştırmak idempotenttir", async () => {
    const first = await ensureDefaultWorkspace(db);
    expect(first.created).toBe(true);
    expect(first.slug).toBe("default");

    const second = await ensureDefaultWorkspace(db);
    expect(second.created).toBe(false);
    expect(second.workspaceId).toBe(first.workspaceId);

    const all = await db.select().from(workspaces);
    expect(all).toHaveLength(1);
    expect(all[0].name).toBe("Default Workspace");
    expect(all[0].defaultCurrency).toBe("TRY");
    expect(all[0].defaultLocale).toBe("tr-TR");
  });
});
