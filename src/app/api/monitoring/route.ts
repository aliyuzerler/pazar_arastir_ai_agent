import type { NextRequest } from "next/server";

import { getDb } from "@/server/db/driver";
import { listAlerts, listJobsWithProducts } from "@/server/jobs/monitoring-service";
import { apiOk, currentDataMode, getRequestId } from "@/server/http/route-helpers";
import { resolveWorkspaceContext } from "@/server/security/workspace-context";

export const dynamic = "force-dynamic";

/** GET /api/monitoring — işler + etkinlik akışı. */
export async function GET(request: NextRequest) {
  const requestId = getRequestId(request);
  const { workspace } = await resolveWorkspaceContext();
  const db = getDb();
  const [jobs, alertRows] = await Promise.all([
    listJobsWithProducts(db, workspace.id),
    listAlerts(db, workspace.id),
  ]);
  return apiOk(
    {
      jobs: jobs.map((row) => ({ ...row.job, productTitle: row.product.title })),
      alerts: alertRows.map((row) => ({ ...row.alert, productTitle: row.product.title })),
    },
    { requestId, dataMode: currentDataMode() },
  );
}
