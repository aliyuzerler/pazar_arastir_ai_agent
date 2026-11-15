import { z } from "zod";
import { NextResponse } from "next/server";

import { getEnv } from "@/lib/env";
import {
  apiFail,
  apiOk,
  getRequestId,
  zodErrorDetails,
  type DataMode,
} from "@/server/http/envelope";
import type { ServiceError } from "@/server/application/product-service";

/** Servis hatasını HTTP yanıtına çevirir. */
export function serviceErrorResponse(error: ServiceError, requestId: string): NextResponse {
  const statusMap: Record<ServiceError["code"], number> = {
    VALIDATION_ERROR: 400,
    DUPLICATE: 409,
    NOT_FOUND: 404,
  };
  return apiFail(
    { code: error.code, message: error.message, details: error.details ?? [] },
    { requestId, status: statusMap[error.code] ?? 400 },
  );
}

/** Gövdeyi Zod ile doğrular; başarısızsa hazır 400 yanıtı döndürür. */
export function parseJsonBody<T extends z.ZodTypeAny>(
  body: unknown,
  schema: T,
  requestId: string,
): { ok: true; data: z.infer<T> } | { ok: false; response: NextResponse } {
  const result = schema.safeParse(body);
  if (!result.success) {
    return {
      ok: false,
      response: apiFail(
        {
          code: "VALIDATION_ERROR",
          message: "İstek gövdesi doğrulanamadı.",
          details: zodErrorDetails(result.error.issues),
        },
        { requestId, status: 400 },
      ),
    };
  }
  return { ok: true, data: result.data };
}

/** Şu anda tüm veri demo altyapısıyla üretilmediği için dataMode="demo". */
export function currentDataMode(): DataMode {
  return getEnv().PROVIDER_MODE === "demo" ? "demo" : "live";
}

export { apiOk, apiFail, getRequestId };
