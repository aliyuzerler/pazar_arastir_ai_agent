import { ShieldAlert } from "lucide-react";

import { EmptyState } from "@/components/feedback/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableWrapper } from "@/components/ui/table";
import { formatDateTime } from "@/lib/format";
import { AdminUserActions } from "@/features/admin/admin-user-actions";
import { listUsersWithWorkspaces, requireAdmin } from "@/server/application/admin-service";
import { getDb } from "@/server/db/driver";
import { resolveWorkspaceContext } from "@/server/security/workspace-context";

export const dynamic = "force-dynamic";

/** Admin kullanıcı yönetimi: kiracı tablosu + rol/aktiflik/doğrulama aksiyonları. */
export default async function AdminUsersPage() {
  const { user } = await resolveWorkspaceContext();
  requireAdmin(user);
  const db = getDb();
  const users = await listUsersWithWorkspaces(db);

  return (
    <section aria-labelledby="admin-users-title" className="space-y-4">
      <header>
        <h1 id="admin-users-title" className="text-2xl font-semibold tracking-tight">
          Kullanıcı Yönetimi
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Tüm kiracı kullanıcıları; rol, aktiflik ve e-posta doğrulama durumları.
        </p>
      </header>

      {users.length === 0 ? (
        <EmptyState icon={ShieldAlert} title="Kullanıcı yok" description="Henüz kayıtlı kullanıcı bulunmuyor." />
      ) : (
        <div className="rounded-xl border border-border-subtle bg-surface">
          <TableWrapper>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kullanıcı</TableHead>
                  <TableHead className="hidden md:table-cell">Workspace</TableHead>
                  <TableHead className="hidden md:table-cell">Kayıt</TableHead>
                  <TableHead className="text-right">Durum ve aksiyonlar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <p className="font-medium">{row.displayName}</p>
                      <p className="text-[11px] text-text-secondary">{row.email}</p>
                      {!row.isActive ? (
                        <Badge variant="danger" className="mt-1">
                          Devre dışı
                        </Badge>
                      ) : null}
                    </TableCell>
                    <TableCell className="hidden text-xs md:table-cell">
                      <p>{row.workspaceName}</p>
                      <p className="text-text-secondary">{row.productCount} ürün</p>
                    </TableCell>
                    <TableCell className="hidden text-xs text-text-secondary md:table-cell">
                      {formatDateTime(row.createdAt)}
                    </TableCell>
                    <TableCell>
                      <AdminUserActions
                        userId={row.id}
                        email={row.email}
                        role={row.role}
                        isActive={row.isActive}
                        emailVerified={row.emailVerified}
                        isSelf={row.id === user.id}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableWrapper>
        </div>
      )}
    </section>
  );
}
