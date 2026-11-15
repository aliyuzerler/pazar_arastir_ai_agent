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
import type { ServiceError as ProductServiceError } from "@/server/application/product-service";

/** Genel servis hatası: auth/admin/middleware kodları da dahil. */
export interface ServiceError {
  code: string;
  message: string;
  details?: { path: string; message: string }[];
}

const STATUS_BY_CODE: Record<string, number> = {
  VALIDATION_ERROR: 400,
  DUPLICATE: 409,
  NOT_FOUND: 404,
  RATE_LIMITED: 429,
  INVALID_CREDENTIALS: 401,
  EMAIL_NOT_VERIFIED: 403,
  ACCOUNT_DISABLED: 403,
  TOKEN_INVALID: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
};

/** Servis hatasını HTTP yanıtına çevirir. */
export function serviceErrorResponse(error: ServiceError | ProductServiceError, requestId: string): NextResponse {
  const status = STATUS_BY_CODE[error.code] ?? 400;
  return apiFail(
    { code: error.code, message: error.message, details: error.details ?? [] },
    { requestId, status },
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
