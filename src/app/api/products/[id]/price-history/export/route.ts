import type { NextRequest } from "next/server";

import { getDb } from "@/server/db/driver";
import { getProduct } from "@/server/db/repositories/product-repository";
import { listObservations } from "@/server/application/price-history-service";
import { neutralizeCsvCell } from "@/server/domain/csv";
import { getRequestId, serviceErrorResponse } from "@/server/http/route-helpers";
import { resolveWorkspaceContext } from "@/server/security/workspace-context";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

/** CSV formül enjeksiyonuna karşı baş hücreleri nötralize eden satır üretici. */
function csvLine(cells: (string | number | null)[]): string {
  return cells
    .map((cell) => {
      const value = cell === null ? "" : String(cell);
      return /["\n,;]/.test(value) ? `"${value.replace(/"/g, '""')}"` : neutralizeCsvCell(value);
    })
    .join(",");
}

/** GET /api/products/:id/price-history/export — geçmiş CSV dışa aktarımı. */
export async function GET(request: NextRequest, context: RouteContext) {
  const requestId = getRequestId(request);
  const { id } = await context.params;
  const workspace = await resolveWorkspaceContext();
  const db = getDb();
  const product = await getProduct(db, workspace.id, id);
  if (!product) {
    return serviceErrorResponse({ code: "NOT_FOUND", message: "Ürün bulunamadı." }, requestId);
  }
  const series = await listObservations(db, workspace.id, id);
  const rows = [...series.ourSnapshots, ...series.providerHistory].sort(
    (a, b) => a.observedAt.getTime() - b.observedAt.getTime(),
  );

  const lines: string[] = [
    csvLine([
      "observed_at",
      "source_kind",
      "price_amount",
      "currency",
      "shipping_amount",
      "availability_status",
      "stock_quantity",
      "is_demo",
      "product",
    ]),
    ...rows.map((row) =>
      csvLine([
        row.observedAt.toISOString(),
        row.sourceKind,
        row.priceAmount,
        row.currency,
        row.shippingAmount,
        row.availabilityStatus,
        row.stockQuantity,
        row.isDemo ? "true" : "false",
        product.title,
      ]),
    ),
  ];

  return new Response(lines.join("\n"), {
    status: 200,
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="fiyat-gecmisi-${id.slice(0, 8)}.csv"`,
      "x-request-id": requestId,
    },
  });
}
