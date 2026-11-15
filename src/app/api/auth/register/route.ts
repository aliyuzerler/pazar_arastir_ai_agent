import type { NextRequest } from "next/server";
import { z } from "zod";

import { getDb } from "@/server/db/driver";
import { registerUser, AuthError } from "@/server/application/auth-service";
import { apiOk, getRequestId, serviceErrorResponse } from "@/server/http/route-helpers";
import { checkRateLimit, clientIpFromRequest } from "@/server/security/rate-limit";
import { getEnv } from "@/lib/env";

export const dynamic = "force-dynamic";

const REGISTER_SCHEMA = z.object({
  email: z.string().min(3).max(200),
  password: z.string().min(1).max(200),
  displayName: z.string().min(2).max(80),
});

/** POST /api/auth/register — kullanıcı + workspace oluşturur, doğrulama maili kuyruklar. */
export async function POST(request: NextRequest) {
  const requestId = getRequestId(request);

  const limit = checkRateLimit(`register:${clientIpFromRequest(request)}`, 5, 60_000);
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
  const parsed = REGISTER_SCHEMA.safeParse(body);
  if (!parsed.success) {
    return serviceErrorResponse(
      {
        code: "VALIDATION_ERROR",
        message: "Kayıt girdileri doğrulanamadı.",
        details: parsed.error.issues.map((issue) => ({
          path: issue.path.map(String).join("."),
          message: issue.message,
        })),
      },
      requestId,
    );
  }

  const db = getDb();
  try {
    const { user, verificationUrl } = await registerUser(db, parsed.data);
    const env = getEnv();
    return apiOk(
      {
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          role: user.role,
          emailVerified: user.emailVerified,
        },
        // Yerel/demo modda gönderilen doğrulama bağlantısı UI'da gösterilir;
        // üretimde bu alan hiçbir zaman dönmez.
        demoVerificationUrl: env.APP_MODE === "production" ? null : verificationUrl,
      },
      { requestId, status: 201, dataMode: env.APP_MODE === "production" ? "live" : "demo" },
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return serviceErrorResponse({ code: error.code, message: error.message }, requestId);
    }
    throw error;
  }
}
