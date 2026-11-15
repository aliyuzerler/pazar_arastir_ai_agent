import type { NextRequest } from "next/server";
import { z } from "zod";

import { getDb } from "@/server/db/driver";
import {
  archiveProduct,
  getProduct,
  restoreProduct,
  updateProduct,
} from "@/server/db/repositories/product-repository";
import {
  parseProductInput,
  updateProductChecked,
} from "@/server/application/product-service";
import {
  apiOk,
  currentDataMode,
  getRequestId,
  serviceErrorResponse,
} from "@/server/http/route-helpers";
import { resolveWorkspaceContext } from "@/server/security/workspace-context";

export const dynamic = "force-dynamic";

const PATCH_ACTION_SCHEMA = z.discriminatedUnion("action", [
  z.object({ action: z.literal("restore") }),
  z.object({ action: z.literal("archive") }),
  z.object({ action: z.literal("update"), fields: z.record(z.unknown()) }),
]);

type RouteContext = { params: Promise<{ id: string }> };

/** GET /api/products/:id */
export async function GET(request: NextRequest, context: RouteContext) {
  const requestId = getRequestId(request);
  const { id } = await context.params;
  const workspace = await resolveWorkspaceContext();
  const db = getDb();
  const product = await getProduct(db, workspace.id, id);
  if (!product) {
    return serviceErrorResponse(
      { code: "NOT_FOUND", message: "Ürün bulunamadı." },
      requestId,
    );
  }
  return apiOk(product, { requestId, dataMode: currentDataMode() });
}

/**
 * PATCH /api/products/:id — güncelleme, arşivleme veya geri yükleme.
 * { action: "update", fields } | { action: "archive" } | { action: "restore" }
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  const requestId = getRequestId(request);
  const { id } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return serviceErrorResponse({ code: "VALIDATION_ERROR", message: "Geçersiz JSON gövdesi." }, requestId);
  }

  const parsed = PATCH_ACTION_SCHEMA.safeParse(body);
  if (!parsed.success) {
    return serviceErrorResponse(
      { code: "VALIDATION_ERROR", message: "Eylem alanı geçersiz (update|archive|restore)." },
      requestId,
    );
  }

  const workspace = await resolveWorkspaceContext();
  const db = getDb();

  try {
    if (parsed.data.action === "archive") {
      const product = await archiveProduct(db, workspace.id, id);
      if (!product) {
        return serviceErrorResponse({ code: "NOT_FOUND", message: "Ürün bulunamadı." }, requestId);
      }
      return apiOk(product, { requestId, dataMode: currentDataMode() });
    }
    if (parsed.data.action === "restore") {
      const product = await restoreProduct(db, workspace.id, id);
      if (!product) {
        return serviceErrorResponse({ code: "NOT_FOUND", message: "Ürün bulunamadı." }, requestId);
      }
      return apiOk(product, { requestId, dataMode: currentDataMode() });
    }
    const input = parseProductInput(parsed.data.fields);
    const product = await updateProductChecked(db, workspace.id, id, input, (pid, inp) =>
      updateProduct(db, workspace.id, pid, inp),
    );
    if (!product) {
      return serviceErrorResponse({ code: "NOT_FOUND", message: "Ürün bulunamadı." }, requestId);
    }
    return apiOk(product, { requestId, dataMode: currentDataMode() });
  } catch (error) {
    return serviceErrorResponse(error as never, requestId);
  }
}

/** DELETE /api/products/:id — soft delete (arşiv) politikası. */
export async function DELETE(request: NextRequest, context: RouteContext) {
  const requestId = getRequestId(request);
  const { id } = await context.params;
  const workspace = await resolveWorkspaceContext();
  const db = getDb();
  const product = await archiveProduct(db, workspace.id, id);
  if (!product) {
    return serviceErrorResponse({ code: "NOT_FOUND", message: "Ürün bulunamadı." }, requestId);
  }
  return apiOk(product, { requestId, dataMode: currentDataMode() });
}
