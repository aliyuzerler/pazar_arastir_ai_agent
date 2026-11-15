import path from "node:path";

import { expect, test as setup } from "@playwright/test";

import { E2E_ADMIN } from "./global-setup";

const STATE_FILE = path.resolve("test-results/.auth/admin.json");

/** Tüm korumalı sayfa testleri bu oturum durumunu kullanır. */
setup("admin oturumu hazırlanır", async ({ request }) => {
  const response = await request.post("/api/auth/login", {
    data: { email: E2E_ADMIN.email, password: E2E_ADMIN.password },
  });
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.data.user.email).toBe(E2E_ADMIN.email);
  await request.storageState({ path: STATE_FILE });
});
