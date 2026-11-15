import { Search, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { EmptyState } from "@/components/feedback/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableWrapper,
} from "@/components/ui/table";
import { MatchReviewButtons } from "@/features/research/match-review-buttons";
import { formatDateTime, formatMoney } from "@/lib/format";
import { getDb } from "@/server/db/driver";
import { getProduct } from "@/server/db/repositories/product-repository";
import {
  listMatchesWithOffers,
  type MatchWithOffer,
} from "@/server/db/repositories/offer-repository";
import { getResearchRun } from "@/server/application/research-orchestrator";
import { resolveWorkspaceContext } from "@/server/security/workspace-context";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, { label: string; variant: "success" | "warning" | "danger" | "info" }> = {
  completed: { label: "Tamamlandı", variant: "success" },
  partial: { label: "Kısmi sonuç", variant: "warning" },
  failed: { label: "Başarısız", variant: "danger" },
  running: { label: "Çalışıyor", variant: "info" },
  queued: { label: "Kuyrukta", variant: "info" },
  cancelled: { label: "İptal edildi", variant: "warning" },
};

const MATCH_TYPE_LABELS: Record<string, { label: string; variant: "success" | "info" | "warning" | "neutral" }> = {
  exact: { label: "Birebir aynı", variant: "success" },
  likely_exact: { label: "Muhtemel birebir", variant: "info" },
  substitute: { label: "Muadil", variant: "warning" },
  unreviewed: { label: "İncelenmeli", variant: "neutral" },
  rejected: { label: "Reddedildi", variant: "neutral" },
};

function OfferRow({ match, showReview }: { match: MatchWithOffer; showReview: boolean }) {
  const { match: m, offer } = match;
  const type = MATCH_TYPE_LABELS[m.matchType] ?? MATCH_TYPE_LABELS.unreviewed;
  const freshness = new Date(offer.lastObservedAt);
  const ageHours = (Date.now() - freshness.getTime()) / 3_600_000;
  const stale = ageHours > 48;

  return (
    <TableRow data-testid={`offer-row-${offer.id}`}>
      <TableCell>
        <p className="font-medium">{offer.title}</p>
        <p className="text-xs text-text-secondary">
          {[offer.brand, offer.model, offer.mpn].filter(Boolean).join(" · ") || "—"}
          {Object.entries(offer.variantAttributes ?? {}).map(([key, value]) => ` · ${key}: ${value}`)}
        </p>
        <p className="mt-1 flex flex-wrap items-center gap-1.5">
          {m.matchReasons.length > 0 ? (
            <span className="text-[11px] text-text-secondary">Gerekçe: {m.matchReasons.join("; ")}</span>
          ) : null}
          {m.differences.length > 0 ? (
            <span className="text-[11px] text-status-warning">Fark: {m.differences.join("; ")}</span>
          ) : null}
        </p>
      </TableCell>
      <TableCell>
        <Badge variant={type.variant}>{type.label}</Badge>
        <p className="mt-1 text-[11px] tabular-nums text-text-secondary">Skor {Number(m.matchScore)}</p>
      </TableCell>
      <TableCell>
        <p className="font-medium tabular-nums">{formatMoney(offer.priceAmount, offer.currency)}</p>
        <p className="text-[11px] text-text-secondary">
          Kargo: {offer.shippingAmount === null ? "Bilgi yok" : formatMoney(offer.shippingAmount, offer.currency)}
        </p>
      </TableCell>
      <TableCell>
        <p>{offer.sellerName}</p>
        <p className="text-[11px] text-text-secondary">{offer.marketplace ?? "—"}</p>
      </TableCell>
      <TableCell>
        <p>
          {offer.stockQuantity !== null
            ? `${offer.stockQuantity} adet`
            : offer.availabilityStatus === "unknown"
              ? "Bilinmiyor"
              : "—"}
        </p>
        <p className="text-[11px] text-text-secondary">
          {offer.availabilityStatus === "in_stock"
            ? "Stokta"
            : offer.availabilityStatus === "limited_stock"
              ? "Az stok"
              : offer.availabilityStatus === "out_of_stock"
                ? "Stokta yok"
                : offer.availabilityStatus === "preorder"
                  ? "Ön sipariş"
                  : "Bilgi yok"}
        </p>
      </TableCell>
      <TableCell>
        <p className={stale ? "text-status-warning" : undefined}>{formatDateTime(offer.lastObservedAt)}</p>
        {stale ? <p className="text-[11px] text-status-warning">Güncel olmayabilir</p> : null}
        <p className="mt-0.5 flex items-center gap-1.5">
          <Badge variant="demo">DEMO</Badge>
          <a
            href={offer.productUrl}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="text-xs text-status-info hover:underline"
          >
            Kaynağa git
          </a>
        </p>
      </TableCell>
      {showReview ? (
        <TableCell className="text-right">
          <MatchReviewButtons matchId={m.id} reviewStatus={m.reviewStatus} />
        </TableCell>
      ) : null}
    </TableRow>
  );
}

