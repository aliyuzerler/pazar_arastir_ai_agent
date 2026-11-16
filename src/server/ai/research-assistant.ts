/**
 * ResearchAssistant portu ve Gemini uygulaması (docs/02 §9).
 *
 * İlkeler:
 * - AI yalnızca yardımcıdır: ek arama sorgusu önerisi ve Türkçe özet.
 * - AI fiyat, stok, bulunabilirlik, GTIN veya satıcı bilgisi üretemez;
 *   teklif verisinin fiyatlı alanları modele hiç gönderilmez ve çıktı
 *   beyaz liste alanlı Zod şemalarıyla doğrulanır.
 * - Anahtar yalnızca sunucu env'inden okunur; loglarda asla görünmez.
 * - Her hata zarif şekilde düşer; araştırma akışı asla etkilenmez
 *   (Gemini kapalıyken core app çalışır).
 */
import "server-only";

import { z } from "zod";

import { getEnv } from "@/lib/env";
import type { ProviderProductContext } from "@/server/providers/contracts";

export const DEFAULT_GEMINI_MODEL = "gemini-3.8-flash";

const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";
const REQUEST_TIMEOUT_MS = 20_000;
const MAX_QUERIES = 5;
const MAX_OFFERS_IN_PROMPT = 12;

/** Modele gönderilecek teklif kesiti — kasıtlı olarak fiyatsız/stoksuz. */
export interface AssistantOfferSnapshot {
  title: string;
  brand?: string | null;
  model?: string | null;
  mpn?: string | null;
  variantAttributes?: Record<string, string> | null;
}

export type AssistantFailureReason =
  | "disabled"
  | "http_error"
  | "timeout"
  | "invalid_response"
  | "network_error"
  | "unknown";

export type AssistantOutcome<T> =
  | { ok: true; data: T }
  | { ok: false; reason: AssistantFailureReason; message?: string };

export interface ResearchAssistantStatus {
  configured: boolean;
  model: string;
}

export interface AssistantSummaryData {
  summary: string;
  substituteNotes: string[];
}

// --- Çıktı şemaları (beyaz liste; bilinmeyen alanlar atılır) ---

const queriesSchema = z.object({
  queries: z
    .array(z.string().trim().min(3).max(120))
    .min(1)
    .max(10),
});

const summarySchema = z.object({
  summary: z.string().trim().min(20).max(1200),
  substituteNotes: z.array(z.string().trim().min(3).max(300)).max(5).default([]),
});

// --- Gemini yanıtı için minimal tipler ---

interface GeminiResponse {
  candidates?: {
    content?: { parts?: { text?: string }[] };
    finishReason?: string;
  }[];
  promptFeedback?: { blockReason?: string };
}

/** Anahtar benzeri dizileri ve satır sonlarını temizleyip kısaltır. */
function sanitizeDetail(raw: string): string {
  const redacted = raw
    .replace(/AIza[0-9A-Za-z_-]+/g, "[redacted]")
    .replace(/AQ\.[0-9A-Za-z._-]+/g, "[redacted]")
    .replace(/\s+/g, " ")
    .trim();
  return redacted.length > 200 ? `${redacted.slice(0, 200)}…` : redacted;
}

/** HTTP hata gövdesinden yalnızca error.message alanını güvenli şekilde çeker. */
function extractHttpErrorMessage(body: string, status: number): string {
  try {
    const parsed = JSON.parse(body) as { error?: { message?: unknown } };
    if (typeof parsed.error?.message === "string") {
      return sanitizeDetail(parsed.error.message);
    }
  } catch {
    // gövde JSON değil → genel mesaj
  }
  return `HTTP ${status}`;
}

function stripFences(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  return fenced ? fenced[1] : trimmed;
}

type GeminiCallResult =
  | { ok: true; text: string; model: string }
  | { ok: false; reason: AssistantFailureReason; message?: string; model: string };

async function callGemini(prompt: string): Promise<GeminiCallResult> {
  const env = getEnv();
  const model = env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL;
  if (!env.GEMINI_API_KEY) {
    return { ok: false, reason: "disabled", model };
  }

  try {
    const response = await fetch(`${GEMINI_ENDPOINT}/${model}:generateContent`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-goog-api-key": env.GEMINI_API_KEY,
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 1024,
          responseMimeType: "application/json",
        },
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      cache: "no-store",
    });

    if (!response.ok) {
      const bodyText = await response.text().catch(() => "");
      return {
        ok: false,
        reason: "http_error",
        message: extractHttpErrorMessage(bodyText, response.status),
        model,
      };
    }

    const payload = (await response.json()) as GeminiResponse;
    if (payload.promptFeedback?.blockReason) {
      return {
        ok: false,
        reason: "invalid_response",
        message: `model isteği engelledi (${payload.promptFeedback.blockReason})`,
        model,
      };
    }
    const text =
      payload.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("") ?? "";
    if (!text.trim()) {
      return { ok: false, reason: "invalid_response", message: "boş yanıt", model };
    }
    return { ok: true, text: stripFences(text), model };
  } catch (error) {
    const name = error instanceof Error ? error.name : "";
    if (name === "TimeoutError" || name === "AbortError") {
      return { ok: false, reason: "timeout", model };
    }
    return {
      ok: false,
      reason: "network_error",
      message: sanitizeDetail(error instanceof Error ? error.message : String(error)),
      model,
    };
  }
}

