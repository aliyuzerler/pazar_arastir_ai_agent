import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright yapılandırması. E2E testleri gömülü pglite veritabanıyla
 * `next dev` sunucusunu kendisi başlatır; Docker gerekmez.
 */
export default defineConfig({
  testDir: "./src/tests/e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: {
      DB_DRIVER: "pglite",
      PG_LITE_DATA_DIR: "/tmp/product-intel-e2e-pgdata",
      APP_MODE: "local",
      PROVIDER_MODE: "demo",
    },
  },
});
