import type { NextRequest } from "next/server";
import { z } from "zod";

import { getDb } from "@/server/db/driver";
import { pricingProfileInputSchema } from "@/server/domain/product-validation";
import { updateProfile } from "@/server/application/pricing-service";
import {
  apiOk,
  currentDataMode,
  getRequestId,
  serviceErrorResponse,
} from "@/server/http/route-helpers";
import { resolveWorkspaceContext } from "@/server/security/workspace-context";

export const dynamic = "force-dynamic";

const PATCH_SCHEMA = pricingProfileInputSchema.partial().extend({ isDefault: z.boolean().nullish() });

type RouteContext = { params: Promise<{ id: string }> };

/** PATCH /api/pricing-profiles/:id — profil güncelleme (kısmi alanlar). */
export async function PATCH(request: NextRequest, context: RouteContext) {
  const requestId = getRequestId(request);
  const { id } = await context.params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return serviceErrorResponse({ code: "VALIDATION_ERROR", message: "Geçersiz JSON gövdesi." }, requestId);
  }
  const parsed = PATCH_SCHEMA.safeParse(body);
  if (!parsed.success) {
    return serviceErrorResponse(
      {
        code: "VALIDATION_ERROR",
        message: "Profil girdileri doğrulanamadı.",
        details: parsed.error.issues.map((issue) => ({
          path: issue.path.map(String).join("."),
          message: issue.message,
        })),
      },
      requestId,
    );
  }
  const workspace = await resolveWorkspaceContext();
  const db = getDb();
  const profile = await updateProfile(db, workspace.id, id, {
    ...parsed.data,
    isDefault: parsed.data.isDefault ?? undefined,
  });
  if (!profile) {
    return serviceErrorResponse({ code: "NOT_FOUND", message: "Profil bulunamadı." }, requestId);
  }
  return apiOk(profile, { requestId, dataMode: currentDataMode() });
}
