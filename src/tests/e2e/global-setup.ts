/**
 * Playwright global kurulum: E2E pglite veritabanını hazırlar.
 * - Migration uygula (boş veritabanından)
 * - Default workspace'i garanti et
 * - Ürün tablosunu temizle + örnek kataloğu yükle (deterministik koşular)
 *
 * Not: Playwright globalSetup "@" alias'ını çözmez; burada göreli importlar
 * ve bağımsız seed mantığı kullanılır.
 */
import { mkdirSync } from "node:fs";

import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";

import { monitoringJobs, products, workspaces } from "../../server/db/schema";
import { ensureSampleProducts } from "../../server/db/sample-products";

export default async function globalSetup(): Promise<void> {  process.env.DB_DRIVER = "pglite";
  process.env.PG_LITE_DATA_DIR = process.env.PG_LITE_DATA_DIR ?? "/tmp/product-intel-e2e-pgdata";
  process.env.APP_MODE = "local";
  process.env.PROVIDER_MODE = "demo";
  process.env.DEFAULT_WORKSPACE_SLUG = "default";
  process.env.DEFAULT_COUNTRY = "TR";
  process.env.DEFAULT_LOCALE = "tr-TR";
  process.env.DEFAULT_CURRENCY = "TRY";

  mkdirSync(process.env.PG_LITE_DATA_DIR, { recursive: true });

  const client = new PGlite(process.env.PG_LITE_DATA_DIR);
  const db = drizzle(client, { schema: { products, workspaces } });

  await migrate(db, { migrationsFolder: "drizzle" });

  const slug = process.env.DEFAULT_WORKSPACE_SLUG;
  const existing = await db.select().from(workspaces).limit(1);
  let workspaceId: string;
  if (existing.length > 0) {
    workspaceId = existing[0].id;
  } else {
    const inserted = await db
      .insert(workspaces)
      .values({
        name: "Default Workspace",
        slug,
        defaultCountry: process.env.DEFAULT_COUNTRY,
        defaultLocale: process.env.DEFAULT_LOCALE,
        defaultCurrency: process.env.DEFAULT_CURRENCY,
      })
      .returning();
    workspaceId = inserted[0].id;
  }

  await db.delete(products);
  await ensureSampleProducts(db as never, workspaceId);

  // İzleme işini burada garanti et (alias zinciri kullanmadan).
  const tracked = await db.select().from(products).limit(1);
  if (tracked[0]) {
    await db
      .insert(monitoringJobs)
      .values({
        workspaceId,
        productId: tracked[0].id,
        status: "idle",
        frequencyHours: 24,
      })
      .onConflictDoNothing();
  }

  await client.close();
  console.log("[global-setup] E2E pglite hazır:", process.env.PG_LITE_DATA_DIR);
}

// Doğrudan çalıştırıldığında (npx tsx src/tests/e2e/global-setup.ts) setup'ı yürüt.
if (process.argv[1] && process.argv[1].endsWith("global-setup.ts")) {
  globalSetup()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
