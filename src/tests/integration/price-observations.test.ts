import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { eq } from "drizzle-orm";

import { createDb } from "@/server/db/driver";
import { runMigrations } from "@/server/db/migrator";
import { createProduct } from "@/server/db/repositories/product-repository";
import { runResearch } from "@/server/application/research-orchestrator";
import { listObservations } from "@/server/application/price-history-service";
import { products, workspaces } from "@/server/db/schema";

/**
 * Entegrasyon (TEST_05): koşu → our_snapshot gözlemleri, provider_history
 * ayrımı ve dedupe davranışı pglite üzerinde.
 */
const db = createDb("pglite");

let workspaceId = "";
let productId = "";

beforeAll(async () => {
  await runMigrations(db, "pglite");
  await db.delete(products);
  await db.delete(workspaces);
  const ws = await db.insert(workspaces).values({ name: "A", slug: "ph-ws" }).returning();
  workspaceId = ws[0].id;
  const product = await createProduct(db, workspaceId, {
    title: "SesMark ANC Pro Kablosuz Kulaklık",
    brand: "SesMark",
    model: "ANC-P",
    mpn: "SM-ANC-P-BLK",
    gtin: "8690000000012",
    currency: "TRY",
    unitCost: "850",
  });
  productId = product.id;
});

afterAll(async () => {
  const client = (db as unknown as { $client: { close: () => Promise<void> } }).$client;
  await client.close();
});

describe("araştırma gözlem kayıtları", () => {
  it("ilk koşu our_snapshot + provider_history üretir ve ayrımı korur", async () => {
    await runResearch(db, workspaceId, await productRow(), { idempotencyKey: "obs-001" });
    const series = await listObservations(db, workspaceId, productId);
    expect(series.ourSnapshots.length).toBeGreaterThan(0);
    // DemoProvider ANC Pro için geçmiş fiyat serisi döndürür:
    expect(series.providerHistory.length).toBeGreaterThanOrEqual(3);
    for (const row of series.providerHistory) {
      expect(row.sourceKind).toBe("provider_history");
      expect(row.isDemo).toBe(true);
    }
    for (const row of series.ourSnapshots) {
      expect(row.sourceKind).toBe("our_snapshot");
    }
  });

  it("ikinci koşu aynı gün dedupe edilir: our_snapshot sayısı artmaz", async () => {
    const before = (await listObservations(db, workspaceId, productId)).ourSnapshots.length;
    await runResearch(db, workspaceId, await productRow(), { idempotencyKey: "obs-002" });
    const after = (await listObservations(db, workspaceId, productId)).ourSnapshots.length;
    expect(after).toBe(before);
  });

  it("provider_history tekrar koşuda çift kayıt üretmez", async () => {
    const before = (await listObservations(db, workspaceId, productId)).providerHistory.length;
    await runResearch(db, workspaceId, await productRow(), { idempotencyKey: "obs-003" });
    const after = (await listObservations(db, workspaceId, productId)).providerHistory.length;
    expect(after).toBe(before);
  });
});

async function productRow() {
  const rows = await db.select().from(products).where(eq(products.id, productId)).limit(1);
  return rows[0];
}
