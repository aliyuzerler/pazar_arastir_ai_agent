import type { NextRequest } from "next/server";

import { getDb } from "@/server/db/driver";
import { listUsersWithWorkspaces, requireAdmin } from "@/server/application/admin-service";
import { apiOk, currentDataMode, getRequestId, serviceErrorResponse } from "@/server/http/route-helpers";
import { resolveWorkspaceContext } from "@/server/security/workspace-context";
import { AuthError } from "@/server/application/auth-service";

export const dynamic = "force-dynamic";

/** GET /api/admin/users — kullanıcı listesi (yalnızca admin). */
export async function GET(request: NextRequest) {
  const requestId = getRequestId(request);
  const { user } = await resolveWorkspaceContext();
  try {
    requireAdmin(user);
  } catch {
    return serviceErrorResponse(
      { code: "FORBIDDEN", message: "Bu işlem için admin yetkisi gerekir." },
      requestId,
    );
  }
  const db = getDb();
  const users = await listUsersWithWorkspaces(db);
  return apiOk({ users }, { requestId, dataMode: currentDataMode() });
}
