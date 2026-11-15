import type { NextRequest } from "next/server";
import { z } from "zod";

import { getDb } from "@/server/db/driver";
import { verifyEmail, AuthError } from "@/server/application/auth-service";
import { apiOk, currentDataMode, getRequestId, serviceErrorResponse } from "@/server/http/route-helpers";

export const dynamic = "force-dynamic";

const SCHEMA = z.object({ token: z.string().min(16).max(200) });

/** POST /api/auth/verify-email — tek kullanımlık doğrulama tokenını harcar. */
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
    return serviceErrorResponse({ code: "VALIDATION_ERROR", message: "Doğrulama belirteci gerekli." }, requestId);
  }
  const db = getDb();
  try {
    const user = await verifyEmail(db, parsed.data.token);
    return apiOk({ email: user.email, verified: true }, { requestId, dataMode: currentDataMode() });
  } catch (error) {
    if (error instanceof AuthError) {
      return serviceErrorResponse({ code: error.code, message: error.message }, requestId);
    }
    throw error;
  }
}
