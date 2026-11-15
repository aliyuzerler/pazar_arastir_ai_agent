import type { NextRequest } from "next/server";

import { getEnv } from "@/lib/env";
import { getDb } from "@/server/db/driver";
import { runMonitoringBatch } from "@/server/jobs/monitoring-service";
import { apiFail, apiOk, getRequestId } from "@/server/http/envelope";

export const dynamic = "force-dynamic";

/**
 * GET /api/cron/monitoring — Vercel Cron uyumlu, CRON_SECRET ile korunan
 * küçük batch çalıştırıcı. Yetkisiz çağrı 401 döner (TEST_07 md-10).
 */
export async function GET(request: NextRequest) {
  const requestId = getRequestId(request);
  const env = getEnv();
  const authHeader = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${env.CRON_SECRET ?? ""}`;

  if (!env.CRON_SECRET || authHeader !== expected) {
    return apiFail({ code: "UNAUTHORIZED", message: "Geçersiz cron kimlik doğrulaması." }, { requestId, status: 401 });
  }

  const db = getDb();
  const result = await runMonitoringBatch(db);
  return apiOk(result, { requestId, dataMode: "demo" });
}
