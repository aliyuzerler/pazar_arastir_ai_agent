import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { eq } from "drizzle-orm";

import { createDb } from "@/server/db/driver";
import { runMigrations } from "@/server/db/migrator";
import { createProduct } from "@/server/db/repositories/product-repository";
import { runResearch } from "@/server/application/research-orchestrator";
import {
  computeAndSaveRecommendations,
  createProfile,
  listRecommendations,
} from "@/server/application/pricing-service";
import { products, workspaces } from "@/server/db/schema";

/**
 * Entegrasyon (TEST_06): profil + koşu → öneriler; geçmiş anlık görüntüsü,
 * para birimi uyarısı ve profil yoksa hata davranışı.
 */
const db = createDb("pglite");

let workspaceId = "";
let productId = "";

beforeAll(async () => {
  await runMigrations(db, "pglite");
  await db.delete(products);
  await db.delete(workspaces);
  const ws = await db.insert(workspaces).values({ name: "A", slug: "p6-ws" }).returning();
  workspaceId = ws[0].id;
  const product = await createProduct(db, workspaceId, {
    title: "SesMark ANC Pro Kablosuz Kulaklık",
    brand: "SesMark",
    model: "ANC-P",
    mpn: "SM-ANC-P-BLK",
    gtin: "8690000000012",
    currency: "TRY",
    unitCost: "850",
    inboundShippingPerUnit: "12.5",
    packagingCost: "3",
    otherFixedCost: "2",
  });
  productId = product.id;
});

afterAll(async () => {
  const client = (db as unknown as { $client: { close: () => Promise<void> } }).$client;
  await client.close();
});

describe("fiyat öneri servisi", () => {
  it("profil yokken hesap hataya düşer", async () => {
    await expect(computeAndSaveRecommendations(db, workspaceId, await productRow())).rejects.toThrowError(
      /profili bulunamadı/i,
    );
  });

  it("profil + koşu sonrası üç strateji önerisi üretilir ve saklanır", async () => {
    await createProfile(db, workspaceId, {
      name: "Standart",
      marketplaceFeeRate: "0.15",
      paymentFeeRate: "0.02",
      otherVariableFeeRate: "0.01",
      targetMarginRate: "0.20",
      fixedPerOrderCost: "10",
      taxMode: "not_modelled",
      commissionBase: "gross_price",
      currency: "TRY",
      isDefault: true,
    });
    await runResearch(db, workspaceId, await productRow(), { idempotencyKey: "p6-001" });
    const result = await computeAndSaveRecommendations(db, workspaceId, await productRow(), {
      researchRunId: null,
    });
    expect(result.recommendations).toHaveLength(3);
    const strategies = result.recommendations.map((rec) => rec.strategy);
    expect(strategies).toEqual(["competitive", "balanced", "profit"]);
    expect(result.marketSummary.exactCount).toBeGreaterThan(0);

    const history = await listRecommendations(db, workspaceId, productId);
    expect(history.length).toBe(3);
    // Girdi anlık görüntüsü saklanmış olmalı (denetlenebilirlik)
    const snapshot = history[0].calculationInputs as { costs: { unitCost: string }; market: { exactCount: number } };
    expect(snapshot.costs.unitCost).toBe("850.0000");
    expect(snapshot.market.exactCount).toBeGreaterThan(0);
  });

  it("aynı girdiyle tekrar hesap aynı fiyat üretir (deterministik)", async () => {
    const first = (await listRecommendations(db, workspaceId, productId)).find(
      (rec) => rec.strategy === "competitive",
    );
    await computeAndSaveRecommendations(db, workspaceId, await productRow());
    const second = (await listRecommendations(db, workspaceId, productId)).find(
      (rec) => rec.strategy === "competitive",
    );
    expect(second?.recommendedPrice).toBe(first?.recommendedPrice);
  });
});

async function productRow() {
  const rows = await db.select().from(products).where(eq(products.id, productId)).limit(1);
  return rows[0];
}
