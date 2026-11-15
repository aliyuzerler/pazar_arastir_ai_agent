import { Users, Database, Activity, Mail, Briefcase } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableWrapper } from "@/components/ui/table";
import { formatDateTime } from "@/lib/format";
import { getAdminOverview, listOutbox, requireAdmin } from "@/server/application/admin-service";
import { getDb } from "@/server/db/driver";
import { resolveWorkspaceContext } from "@/server/security/workspace-context";
import Link from "next/link";

export const dynamic = "force-dynamic";

const KIND_LABELS: Record<string, string> = {
  verification: "Doğrulama",
  password_reset: "Parola sıfırlama",
};

/** Admin genel bakış: kiracı sayıları, sağlıklı işler, e-posta çıkışı. */
export default async function AdminOverviewPage() {
  const { user } = await resolveWorkspaceContext();
  requireAdmin(user);
  const db = getDb();
  const [overview, outbox] = await Promise.all([getAdminOverview(db), listOutbox(db, 8)]);

  const cards = [
    { label: "Kullanıcı", value: overview.userCount, hint: `${overview.verifiedUserCount} doğrulanmış`, icon: Users },
    { label: "Workspace", value: overview.workspaceCount, hint: "kiracı", icon: Database },
    { label: "Ürün", value: overview.productCount, hint: "tüm kiracılar", icon: Briefcase },
    { label: "24s Araştırma", value: overview.researchRuns24h, hint: "koşu", icon: Activity },
    { label: "Aktif İş", value: overview.activeJobCount, hint: `${overview.failedJobCount} hatalı`, icon: Activity },
    { label: "E-posta", value: overview.outboxCount, hint: "gönderim", icon: Mail },
  ];

  return (
    <section aria-labelledby="admin-title" className="space-y-4">
      <header>
        <h1 id="admin-title" className="text-2xl font-semibold tracking-tight">
          Yönetim Paneli
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Kiracı kullanımları ve sistem sağlığı. Bu sayfa yalnızca admin rolüne açıktır.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" data-testid="admin-overview">
        {cards.map((card) => (
          <Card key={card.label}>
            <CardHeader className="flex-row items-center justify-between pb-2">
              <CardDescription>{card.label}</CardDescription>
              <card.icon className="size-4 text-text-secondary" aria-hidden />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold tabular-nums">{card.value}</p>
              <p className="text-[11px] text-text-secondary">{card.hint}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>Son e-posta gönderimleri</CardTitle>
            <CardDescription>Outbox kayıtları; RESEND anahtarı varsa gerçek gönderim yapılır.</CardDescription>
          </div>
          <Link href="/admin/outbox" className="text-xs text-text-secondary underline hover:text-foreground">
            Tümü →
          </Link>
        </CardHeader>
        <CardContent>
          {outbox.length === 0 ? (
            <p className="text-sm text-text-secondary">Henüz e-posta gönderilmedi.</p>
          ) : (
            <div className="rounded-lg border border-border-subtle">
              <TableWrapper>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tür</TableHead>
                      <TableHead>Alıcı</TableHead>
                      <TableHead className="hidden md:table-cell">Taşıyıcı</TableHead>
                      <TableHead className="hidden md:table-cell">Zaman</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {outbox.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>
                          <Badge variant="neutral">{KIND_LABELS[entry.kind] ?? entry.kind}</Badge>
                        </TableCell>
                        <TableCell className="text-xs">{entry.toEmail}</TableCell>
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
