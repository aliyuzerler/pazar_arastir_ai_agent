import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createDb } from "@/server/db/driver";
import { runMigrations } from "@/server/db/migrator";
import { createProduct } from "@/server/db/repositories/product-repository";
import { listMatchesWithOffers, reviewMatch } from "@/server/db/repositories/offer-repository";
import { runResearch } from "@/server/application/research-orchestrator";
import { products, workspaces } from "@/server/db/schema";

/**
 * Entegrasyon (TEST_04): orkestratör — idempotency, kısmi başarı,
 * eşleşme sınıflandırması ve kullanıcı kararı kalıcılığı.
 */
const db = createDb("pglite");

let workspaceId = "";
let productId = "";

beforeAll(async () => {
  await runMigrations(db, "pglite");
  await db.delete(products);
  await db.delete(workspaces);
  const ws = await db.insert(workspaces).values({ name: "A", slug: "a-ws" }).returning();
  workspaceId = ws[0].id;

  // DemoProvider fixture'larıyla eşleşen ürün (GTIN + MPN + varyant).
  const product = await createProduct(db, workspaceId, {
    title: "SesMark ANC Pro Kablosuz Kulaklık",
    sku: "RES-1",
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
});

afterAll(async () => {
  const client = (db as unknown as { $client: { close: () => Promise<void> } }).$client;
  await client.close();
});

describe("ResearchOrchestrator", () => {
  it("araştırma koşusu tamamlanır ve eşleşmeler üretilir", async () => {
    const { run } = await runResearch(db, workspaceId, await getProductRow(), {
      idempotencyKey: "test-key-001",
    });
    expect(["completed", "partial"]).toContain(run.status);
    expect(run.totalResults).toBeGreaterThan(0);
    expect(run.exactCount).toBeGreaterThan(0);

    const matches = await listMatchesWithOffers(db, workspaceId, productId);
    const types = matches.map((entry) => entry.match.matchType);
    expect(types).toContain("exact"); // GTIN teklifleri
    expect(types).toContain("likely_exact"); // MPN+marka / beyaz varyant
    expect(types).toContain("substitute"); // TechSound muadili
  });

  it("aynı idempotency key çift koşu ve çift teklif üretmez", async () => {
    const first = await runResearch(db, workspaceId, await getProductRow(), {
      idempotencyKey: "test-key-002",
    });
    expect(first.duplicate).toBe(false);
    const second = await runResearch(db, workspaceId, await getProductRow(), {
      idempotencyKey: "test-key-002",
    });
    expect(second.duplicate).toBe(true);
    expect(second.run.id).toBe(first.run.id);
  });

  it("tekrar koşu teklifleri çoğaltmaz (upsert, ilk görülme korunur)", async () => {
    const before = await listMatchesWithOffers(db, workspaceId, productId);
    await runResearch(db, workspaceId, await getProductRow(), { idempotencyKey: "test-key-003" });
    const after = await listMatchesWithOffers(db, workspaceId, productId);
    expect(after.length).toBe(before.length);
  });

  it("kullanıcı onayı kalıcıdır ve sonraki koşu sınıfı geri düşürmez", async () => {
    const matches = await listMatchesWithOffers(db, workspaceId, productId);
    const substitute = matches.find((entry) => entry.match.matchType === "substitute");
    expect(substitute).toBeDefined();

    const approved = await reviewMatch(db, workspaceId, substitute!.match.id, "approved");
    expect(approved?.reviewStatus).toBe("approved");

    await runResearch(db, workspaceId, await getProductRow(), { idempotencyKey: "test-key-004" });
    const after = await listMatchesWithOffers(db, workspaceId, productId);
    const reloaded = after.find((entry) => entry.offer.id === substitute!.offer.id);
    expect(reloaded?.match.reviewStatus).toBe("approved");

    const rejected = await reviewMatch(db, workspaceId, substitute!.match.id, "rejected");
    expect(rejected?.matchType).toBe("rejected");
  });
});

async function getProductRow() {
  const rows = await db.select().from(products).where(eq(products.id, productId)).limit(1);
  return rows[0];
}
