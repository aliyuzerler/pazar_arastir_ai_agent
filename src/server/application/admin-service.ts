/**
 * Admin servisi: kullanıcı yönetimi ve genel bakış sayıları.
 * Her fonksiyon requireAdmin ile korunur; admin işlemleri workspace
 * sınırını aşar (bilinçli olarak — tüm kiracıların yönetimi).
 */
import { count, desc, eq, gte, sql } from "drizzle-orm";

import type { AppDatabase } from "@/server/db/driver";
import {
  emailOutbox,
  monitoringJobs,
  products,
  researchRuns,
  users,
  workspaces,
  type User,
} from "@/server/db/schema";
import { AuthError } from "@/server/application/auth-service";

export function requireAdmin(user: User): void {
  if (user.role !== "admin") {
    throw new AuthError("FORBIDDEN", "Bu işlem için admin yetkisi gerekir.");
  }
}

export interface AdminUserRow {
  id: string;
  email: string;
  displayName: string;
  role: string;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: Date;
  workspaceName: string;
  productCount: number;
}

export async function listUsersWithWorkspaces(db: AppDatabase): Promise<AdminUserRow[]> {
  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      displayName: users.displayName,
      role: users.role,
      isActive: users.isActive,
      emailVerified: users.emailVerified,
      createdAt: users.createdAt,
      workspaceName: workspaces.name,
      productCount: sql<number>`(select count(*)::int from ${products} where ${products.workspaceId} = ${users.workspaceId})`,
    })
    .from(users)
    .innerJoin(workspaces, eq(users.workspaceId, workspaces.id))
    .orderBy(desc(users.createdAt));
  return rows;
}

export async function updateUserAdmin(
  db: AppDatabase,
  actor: User,
  userId: string,
  patch: { role?: string; isActive?: boolean; emailVerified?: boolean },
): Promise<User> {
  requireAdmin(actor);
  if (patch.role && !["user", "admin"].includes(patch.role)) {
    throw new AuthError("VALIDATION_ERROR", "Geçersiz rol.");
  }
  // Admin kendisini devre dışı bırakamaz/küçültemez (kilitleme koruması).
  if (actor.id === userId && (patch.isActive === false || (patch.role && patch.role !== "admin"))) {
    throw new AuthError("VALIDATION_ERROR", "Kendi yönetici hesabınızı kısıtlayamazsınız.");
  }
  const updated = await db
    .update(users)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(users.id, userId))
    .returning();
  if (!updated[0]) {
    throw new AuthError("NOT_FOUND", "Kullanıcı bulunamadı.");
  }
  return updated[0];
}

export interface AdminOverview {
  userCount: number;
  verifiedUserCount: number;
  workspaceCount: number;
  productCount: number;
  researchRuns24h: number;
  outboxCount: number;
  activeJobCount: number;
  failedJobCount: number;
}

export async function getAdminOverview(db: AppDatabase): Promise<AdminOverview> {
  const since24h = new Date(Date.now() - 24 * 3_600_000);
  const userRows = (
    await db
      .select({
        total: count(),
        verified: sql<number>`sum(case when ${users.emailVerified} then 1 else 0 end)::int`,
      })
      .from(users)
  )[0];
  const [wsRows, productRows, runRows, outboxRows, jobRows] = await Promise.all([
    db.select({ total: count() }).from(workspaces),
    db.select({ total: count() }).from(products),
    db.select({ total: count() }).from(researchRuns).where(gte(researchRuns.startedAt, since24h)),
    db.select({ total: count() }).from(emailOutbox),
    db
      .select({
        active: sql<number>`sum(case when ${monitoringJobs.status} <> 'paused' then 1 else 0 end)::int`,
        failed: sql<number>`sum(case when ${monitoringJobs.status} = 'failed' then 1 else 0 end)::int`,
      })
      .from(monitoringJobs),
  ]);

  return {
    userCount: Number(userRows?.total ?? 0),
    verifiedUserCount: Number(userRows?.verified ?? 0),
    workspaceCount: Number(wsRows[0]?.total ?? 0),
    productCount: Number(productRows[0]?.total ?? 0),
    researchRuns24h: Number(runRows[0]?.total ?? 0),
    outboxCount: Number(outboxRows[0]?.total ?? 0),
    activeJobCount: Number(jobRows[0]?.active ?? 0),
    failedJobCount: Number(jobRows[0]?.failed ?? 0),
  };
}

export async function listOutbox(db: AppDatabase, limit = 50) {
  return db.select().from(emailOutbox).orderBy(desc(emailOutbox.createdAt)).limit(limit);
}
