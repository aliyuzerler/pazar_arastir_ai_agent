import { eq } from "drizzle-orm";

import type { AppDatabase } from "@/server/db/driver";
import { workspaces, type Workspace } from "@/server/db/schema";

/**
 * Workspace repository. Tüm repository fonksiyonları workspace kapsamıyla
 * çalışmak zorundadır (docs/03_DATA_MODEL.md çok kiracılılık kuralları).
 */
export async function findWorkspaceById(db: AppDatabase, workspaceId: string): Promise<Workspace | null> {
  const rows = await db.select().from(workspaces).where(eq(workspaces.id, workspaceId)).limit(1);
  return rows[0] ?? null;
}

export async function findWorkspaceBySlug(db: AppDatabase, slug: string): Promise<Workspace | null> {
  const rows = await db.select().from(workspaces).where(eq(workspaces.slug, slug)).limit(1);
  return rows[0] ?? null;
}

/** Local tek-kullanıcı modunda sunucu tarafında seçilen tek workspace. */
export async function getDefaultWorkspace(db: AppDatabase): Promise<Workspace> {
  const { getEnv } = await import("@/lib/env");
  const slug = getEnv().DEFAULT_WORKSPACE_SLUG;
  const found = await findWorkspaceBySlug(db, slug);
  if (!found) {
    throw new Error(
      `Default workspace bulunamadı (slug: ${slug}). Lütfen 'npm run db:seed' komutunu çalıştırın.`,
    );
  }
  return found;
}

export async function listWorkspaces(db: AppDatabase): Promise<Workspace[]> {
  return db.select().from(workspaces).orderBy(workspaces.createdAt);
}
