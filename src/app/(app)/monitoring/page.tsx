import { Bell, BellOff, CircleAlert, Info } from "lucide-react";

import { EmptyState } from "@/components/feedback/empty-state";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableWrapper,
} from "@/components/ui/table";
import { MarkAlertRead, MonitoringJobActions } from "@/features/monitoring/monitoring-actions";
import { formatDateTime, formatMoney } from "@/lib/format";
import { getDb } from "@/server/db/driver";
import { listAlerts, listJobsWithProducts } from "@/server/jobs/monitoring-service";
import { resolveWorkspaceContext } from "@/server/security/workspace-context";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, { label: string; variant: "success" | "warning" | "danger" | "neutral" }> = {
  idle: { label: "Beklemede", variant: "success" },
  running: { label: "Çalışıyor", variant: "warning" },
  failed: { label: "Hata", variant: "danger" },
  paused: { label: "Duraklatıldı", variant: "neutral" },
};

const ALERT_TYPE_LABELS: Record<string, { label: string; variant: "success" | "warning" | "info" }> = {
  price_drop: { label: "Fiyat düşüşü", variant: "success" },
  price_rise: { label: "Fiyat yükselişi", variant: "warning" },
  availability_change: { label: "Stok değişimi", variant: "info" },
  research_completed: { label: "Araştırma tamamlandı", variant: "info" },
};

export default async function MonitoringPage() {
  const { workspace } = await resolveWorkspaceContext();
  const db = getDb();
  const jobs = await listJobsWithProducts(db, workspace.id);
  const alertRows = await listAlerts(db, workspace.id);

  return (
    <section aria-labelledby="monitoring-title" className="space-y-4">
      <header>
        <h1 id="monitoring-title" className="text-2xl font-semibold tracking-tight">
          Fiyat İzleme
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Zamanlanmış kontroller DemoProvider ile çalışır; sıklık güvenli varsayılanla
          başlar (24 saat, en az 6 saat). Günlük sorgu bütçesi korunur.
        </p>
      </header>

      {jobs.length === 0 ? (
        <EmptyState
          icon={BellOff}
          title="İzlenen ürün yok"
          description="Ürün detayından veya buradan izlemeyi başlattığınızda fiyat/stok kontrolleri zamanlanır ve değişimler etkinlik akışına düşer."
        />
      ) : (
        <div className="rounded-xl border border-border-subtle bg-surface">
          <TableWrapper>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ürün</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="hidden md:table-cell">Son kontrol</TableHead>
                  <TableHead className="hidden md:table-cell">Sonraki kontrol</TableHead>
                  <TableHead className="text-right">Aksiyonlar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map(({ job, product }) => {
                  const status = STATUS_LABELS[job.status] ?? STATUS_LABELS.idle;
                  return (
                    <TableRow key={job.id}>
                      <TableCell>
                        <p className="font-medium">{product.title}</p>
                        {job.lastError ? (
                          <p className="text-[11px] text-status-danger">Son hata: {job.lastError}</p>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </TableCell>
                      <TableCell className="hidden text-xs text-text-secondary md:table-cell">
                        {job.lastRunAt ? formatDateTime(job.lastRunAt) : "—"}
                      </TableCell>
                      <TableCell className="hidden text-xs text-text-secondary md:table-cell">
                        {formatDateTime(job.nextRunAt)}
                      </TableCell>
                      <TableCell>
                        <MonitoringJobActions
                          productId={product.id}
                          trackingEnabled={job.status !== "paused"}
                          frequencyHours={job.frequencyHours}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableWrapper>
        </div>
      )}

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>Etkinlik akışı</CardTitle>
            <CardDescription>Fiyat/stok değişim uyarıları burada listelenir.</CardDescription>
          </div>
          <Bell className="size-4 text-text-secondary" aria-hidden />
        </CardHeader>
        <CardContent className="space-y-2">
          {alertRows.length === 0 ? (
            <EmptyState
              icon={CircleAlert}
              title="Etkinlik yok"
              description="İzleme kontrolleri fiyat eşiklerini (varsayılan %5) veya bulunabilirlik değişimini yakaladığında burada görünür."
            />
          ) : (
            alertRows.map(({ alert, product }) => {
              const type = ALERT_TYPE_LABELS[alert.type] ?? ALERT_TYPE_LABELS.availability_change;
              return (
                <div
                  key={alert.id}
                  className={`flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2.5 ${
                    alert.isRead ? "border-border-subtle bg-surface-subtle/50" : "border-border-subtle bg-surface"
                  }`}
                >
                  <Badge variant={type.variant}>{type.label}</Badge>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">
                      {product.title}
                      {alert.oldPrice !== null && alert.newPrice !== null ? (
                        <span className="ml-2 tabular-nums text-text-secondary">
                          {formatMoney(alert.oldPrice, alert.currency ?? "TRY")} →{" "}
                          {formatMoney(alert.newPrice, alert.currency ?? "TRY")}
                        </span>
                      ) : null}
                    </p>
                    <p className="text-[11px] text-text-secondary">
                      {alert.message} · {formatDateTime(alert.createdAt)}
                      {alert.isDemo ? " · DEMO" : ""}
                    </p>
                  </div>
                  {alert.isRead ? (
                    <Badge variant="neutral">Okundu</Badge>
                  ) : (
                    <MarkAlertRead alertId={alert.id} />
                  )}
                </div>
              );
            })
          )}
          <p className="flex items-start gap-1.5 pt-1 text-[11px] text-text-secondary">
            <Info className="mt-0.5 size-3 shrink-0" aria-hidden />
            Sunucu tarafı zamanlama için `npm run worker` (yerel) veya
            CRON_SECRET ile korunan `/api/cron/monitoring` (Vercel Cron) kullanılır.
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
