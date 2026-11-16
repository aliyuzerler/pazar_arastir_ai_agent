/**
 * Yerel demo yöneticisi oluşturur (E2E global-setup ile aynı desen):
 *   PG_LITE_DATA_DIR=./.pglite-demo-data npx tsx scripts/create-demo-admin.ts
 * Önce `npm run db:seed` ile workspace+ürünler hazır olmalıdır.
 */
import "dotenv/config";

import bcryptjs from "bcryptjs";
import { eq } from "drizzle-orm";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";

import { users, workspaces } from "../src/server/db/schema";

const ADMIN = {
  email: process.env.DEMO_ADMIN_EMAIL ?? "admin@demo.local",
  password: process.env.DEMO_ADMIN_PASSWORD ?? "Demo!23456",
  displayName: "Demo Yönetici",
};

async function main(): Promise<void> {
  const client = new PGlite(process.env.PG_LITE_DATA_DIR ?? "./.pglite-demo-data");
  const db = drizzle(client, { schema: { users, workspaces } });

  const ws = await db.select().from(workspaces).limit(1);
  if (!ws[0]) {
    throw new Error("Workspace yok; önce `npm run db:seed` çalıştırın.");
  }

  const existing = await db.select().from(users).where(eq(users.email, ADMIN.email)).limit(1);
  if (existing[0]) {
    console.log("Admin zaten mevcut:", ADMIN.email);
  } else {
    await db.insert(users).values({
      workspaceId: ws[0].id,
      email: ADMIN.email,
      passwordHash: bcryptjs.hashSync(ADMIN.password, 10),
      displayName: ADMIN.displayName,
      role: "admin",
      isActive: true,
      emailVerified: true,
    });
    console.log("Admin oluşturuldu:", ADMIN.email);
  }

  await client.close();
  process.exit(0);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
