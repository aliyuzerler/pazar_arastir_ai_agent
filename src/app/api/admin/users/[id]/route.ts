import type { NextRequest } from "next/server";
import { z } from "zod";

import { getDb } from "@/server/db/driver";
import { updateUserAdmin } from "@/server/application/admin-service";
import { AuthError } from "@/server/application/auth-service";
import { apiOk, currentDataMode, getRequestId, serviceErrorResponse } from "@/server/http/route-helpers";
import { resolveWorkspaceContext } from "@/server/security/workspace-context";

export const dynamic = "force-dynamic";

const PATCH_SCHEMA = z
  .object({
    role: z.enum(["user", "admin"]).optional(),
    isActive: z.boolean().optional(),
    emailVerified: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, { message: "Güncellenecek alan gerekli." });

type RouteContext = { params: Promise<{ id: string }> };

/** PATCH /api/admin/users/:id — rol/aktiflik/doğrulama güncelleme (admin). */
export async function PATCH(request: NextRequest, context: RouteContext) {
  const requestId = getRequestId(request);
  const { id } = await context.params;
  const { user } = await resolveWorkspaceContext();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return serviceErrorResponse({ code: "VALIDATION_ERROR", message: "Geçersiz JSON gövdesi." }, requestId);
  }
  const parsed = PATCH_SCHEMA.safeParse(body);
  if (!parsed.success) {
    return serviceErrorResponse({ code: "VALIDATION_ERROR", message: "Güncellenecek alan gerekli." }, requestId);
  }

  const db = getDb();
  try {
    const updated = await updateUserAdmin(db, user, id, parsed.data);
    return apiOk(
      {
        id: updated.id,
        email: updated.email,
        role: updated.role,
        isActive: updated.isActive,
        emailVerified: updated.emailVerified,
      },
      { requestId, dataMode: currentDataMode() },
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return serviceErrorResponse({ code: error.code, message: error.message }, requestId);
    }
    throw error;
  }
}
