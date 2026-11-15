import { expect, test } from "@playwright/test";

test.describe("Faz 5 - fiyat geçmişi", () => {
  let consoleErrors: string[] = [];

  test.beforeEach(({ page }) => {
    consoleErrors = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => consoleErrors.push(String(error)));
  });

  test("araştırma sonrası ürün detayında fiyat geçmişi oluşur ve CSV dışa aktarılır", async ({
    page,
  }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: 1440, height: 900 });

    await page.goto("/products");
    await page.getByLabel("Ara (başlık, marka, SKU, GTIN)").fill("DEMO-001");
    await page.getByRole("button", { name: "Filtrele" }).click();
    await page.getByRole("link", { name: /Kablosuz Kulaklık ANC Pro/ }).first().click();
    await page.getByRole("button", { name: "Piyasayı Araştır" }).click();
    await page.waitForURL(/\/research\/[a-f0-9-]+/, { timeout: 30_000 });

    // Ürün detayına dön → fiyat geçmişi bölümü dolu olmalı
    await page.goto("/products");
    await page.getByLabel("Ara (başlık, marka, SKU, GTIN)").fill("DEMO-001");
    await page.getByRole("button", { name: "Filtrele" }).click();
    await page.getByRole("link", { name: /Kablosuz Kulaklık ANC Pro/ }).first().click();

    await expect(page.getByText("Fiyat geçmişi")).toBeVisible();
    await expect(page.getByTestId("price-stats")).toBeVisible();
    await expect(page.getByText("İlk gözlem")).toBeVisible();
    await expect(page.getByTestId("price-history-chart")).toBeVisible();
    // Sağlayıcı geçmişi ayrı seri olarak işaretlenir
    await expect(page.getByText(/Sağlayıcı geçmişi: \d+ nokta/)).toBeVisible();

    // CSV dışa aktarma: source_kind ve tarih sütunları taşınır
    const download = await page.getByRole("link", { name: /CSV indir/ }).getAttribute("href");
    expect(download).toContain("/price-history/export");
    const response = await page.request.get(download!);
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("text/csv");
    const csv = await response.text();
    expect(csv).toContain("source_kind");
    expect(csv).toContain("our_snapshot");
    expect(csv).toContain("provider_history");
    // Formül nötralizasyonu: başlayan "=" hücresi saf geçemez
    expect(csv.split("\n").every((line) => !/^=/.test(line))).toBe(true);
    expect(consoleErrors).toEqual([]);
  });

  test("araştırma yapılmamış ürün boş geçmiş durumu gösterir", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    // DEMO-002 termostat için araştırma yok
    await page.goto("/products");
    await page.getByLabel("Ara (başlık, marka, SKU, GTIN)").fill("DEMO-002");
    await page.getByRole("button", { name: "Filtrele" }).click();
    await page.getByRole("link", { name: /Termostat/ }).first().click();
    await expect(page.getByText("Henüz fiyat geçmişi yok")).toBeVisible();
    expect(consoleErrors).toEqual([]);
  });
});
