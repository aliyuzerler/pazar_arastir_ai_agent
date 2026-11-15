import { expect, test } from "@playwright/test";

test.describe("Faz 6 - fiyat analizi", () => {
  let consoleErrors: string[] = [];

  test.beforeEach(({ page }) => {
    consoleErrors = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => consoleErrors.push(String(error)));
  });

  test("profil oluşturulur, öneriler hesaplanır, formül görünür", async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: 1440, height: 900 });

    // 1. Profil oluştur (Fiyat Analizi sayfası)
    await page.goto("/pricing-analysis");
    await page.getByLabel("Profil adı").fill(`E2E Profil ${Date.now().toString().slice(-5)}`);
    await page.getByRole("button", { name: "Profili kaydet" }).click();
    await expect(page.getByText("Varsayılan").first()).toBeVisible();

    // 2. Araştırma çalıştır (piyasa teklifleri olmadan öneri üretilemez)
    await page.goto("/products");
    await page.getByLabel("Ara (başlık, marka, SKU, GTIN)").fill("DEMO-001");
    await page.getByRole("button", { name: "Filtrele" }).click();
    await page.getByRole("link", { name: /Kablosuz Kulaklık ANC Pro/ }).first().click();
    await page.getByRole("button", { name: "Piyasayı Araştır" }).click();
    await page.waitForURL(/\/research\/[a-f0-9-]+/, { timeout: 30_000 });

    // 3. Ürün detayından öneri hesapla
    await page.goto("/products");
    await page.getByLabel("Ara (başlık, marka, SKU, GTIN)").fill("DEMO-001");
    await page.getByRole("button", { name: "Filtrele" }).click();
    await page.getByRole("link", { name: /Kablosuz Kulaklık ANC Pro/ }).first().click();

    await page.getByRole("button", { name: "Önerileri Hesapla & Kaydet" }).click();
    await expect(page.getByTestId("pricing-strategies")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId("strategy-competitive")).toBeVisible();
    await expect(page.getByTestId("strategy-balanced")).toBeVisible();
    await expect(page.getByTestId("strategy-profit")).toBeVisible();
    await expect(page.getByText(/Başa baş/).first()).toBeVisible();

    // 4. Formül açıklaması: deterministik formül terimleri görünür
    await page.getByRole("button", { name: /Formülü göster/ }).click();
    await expect(page.getByText(/Maliyet tabanı C =/)).toBeVisible();
    await expect(page.getByText(/Başa baş fiyat = \(C \+ F\) \/ \(1 - r\)/)).toBeVisible();
    expect(consoleErrors).toEqual([]);
  });

  test("geçersiz oran profili sunucuda reddedilir", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/pricing-analysis");
    await page.getByLabel("Profil adı").fill("Hatalı Oran");
    await page.getByLabel("Pazaryeri komisyonu (0-1, ör. 0.15)").fill("1.5");
    await page.getByRole("button", { name: "Profili kaydet" }).click();
    await expect(page.getByText(/arasında olmalıdır/)).toBeVisible();
  });
});
