/**
 * Seed fonksiyonları. Idempotenttir: tekrar çalıştırmak yeni kayıt oluşturmaz.
 */
import { eq } from "drizzle-orm";

import { getEnv } from "@/lib/env";
import type { AppDatabase } from "./driver";
import { workspaces } from "./schema";

export interface SeedResult {
  workspaceId: string;
  slug: string;
  created: boolean;
}

/** Default workspace'i garanti eder; yoksa oluşturur, varsa aynen bırakır. */
export async function ensureDefaultWorkspace(db: AppDatabase): Promise<SeedResult> {
  const env = getEnv();
  const slug = env.DEFAULT_WORKSPACE_SLUG;

  const existing = await db.select().from(workspaces).where(eq(workspaces.slug, slug)).limit(1);
  if (existing.length > 0) {
    return { workspaceId: existing[0].id, slug, created: false };
  }

  const inserted = await db
    .insert(workspaces)
    .values({
      name: "Default Workspace",
      slug,
      defaultCountry: env.DEFAULT_COUNTRY,
      defaultLocale: env.DEFAULT_LOCALE,
      defaultCurrency: env.DEFAULT_CURRENCY,
    })
    .onConflictDoNothing({ target: workspaces.slug })
    .returning();

  // onConflictDoNothing boş dönerse yarış kaybettiğimiz içindir; tekrar oku.
  if (inserted.length === 0) {
    const again = await db.select().from(workspaces).where(eq(workspaces.slug, slug)).limit(1);
    if (again.length === 0) {
      throw new Error("Default workspace oluşturulamadı (beklenmeyen yarış durumu).");
    }
    return { workspaceId: again[0].id, slug, created: false };
  }

  return { workspaceId: inserted[0].id, slug, created: true };
}
