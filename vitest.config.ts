import path from "node:path";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "node",
    setupFiles: ["src/tests/setup.ts"],
    include: ["src/tests/**/*.test.{ts,tsx}"],
    exclude: ["node_modules/**", ".next/**", "src/tests/e2e/**"],
    restoreMocks: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      // Next.js "server-only" guard'ı test ortamında nötrlenir.
      "server-only": path.resolve(__dirname, "src/tests/stubs/server-only.ts"),
    },
  },
});
