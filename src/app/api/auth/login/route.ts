import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { getDb } from "@/server/db/driver";
import { login, AuthError, toPublicUser, SESSION_COOKIE, SESSION_COOKIE_MAX_AGE } from "@/server/application/auth-service";
import { apiOk, currentDataMode, getRequestId, serviceErrorResponse } from "@/server/http/route-helpers";
import { checkRateLimit, clientIpFromRequest } from "@/server/security/rate-limit";

export const dynamic = "force-dynamic";

const LOGIN_SCHEMA = z.object({
  email: z.string().min(3).max(200),
  password: z.string().min(1).max(200),
});

/** POST /api/auth/login — httpOnly oturum çerezi koyar. */
export async function POST(request: NextRequest) {
  const requestId = getRequestId(request);

  const limit = checkRateLimit(`login:${clientIpFromRequest(request)}`, 10, 60_000);
  if (!limit.allowed) {
    return serviceErrorResponse(
      { code: "RATE_LIMITED", message: "Çok fazla deneme; bir dakika sonra tekrar deneyin." },
      requestId,
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return serviceErrorResponse({ code: "VALIDATION_ERROR", message: "Geçersiz JSON gövdesi." }, requestId);
  }
  const parsed = LOGIN_SCHEMA.safeParse(body);
  if (!parsed.success) {
    return serviceErrorResponse({ code: "VALIDATION_ERROR", message: "E-posta ve parola gerekli." }, requestId);
  }

  const db = getDb();
  try {
    const { token, user } = await login(db, parsed.data);
    const response = NextResponse.json(
      { data: { user: toPublicUser(user) }, meta: { requestId, dataMode: currentDataMode() } },
      { status: 200 },
    );
    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: SESSION_COOKIE_MAX_AGE,
    });
    return response;
  } catch (error) {
    if (error instanceof AuthError) {
      return serviceErrorResponse({ code: error.code, message: error.message }, requestId);
    }
    throw error;
  }
}
