import { sql } from "drizzle-orm";

import { getEnv } from "@/lib/env";
import { getDb, getDbDriverName } from "@/server/db/driver";
import { apiFail, apiOk, getRequestId } from "@/server/http/envelope";

export const dynamic = "force-dynamic";

/**
 * GET /api/health — uygulama ve veritabanı hazır durumunu döndürür.
 * DB hatasında güvenli, ayrıntısız (secret içermeyen) yanıt verir.
 */
export async function GET(request: Request) {
  const requestId = getRequestId(request);
  const env = getEnv();

  let dbStatus: "healthy" | "unhealthy" = "healthy";
  let status = 200;

  try {
    const db = getDb();
    await db.execute(sql`select 1`);
  } catch (error) {
    // Hata detayını (bağlantı dizesi vb.) yanıta koyma; sunucu loguna yalnızca
    // temizlenmiş mesajı yaz.
    const message = error instanceof Error ? error.message : "bilinmeyen hata";
    console.error(`[health] veritabanı erişilemiyor: ${message.slice(0, 200)}`);
    dbStatus = "unhealthy";
    status = 503;
  }

  if (dbStatus === "unhealthy") {
    return apiFail(
      {
        code: "HEALTH_CHECK_FAILED",
        message: "Uygulama çalışıyor ancak veritabanına ulaşılamıyor.",
      },
      { requestId, status },
    );
  }

  return apiOk(
    {
      status: "healthy",
      app: { mode: env.APP_MODE, nodeEnv: env.NODE_ENV },
      database: { status: dbStatus, driver: getDbDriverName() },
      version: "0.1.0",
    },
    { requestId, dataMode: env.PROVIDER_MODE === "demo" ? "demo" : "live" },
  );
}
