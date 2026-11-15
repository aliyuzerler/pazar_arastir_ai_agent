import { Search } from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/feedback/empty-state";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableWrapper,
} from "@/components/ui/table";
import { formatDateTime } from "@/lib/format";
import { getDb } from "@/server/db/driver";
import { listResearchRuns } from "@/server/application/research-orchestrator";
import { resolveWorkspaceContext } from "@/server/security/workspace-context";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, { label: string; variant: "success" | "warning" | "danger" | "info" }> = {
  completed: { label: "Tamamlandı", variant: "success" },
  partial: { label: "Kısmi sonuç", variant: "warning" },
  failed: { label: "Başarısız", variant: "danger" },
  running: { label: "Çalışıyor", variant: "info" },
  queued: { label: "Kuyrukta", variant: "info" },
};

export default async function ResearchPage() {
  const { workspace } = await resolveWorkspaceContext();
  const db = getDb();
  const runs = await listResearchRuns(db, workspace.id, undefined, 30);

  return (
    <section aria-labelledby="research-title" className="space-y-4">
      <header>
        <h1 id="research-title" className="text-2xl font-semibold tracking-tight">
          Araştırma
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Araştırma koşuları ürün detayından “Piyasayı Araştır” ile başlatılır.
        </p>
      </header>

      {runs.length === 0 ? (
        <EmptyState
          icon={Search}
          title="Henüz araştırma yapılmadı"
          description="Ürün detay sayfasından araştırma başlattığınızda koşular burada listelenir."
        />
      ) : (
        <div className="rounded-xl border border-border-subtle bg-surface">
          <TableWrapper>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ürün</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="text-right">Teklif / birebir / muadil</TableHead>
                  <TableHead className="hidden md:table-cell">Kaynaklar</TableHead>
                  <TableHead className="hidden lg:table-cell">Tarih</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {runs.map((run) => {
                  const status = STATUS_LABELS[run.status] ?? STATUS_LABELS.running;
                  return (
                    <TableRow key={run.id}>
                      <TableCell>
                        <Link href={`/research/${run.id}`} className="font-medium hover:underline">
                          Koşu {run.id.slice(0, 8)}
                        </Link>
                        <p className="text-xs text-text-secondary">{run.productId.slice(0, 8)}…</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {run.totalResults} / {run.exactCount} / {run.substituteCount}
                      </TableCell>
                      <TableCell className="hidden text-xs text-text-secondary md:table-cell">
                        {run.providersRequested.join(", ") || "—"}
                        {run.providerErrors.length > 0 ? ` · ${run.providerErrors.length} hata` : ""}
                      </TableCell>
                      <TableCell className="hidden text-xs text-text-secondary lg:table-cell">
                        {formatDateTime(run.createdAt)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableWrapper>
        </div>
      )}
    </section>
  );
}
