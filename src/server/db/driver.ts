/**
 * Veritabanı sürücü fabrikası.
 *
 * İki sürücü desteklenir:
 * - postgres: node-postgres Pool ile gerçek PostgreSQL (yerel Docker / bulut).
 * - pglite  : in-process WASM PostgreSQL (Docker olmayan ortamlar ve testler).
 *
 * Her iki sürücü de aynı Drizzle sorgu API'sini sunar; tip birliği sorunlarını
 * önlemek için pglite örneği AppDatabase tipine dönülür. Aşağı akıştaki tüm
 * repository fonksiyonları AppDatabase tipiyle çalışır.
 */
import { PGlite } from "@electric-sql/pglite";
import { drizzle as drizzleNodePg, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { Pool } from "pg";

import { getEnv } from "@/lib/env";
import * as schema from "./schema";

export type AppDatabase = NodePgDatabase<typeof schema>;

export type DbDriver = "postgres" | "pglite";

/** Sürücüye göre yeni bir Drizzle veritabanı örneği oluşturur. */
export function createDb(driver?: DbDriver): AppDatabase {
  const env = getEnv();
  const selected = driver ?? env.DB_DRIVER;

  if (selected === "pglite") {
    const client = new PGlite(env.PG_LITE_DATA_DIR);
    return drizzlePglite(client, { schema }) as unknown as AppDatabase;
  }

  const pool = new Pool({ connectionString: env.DATABASE_URL, max: 10 });
  return drizzleNodePg(pool, { schema });
}

const globalStore = globalThis as unknown as { __productIntelDb?: AppDatabase };

/** Uygulama geneli tek veritabanı örneği (dev HMR'a dayanıklı). */
export function getDb(): AppDatabase {
  if (!globalStore.__productIntelDb) {
    globalStore.__productIntelDb = createDb();
  }
  return globalStore.__productIntelDb;
}

/** Sürücü adını döndürür (health/telemetri için). */
export function getDbDriverName(): string {
  return getEnv().DB_DRIVER;
}
