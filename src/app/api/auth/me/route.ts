import type { NextRequest } from "next/server";

import { toPublicUser } from "@/server/application/auth-service";
import { apiOk, currentDataMode, getRequestId } from "@/server/http/route-helpers";
import { resolveWorkspaceContext } from "@/server/security/workspace-context";

export const dynamic = "force-dynamic";

/** GET /api/auth/me — oturum sahibi kullanıcı + workspace özeti. */
export async function GET(request: NextRequest) {
  const requestId = getRequestId(request);
  const { workspace, user } = await resolveWorkspaceContext();
  return apiOk(
    {
      user: toPublicUser(user),
      workspace: {
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
        defaultCurrency: workspace.defaultCurrency,
      },
    },
    { requestId, dataMode: currentDataMode() },
  );
}
