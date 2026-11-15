import type { NextRequest } from "next/server";

import { getDb } from "@/server/db/driver";
import { getProduct } from "@/server/db/repositories/product-repository";
import { listObservations } from "@/server/application/price-history-service";
import { computePriceStats, type PricePoint } from "@/server/domain/price-history";
import {
  apiOk,
  currentDataMode,
  getRequestId,
  serviceErrorResponse,
} from "@/server/http/route-helpers";
import { resolveWorkspaceContext } from "@/server/security/workspace-context";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

function toPoints(rows: { observedAt: Date; priceAmount: string; currency: string; availabilityStatus: string; stockQuantity: number | null }[]): PricePoint[] {
  return rows.map((row) => ({
    observedAt: row.observedAt.toISOString(),
    priceAmount: row.priceAmount,
    currency: row.currency,
    availabilityStatus: row.availabilityStatus,
    stockQuantity: row.stockQuantity,
  }));
}

/** GET /api/products/:id/price-history — iki ayrı seri + istatistik. */
export async function GET(request: NextRequest, context: RouteContext) {
  const requestId = getRequestId(request);
  const { id } = await context.params;
  const { workspace } = await resolveWorkspaceContext();
  const db = getDb();
  const product = await getProduct(db, workspace.id, id);
  if (!product) {
    return serviceErrorResponse({ code: "NOT_FOUND", message: "Ürün bulunamadı." }, requestId);
  }
  const series = await listObservations(db, workspace.id, id);
  return apiOk(
    {
      ourSnapshots: series.ourSnapshots,
      providerHistory: series.providerHistory,
      ourStats: computePriceStats(toPoints(series.ourSnapshots)),
      providerStats: computePriceStats(toPoints(series.providerHistory)),
    },
    { requestId, dataMode: currentDataMode() },
  );
}
