import type { NextRequest } from "next/server";
import { z } from "zod";

import { getDb } from "@/server/db/driver";
import { resetPassword, AuthError } from "@/server/application/auth-service";
import { apiOk, getRequestId, serviceErrorResponse } from "@/server/http/route-helpers";

export const dynamic = "force-dynamic";

const SCHEMA = z.object({ token: z.string().min(16).max(200), password: z.string().min(1).max(200) });

/** POST /api/auth/reset-password — tek kullanımlık token ile parola sıfırlar. */
export async function POST(request: NextRequest) {
  const requestId = getRequestId(request);
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return serviceErrorResponse({ code: "VALIDATION_ERROR", message: "Geçersiz JSON gövdesi." }, requestId);
  }
  const parsed = SCHEMA.safeParse(body);
  if (!parsed.success) {
    return serviceErrorResponse({ code: "VALIDATION_ERROR", message: "Belirteç ve yeni parola gerekli." }, requestId);
  }
  const db = getDb();
  try {
    await resetPassword(db, parsed.data.token, parsed.data.password);
    return apiOk({ ok: true }, { requestId });
  } catch (error) {
    if (error instanceof AuthError) {
      return serviceErrorResponse({ code: error.code, message: error.message }, requestId);
    }
    throw error;
  }
}
