/**
 * Migration betiği: `npm run db:migrate`
 * Kullanım: DATABASE_URL (postgres) veya DB_DRIVER=pglite üzerinden çalışır.
 */
import "dotenv/config";

import { getEnv } from "@/lib/env";
import { createDb, type DbDriver } from "./driver";
import { runMigrations } from "./migrator";

async function main(): Promise<void> {
  const env = getEnv();
  const driver: DbDriver = env.DB_DRIVER;
  console.log(`Migration başlatılıyor (sürücü: ${driver})...`);
  const db = createDb(driver);
  await runMigrations(db, driver);
  console.log("Migration tamamlandı.");
  process.exit(0);
}

main().catch((error) => {
  console.error("Migration hatası:", error instanceof Error ? error.message : error);
  process.exit(1);
});
