/**
 * Workspace bağlamı (SaaS çok kiracılı). Oturum çerezinden kullanıcı
 * çözülür; workspace tarayıcıdan ASLA güvenilmez. Middleware kenar katmanında
 * imzayı doğrular; burada kullanıcı DB'den tekrar teyit edilir (devre dışı
 * hesap, silinen kullanıcı vb.). (docs/03 §2 — artık session üyeliğinden)
 */
import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";

import { getDb } from "@/server/db/driver";
import { users, type User, type Workspace } from "@/server/db/schema";
import { workspaces } from "@/server/db/schema";
import { verifySessionToken, SESSION_COOKIE } from "@/server/domain/session";

export interface WorkspaceContext {
  workspace: Workspace;
  user: User;
}

export async function resolveWorkspaceContext(): Promise<WorkspaceContext> {
  const db = getDb();
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;

  if (token) {
    const claims = await verifySessionToken(token);
    if (claims) {
      const rows = await db.select().from(users).where(eq(users.id, claims.sub)).limit(1);
      const user = rows[0];
      // Devre dışı/silinmiş kullanıcı: oturum anında geçersiz.
      if (user && user.isActive) {
        const wsRows = await db
          .select()
          .from(workspaces)
          .where(eq(workspaces.id, user.workspaceId))
          .limit(1);
        if (wsRows[0]) {
          return { workspace: wsRows[0], user };
        }
      }
    }
  }

  // Middleware korumalı sayfalarda normalde ulaşılmaz; savunma katmanı.
  redirect("/login");
}
