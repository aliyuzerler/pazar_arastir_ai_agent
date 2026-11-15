import type { NextRequest } from "next/server";
import { eq } from "drizzle-orm";

import { getDb } from "@/server/db/driver";
import { alerts } from "@/server/db/schema";
import { apiOk, getRequestId, serviceErrorResponse } from "@/server/http/route-helpers";
import { resolveWorkspaceContext } from "@/server/security/workspace-context";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

/** POST /api/alerts/:id/read — etkinliği okundu işaretle. */
export async function POST(request: NextRequest, context: RouteContext) {
  const requestId = getRequestId(request);
  const { id } = await context.params;
  const workspace = await resolveWorkspaceContext();
  const db = getDb();
  const updated = await db
    .update(alerts)
    .set({ isRead: true })
    .where(eq(alerts.id, id))
    .returning();
  if (!updated[0] || updated[0].workspaceId !== workspace.id) {
    return serviceErrorResponse({ code: "NOT_FOUND", message: "Etkinlik bulunamadı." }, requestId);
  }
  return apiOk(updated[0], { requestId, dataMode: "demo" });
}
