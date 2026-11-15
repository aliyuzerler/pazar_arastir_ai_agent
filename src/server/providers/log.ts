/**
 * Sanitised provider loglama: request_id, provider_id, latency, status,
 * kayıt sayısı. API key, Authorization header veya ham yanıt yazılmaz.
 */
export interface ProviderLogFields {
  requestId?: string;
  providerId: string;
  latencyMs: number;
  status: "ok" | "error";
  recordsCount?: number;
  errorKind?: string;
  errorMessage?: string;
}

export function logProviderEvent(fields: ProviderLogFields): void {
  const entry = {
    event: "provider_call",
    time: new Date().toISOString(),
    requestId: fields.requestId ?? null,
    providerId: fields.providerId,
    latencyMs: Math.round(fields.latencyMs),
    status: fields.status,
    recordsCount: fields.recordsCount ?? null,
    errorKind: fields.errorKind ?? null,
    // Hata mesajı zaten sanitised üretilir; yine de anahtar benzeri dizileri temizle.
    errorMessage: fields.errorMessage ? sanitizeLogMessage(fields.errorMessage) : null,
  };
  console.log(JSON.stringify(entry));
}

/** Anahtar benzeri uzun dizileri maskeler (savunma katmanı). */
export function sanitizeLogMessage(message: string): string {
  return message
    .replace(/(Basic\s+)[A-Za-z0-9+/=_-]{8,}/g, "$1[MASKED]")
    .replace(/\b(sk|pk|key|token|password)-?[A-Za-z0-9]{12,}\b/gi, "[MASKED]");
}
