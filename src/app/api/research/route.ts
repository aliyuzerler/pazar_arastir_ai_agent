import type { NextRequest } from "next/server";
import { z } from "zod";

import { getDb } from "@/server/db/driver";
import { getProduct } from "@/server/db/repositories/product-repository";
import { runResearch } from "@/server/application/research-orchestrator";
import {
  apiOk,
  currentDataMode,
  getRequestId,
  serviceErrorResponse,
} from "@/server/http/route-helpers";
import { resolveWorkspaceContext } from "@/server/security/workspace-context";

export const dynamic = "force-dynamic";

const RESEARCH_SCHEMA = z.object({
  productId: z.string().uuid(),
  idempotencyKey: z.string().min(8).max(120).optional(),
  providerIds: z.array(z.string().min(1).max(60)).max(10).optional(),
});

/** POST /api/research — araştırma başlatır (kapsamlı, bounded, idempotent). */
export async function POST(request: NextRequest) {
  const requestId = getRequestId(request);
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return serviceErrorResponse({ code: "VALIDATION_ERROR", message: "Geçersiz JSON gövdesi." }, requestId);
  }

  const parsed = RESEARCH_SCHEMA.safeParse(body);
  if (!parsed.success) {
    return serviceErrorResponse(
      {
        code: "VALIDATION_ERROR",
        message: "Araştırma isteği doğrulanamadı.",
        details: parsed.error.issues.map((issue) => ({
          path: issue.path.map(String).join("."),
          message: issue.message,
        })),
      },
      requestId,
    );
  }

  try {
    const { workspace } = await resolveWorkspaceContext();
    const db = getDb();
    const product = await getProduct(db, workspace.id, parsed.data.productId);
    if (!product) {
      return serviceErrorResponse({ code: "NOT_FOUND", message: "Ürün bulunamadı." }, requestId);
    }
    const { run, duplicate } = await runResearch(db, workspace.id, product, {
      idempotencyKey: parsed.data.idempotencyKey,
      providerIds: parsed.data.providerIds,
    });
    return apiOk(
      { run, duplicate },
      { requestId, dataMode: currentDataMode(), status: duplicate ? 200 : 201 },
    );
  } catch (error) {
    return serviceErrorResponse(
      { code: "VALIDATION_ERROR", message: error instanceof Error ? error.message : "Araştırma başarısız." },
      requestId,
    );
  }
}
