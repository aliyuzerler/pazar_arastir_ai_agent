import { ArrowLeft, Pencil } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/feedback/empty-state";
import { formatDateTime, formatMoney } from "@/lib/format";
import { ProductArchiveButton } from "@/features/products/product-archive-button";
import { ResearchLauncher } from "@/features/research/research-launcher";
import { PriceHistorySection } from "@/features/pricing/price-history-section";
import { PricingPanel } from "@/features/pricing/pricing-panel";
import { resolvePricingProfile } from "@/server/application/pricing-service";
import { listObservations } from "@/server/application/price-history-service";
import { computePriceStats, type PricePoint } from "@/server/domain/price-history";
import Decimal from "decimal.js";
import { getDb } from "@/server/db/driver";
import { getProduct } from "@/server/db/repositories/product-repository";
import { resolveWorkspaceContext } from "@/server/security/workspace-context";

export const dynamic = "force-dynamic";

interface ProductDetailPageProps {
  params: Promise<{ productId: string }>;
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { productId } = await params;
  const workspace = await resolveWorkspaceContext();
  const db = getDb();
  const product = await getProduct(db, workspace.id, productId);

  if (!product) notFound();

  const series = await listObservations(db, workspace.id, product.id);
  const toPoints = (rows: typeof series.ourSnapshots): PricePoint[] =>
    rows.map((row) => ({
      observedAt: row.observedAt.toISOString(),
      priceAmount: row.priceAmount,
      currency: row.currency,
      availabilityStatus: row.availabilityStatus,
      stockQuantity: row.stockQuantity,
    }));
  const ourStats = computePriceStats(toPoints(series.ourSnapshots));
  const providerStats = computePriceStats(toPoints(series.providerHistory));

  const costBase = Decimal.sum(
    product.unitCost,
    product.inboundShippingPerUnit,
    product.packagingCost,
    product.otherFixedCost,
  );
  const profile = await resolvePricingProfile(db, workspace.id, product);

  const facts: { label: string; value: string }[] = [
    { label: "Marka", value: product.brand ?? "Bilgi yok" },
    { label: "Model", value: product.model ?? "Bilgi yok" },
    { label: "MPN", value: product.mpn ?? "Bilgi yok" },
    { label: "GTIN (orijinal)", value: product.gtin ?? "Bilgi yok" },
    { label: "GTIN (normalize)", value: product.gtinNormalized ?? "Bilgi yok" },
    { label: "SKU", value: product.sku ?? "Bilgi yok" },
    { label: "Kategori", value: product.category ?? "Bilgi yok" },
  ];

  const costs: { label: string; value: string }[] = [
    { label: "Birim alış maliyeti", value: formatMoney(product.unitCost, product.currency) },
    {
      label: "Giriş kargo / birim",
      value: formatMoney(product.inboundShippingPerUnit, product.currency),
    },
    { label: "Paketleme", value: formatMoney(product.packagingCost, product.currency) },
    { label: "Diğer sabit maliyet", value: formatMoney(product.otherFixedCost, product.currency) },
  ];

  return (
    <section aria-labelledby="product-title" className="space-y-4">
      <Link href="/products" className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden />
        Ürünlere dön
      </Link>

      <header className="flex flex-wrap items-start gap-3">
        <div className="min-w-0">
          <h1 id="product-title" className="text-2xl font-semibold tracking-tight">
            {product.title}
          </h1>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-text-secondary">
            <span>{formatDateTime(product.createdAt)} tarihinde eklendi</span>
            {product.archivedAt ? (
              <Badge variant="warning">Arşivlendi</Badge>
            ) : (
              <Badge variant="success">Aktif</Badge>
            )}
          </p>
        </div>
        <div className="ml-auto flex gap-2">
          <Link href={`/products/${product.id}/edit`}>
            <Button variant="secondary">
              <Pencil aria-hidden />
              Düzenle
            </Button>
          </Link>
          <ProductArchiveButton productId={product.id} archived={Boolean(product.archivedAt)} />
        </div>
      </header>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Ürün bilgileri</CardTitle>
            <CardDescription>GTIN normalize edilir; orijinal değer korunur.</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              {facts.map((fact) => (
                <div key={fact.label}>
                  <dt className="text-xs text-text-secondary">{fact.label}</dt>
                  <dd className="font-medium" data-testid={fact.label.startsWith("GTIN (n") ? "gtin-normalized" : undefined}>
                    {fact.value}
                  </dd>
                </div>
              ))}
            </dl>
            {product.productUrl ? (
              <p className="mt-3 text-sm">
                <a
                  href={product.productUrl}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="text-status-info hover:underline"
                >
                  Ürün sayfası (yeni sekmede açılır)
                </a>
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Maliyet girdileri</CardTitle>
            <CardDescription>
              Fiyat önerileri bu girdiler + onaylı piyasa teklifleriyle hesaplanır.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              {costs.map((cost) => (
                <div key={cost.label}>
                  <dt className="text-xs text-text-secondary">{cost.label}</dt>
                  <dd className="font-medium tabular-nums">{cost.value}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>Piyasa araştırması</CardTitle>
            <CardDescription>
              DemoProvider anahtarsız çalışır; sonuçlar DEMO etiketli gelir.
            </CardDescription>
          </div>
          {product.archivedAt ? null : <ResearchLauncher productId={product.id} />}
        </CardHeader>
        <CardContent>
          <EmptyState
            title="Bu ürün için henüz araştırma yapılmadı"
            description="“Piyasayı Araştır” ile birebir ürün ve muadil teklifleri toplanır; eşleşmeleri onaylayıp fiyat analizine temel oluşturursunuz."
          />
        </CardContent>
      </Card>

      <PriceHistorySection
        productId={product.id}
        currency={product.currency}
        ourSnapshots={series.ourSnapshots}
        providerHistory={series.providerHistory}
        ourStats={ourStats}
        providerStats={providerStats}
      />

      <Card>
        <CardHeader>
          <CardTitle>Fiyat analizi</CardTitle>
          <CardDescription>
            Başa baş fiyat, hedef marj ve 3 strateji önerisi; onaylı exact tekliflere dayanır.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PricingPanel
            productId={product.id}
            currency={product.currency}
            costBase={costBase.toFixed(2)}
            hasProfile={Boolean(profile)}
          />
        </CardContent>
      </Card>
    </section>
  );
}
