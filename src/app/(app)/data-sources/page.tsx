import { Database, ShieldCheck } from "lucide-react";

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
import { getProviderStatuses } from "@/server/providers/registry";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, { label: string; variant: "success" | "warning" | "neutral" | "info" }> = {
  ready: { label: "Hazır", variant: "success" },
  not_configured: { label: "Kurulmadı", variant: "neutral" },
  disabled: { label: "Devre dışı", variant: "warning" },
  running: { label: "Çalışıyor", variant: "info" },
  rate_limited: { label: "Hız limiti", variant: "warning" },
  temporary_error: { label: "Geçici hata", variant: "warning" },
  authentication_error: { label: "Kimlik doğrulama hatası", variant: "warning" },
};

const CAPABILITY_LABELS: Record<string, string> = {
  keywordSearch: "Anahtar kelime",
  gtinSearch: "GTIN arama",
  mpnSearch: "MPN arama",
  productDetails: "Detay çekme",
  stockStatus: "Stok durumu",
  stockQuantity: "Stok adedi",
  shippingPrice: "Kargo fiyatı",
  historicalPrices: "Geçmiş fiyat",
  sellerOffers: "Satıcı teklifleri",
};

export default function DataSourcesPage() {
  const providers = getProviderStatuses();

  return (
    <section aria-labelledby="sources-title" className="space-y-4">
      <header>
        <h1 id="sources-title" className="text-2xl font-semibold tracking-tight">
          Veri Kaynakları
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Anahtarlar yalnızca sunucu ortam değişkenlerinden okunur; bu ekranda
          gösterilmez ve istemciye gönderilmez.
        </p>
      </header>

      <div className="rounded-xl border border-border-subtle bg-surface">
        <TableWrapper>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sağlayıcı</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead className="hidden md:table-cell">Gerekli ortam değişkenleri</TableHead>
                <TableHead className="hidden lg:table-cell">Kapsam</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {providers.map((provider) => {
                const status = STATUS_LABELS[provider.status] ?? STATUS_LABELS.not_configured;
                return (
                  <TableRow key={provider.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Database className="size-4 text-text-secondary" aria-hidden />
                        <div>
                          <p className="font-medium">{provider.displayName}</p>
                          <p className="text-xs text-text-secondary">
                            {provider.isDemo ? "Demo veri sağlayıcı" : "Canlı veri sağlayıcı"}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={status.variant}>
                        <ShieldCheck aria-hidden />
                        {status.label}
                      </Badge>
                      {provider.isDemo ? (
                        <Badge variant="demo" className="ml-1.5">
                          DEMO
                        </Badge>
                      ) : null}
                    </TableCell>
                    <TableCell className="hidden font-mono text-xs text-text-secondary md:table-cell">
                      {provider.requiredEnvVars.length > 0
                        ? provider.requiredEnvVars.join(", ")
                        : "—"}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(provider.capabilities)
                          .filter(([key, value]) => key !== "marketplaces" && key !== "countries" && value === true)
                          .map(([key]) => (
                            <Badge key={key} variant="neutral">
                              {CAPABILITY_LABELS[key] ?? key}
                            </Badge>
                          ))}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableWrapper>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Kapsam ve sorumluluk</CardTitle>
          <CardDescription>
            “Tüm pazar tarandı” iddiası yapılmaz; her sonuç kaynağına ve
            son kontrol zamanına bağlanır.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm leading-relaxed text-text-secondary">
          <p>
            DemoProvider sabit fixture verisiyle çalışır ve her ekranda DEMO etiketiyle
            işaretlenir. DataForSEO Google Shopping adaptörü, anahtar tanımlandığında
            canlı arama için hazır hale gelir; anahtar yoksa hiçbir canlı çağrı yapılmaz.
          </p>
          <p>
            Yetkisiz scraping, bot koruması atlatma ve gizli API taklidi bu projede
            bilinçli olarak uygulanmaz (docs/04 §7).
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
