import { afterAll, beforeAll, describe, expect, it } from "vitest";


import { createDb } from "@/server/db/driver";
import { runMigrations } from "@/server/db/migrator";
import {
  archiveProduct,
  createProduct,
  getProduct,
  listProducts,
  updateProduct,
} from "@/server/db/repositories/product-repository";
import { upsertOffer, listMatchesWithOffers } from "@/server/db/repositories/offer-repository";
import { listResearchRuns, runResearch } from "@/server/application/research-orchestrator";
import { listRecommendations } from "@/server/application/pricing-service";
import { listJobsWithProducts, listAlerts } from "@/server/jobs/monitoring-service";
import { ensureDefaultWorkspace } from "@/server/db/seeding";
import { products, workspaces } from "@/server/db/schema";

/**
 * TEST_08 — Workspace izolasyon denetimi: HER repository fonksiyonu başka
 * workspace'in verisine erişememelidir (security-multitenant skill).
 */
const db = createDb("pglite");

let wsA = "";
let wsB = "";
let productAId = "";

beforeAll(async () => {
  await runMigrations(db, "pglite");
  await db.delete(products);
  await db.delete(workspaces);
  const a = await db.insert(workspaces).values({ name: "A", slug: "iso-a" }).returning();
  const b = await db.insert(workspaces).values({ name: "B", slug: "iso-b" }).returning();
  wsA = a[0].id;
  wsB = b[0].id;

  const product = await createProduct(db, wsA, {
    title: "A Workspace Ürünü",
    sku: "ISO-1",
    gtin: "8690000000012",
    currency: "TRY",
    unitCost: "100",
    trackingEnabled: true,
    trackingIntervalHours: 24,
  });
  productAId = product.id;

  // A workspace'inde araştırma + teklif + eşleşme + izleme işi üret
  await runResearch(db, wsA, product, { idempotencyKey: "iso-run-1" });
});

afterAll(async () => {
  const client = (db as unknown as { $client: { close: () => Promise<void> } }).$client;
  await client.close();
});

describe("workspace izolasyonu (TEST_08)", () => {
  it("ürün okuma/listeleme/arşivleme başka workspace'te boş döner", async () => {
    expect(await getProduct(db, wsB, productAId)).toBeNull();
    const listB = await listProducts(db, wsB);
    expect(listB.total).toBe(0);

    // Güncelleme ve arşivleme başkasının satırına dokunmaz
    expect(await updateProduct(db, wsB, productAId, { title: "Saldırı", currency: "TRY", unitCost: "1" })).toBeNull();
    expect(await archiveProduct(db, wsB, productAId)).toBeNull();
    const stillA = await getProduct(db, wsA, productAId);
    expect(stillA?.title).toBe("A Workspace Ürünü");
  });

  it("teklif/eşleşme, araştırma geçmişi ve öneriler izoledir", async () => {
    expect(await listMatchesWithOffers(db, wsB, productAId)).toHaveLength(0);
    expect(await listResearchRuns(db, wsB, productAId)).toHaveLength(0);
    expect(await listRecommendations(db, wsB, productAId)).toHaveLength(0);
  });

  it("izleme işleri ve etkinlikler izoledir", async () => {
    expect(await listJobsWithProducts(db, wsB)).toHaveLength(0);
    expect(await listAlerts(db, wsB)).toHaveLength(0);
  });

  it("teklif upsert başka workspace'e yazamaz (.productId yabancıysa FK kırılır)", async () => {
    const offer = {
      providerId: "demo",
      providerOfferId: "iso-x",
      title: "X",
      brand: null,
      model: null,
      mpn: null,
      gtin: null,
      sellerName: "S",
      marketplace: null,
      productUrl: "https://demo.example.com/x",
      imageUrl: null,
      priceAmount: "10",
      currency: "TRY",
      shippingAmount: null,
      deliveredTotalAmount: null,
      availabilityStatus: "in_stock" as const,
      stockQuantity: null,
      rating: null,
      reviewCount: null,
      condition: null,
      variantAttributes: null,
      observedAt: "2026-11-15T09:00:00.000Z",
      isDemo: true,
      rawReference: null,
    };
    // wsB scope + A'nın ürünü → FK ihlali beklenir (izolasyon katmanı 2)
    await expect(upsertOffer(db, wsB, productAId, offer)).rejects.toThrow();
    expect(await listMatchesWithOffers(db, wsB, productAId)).toHaveLength(0);
  });

  it("seed yalnızca kendi workspace'ine yazar", async () => {
    const before = await db.select().from(workspaces);
    await ensureDefaultWorkspace(db);
    const after = await db.select().from(workspaces);
    expect(after.length).toBe(before.length + 1); // sadece default eklendi
    expect(after.find((row) => row.slug === "iso-a")).toBeDefined();
  });
});