function productPromptBlock(product: ProviderProductContext): string {
  return JSON.stringify({
    title: product.title,
    brand: product.brand ?? null,
    model: product.model ?? null,
    mpn: product.mpn ?? null,
    category: product.category ?? null,
    attributes: product.attributes ?? [],
  });
}

/** Asistan yapılandırma durumu (settings ekranı için). */
export function getResearchAssistantStatus(): ResearchAssistantStatus {
  const env = getEnv();
  return {
    configured: Boolean(env.GEMINI_API_KEY),
    model: env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL,
  };
}

/**
 * Ürün için ek arama sorguları önerir. Mevcut sorgularla (büyük/küçük harf
 * duyarsız) dedupe edilir ve en fazla MAX_QUERIES sorgu döner.
 */
export async function suggestQueries(input: {
  product: ProviderProductContext;
  existingQueries: string[];
}): Promise<AssistantOutcome<string[]>> {
  const prompt = [
    "Sen bir e-ticaret pazar araştırma asistanısın. Aşağıdaki ürün için Türkiye'deki",
    "satıcılarda arama yapmak üzere EK arama sorguları öner.",
    "",
    "KURALLAR:",
    '- Yalnızca JSON döndür: {"queries": ["...", "..."]}',
    "- 3 ile 5 arası sorgu üret; her sorgu en fazla 120 karakter.",
    "- URL, tırnak işareti ve komut içermesin.",
    "- Fiyat, stok veya satıcı iddiası içermesin.",
    "- Marka + model + MPN + kritik özellik varyasyonlarını hedefle.",
    "- MEVCUT SORGULAR listesindekileri tekrarlama.",
    "",
    `ÜRÜN: ${productPromptBlock(input.product)}`,
    `MEVCUT SORGULAR: ${JSON.stringify(input.existingQueries)}`,
  ].join("\n");

  const result = await callGemini(prompt);
  if (!result.ok) return result;

  const parsed = queriesSchema.safeParse(safeJsonParse(result.text));
  if (!parsed.success) {
    return { ok: false, reason: "invalid_response", message: "sorgu şeması uyuşmadı" };
  }

  const seen = new Set(input.existingQueries.map((query) => normalize(query)));
  const suggestions: string[] = [];
  for (const query of parsed.data.queries) {
    const key = normalize(query);
    if (seen.has(key)) continue;
    seen.add(key);
    suggestions.push(query);
    if (suggestions.length >= MAX_QUERIES) break;
  }
  return { ok: true, data: suggestions };
}

/**
 * Teklifleri Türkçe özetler. Fiyatsız kesit gönderilir; çıktı şemasında
 * fiyat/stok alanı hiç tanımlı değildir, bilinmeyen alanlar Zod tarafından atılır.
 */
export async function summarizeFindings(input: {
  product: ProviderProductContext;
  offers: AssistantOfferSnapshot[];
}): Promise<AssistantOutcome<AssistantSummaryData>> {
  const offers = input.offers.slice(0, MAX_OFFERS_IN_PROMPT).map((offer) => ({
    title: offer.title,
    brand: offer.brand ?? null,
    model: offer.model ?? null,
    variants: offer.variantAttributes ?? null,
  }));

  const prompt = [
    "Sen bir e-ticaret pazar araştırma asistanısın. Aşağıdaki teklif listesini Türkçe değerlendir.",
    "",
    "KURALLAR:",
    '- Yalnızca JSON döndür: {"summary": "...", "substituteNotes": ["...", "..."]}',
    "- summary: 2-4 cümle; tekliflerdeki marka/model/varyant yapısını ve muadil yapısını özetler.",
    "- substituteNotes: muadil ürünlerle ilgili en fazla 5 kısa gözlem.",
    "- FİYAT, STOK, BULUNABİLİRLİK, GTİN veya SATICI bilgisi YAZMA; bu bilgiler sana verilmedi.",
    "- Uydurma özellik veya model ekleme; yalnızca verilen bilgilere dayan.",
    "",
    `ÜRÜN: ${productPromptBlock(input.product)}`,
    `TEKLİFLER: ${JSON.stringify(offers)}`,
  ].join("\n");

  const result = await callGemini(prompt);
  if (!result.ok) return result;

  const parsed = summarySchema.safeParse(safeJsonParse(result.text));
  if (!parsed.success) {
    return { ok: false, reason: "invalid_response", message: "özet şeması uyuşmadı" };
  }
  return {
    ok: true,
    data: {
      summary: parsed.data.summary,
      substituteNotes: parsed.data.substituteNotes,
    },
  };
}

function normalize(value: string): string {
  return value.trim().toLocaleLowerCase("tr-TR");
}

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}
