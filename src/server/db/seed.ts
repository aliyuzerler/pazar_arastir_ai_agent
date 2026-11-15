/**
 * Seed betiği: `npm run db:seed`
 */
import "dotenv/config";

import { getEnv } from "@/lib/env";
import { createDb, type DbDriver } from "./driver";
import { ensureDefaultWorkspace } from "./seeding";

async function main(): Promise<void> {
  const env = getEnv();
  const driver: DbDriver = env.DB_DRIVER;
  const db = createDb(driver);
  const result = await ensureDefaultWorkspace(db);
  console.log(
    result.created
      ? `Default workspace oluşturuldu (${result.slug}, id: ${result.workspaceId}).`
      : `Default workspace zaten mevcut (${result.slug}); seed idempotent.`,
  );
  process.exit(0);
}

main().catch((error) => {
  console.error("Seed hatası:", error instanceof Error ? error.message : error);
  process.exit(1);
});
