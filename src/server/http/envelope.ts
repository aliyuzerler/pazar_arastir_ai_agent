/**
 * Ortak API yanıt zarfı (docs/08_API_AND_EVENT_CONTRACTS.md uyarınca).
 * Başarılı: { data, meta: { requestId, generatedAt, dataMode }, error: null }
 * Hatalı:  { data: null, meta: {...}, error: { code, message, details } }
 */
import { NextResponse } from "next/server";

export type DataMode = "live" | "demo" | "mixed";

export interface ResponseMeta {
  requestId: string;
  generatedAt: string;
  dataMode: DataMode;
}

export interface ApiErrorBody {
  code: string;
  message: string;
  details?: unknown[];
}

export interface ApiEnvelope<T> {
  data: T | null;
  meta: ResponseMeta;
  error: ApiErrorBody | null;
}

export interface ErrorDetail {
  path: string;
  message: string;
}

/** İstek başına benzersiz takip kimliği; gelen x-request-id başlığına saygı duyar. */
export function getRequestId(incoming?: Request | null): string {
  const headerValue = incoming?.headers.get("x-request-id");
  return headerValue && headerValue.trim().length > 0 ? headerValue.trim() : crypto.randomUUID();
}

function buildMeta(requestId: string, dataMode?: DataMode): ResponseMeta {
  return {
    requestId,
    generatedAt: new Date().toISOString(),
    dataMode: dataMode ?? "live",
  };
}

export function apiOk<T>(
  data: T,
  options: { requestId: string; dataMode?: DataMode; status?: number },
): NextResponse<ApiEnvelope<T>> {
  const body: ApiEnvelope<T> = {
    data,
    meta: buildMeta(options.requestId, options.dataMode),
    error: null,
  };
  return NextResponse.json(body, {
    status: options.status ?? 200,
    headers: { "x-request-id": options.requestId },
  });
}

export function apiFail(
  error: ApiErrorBody,
  options: { requestId: string; status: number; dataMode?: DataMode },
): NextResponse<ApiEnvelope<never>> {
  const body: ApiEnvelope<never> = {
    data: null,
    meta: buildMeta(options.requestId, options.dataMode),
    error,
  };
  return NextResponse.json(body, {
    status: options.status,
    headers: { "x-request-id": options.requestId },
  });
}

/** Zod hatalarını zarf detayına çevirir (alan adı + mesaj; değer yazılmaz). */
export function zodErrorDetails(issues: { path: (string | number | symbol)[]; message: string }[]): ErrorDetail[] {
  return issues.map((issue) => ({
    path: issue.path.map(String).join(".") || "(kök)",
    message: issue.message,
  }));
}
