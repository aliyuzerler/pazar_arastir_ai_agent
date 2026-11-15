"use client";

import { Calculator, Info } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/format";

interface StrategyRecommendation {
  id: string;
  strategy: string;
  recommendedPrice: string;
  breakEvenPrice: string;
  targetPrice: string;
  expectedContribution: string;
  expectedMargin: string;
  marketReferencePrice: string | null;
  confidenceScore: string;
  warnings: string[];
  explanation: string[];
  createdAt: string;
}

const STRATEGY_META: Record<string, { label: string; hint: string }> = {
  competitive: { label: "Rekabetçi", hint: "Onaylı exact tekliflerin medyanı (aykırılar hariç)" },
  balanced: { label: "Dengeli", hint: "Piyasa referansı ile hedef marj fiyatının ortası" },
  profit: { label: "Kâr Odaklı", hint: "Hedef katkı marjını yakalayan fiyat" },
};

/** Ürün fiyat paneli: hesapla + strateji kartları + formül açıklaması. */
export function PricingPanel({
  productId,
  currency,
  costBase,
  hasProfile,
}: {
  productId: string;
  currency: string;
  costBase: string;
  hasProfile: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<StrategyRecommendation[] | null>(null);
  const [showFormula, setShowFormula] = useState(false);

  async function compute() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/products/${productId}/pricing`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      });
      const body = await response.json();
      if (!response.ok) {
        setError(body?.error?.message ?? "Hesaplama başarısız.");
        return;
      }
      setRecommendations(body.data.recommendations as StrategyRecommendation[]);
      router.refresh();
    } catch {
      setError("Sunucuya ulaşılamadı.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={compute} disabled={busy || !hasProfile}>
          <Calculator aria-hidden />
          {busy ? "Hesaplanıyor…" : "Önerileri Hesapla & Kaydet"}
        </Button>
        {!hasProfile ? (
          <Badge variant="warning">Fiyatlandırma profili yok — Fiyat Analizi sayfasından ekleyin</Badge>
        ) : null}
        <Button variant="ghost" size="sm" onClick={() => setShowFormula((prev) => !prev)}>
          <Info aria-hidden />
          Formülü göster/gizle
        </Button>
      </div>

      {error ? (
        <p role="alert" className="rounded-lg border border-status-danger/30 bg-status-danger/5 px-3 py-2 text-sm text-status-danger">
          {error}
        </p>
      ) : null}

      {recommendations ? (
        <div className="grid gap-3 lg:grid-cols-3" data-testid="pricing-strategies">
          {recommendations.map((rec) => {
            const meta = STRATEGY_META[rec.strategy] ?? { label: rec.strategy, hint: "" };
            const warning = rec.warnings.length > 0;
            return (
              <div
                key={rec.id}
                data-testid={`strategy-${rec.strategy}`}
                className={`rounded-xl border p-4 ${
                  warning ? "border-status-warning/50 bg-status-warning/5" : "border-border-subtle bg-surface"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold">{meta.label}</p>
                  <Badge variant={Number(rec.confidenceScore) >= 0.8 ? "success" : "warning"}>
                    Güven {Number(rec.confidenceScore).toFixed(2)}
                  </Badge>
                </div>
                <p className="mt-1 text-[11px] text-text-secondary">{meta.hint}</p>
                <p className="mt-2 text-2xl font-semibold tabular-nums">
                  {formatMoney(rec.recommendedPrice, currency)}
                </p>
                <dl className="mt-2 space-y-1 text-xs text-text-secondary">
                  <div className="flex justify-between">
                    <dt>Başa baş</dt>
                    <dd className="tabular-nums">{formatMoney(rec.breakEvenPrice, currency)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Beklenen katkı</dt>
                    <dd className="tabular-nums">{formatMoney(rec.expectedContribution, currency)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Katkı marjı</dt>
                    <dd className="tabular-nums">%{(Number(rec.expectedMargin) * 100).toFixed(1)}</dd>
                  </div>
                </dl>
                {rec.warnings.length > 0 ? (
                  <ul className="mt-2 space-y-1 text-[11px] text-status-warning">
                    {rec.warnings.map((warningText, index) => (
                      <li key={index}>{warningText}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}

      {showFormula && recommendations ? (
        <div className="rounded-xl border border-border-subtle bg-surface-subtle p-4 text-xs leading-relaxed text-text-secondary">
          <p className="mb-1 font-semibold text-foreground">Hesap detayı ve varsayımlar</p>
          <ul className="list-disc space-y-1 pl-4">
            {recommendations[0]?.explanation.map((line, index) => (
              <li key={index}>{line}</li>
            ))}
          </ul>
          <p className="mt-2">
            Maliyet tabanı girdisi: {formatMoney(costBase, currency)} (ürün maliyet kartından).
          </p>
        </div>
      ) : null}
    </div>
  );
}
