import type { NextRequest } from "next/server";
import { z } from "zod";

import { getDb } from "@/server/db/driver";
import { requestPasswordReset } from "@/server/application/auth-service";
import { apiOk, getRequestId, serviceErrorResponse } from "@/server/http/route-helpers";
import { checkRateLimit, clientIpFromRequest } from "@/server/security/rate-limit";
import { getEnv } from "@/lib/env";

export const dynamic = "force-dynamic";

const SCHEMA = z.object({ email: z.string().min(3).max(200) });

/**
 * POST /api/auth/forgot-password — her zaman başarılı döner (kullanıcı
 * varlığı sızdırılmaz). Yerel modda sıfırlama bağlantısı DEMO alanında
 * gösterilir; üretimde yalnızca e-posta gider.
 */
export async function POST(request: NextRequest) {
  const requestId = getRequestId(request);

  const limit = checkRateLimit(`forgot:${clientIpFromRequest(request)}`, 5, 60_000);
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
  const parsed = SCHEMA.safeParse(body);
  if (!parsed.success) {
    return serviceErrorResponse({ code: "VALIDATION_ERROR", message: "E-posta gerekli." }, requestId);
  }

  const db = getDb();
  const env = getEnv();
  await requestPasswordReset(db, parsed.data.email);

  let demoResetUrl: string | null = null;
  if (env.APP_MODE !== "production") {
    // Yerel modda outbox'tan bağlantıyı DEMO gösterimi için oku.
    const { emailOutbox } = await import("@/server/db/schema");
    const { desc, eq } = await import("drizzle-orm");
    const rows = await db
      .select()
      .from(emailOutbox)
      .where(eq(emailOutbox.toEmail, parsed.data.email.trim().toLowerCase()))
      .orderBy(desc(emailOutbox.createdAt))
      .limit(1);
    const match = rows[0]?.bodyHtml.match(/https?:\/\/[^"]+\/reset-password\?token=[a-f0-9]+/);
    demoResetUrl = match ? match[0] : null;
  }

  return apiOk(
    { message: "Eğer bu e-posta kayıtlıysa sıfırlama bağlantısı gönderildi.", demoResetUrl },
    { requestId },
  );
}
