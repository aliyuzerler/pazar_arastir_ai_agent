/**
 * Birim testler (TEST_03 tamamlayıcısı): Gemini ResearchAssistant adaptörü.
 * Transport (fetch) mock'lanır; şema doğrulama, zarif düşme ve anahtar
 * sızıntısı olmaması doğrulanır. Canlı API çağrısı yapılmaz.
 */
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  DEFAULT_GEMINI_MODEL,
  getResearchAssistantStatus,
  suggestQueries,
  summarizeFindings,
} from "@/server/ai/research-assistant";
import { resetEnvCache } from "@/lib/env";

const PRODUCT = {
  title: "SesMark ANC Pro Kablosuz Kulaklık",
  brand: "SesMark",
  model: "ANC-P",
  mpn: "SM-ANC-P-BLK",
  category: "Elektronik / Ses Sistemleri",
};

function geminiResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function okTextResponse(text: string): Response {
  return geminiResponse({ candidates: [{ content: { parts: [{ text }] } }] });
}

async function fetchBody(mock: ReturnType<typeof vi.fn>): Promise<string> {
  const init = mock.mock.calls[0][1] as RequestInit;
  return (init.body as string) ?? "";
}

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_MODEL;
  resetEnvCache();
});

describe("ResearchAssistant (Gemini adaptörü)", () => {
  it("anahtar yokken disabled döner ve fetch çağrılmaz", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    resetEnvCache();

    const status = getResearchAssistantStatus();
    expect(status.configured).toBe(false);

    const result = await suggestQueries({ product: PRODUCT, existingQueries: ["a"] });
    expect(result).toMatchObject({ ok: false, reason: "disabled" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("başarılı yanıtta sorgular döner, mevcutlar dedupe edilir", async () => {
    process.env.GEMINI_API_KEY = "unit-test-key";
    resetEnvCache();
    const fetchMock = vi.fn().mockResolvedValue(
      okTextResponse(
        JSON.stringify({
          queries: [
            "SesMark ANC-P Siyah", // mevcutla aynı → atılır
            "sesmark kulaklık SM-ANC-P-BLK", // yeni
            "SESMARK kulaklık SM-ANC-P-BLK", // 2. ile dupe'si → atılır (TR normalizasyon)
            "SesMark ANC-P yedek ped", // yeni
          ],
        }),
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await suggestQueries({
      product: PRODUCT,
      existingQueries: ["8690000000012", "SesMark ANC-P Siyah"],
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data).toHaveLength(2);
    expect(result.data[0]).toBe("sesmark kulaklık SM-ANC-P-BLK");
    expect(result.data[1]).toBe("SesMark ANC-P yedek ped");

    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain(`/models/${DEFAULT_GEMINI_MODEL}:generateContent`);
    const headers = (fetchMock.mock.calls[0][1] as RequestInit).headers as Record<string, string>;
    expect(headers["x-goog-api-key"]).toBe("unit-test-key");
  });

  it("markdown çitli JSON yanıtı da ayrıştırılır", async () => {
    process.env.GEMINI_API_KEY = "unit-test-key";
    resetEnvCache();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        okTextResponse('```json\n{"queries": ["SesMark ANC-P yedek ped"]}\n```'),
      ),
    );

    const result = await suggestQueries({ product: PRODUCT, existingQueries: [] });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data).toEqual(["SesMark ANC-P yedek ped"]);
  });

  it("şema dışı model çıktısı invalid_response ile düşer", async () => {
    process.env.GEMINI_API_KEY = "unit-test-key";
    resetEnvCache();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(okTextResponse("merhaba dünya")));

    const result = await summarizeFindings({
      product: PRODUCT,
      offers: [{ title: "X" }],
    });
    expect(result).toMatchObject({ ok: false, reason: "invalid_response" });
  });

  it("HTTP hata mesajı sanitize edilir; anahtar sızmaz", async () => {
    process.env.GEMINI_API_KEY = "unit-test-key";
    resetEnvCache();
    const leaked = "Anahtar AQ.Ab8RN6SECRETVAL geçersiz.";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(geminiResponse({ error: { message: leaked } }, 400)),
    );

    const result = await suggestQueries({ product: PRODUCT, existingQueries: [] });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe("http_error");
    expect(result.message).toContain("geçersiz");
    expect(result.message).not.toContain("AQ.");
    expect(result.message).not.toContain("SECRETVAL");
  });

  it("zaman aşımı timeout nedeniyle döner", async () => {
    process.env.GEMINI_API_KEY = "unit-test-key";
    resetEnvCache();
    const timeoutError = new Error("The operation was aborted due to timeout");
    timeoutError.name = "TimeoutError";
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(timeoutError));

    const result = await suggestQueries({ product: PRODUCT, existingQueries: [] });
    expect(result).toMatchObject({ ok: false, reason: "timeout" });
  });

  it("özet çıktısında beyaz liste dışı alanlar atılır (fiyat/stok sızamaz)", async () => {
    process.env.GEMINI_API_KEY = "unit-test-key";
    resetEnvCache();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        okTextResponse(
          JSON.stringify({
            summary: "Teklifler ağırlıkla SesMark ekosisteminden geliyor; muadil yapısı sınırlı.",
            substituteNotes: ["TechSound X2 aynı kullanım senaryosunu karşılar."],
            priceAmount: "999",
            stockQuantity: 42,
          }),
        ),
      ),
    );

    const result = await summarizeFindings({
      product: PRODUCT,
      offers: Array.from({ length: 20 }, (_, index) => ({ title: `Teklif ${index + 1}` })),
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data).not.toHaveProperty("priceAmount");
    expect(result.data).not.toHaveProperty("stockQuantity");
    expect(result.data.summary).toContain("SesMark");
    expect(result.data.substituteNotes).toHaveLength(1);

    // Modele en fazla 12 teklif kesiti gönderilir (ürün bloğundaki title hariç).
    const body = JSON.parse(await fetchBody(vi.mocked(fetch)));
    const prompt = body.contents[0].parts[0].text as string;
    const offersBlock = prompt.split("TEKLİFLER: ")[1] ?? "";
    expect(offersBlock.match(/"title":/g)).toHaveLength(12);
    expect(prompt).not.toContain("priceAmount");
  });
});
