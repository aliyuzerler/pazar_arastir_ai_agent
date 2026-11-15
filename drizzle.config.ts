import "dotenv/config";

import { defineConfig } from "drizzle-kit";

import { getEnv } from "./src/lib/env";

const env = getEnv();

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/server/db/schema/*.ts",
  out: "./drizzle",
  dbCredentials:
    env.DB_DRIVER === "pglite"
      ? { url: "postgresql://pglite-local/pglite" }
      : { url: env.DATABASE_URL },
  verbose: true,
  strict: false,
});
