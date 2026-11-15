import type { NextRequest } from "next/server";

import { getDb } from "@/server/db/driver";
import { getAdminOverview, listOutbox, requireAdmin } from "@/server/application/admin-service";
import { apiOk, currentDataMode, getRequestId } from "@/server/http/route-helpers";
import { resolveWorkspaceContext } from "@/server/security/workspace-context";

export const dynamic = "force-dynamic";

/** GET /api/admin/overview — genel bakış sayıları (yalnızca admin). */
export async function GET(request: NextRequest) {
  const requestId = getRequestId(request);
  const { user } = await resolveWorkspaceContext();
  requireAdmin(user); // middleware 403 verir; burada DB tabanlı ikinci savunma

  const db = getDb();
  const [overview, outbox] = await Promise.all([getAdminOverview(db), listOutbox(db, 10)]);
  return apiOk({ overview, outbox }, { requestId, dataMode: currentDataMode() });
}
