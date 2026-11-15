import { expect, test, type Page } from "@playwright/test";

/**
 * TEST_04: ürün → araştırma → exact/muadil sekmleri → onay/red akışı.
 */
test.describe("Faz 4 - araştırma ve eşleştirme", () => {
  let consoleErrors: string[] = [];

  test.beforeEach(({ page }) => {
    consoleErrors = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => consoleErrors.push(String(error)));
  });

  test("ürün detayından demo araştırma çalışır, exact/muadil ayrılır, onay kalıcıdır", async ({
    page,
  }: {
    page: Page;
  }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width: 1440, height: 900 });

    // DemoProvider fixture'larıyla eşleşen ürünü bul (global seed: DEMO-001)
    await page.goto("/products");
    await page.getByLabel("Ara (başlık, marka, SKU, GTIN)").fill("DEMO-001");
    await page.getByRole("button", { name: "Filtrele" }).click();
    await page.getByRole("link", { name: /Kablosuz Kulaklık ANC Pro/ }).first().click();

    await expect(page.getByRole("heading", { name: /Kablosuz Kulaklık ANC Pro/ })).toBeVisible();

    // Araştırmayı başlat
    await page.getByRole("button", { name: "Piyasayı Araştır" }).click();
    await page.waitForURL(/\/research\/[a-f0-9-]+/, { timeout: 30_000 });

    // Sonuç sayfası: DEMO rozeti, sekmeler ve exact sonuçlar
    await expect(page.getByText("DEMO MOD").first()).toBeVisible();
    await expect(page.getByRole("tab", { name: /Birebir aynı/ })).toBeVisible();
    await expect(page.getByText("Birebir aynı", { exact: false }).first()).toBeVisible();
    const exactBadge = page.getByText("Birebir aynı").first();
    await expect(exactBadge).toBeVisible();

    // Muadil sekmesinde TechSound muadili görünür
    await page.getByRole("tab", { name: /Muadiller/ }).click();
    await expect(page.getByText(/TechSound|Ortak kullanım terimi/).first()).toBeVisible();

    // Onay işlemi: muadil sekmesinde ilk Onayla → durum kalıcı olmalı
    await page.getByRole("button", { name: "Onayla" }).first().click();
    await expect(page.getByText("Onaylandı").first()).toBeVisible();
    await page.reload();
    await page.getByRole("tab", { name: /Muadiller/ }).click();
    await expect(page.getByText("Onaylandı").first()).toBeVisible();

    // Tüm teklifler sekmesi
    await page.getByRole("tab", { name: /Tüm teklifler/ }).click();
    await expect(page.getByText("Kaynağa git").first()).toBeVisible();
    expect(consoleErrors).toEqual([]);
  });

  test("araştırma listesi koşuları gösterir", async ({ page }: { page: Page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/research");
    await expect(page.getByRole("heading", { name: "Araştırma" })).toBeVisible();
    expect(consoleErrors).toEqual([]);
  });
});
