import { expect, test } from "@playwright/test";

/** Auth sayfaları oturum durumu OLMADAN test edilir. */
test.use({ storageState: { cookies: [], origins: [] } });

test.describe("Faz 11 - e-posta doğrulama ve parola sıfırlama", () => {
  let consoleErrors: string[] = [];

  test.beforeEach(({ page }) => {
    consoleErrors = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => consoleErrors.push(String(error)));
  });

  test("kayıt → doğrulama → parola sıfırlama → yeni parola ile giriş", async ({ page }) => {
    test.setTimeout(120_000);
    const email = `akiz${Date.now().toString().slice(-6)}@test.local`;

    // 1) Kayıt + doğrulama
    await page.goto("/register");
    await page.getByLabel("Ad soyad").fill("Akış Kullanıcısı");
    await page.getByLabel("E-posta").fill(email);
    await page.getByLabel("Parola").fill("AkisParola123");
    await page.getByRole("button", { name: "Hesap oluştur" }).click();
    await page.getByTestId("register-success").waitFor({ timeout: 15_000 });
    await page.getByTestId("demo-verification").getByRole("link").click();
    await expect(page.getByText("E-posta adresin doğrulandı")).toBeVisible({ timeout: 15_000 });

    // 2) Çıkış yapılmış durumda parolamı unuttum akışı
    await page.goto("/forgot-password");
    await page.getByLabel("E-posta").fill(email);
    await page.getByRole("button", { name: "Sıfırlama bağlantısı gönder" }).click();
    await page.getByTestId("forgot-result").waitFor({ timeout: 15_000 });
    await expect(page.getByText("İstek alındı")).toBeVisible();

    // 3) DEMO sıfırlama bağlantısı → yeni parola
    await page.getByTestId("demo-reset").getByRole("link").click();
    await page.getByLabel("Yeni parola", { exact: true }).fill("YeniAkisParola123");
    await page.getByLabel("Yeni parola (tekrar)").fill("YeniAkisParola123");
    await page.getByRole("button", { name: "Parolayı güncelle" }).click();
    await expect(page.getByTestId("reset-success")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("Parolan güncellendi")).toBeVisible();

    // 4) Yeni parola ile giriş
    await page.goto("/login");
    await page.getByLabel("E-posta").fill(email);
    await page.getByLabel("Parola").fill("YeniAkisParola123");
    await page.getByRole("button", { name: "Giriş yap" }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });

    const jsErrors = consoleErrors.filter((entry) => !entry.startsWith("Failed to load resource"));
    expect(jsErrors).toEqual([]);
  });

  test("geçersiz doğrulama belirteci anlaşılır hata verir", async ({ page }) => {
    await page.goto("/verify-email?token=ffffffffffffffffffffffffffffffff");
    await expect(page.getByText("Doğrulama başarısız")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/geçersiz veya süresi dolmuş/i)).toBeVisible();
  });

  test("token'sız sıfırlama sayfası yönlendirme mesajı verir", async ({ page }) => {
    await page.goto("/reset-password");
    await expect(page.getByText("Geçersiz bağlantı")).toBeVisible();
  });
});
