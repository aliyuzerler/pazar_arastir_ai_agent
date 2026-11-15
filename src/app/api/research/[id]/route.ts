import type { NextRequest } from "next/server";

import { getDb } from "@/server/db/driver";
import { getResearchRun } from "@/server/application/research-orchestrator";
import { listOffersForProduct } from "@/server/db/repositories/offer-repository";
import {
  apiOk,
  currentDataMode,
  getRequestId,
  serviceErrorResponse,
} from "@/server/http/route-helpers";
import { resolveWorkspaceContext } from "@/server/security/workspace-context";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

/** GET /api/research/:id — koşu + teklif listesi. */
export async function GET(request: NextRequest, context: RouteContext) {
  const requestId = getRequestId(request);
  const { id } = await context.params;
  const { workspace } = await resolveWorkspaceContext();
  const db = getDb();
  const run = await getResearchRun(db, workspace.id, id);
  if (!run) {
    return serviceErrorResponse({ code: "NOT_FOUND", message: "Araştırma bulunamadı." }, requestId);
  }
  const offers = await listOffersForProduct(db, workspace.id, run.productId);
  return apiOk({ run, offers }, { requestId, dataMode: currentDataMode() });
}
