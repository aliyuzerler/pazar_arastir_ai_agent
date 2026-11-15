import type { NextRequest } from "next/server";
import { z } from "zod";

import { getDb } from "@/server/db/driver";
import { getProduct } from "@/server/db/repositories/product-repository";
import {
  computeAndSaveRecommendations,
  listRecommendations,
} from "@/server/application/pricing-service";
import {
  apiOk,
  currentDataMode,
  getRequestId,
  serviceErrorResponse,
} from "@/server/http/route-helpers";
import { resolveWorkspaceContext } from "@/server/security/workspace-context";

export const dynamic = "force-dynamic";

const COMPUTE_SCHEMA = z.object({
  pricingProfileId: z.string().uuid().nullish(),
  researchRunId: z.string().uuid().nullish(),
});

type RouteContext = { params: Promise<{ id: string }> };

/**
 * POST /api/products/:id/pricing — üç stratejiyi hesaplar, girdi anlık
 * görüntüsüyle geçmişe kaydeder. AI nihai fiyat yazmaz; motor deterministiktir.
 */
export async function POST(request: NextRequest, context: RouteContext) {
  const requestId = getRequestId(request);
  const { id } = await context.params;
  let body: unknown = {};
  try {
    const text = await request.text();
    if (text.length > 0) body = JSON.parse(text);
  } catch {
    return serviceErrorResponse({ code: "VALIDATION_ERROR", message: "Geçersiz JSON gövdesi." }, requestId);
  }
  const parsed = COMPUTE_SCHEMA.safeParse(body);
  if (!parsed.success) {
    return serviceErrorResponse({ code: "VALIDATION_ERROR", message: "İstek alanları geçersiz." }, requestId);
  }

  const workspace = await resolveWorkspaceContext();
  const db = getDb();
  const product = await getProduct(db, workspace.id, id);
  if (!product) {
    return serviceErrorResponse({ code: "NOT_FOUND", message: "Ürün bulunamadı." }, requestId);
  }

  try {
    const result = await computeAndSaveRecommendations(db, workspace.id, product, {
      profileOverrideId: parsed.data.pricingProfileId ?? null,
      researchRunId: parsed.data.researchRunId ?? null,
    });
    return apiOk(result, { requestId, dataMode: currentDataMode(), status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Fiyat önerisi hesaplanamadı.";
    return serviceErrorResponse({ code: "VALIDATION_ERROR", message }, requestId);
  }
}

/** GET /api/products/:id/pricing — öneri geçmişi. */
export async function GET(request: NextRequest, context: RouteContext) {
  const requestId = getRequestId(request);
  const { id } = await context.params;
  const workspace = await resolveWorkspaceContext();
  const db = getDb();
  const product = await getProduct(db, workspace.id, id);
  if (!product) {
    return serviceErrorResponse({ code: "NOT_FOUND", message: "Ürün bulunamadı." }, requestId);
  }
  const recommendations = await listRecommendations(db, workspace.id, id);
  return apiOk({ recommendations }, { requestId, dataMode: currentDataMode() });
}
