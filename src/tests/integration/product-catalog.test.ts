import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createDb } from "@/server/db/driver";
import { runMigrations } from "@/server/db/migrator";
import {
  archiveProduct,
  createProduct,
  getProduct,
  listProducts,
  restoreProduct,
  updateProduct,
} from "@/server/db/repositories/product-repository";
import { createProductChecked, importCsv } from "@/server/application/product-service";
import { products, workspaces } from "@/server/db/schema";

/**
 * Entegrasyon (TEST_02): workspace kapsamı, CRUD yaşam döngüsü, CSV içe
 * aktarma ve mükerrer davranışı gerçek PostgreSQL (pglite) üzerinde.
 */
const db = createDb("pglite");

let workspaceAId = "";
let workspaceBId = "";

const PRODUCT_A = {
  title: "Workspace A Ürünü",
  sku: "WSA-1",
  unitCost: "100",
  currency: "TRY",
};

beforeAll(async () => {
  await runMigrations(db, "pglite");
  await db.delete(products);
  await db.delete(workspaces);

  const a = await db
    .insert(workspaces)
    .values({ name: "A", slug: "a-workspace" })
    .returning();
  workspaceAId = a[0].id;
  const b = await db
    .insert(workspaces)
    .values({ name: "B", slug: "b-workspace" })
    .returning();
  workspaceBId = b[0].id;
});

afterAll(async () => {
  const client = (db as unknown as { $client: { close: () => Promise<void> } }).$client;
  await client.close();
});

describe("workspace kapsamı (TEST_02 md-10)", () => {
  it("başka workspace'in ürünü kendi id'siyle dahi okunamaz", async () => {
    const created = await createProduct(db, workspaceAId, PRODUCT_A);
    const fromB = await getProduct(db, workspaceBId, created.id);
    expect(fromB).toBeNull();
    const fromA = await getProduct(db, workspaceAId, created.id);
    expect(fromA?.title).toBe("Workspace A Ürünü");
  });

  it("liste yalnızca kendi workspace kayıtlarını döndürür", async () => {
    await createProduct(db, workspaceBId, { title: "Workspace B Ürünü", currency: "TRY", unitCost: "50" });
    const listA = await listProducts(db, workspaceAId);
    expect(listA.total).toBe(1);
    expect(listA.items[0].title).toBe("Workspace A Ürünü");
  });

  it("aynı SKU başka workspace'te sorun olmaz", async () => {
    const created = await createProduct(db, workspaceBId, {
      title: "B SKU aynı",
      sku: "WSA-1",
      currency: "TRY",
      unitCost: "10",
    });
    expect(created.sku).toBe("WSA-1");
  });
});

describe("ürün yaşam döngüsü (TEST_02 md-1, md-4, md-5)", () => {
  it("düzenleme doğru workspace satırını günceller ve orijinal GTIN korunur", async () => {
    const created = await createProduct(db, workspaceAId, {
      title: "Eski Başlık",
      gtin: "869-000 000001.2",
      currency: "TRY",
      unitCost: "100",
    });
    expect(created.gtin).toBe("869-000 000001.2");
    expect(created.gtinNormalized).toBe("08690000000012");

    const updated = await updateProduct(db, workspaceAId, created.id, {
      title: "Yeni Başlık",
      gtin: "869-000 000001.2",
      currency: "TRY",
      unitCost: "120",
    });
    expect(updated?.title).toBe("Yeni Başlık");
    expect(Number(updated?.unitCost)).toBe(120);
  });

  it("arşiv gizler, geri yükleme geri getirir", async () => {
    const created = await createProduct(db, workspaceAId, {
      title: "Arşivlenecek",
      currency: "TRY",
      unitCost: "5",
    });

    const activeBefore = await listProducts(db, workspaceAId, { archived: false });
    await archiveProduct(db, workspaceAId, created.id);
    const activeAfter = await listProducts(db, workspaceAId, { archived: false });
    const archivedList = await listProducts(db, workspaceAId, { archived: true });

    expect(activeAfter.total).toBe(activeBefore.total - 1);
    expect(archivedList.items.some((item) => item.id === created.id)).toBe(true);

    await restoreProduct(db, workspaceAId, created.id);
    const activeRestored = await listProducts(db, workspaceAId, { archived: false });
    expect(activeRestored.total).toBe(activeBefore.total);
  });
});

describe("CSV içe aktarma (TEST_02 md-6, md-7)", () => {
  const CSV = `title,sku,gtin,unit_cost,currency
"Kulaklık, ANC Pro",CSV-1,8690000000036,850.00,TRY
Eksik Maliyet,CSV-2,,TRY
Mükerrer SKU,WSA-1,,100,TRY`;

  it("yalnızca geçerli satırlar kalıcı olur; hatalar satır bazlı raporlanır", async () => {
    const result = await importCsv(db, workspaceAId, CSV);
    expect(result.imported).toBe(1);
    expect(result.skipped).toBe(2);
    expect(result.errors.join(" ")).toContain("Satır 3");
    expect(result.errors.join(" ")).toContain("Satır 4");
  });

  it("mükerrer SKU/GTIN ServiceError ile reddedilir", async () => {
    await expect(
      createProductChecked(db, workspaceAId, {
        title: "Kopya",
        sku: "WSA-1",
        currency: "TRY",
        unitCost: "1",
      }),
    ).rejects.toMatchObject({ code: "DUPLICATE" });
  });
});
