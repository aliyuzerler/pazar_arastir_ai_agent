import { BarChart3, Package, Search, Sparkles } from "lucide-react";

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
  RecentResearchCard,
  ResearchCtaCard,
  SourceStatusCard,
} from "@/features/dashboard/widgets";

/**
 * Faz 1 dashboard: KPI şeridi, fiyat hareketi yer tutucusu, son araştırmalar
 * (DEMO örnek tablo) ve kaynak durum paneli. Sahte metrik üretilmez.
 */
export default function DashboardPage() {
  const kpis = [
    { label: "İzlenen ürün", value: "—", hint: "Faz 2 ile aktif", icon: Package },
    { label: "Bugünkü araştırma", value: "—", hint: "Faz 4 ile aktif", icon: Search },
    { label: "Fiyat değişimi sinyali", value: "—", hint: "Faz 7 ile aktif", icon: BarChart3 },
    { label: "Kaynak sağlığı", value: "1/4", hint: "Yalnız DemoProvider hazır", icon: Sparkles },
  ];

  return (
    <section aria-labelledby="dashboard-title" className="space-y-6">
      <header className="flex flex-wrap items-center gap-2">
        <div>
          <h1 id="dashboard-title" className="text-2xl font-semibold tracking-tight">
            Genel Bakış
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Ürün ve araştırma verisi ekranları sonraki fazlarda aktifleşiyor.
          </p>
        </div>
        <Badge variant="demo" className="ml-auto">
          DEMO MOD
        </Badge>
      </header>

      <div
        data-testid="kpi-strip"
        className="grid grid-cols-2 gap-4 xl:grid-cols-4"
        aria-label="KPI şeridi"
      >
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.label}>
              <CardContent className="flex items-center gap-3 p-4">
                <span className="flex size-9 items-center justify-center rounded-lg bg-surface-subtle text-text-secondary">
                  <Icon className="size-4" aria-hidden />
                </span>
                <div>
                  <p className="text-xs text-text-secondary">{kpi.label}</p>
                  <p className="text-lg font-semibold tabular-nums" title={kpi.hint}>
                    {kpi.value}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Fiyat hareketi grafiği</CardTitle>
            <CardDescription>
              Faz 5’te gerçek fiyat gözlemleriyle çizilecek; uydurma veri gösterilmez.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={BarChart3}
              title="Grafik verisi yok"
              description="İlk başarılı fiyat gözleminden itibaren geçmiş burada oluşacak. Eksik günler araya çizgi eklenerek doldurulmaz."
            />
          </CardContent>
        </Card>
        <SourceStatusCard />
      </div>

      <RecentResearchCard />
      <ResearchCtaCard />
    </section>
  );
}
