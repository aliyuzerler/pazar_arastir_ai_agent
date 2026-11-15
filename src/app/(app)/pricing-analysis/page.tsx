import { BarChart3, CheckCircle2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatMoney } from "@/lib/format";
import { PricingProfileForm } from "@/features/pricing/pricing-profile-form";
import { listProfiles } from "@/server/application/pricing-service";
import { getDb } from "@/server/db/driver";
import { resolveWorkspaceContext } from "@/server/security/workspace-context";

export const dynamic = "force-dynamic";

function rateLabel(rate: string): string {
  return `%${(Number(rate) * 100).toLocaleString("tr-TR", { maximumFractionDigits: 2 })}`;
}

export default async function PricingAnalysisPage() {
  const { workspace } = await resolveWorkspaceContext();
  const db = getDb();
  const profiles = await listProfiles(db, workspace.id);

  return (
    <section aria-labelledby="pricing-title" className="space-y-4">
      <header>
        <h1 id="pricing-title" className="text-2xl font-semibold tracking-tight">
          Fiyat Analizi
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Fiyatlandırma profilleri komisyon/kesinti oranlarınızı tanımlar; öneriler
          ürün detayından hesaplanır ve tamamen deterministiktir.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Fiyatlandırma profilleri</CardTitle>
            <CardDescription>
              Ürün bazlı profil bağlanmadıysa varsayılan profil kullanılır.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {profiles.length === 0 ? (
              <p className="text-sm text-text-secondary">
                Henüz profil yok. Aşağıdaki formdan ilk profilinizi oluşturun.
              </p>
            ) : (
              profiles.map((profile) => (
                <div
                  key={profile.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border-subtle px-3 py-2.5"
                >
                  <div>
                    <p className="flex items-center gap-2 text-sm font-medium">
                      {profile.name}
                      {profile.isDefault ? (
                        <Badge variant="success">
                          <CheckCircle2 aria-hidden />
                          Varsayılan
                        </Badge>
                      ) : null}
                    </p>
                    <p className="text-[11px] text-text-secondary">
                      Komisyon {rateLabel(profile.marketplaceFeeRate)} · Ödeme{" "}
                      {rateLabel(profile.paymentFeeRate)} · Diğer {rateLabel(profile.otherVariableFeeRate)} ·
                      Hedef marj {rateLabel(profile.targetMarginRate)} · Sipariş sabiti{" "}
                      {formatMoney(profile.fixedPerOrderCost, profile.currency)}
                    </p>
                  </div>
                  <Badge variant="neutral">
                    {profile.taxMode === "not_modelled" ? "Vergi: modelleme dışı" : `Vergi: ${profile.taxMode}`} ·{" "}
                    Komisyon tabanı: {profile.commissionBase}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Yeni profil</CardTitle>
              <CardDescription>
                Oranlar 0-1 aralığında ondalık girilir (0.15 = %15).
              </CardDescription>
            </div>
            <BarChart3 className="size-4 text-text-secondary" aria-hidden />
          </CardHeader>
          <CardContent>
            <PricingProfileForm />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Formüller ve varsayımlar</CardTitle>
          <CardDescription>
            Öneriler açık formüllerle üretilir; aynı girdi her zaman aynı sonucu verir.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-1.5 text-sm text-text-secondary">
          <p>
            <span className="font-medium text-foreground">C</span> (maliyet tabanı) = birim alış +
            giriş kargo/birim + paketleme + diğer sabit maliyet
          </p>
          <p>
            <span className="font-medium text-foreground">Başa baş fiyat</span> = (C + F) / (1 − r);
            r = pazaryeri + ödeme + diğer değişken kesinti, F = sipariş başına sabit maliyet
          </p>
          <p>
            <span className="font-medium text-foreground">Hedef fiyat</span> = (C + F) / (1 − r − m);
            r + m ≥ 1 ise hedef fiyat tanımsızdır ve motor hata verir
          </p>
          <p>
            <span className="font-medium text-foreground">Katkı</span> = P × (1 − r) − (C + F);
            katkı marjı = katkı / P
          </p>
          <p>
            Piyasa referansı: aykırı olmayan (IQR) onaylı exact tekliflerin medyanı; muadil
            teklifler ayrı istatistiklenir ve güven skorunu sınırlar. Vergi oranı sabitlenmez;
            vergi modu kullanıcı yapılandırmasıdır.
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
