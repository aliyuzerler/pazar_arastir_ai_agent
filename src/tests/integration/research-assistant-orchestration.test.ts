/**
 * Entegrasyon (TEST_04 tamamlayıcısı): orkestratör × Gemini asistan.
 * Transport mock'lanır; sorgu planı genişlemesi, özet kaydı ve asistan
 * hatasının koşuyu bozmaması pglite üzerinde doğrulanır.
 */
import { eq } from "drizzle-orm";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { createDb } from "@/server/db/driver";
import { runMigrations } from "@/server/db/migrator";
import { createProduct } from "@/server/db/repositories/product-repository";
import { runResearch } from "@/server/application/research-orchestrator";
import { products, workspaces } from "@/server/db/schema";
import { resetEnvCache } from "@/lib/env";

// Bu dosyaya özel pglite dizini (paralel test dosyalarından izolasyon).
process.env.PG_LITE_DATA_DIR = "./.pglite-test-data-assistant";
resetEnvCache();

const db = createDb("pglite");

let workspaceId = "";
let productId = "";
let productRow: typeof products.$inferSelect;

function geminiPayload(text: string): Response {
  return new Response(
    JSON.stringify({ candidates: [{ content: { parts: [{ text }] } }] }),
    { status: 200, headers: { "content-type": "application/json" } },
  );
}

beforeAll(async () => {
  await runMigrations(db, "pglite");
  await db.delete(products);
  await db.delete(workspaces);
  const ws = await db.insert(workspaces).values({ name: "AI", slug: "ai-ws" }).returning();
  workspaceId = ws[0].id;

  const product = await createProduct(db, workspaceId, {
    title: "SesMark ANC Pro Kablosuz Kulaklık",
    sku: "AI-1",
    brand: "SesMark",
    model: "ANC-P",
    mpn: "SM-ANC-P-BLK",
    gtin: "8690000000012",
    category: "Elektronik / Ses Sistemleri",
    attributes: [{ key: "Renk", value: "Siyah" }],
    currency: "TRY",
    unitCost: "850",
  });
  productId = product.id;
  const rows = await db.select().from(products).where(eq(products.id, productId));
  productRow = rows[0];

  process.env.GEMINI_API_KEY = "integration-test-key";
  resetEnvCache();
});

afterAll(async () => {
  delete process.env.GEMINI_API_KEY;
  resetEnvCache();
  const client = (db as unknown as { $client: { close: () => Promise<void> } }).$client;
  await client.close();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ResearchOrchestrator × Gemini asistan", () => {
  it("asistan açıkken sorgu planı genişler ve Türkçe özet kaydedilir", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        geminiPayload(JSON.stringify({ queries: ["SesMark ANC Pro Kablosuz Kulaklık Türkiye mağaza"] })),
      )
      .mockResolvedValueOnce(
        geminiPayload(
          JSON.stringify({
            summary:
              "Teklifler ağırlıkla SesMark ANC-P ailesinden geliyor; muadil sayısı sınırlı ve kategori uyumu yüksek.",
            substituteNotes: ["TechSound muadili aynı kategoriye hizmet ediyor."],
          }),
        ),
      );
    vi.stubGlobal("fetch", fetchMock);

    const { run } = await runResearch(db, workspaceId, productRow, {
      idempotencyKey: "ai-ok-001",
    });

    expect(["completed", "partial"]).toContain(run.status);
    expect(run.totalResults).toBeGreaterThan(0);
    expect(run.assistant?.status).toBe("ok");
    expect(run.assistant?.queriesAdded).toBe(1);
    expect(run.assistant?.summary).toContain("SesMark");
    expect(run.assistant?.substituteNotes).toHaveLength(1);
    expect(run.queryPlan).toContain("SesMark ANC Pro Kablosuz Kulaklık Türkiye mağaza");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("asistan hatası (timeout) koşuyu bozmaz; koşu unavailable işaretlenir", async () => {
    const timeoutError = new Error("aborted");
    timeoutError.name = "TimeoutError";
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(timeoutError));

    const { run } = await runResearch(db, workspaceId, productRow, {
      idempotencyKey: "ai-fail-001",
    });

    expect(run.status).toBe("completed");
    expect(run.totalResults).toBeGreaterThan(0);
    expect(run.assistant?.status).toBe("unavailable");
    expect(run.assistant?.reason).toBe("timeout");
  });

  it("anahtar yokken assistant kolonu null kalır ve fetch çağrılmaz", async () => {
    delete process.env.GEMINI_API_KEY;
    resetEnvCache();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const { run } = await runResearch(db, workspaceId, productRow, {
      idempotencyKey: "ai-off-001",
    });

    expect(run.status).toBe("completed");
    expect(run.assistant).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
