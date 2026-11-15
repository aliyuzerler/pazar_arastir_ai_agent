import { expect, test } from "@playwright/test";

/**
 * TEST_09 — Uçtan uca yolculuk: ürün → araştırma → eşleşme onayı →
 * fiyat geçmişi → fiyat önerisi → izleme. Tam kullanıcı yolculuğu tek akışta.
 */
test.describe("Faz 9 - uçtan uca yolculuk", () => {
  let consoleErrors: string[] = [];

  test.beforeEach(({ page }) => {
    consoleErrors = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => consoleErrors.push(String(error)));
  });

  test("üründen fiyat önerisine tam yolculuk çalışır", async ({ page }) => {
    test.setTimeout(150_000);
    await page.setViewportSize({ width: 1440, height: 900 });

    // 1) Profil
    await page.goto("/pricing-analysis");
    await page.getByLabel("Profil adı").fill("Yolculuk Profili");
    await page.getByRole("button", { name: "Profili kaydet" }).click();
    await expect(page.getByText("Varsayılan").first()).toBeVisible();

    // 2) Ürün araştırması
    await page.goto("/products");
    await page.getByLabel("Ara (başlık, marka, SKU, GTIN)").fill("DEMO-001");
    await page.getByRole("button", { name: "Filtrele" }).click();
    await page.getByRole("link", { name: /Kablosuz Kulaklık ANC Pro/ }).first().click();
    await page.getByRole("button", { name: "Piyasayı Araştır" }).click();
    await page.waitForURL(/\/research\/[a-f0-9-]+/, { timeout: 30_000 });

    // 3) Muadil onayı
    await page.getByRole("tab", { name: /Muadiller/ }).click();
    await page.getByRole("button", { name: "Onayla" }).first().click();
    await expect(page.getByText("Onaylandı").first()).toBeVisible();

    // 4) Ürün detayında fiyat geçmişi + öneriler
    await page.goto("/products");
    await page.getByLabel("Ara (başlık, marka, SKU, GTIN)").fill("DEMO-001");
    await page.getByRole("button", { name: "Filtrele" }).click();
    await page.getByRole("link", { name: /Kablosuz Kulaklık ANC Pro/ }).first().click();
    await expect(page.getByTestId("price-stats")).toBeVisible();
    await page.getByRole("button", { name: "Önerileri Hesapla & Kaydet" }).click();
    await expect(page.getByTestId("strategy-competitive")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId("strategy-profit")).toBeVisible();

    // 5) İzleme işi aktif
    await page.goto("/monitoring");
    await expect(page.getByText(/Kablosuz Kulaklık ANC Pro/).first()).toBeVisible();
    await expect(page.getByText("Beklemede").first()).toBeVisible();
    expect(consoleErrors).toEqual([]);
  });
});
