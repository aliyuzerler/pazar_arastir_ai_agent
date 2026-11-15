/**
 * GTIN (GTIN-8/12/13/14) normalize ve doğrulama yardımcıları.
 * Kurallar (AGENTS.md §6): GTIN normalize edilir ama orijinal değer korunur.
 * Kanonik depolama değeri 14 haneli (GTIN-14) zero-padded formdur.
 */

const ALLOWED_LENGTHS = [8, 12, 13, 14] as const;

export interface GtinResult {
  /** Girilen orijinal değer (dokunulmaz). */
  original: string;
  /** 14 haneli kanonik değer; geçersizse null. */
  normalized: string | null;
  valid: boolean;
  reason?: string;
}

function gs1CheckDigit(digits: string): number {
  // Son hane hariç sağdan sola 3-1 ağırlıklı toplam.
  let sum = 0;
  const body = digits.split("").reverse();
  for (let i = 0; i < body.length; i += 1) {
    const factor = i % 2 === 0 ? 3 : 1;
    sum += Number(body[i]) * factor;
  }
  return (10 - (sum % 10)) % 10;
}

export function normalizeGtin(raw: string | null | undefined): GtinResult {
  const original = raw ?? "";
  const trimmed = original.trim();
  if (trimmed.length === 0) {
    return { original: "", normalized: null, valid: false, reason: "empty" };
  }

  // İzinli ayraçlar temizlenir; harf/karakter kalırsa geçersiz.
  const cleaned = trimmed.replace(/[\s._-]/g, "");
  if (!/^\d+$/.test(cleaned)) {
    return { original: trimmed, normalized: null, valid: false, reason: "sadece rakam beklenir" };
  }
  if (!(ALLOWED_LENGTHS as readonly number[]).includes(cleaned.length)) {
    return {
      original: trimmed,
      normalized: null,
      valid: false,
      reason: "uzunluk 8/12/13/14 olmalı",
    };
  }

  const body = cleaned.slice(0, -1);
  const providedCheck = Number(cleaned.slice(-1));
  if (gs1CheckDigit(body) !== providedCheck) {
    return { original: trimmed, normalized: null, valid: false, reason: "kontrol hanesi hatalı" };
  }

  return { original: trimmed, normalized: cleaned.padStart(14, "0"), valid: true };
}
