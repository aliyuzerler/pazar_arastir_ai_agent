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

/**
 * Faz 0 dashboard iskeleti: yer tutucu KPI şeridi ve boş durum kartları.
 * Sahte KPI veya uydurma grafik gösterilmez; tüm alanlar "yakında" işaretlidir.
 */
export default function DashboardPage() {
  const kpis = [
    { label: "İzlenen ürün", value: "—", icon: Package },
    { label: "Bugünkü araştırma", value: "—", icon: Search },
    { label: "Fiyat değişimi sinyali", value: "—", icon: BarChart3 },
    { label: "Kaynak sağlığı", value: "—", icon: Sparkles },
  ];

  return (
    <section aria-labelledby="dashboard-title" className="space-y-6">
      <header className="flex flex-wrap items-center gap-2">
        <div>
          <h1 id="dashboard-title" className="text-2xl font-semibold tracking-tight">
            Genel Bakış
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Faz 0 iskeleti: altyapı çalışıyor, veri ekranları sonraki fazlarda ekleniyor.
          </p>
        </div>
        <Badge variant="demo" className="ml-auto">
          FAZ 0 · DEMO İSKELET
        </Badge>
      </header>

      <div
        data-testid="kpi-strip"
        className="grid grid-cols-2 gap-4 xl:grid-cols-4"
        aria-label="KPI şeridi (yer tutucu)"
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
                  <p className="text-lg font-semibold tabular-nums" aria-label="Veri henüz yok">
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
              description="İlk başarılı fiyat gözleminden itibaren geçmiş burada oluşacak. Henüz araştırma yapılmadı."
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Son araştırmalar</CardTitle>
            <CardDescription>Faz 4’te araştırma geçmişi tablo halinde listelenecek.</CardDescription>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={Search}
              title="Henüz araştırma yapılmadı"
              description="Ürün ekleyip “Piyasayı Araştır” çalıştırdığınızda sonuçlar burada listelenecek."
            />
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