interface ResearchResultPageProps {
  params: Promise<{ researchId: string }>;
}

export default async function ResearchResultPage({ params }: ResearchResultPageProps) {
  const { researchId } = await params;
  const workspace = await resolveWorkspaceContext();
  const db = getDb();
  const run = await getResearchRun(db, workspace.id, researchId);
  if (!run) notFound();

  const product = await getProduct(db, workspace.id, run.productId);
  if (!product) notFound();

  const matches = await listMatchesWithOffers(db, workspace.id, product.id);
  const exactMatches = matches.filter(
    (entry) => entry.match.matchType === "exact" || entry.match.matchType === "likely_exact",
  );
  const substitutes = matches.filter(
    (entry) => entry.match.matchType === "substitute" && entry.match.reviewStatus !== "rejected",
  );
  const allOffers = matches;
  const status = STATUS_LABELS[run.status] ?? STATUS_LABELS.running;

  return (
    <section aria-labelledby="research-title" className="space-y-4">
      <Link href={`/products/${product.id}`} className="text-sm text-text-secondary hover:text-foreground">
        ← {product.title}
      </Link>

      <header className="flex flex-wrap items-start gap-3">
        <div>
          <h1 id="research-title" className="text-2xl font-semibold tracking-tight">
            Araştırma Sonucu
          </h1>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-text-secondary">
            <span>{product.title}</span>
            <Badge variant={status.variant}>{status.label}</Badge>
            <Badge variant="demo">DEMO MOD</Badge>
          </p>
          <p className="mt-1 text-xs text-text-secondary">
            {run.totalResults} teklif · {run.exactCount} birebir · {run.substituteCount} muadil ·
            Koşu: {formatDateTime(run.createdAt)}
          </p>
        </div>
      </header>

      {run.providerErrors.length > 0 ? (
        <div role="alert" className="rounded-xl border border-status-warning/40 bg-status-warning/5 p-4">
          <p className="flex items-center gap-2 text-sm font-medium text-status-warning">
            <TriangleAlert className="size-4" aria-hidden />
            Kısmi sonuç: {run.providerErrors.length} kaynak yanıt vermedi, diğer kaynaklar korundu.
          </p>
          <ul className="mt-2 space-y-1 text-xs text-text-secondary">
            {run.providerErrors.map((error) => (
              <li key={error.providerId}>
                {error.providerId} — {error.message}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Sorgu planı</CardTitle>
          <CardDescription>
            Araştırma şu sorgu varyantlarıyla yapıldı; kapsam sağlayıcıya bağlıdır.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-1.5">
          {run.queryPlan.map((query) => (
            <Badge key={query} variant="neutral" className="font-mono">
              {query}
            </Badge>
          ))}
        </CardContent>
      </Card>

      {matches.length === 0 ? (
        <EmptyState
          icon={Search}
          title="Sonuç bulunamadı"
          description="Sağlayıcı bu ürün için teklif döndürmedi. Sorgu planını genişletip yeniden deneyebilirsiniz."
        />
      ) : (
        <Tabs defaultValue="exact">
          <TabsList>
            <TabsTrigger value="exact" count={exactMatches.length}>
              Birebir aynı
            </TabsTrigger>
            <TabsTrigger value="substitutes" count={substitutes.length}>
              Muadiller
            </TabsTrigger>
            <TabsTrigger value="all" count={allOffers.length}>
              Tüm teklifler
            </TabsTrigger>
          </TabsList>

          <TabsContent value="exact">
            {exactMatches.length === 0 ? (
              <EmptyState
                title="Birebir eşleşme yok"
                description="GTIN/MPN kanıtıyla birebir teklif bulunamadı. Muadil sekmesini kontrol edin."
              />
            ) : (
              <OfferTable matches={exactMatches} showReview />
            )}
          </TabsContent>

          <TabsContent value="substitutes">
            {substitutes.length === 0 ? (
              <EmptyState
                title="Muadil önerisi yok"
                description="Aynı ihtiyacı karşılayan alternatif ürün bu koşuda bulunamadı."
              />
            ) : (
              <OfferTable matches={substitutes} showReview />
            )}
          </TabsContent>

          <TabsContent value="all">
            <OfferTable matches={allOffers} showReview={false} />
          </TabsContent>
        </Tabs>
      )}
    </section>
  );
}

function OfferTable({ matches, showReview }: { matches: MatchWithOffer[]; showReview: boolean }) {
  return (
    <div className="rounded-xl border border-border-subtle bg-surface">
      <TableWrapper>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Teklif</TableHead>
              <TableHead>Eşleşme</TableHead>
              <TableHead>Fiyat</TableHead>
              <TableHead className="hidden md:table-cell">Satıcı</TableHead>
              <TableHead>Stok</TableHead>
              <TableHead>Kaynak / zaman</TableHead>
              {showReview ? <TableHead className="text-right">Karar</TableHead> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {matches.map((match) => (
              <OfferRow key={match.match.id} match={match} showReview={showReview} />
            ))}
          </TableBody>
        </Table>
      </TableWrapper>
    </div>
  );
}
