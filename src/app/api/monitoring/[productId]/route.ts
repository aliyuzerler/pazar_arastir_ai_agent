import type { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { getDb } from "@/server/db/driver";
import { products } from "@/server/db/schema";
import { getProduct } from "@/server/db/repositories/product-repository";
import { upsertMonitoringJob } from "@/server/jobs/monitoring-service";
import {
  apiOk,
  currentDataMode,
  getRequestId,
  serviceErrorResponse,
} from "@/server/http/route-helpers";
import { resolveWorkspaceContext } from "@/server/security/workspace-context";

export const dynamic = "force-dynamic";

const BODY_SCHEMA = z.object({
  trackingEnabled: z.boolean(),
  frequencyHours: z.number().int().min(6).max(168).optional(),
});

type RouteContext = { params: Promise<{ productId: string }> };

/** POST /api/monitoring/:productId — izlemeyi aç/kapat, sıklık güncelle. */
export async function POST(request: NextRequest, context: RouteContext) {
  const requestId = getRequestId(request);
  const { productId } = await context.params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return serviceErrorResponse({ code: "VALIDATION_ERROR", message: "Geçersiz JSON gövdesi." }, requestId);
  }
  const parsed = BODY_SCHEMA.safeParse(body);
  if (!parsed.success) {
    return serviceErrorResponse(
      { code: "VALIDATION_ERROR", message: "Sıklık 6-168 saat arasında olmalıdır." },
      requestId,
    );
  }
  const { workspace } = await resolveWorkspaceContext();
  const db = getDb();
  const product = await getProduct(db, workspace.id, productId);
  if (!product) {
    return serviceErrorResponse({ code: "NOT_FOUND", message: "Ürün bulunamadı." }, requestId);
  }

  // products tablosundaki izleme alanlarıyla senkron
  await db
    .update(products)
    .set({
      trackingEnabled: parsed.data.trackingEnabled,
      trackingIntervalHours: parsed.data.frequencyHours ?? product.trackingIntervalHours ?? 24,
      updatedAt: new Date(),
    })
    .where(eq(products.id, productId));

  const job = await upsertMonitoringJob(db, workspace.id, productId, parsed.data);
  return apiOk(job, { requestId, dataMode: currentDataMode() });
}
