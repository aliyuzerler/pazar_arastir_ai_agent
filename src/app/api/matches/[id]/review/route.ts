import type { NextRequest } from "next/server";
import { z } from "zod";

import { getDb } from "@/server/db/driver";
import { reviewMatch } from "@/server/db/repositories/offer-repository";
import {
  apiOk,
  currentDataMode,
  getRequestId,
  serviceErrorResponse,
} from "@/server/http/route-helpers";
import { resolveWorkspaceContext } from "@/server/security/workspace-context";

export const dynamic = "force-dynamic";

const REVIEW_SCHEMA = z.object({
  decision: z.enum(["approved", "rejected"]),
});

type RouteContext = { params: Promise<{ id: string }> };

/** POST /api/matches/:id/review — kullanıcı eşleşmeyi onaylar/reddeder. */
export async function POST(request: NextRequest, context: RouteContext) {
  const requestId = getRequestId(request);
  const { id } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return serviceErrorResponse({ code: "VALIDATION_ERROR", message: "Geçersiz JSON gövdesi." }, requestId);
  }
  const parsed = REVIEW_SCHEMA.safeParse(body);
  if (!parsed.success) {
    return serviceErrorResponse(
      { code: "VALIDATION_ERROR", message: "Karar alanı approved veya rejected olmalıdır." },
      requestId,
    );
  }

  const workspace = await resolveWorkspaceContext();
  const db = getDb();
  const match = await reviewMatch(db, workspace.id, id, parsed.data.decision);
  if (!match) {
    return serviceErrorResponse({ code: "NOT_FOUND", message: "Eşleşme bulunamadı." }, requestId);
  }
  return apiOk(match, { requestId, dataMode: currentDataMode() });
}
