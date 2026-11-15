import { expect, test, type Page } from "@playwright/test";

/**
 * TEST_02: ürün oluşturma, doğrulama hataları, liste ve CSV içe aktarma.
 */
test.describe("Faz 2 - ürün kataloğu yolculuğu", () => {
  let consoleErrors: string[] = [];

  test.beforeEach(({ page }) => {
    consoleErrors = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => consoleErrors.push(String(error)));
  });

  async function openNewProductForm(page: Page) {
    await page.goto("/products/new");
    await expect(page.getByRole("heading", { name: "Ürün Ekle" })).toBeVisible();
  }

  test("boş başlık ve hatalı GTIN sunucu doğrulamasında Türkçe hata verir", async ({
    page,
  }: {
    page: Page;
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openNewProductForm(page);
    await page.getByLabel("Ürün başlığı").fill("");
    await page.getByLabel("Birim alış maliyeti").fill("100");
    await page.getByLabel("GTIN / EAN / UPC").fill("1234567890123");
    await page.getByRole("button", { name: "Ürünü kaydet" }).click();
    await expect(page.getByText("Ürün başlığı zorunludur.")).toBeVisible();
    await expect(page.getByText(/GTIN geçersiz/)).toBeVisible();
  });

  test("geçerli ürün oluşturulur, listede görünür, arşivlenir", async ({ page }: { page: Page }) => {
    test.setTimeout(60_000);
    await page.setViewportSize({ width: 1440, height: 900 });
    await openNewProductForm(page);

    const suffix = Date.now().toString().slice(-6);
    await page.getByLabel("Ürün başlığı").fill(`E2E Test Ürünü ${suffix}`);
    await page.getByLabel("SKU (stok kodu)").fill(`E2E-${suffix}`);
    await page.getByLabel("GTIN / EAN / UPC").fill("8690000000036");
    await page.getByLabel("Marka").fill("TestMark");
    await page.getByLabel("Birim alış maliyeti").fill("425.50");
    await page.getByRole("button", { name: "Ürünü kaydet" }).click();

    // Detay sayfasına yönlendirilir
    await expect(page.getByRole("heading", { name: `E2E Test Ürünü ${suffix}` })).toBeVisible();
    await expect(page.getByText("₺425,50").first()).toBeVisible();

    // Listede ara
    await page.goto("/products");
    await page.getByLabel("Ara (başlık, marka, SKU, GTIN)").fill(`E2E-${suffix}`);
    await page.getByRole("button", { name: "Filtrele" }).click();
    await expect(page.getByRole("link", { name: `E2E Test Ürünü ${suffix}` })).toBeVisible();

    // Arşivle: satır aktif listeden kaybolur, arşiv görünümünde geri yüklenir
    await page.getByRole("button", { name: "Arşivle" }).click();
    await expect(page.getByRole("link", { name: `E2E Test Ürünü ${suffix}` })).toBeHidden();
    await page.goto("/products?archived=true");
    await expect(page.getByRole("link", { name: `E2E Test Ürünü ${suffix}` })).toBeVisible();
    await expect(page.getByRole("button", { name: "Geri yükle" }).first()).toBeVisible();
    expect(consoleErrors).toEqual([]);
  });

  test("CSV önizleme hatalı satırları işaretler ve içe aktarma çalışır", async ({
    page,
  }: {
    page: Page;
  }) => {
    test.setTimeout(60_000);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/products/import");

    const suffix = Date.now().toString().slice(-6);
    const csv = [
      "title,sku,gtin,unit_cost,currency",
      `CSV Ürün A ${suffix},CSVA-${suffix},,199.90,TRY`,
      "Hatalı Satır,,,abc,TRY",
    ].join("\n");
    await page.getByLabel("CSV içeriği").fill(csv);
    await page.getByRole("button", { name: "Önizle" }).click();

    await expect(page.getByText(/2 satır · 1 geçerli · 1 hatalı/)).toBeVisible();
    await expect(page.getByText("unitCost: Geçerli bir sayı girin")).toBeVisible();

    await page.getByRole("button", { name: /İçe Aktar \(1 geçerli satır\)/ }).click();
    await expect(page.getByText(/1 ürün içe aktarıldı, 1 satır atlandı/)).toBeVisible();

    // İçe aktarılan ürün listede
    await page.goto("/products");
    await page.getByLabel("Ara (başlık, marka, SKU, GTIN)").fill(`CSVA-${suffix}`);
    await page.getByRole("button", { name: "Filtrele" }).click();
    await expect(page.getByRole("link", { name: `CSV Ürün A ${suffix}` })).toBeVisible();
    expect(consoleErrors).toEqual([]);
  });

  test("mobil görünümde ürün formu kullanılabilir", async ({ page }: { page: Page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/products/new");
    await expect(page.getByLabel("Ürün başlığı")).toBeVisible();
    await expect(page.getByRole("button", { name: "Ürünü kaydet" })).toBeVisible();
    // Yatay taşma yok
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);
  });
});
