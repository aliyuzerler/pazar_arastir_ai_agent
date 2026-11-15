import type { NextRequest } from "next/server";

import { listProducts, type ProductSortField, type SortOrder } from "@/server/db/repositories/product-repository";
import { getDb } from "@/server/db/driver";
import { createProductChecked, parseProductInput } from "@/server/application/product-service";
import {
  apiOk,
  currentDataMode,
  getRequestId,
  serviceErrorResponse,
} from "@/server/http/route-helpers";
import { resolveWorkspaceContext } from "@/server/security/workspace-context";

export const dynamic = "force-dynamic";

const SORT_FIELDS: ProductSortField[] = ["title", "unitCost", "createdAt", "updatedAt"];

/** GET /api/products?query=&category=&tracking=&archived=&sort=&order=&limit=&offset= */
export async function GET(request: NextRequest) {
  const requestId = getRequestId(request);
  try {
    const workspace = await resolveWorkspaceContext();
    const sp = request.nextUrl.searchParams;

    const sortParam = sp.get("sort");
    const sort = SORT_FIELDS.includes(sortParam as ProductSortField)
      ? (sortParam as ProductSortField)
      : "createdAt";
    const order: SortOrder = sp.get("order") === "asc" ? "asc" : "desc";
    const trackingParam = sp.get("tracking");
    const archivedParam = sp.get("archived");

    const db = getDb();
    const result = await listProducts(db, workspace.id, {
      query: sp.get("query") ?? undefined,
      category: sp.get("category") ?? undefined,
      tracking: trackingParam === null ? undefined : trackingParam === "true",
      archived: archivedParam === "true",
      sort,
      order,
      limit: Number(sp.get("limit") ?? 20),
      offset: Number(sp.get("offset") ?? 0),
    });

    return apiOk(
      {
        items: result.items,
        total: result.total,
        limit: Number(sp.get("limit") ?? 20),
        offset: Number(sp.get("offset") ?? 0),
      },
      { requestId, dataMode: currentDataMode() },
    );
  } catch (error) {
    return serviceErrorResponse(
      { code: "VALIDATION_ERROR", message: error instanceof Error ? error.message : "Liste alınamadı." },
      requestId,
    );
  }
}

/** POST /api/products — yeni ürün oluştur. */
export async function POST(request: NextRequest) {
  const requestId = getRequestId(request);
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return serviceErrorResponse({ code: "VALIDATION_ERROR", message: "Geçersiz JSON gövdesi." }, requestId);
  }

  try {
    const input = parseProductInput(body);
    const workspace = await resolveWorkspaceContext();
    const db = getDb();
    const product = await createProductChecked(db, workspace.id, input);
    return apiOk(product, { requestId, dataMode: currentDataMode(), status: 201 });
  } catch (error) {
    return serviceErrorResponse(error as never, requestId);
  }
}
