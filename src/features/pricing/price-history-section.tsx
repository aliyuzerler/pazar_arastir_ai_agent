import { Download, TrendingDown, TrendingUp } from "lucide-react";

import { PriceHistoryChart, type HistoryChartPoint } from "@/features/pricing/price-history-chart";
import { EmptyState } from "@/components/feedback/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDateTime, formatMoney } from "@/lib/format";
import type { PriceStats } from "@/server/domain/price-history";
import type { PriceObservation } from "@/server/db/schema";

/**
 * Fiyat geçmişi bölümü: iki seri (kendi gözlemlerimiz vs sağlayıcı geçmişi),
 * istatistik şeridi, stok zaman çizelgesi ve CSV dışa aktarma.
 */
export function PriceHistorySection({
  productId,
  currency,
  ourSnapshots,
  providerHistory,
  ourStats,
  providerStats,
}: {
  productId: string;
  currency: string;
  ourSnapshots: PriceObservation[];
  providerHistory: PriceObservation[];
  ourStats: PriceStats;
  providerStats: PriceStats;
}) {
  const chartData = buildChartData(ourSnapshots, providerHistory);
  const hasData = ourSnapshots.length > 0 || providerHistory.length > 0;

  // Stok durum değişim zaman çizelgesi: yalnızca GERÇEK gözlemlerden.
  const stockTimeline = ourSnapshots
    .filter((row) => row.availabilityStatus !== "unknown")
    .map((row) => ({ at: row.observedAt, status: row.availabilityStatus, quantity: row.stockQuantity }))
    .filter(
      (entry, index, all) =>
        index === 0 || all[index - 1].status !== entry.status || all[index - 1].quantity !== entry.quantity,
    );

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <div>
          <CardTitle>Fiyat geçmişi</CardTitle>
          <CardDescription>
            Kaynağa göre ayrı seriler; eksik günler uydurulmaz. Sağlayıcı geçmişi yalnızca
            sağlayıcı gerçekten veriyorsa görünür.
          </CardDescription>
        </div>
        {hasData ? <ExportButton productId={productId} /> : null}
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasData ? (
          <EmptyState
            title="Henüz fiyat geçmişi yok"
            description="İlk başarılı araştırma sonrası kendi gözlemleriniz burada birikmeye başlar. Sağlayıcı geçmiş verisi sunmuyorsa grafik boş kalır; veri icat edilmez."
          />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-5" data-testid="price-stats">
              <StatBox label="İlk gözlem" value={ourStats.first ? formatMoney(ourStats.first.priceAmount, currency) : "—"} />
              <StatBox label="Son gözlem" value={ourStats.last ? formatMoney(ourStats.last.priceAmount, currency) : "—"} />
              <StatBox label="En düşük" value={ourStats.min !== undefined ? formatMoney(ourStats.min, currency) : "—"} />
              <StatBox label="En yüksek" value={ourStats.max !== undefined ? formatMoney(ourStats.max, currency) : "—"} />
              <StatBox
                label="Değişim"
                value={
                  ourStats.changePercent === undefined || ourStats.changePercent === null
                    ? "—"
                    : `%${ourStats.changePercent.toLocaleString("tr-TR")}`
                }
                icon={
                  ourStats.changePercent !== undefined && ourStats.changePercent !== null
                    ? ourStats.changePercent >= 0
                      ? TrendingUp
                      : TrendingDown
                    : undefined
                }
              />
            </div>

            <PriceHistoryChart data={chartData} currency={currency} />

            {providerHistory.length > 0 ? (
              <p className="text-xs text-text-secondary">
                Sağlayıcı geçmişi: {providerStats.count} nokta ({formatDateTime(providerHistory[0].observedAt)} —{" "}
                {formatDateTime(providerHistory[providerHistory.length - 1].observedAt)}). Bu seri sağlayıcının
                belgelenmiş geçmiş verisidir.
              </p>
            ) : null}

            {stockTimeline.length > 0 ? (
              <div>
                <p className="mb-1.5 text-sm font-semibold">Stok durum değişimleri</p>
                <ul className="space-y-1 text-xs text-text-secondary">
                  {stockTimeline.map((entry, index) => (
                    <li key={index}>
                      {formatDateTime(entry.at)} — {statusLabel(entry.status)}
                      {entry.quantity !== null ? ` (${entry.quantity} adet)` : ""}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="flex items-center gap-2">
              <Badge variant="info">Kaynak: our_snapshot</Badge>
              {providerHistory.length > 0 ? <Badge variant="neutral">Kaynak: provider_history</Badge> : null}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function ExportButton({ productId }: { productId: string }) {
  return (
    <a href={`/api/products/${productId}/price-history/export`}>
      <Button variant="secondary" size="sm">
        <Download aria-hidden />
        CSV indir
      </Button>
    </a>
  );
}

function StatBox({ label, value, icon: Icon }: { label: string; value: string; icon?: typeof TrendingUp }) {
  return (
    <div className="rounded-lg border border-border-subtle bg-surface-subtle px-3 py-2">
      <p className="text-[11px] text-text-secondary">{label}</p>
      <p className="flex items-center gap-1 text-sm font-semibold tabular-nums">
        {Icon ? <Icon className="size-3.5" aria-hidden /> : null}
        {value}
      </p>
    </div>
  );
}

function statusLabel(status: string): string {
  switch (status) {
    case "in_stock":
      return "Stokta";
    case "limited_stock":
      return "Az stok";
    case "out_of_stock":
      return "Stokta yok";
    case "preorder":
      return "Ön sipariş";
    default:
      return "Bilinmiyor";
  }
}

function buildChartData(ours: PriceObservation[], history: PriceObservation[]): HistoryChartPoint[] {
  const map = new Map<string, HistoryChartPoint>();
  for (const row of ours) {
    const key = row.observedAt.toISOString();
    map.set(key, { observedAt: key, ourPrice: Number(row.priceAmount), providerPrice: null });
  }
  for (const row of history) {
    const key = row.observedAt.toISOString();
    const existing = map.get(key);
    if (existing) {
      existing.providerPrice = Number(row.priceAmount);
    } else {
      map.set(key, { observedAt: key, ourPrice: null, providerPrice: Number(row.priceAmount) });
    }
  }
  return [...map.values()].sort((a, b) => a.observedAt.localeCompare(b.observedAt));
}
