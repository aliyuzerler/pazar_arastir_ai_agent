import type { NextRequest } from "next/server";

import { getDb } from "@/server/db/driver";
import { getProduct } from "@/server/db/repositories/product-repository";
import { listResearchRuns } from "@/server/application/research-orchestrator";
import {
  apiOk,
  currentDataMode,
  getRequestId,
  serviceErrorResponse,
} from "@/server/http/route-helpers";
import { resolveWorkspaceContext } from "@/server/security/workspace-context";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

/** GET /api/products/:id/research-history — ürünün araştırma koşuları. */
export async function GET(request: NextRequest, context: RouteContext) {
  const requestId = getRequestId(request);
  const { id } = await context.params;
  const workspace = await resolveWorkspaceContext();
  const db = getDb();
  const product = await getProduct(db, workspace.id, id);
  if (!product) {
    return serviceErrorResponse({ code: "NOT_FOUND", message: "Ürün bulunamadı." }, requestId);
  }
  const runs = await listResearchRuns(db, workspace.id, id);
  return apiOk({ runs }, { requestId, dataMode: currentDataMode() });
}
