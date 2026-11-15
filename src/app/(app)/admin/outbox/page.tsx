import { EmptyState } from "@/components/feedback/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableWrapper } from "@/components/ui/table";
import { formatDateTime } from "@/lib/format";
import { Mail } from "lucide-react";
import { listOutbox, requireAdmin } from "@/server/application/admin-service";
import { getDb } from "@/server/db/driver";
import { resolveWorkspaceContext } from "@/server/security/workspace-context";

export const dynamic = "force-dynamic";

const KIND_LABELS: Record<string, string> = {
  verification: "Doğrulama",
  password_reset: "Parola sıfırlama",
};

/** E-posta çıkış kutusu: yerel modda tüm gönderimler burada görünür. */
export default async function AdminOutboxPage() {
  const { user } = await resolveWorkspaceContext();
  requireAdmin(user);
  const db = getDb();
  const entries = await listOutbox(db, 50);

  return (
    <section aria-labelledby="admin-outbox-title" className="space-y-4">
      <header>
        <h1 id="admin-outbox-title" className="text-2xl font-semibold tracking-tight">
          E-posta Çıkış Kutusu
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Sistem tarafından üretilen e-postalar. Secret/bağlantı token değerleri bu ekranda gösterilmez.
        </p>
      </header>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>Gönderim kaydı</CardTitle>
            <CardDescription>Son 50 kayıt, en yeni önce.</CardDescription>
          </div>
          <Mail className="size-4 text-text-secondary" aria-hidden />
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <EmptyState icon={Mail} title="Kayıt yok" description="Henüz e-posta üretilmedi." />
          ) : (
            <div className="rounded-lg border border-border-subtle">
              <TableWrapper>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tür</TableHead>
                      <TableHead>Alıcı</TableHead>
                      <TableHead className="hidden md:table-cell">Konu</TableHead>
                      <TableHead className="hidden md:table-cell">Taşıyıcı</TableHead>
                      <TableHead className="hidden md:table-cell">Zaman</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>
                          <Badge variant={entry.kind === "password_reset" ? "warning" : "info"}>
                            {KIND_LABELS[entry.kind] ?? entry.kind}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">{entry.toEmail}</TableCell>
                        <TableCell className="hidden max-w-[240px] truncate text-xs md:table-cell">
                          {entry.subject}
                        </TableCell>
                        <TableCell className="hidden text-xs text-text-secondary md:table-cell">
                          {entry.sentVia === "resend" ? "Resend" : "Outbox (yerel)"}
                        </TableCell>
                        <TableCell className="hidden text-xs text-text-secondary md:table-cell">
                          {formatDateTime(entry.createdAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableWrapper>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
