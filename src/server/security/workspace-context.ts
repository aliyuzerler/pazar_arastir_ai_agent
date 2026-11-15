/**
 * Workspace bağlamı. Tarayıcıdan gelen workspace id güvenilir kabul edilmez;
 * local tek-kullanıcı modunda sunucu tarafında tek workspace çözülür.
 * SaaS auth geldiğinde burası session üyeliğinden çözülecek (docs/03 §2).
 */
import "server-only";

import { getDefaultWorkspace } from "@/server/db/repositories/workspace-repository";
import { getDb } from "@/server/db/driver";
import type { Workspace } from "@/server/db/schema";

export async function resolveWorkspaceContext(): Promise<Workspace> {
  const db = getDb();
  return getDefaultWorkspace(db);
}
