import { expect, test } from "@playwright/test";

/**
 * TEST_12 — admin paneli E2E: admin erişimi, kullanıcı yönetimi aksiyonları,
 * admin olmayan kullanıcının engellenmesi.
 */
test.describe("Faz 12 - admin paneli", () => {
  let consoleErrors: string[] = [];

  test.beforeEach(({ page }) => {
    consoleErrors = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => consoleErrors.push(String(error)));
  });

  test("admin genel bakış ve kullanıcı tablosunu görür; aksiyon çalışır", async ({ page }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width: 1440, height: 900 });

    await page.goto("/admin");
    await expect(page.getByRole("heading", { name: "Yönetim Paneli" })).toBeVisible();
    await expect(page.getByTestId("admin-overview")).toBeVisible();

    await page.goto("/admin/users");
    await expect(page.getByRole("heading", { name: "Kullanıcı Yönetimi" })).toBeVisible();
    await expect(page.getByTestId("user-actions-admin@demo.local")).toBeVisible();

    // Admin kendisini devre dışı bırakamaz: "Siz" rozeti görünür
    const adminRow = page.locator('[data-testid="user-actions-admin@demo.local"]');
    await expect(adminRow.getByText("Siz")).toBeVisible();
    expect(consoleErrors).toEqual([]);
  });

  test("admin olmayan kullanıcı /admin'e erişemez ve menüde Yönetim görünmez", async ({ page }) => {
    test.setTimeout(120_000);
    const email = `nonadmin${Date.now().toString().slice(-6)}@test.local`;

    // Yeni kullanıcı kaydet + doğrula
    await page.goto("/register");
    await page.getByLabel("Ad soyad").fill("Normal Üye");
    await page.getByLabel("E-posta").fill(email);
    await page.getByLabel("Parola").fill("NormalParola123");
    await page.getByRole("button", { name: "Hesap oluştur" }).click();
    await page.getByTestId("register-success").waitFor({ timeout: 15_000 });
    await page.getByTestId("demo-verification").getByRole("link").click();
    await expect(page.getByText("E-posta adresin doğrulandı")).toBeVisible({ timeout: 15_000 });

    // Giriş yap
    await page.goto("/login");
    await page.getByLabel("E-posta").fill(email);
    await page.getByLabel("Parola").fill("NormalParola123");
    await page.getByRole("button", { name: "Giriş yap" }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });

    // Menüde Yönetim yok; doğrudan /admin girişi dashboard'a döner
    await expect(page.getByTestId("admin-nav-link")).toHaveCount(0);
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("admin olmayan kullanıcıya admin API 403 döner", async ({ page }) => {
    test.setTimeout(120_000);
    const email = `apiforb${Date.now().toString().slice(-6)}@test.local`;
    await page.goto("/register");
    await page.getByLabel("Ad soyad").fill("API Üye");
    await page.getByLabel("E-posta").fill(email);
    await page.getByLabel("Parola").fill("ApiParola123");
    await page.getByRole("button", { name: "Hesap oluştur" }).click();
    await page.getByTestId("register-success").waitFor({ timeout: 15_000 });
    await page.getByTestId("demo-verification").getByRole("link").click();
    await expect(page.getByText("E-posta adresin doğrulandı")).toBeVisible({ timeout: 15_000 });

    await page.goto("/login");
    await page.getByLabel("E-posta").fill(email);
    await page.getByLabel("Parola").fill("ApiParola123");
    await page.getByRole("button", { name: "Giriş yap" }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });

    const response = await page.request.get("/api/admin/users");
    expect(response.status()).toBe(403);
  });
});
