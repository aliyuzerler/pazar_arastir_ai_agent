/**
 * Migration çalıştırıcı. Hem postgres hem pglite sürücüsünde aynı SQL
 * migration klasörünü (./drizzle) uygular.
 */
import { migrate as migrateNodePg } from "drizzle-orm/node-postgres/migrator";
import { migrate as migratePglite } from "drizzle-orm/pglite/migrator";

import type { AppDatabase } from "./driver";

export const MIGRATIONS_FOLDER = "./drizzle";

export async function runMigrations(db: AppDatabase, driver: "postgres" | "pglite"): Promise<void> {
  if (driver === "pglite") {
    await migratePglite(db, { migrationsFolder: MIGRATIONS_FOLDER });
    return;
  }
  await migrateNodePg(db, { migrationsFolder: MIGRATIONS_FOLDER });
}
