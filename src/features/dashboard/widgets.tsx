import { CircleCheck, CircleMinus, CircleOff, Database, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

/**
 * Faz 1 yer tutucu verileri: tümü açıkça DEMO/ÖRNEK etiketlidir. Gerçek KPI
 * veya piyasa verisi gibi sunulmaz (AGENTS.md ürün ilkeleri).
 */
const SAMPLE_RESEARCH = [
  {
    product: "Kablosuz Kulaklık ANC Pro — ÖRNEK KAYIT",
    status: "Tamamlandı",
    statusVariant: "success" as const,
    source: "DemoProvider",
    when: "2 saat önce",
  },
  {
    product: "Akıllı Ev Termostatı X1 — ÖRNEK KAYIT",
    status: "Kısmi sonuç",
    statusVariant: "warning" as const,
    source: "DemoProvider",
    when: "Dün",
  },
  {
    product: "Portatif Projeksiyon Cihazı — ÖRNEK KAYIT",
    status: "Sonuç yok",
    statusVariant: "neutral" as const,
    source: "DemoProvider",
    when: "3 gün önce",
  },
];

const SOURCE_STATUS = [
  { name: "DemoProvider", status: "Hazır (demo veri)", ready: true },
  { name: "DataForSEO · Google Shopping", status: "Kurulmadı (anahtar yok)", ready: false },
  { name: "Keepa · Amazon", status: "Kurulmadı", ready: false },
  { name: "SerpApi", status: "Kurulmadı", ready: false },
];

export function RecentResearchCard() {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <div>
          <CardTitle>Son araştırmalar</CardTitle>
          <CardDescription>Örnek kayıtlar — Faz 4’te gerçek veriyle değişecek.</CardDescription>
        </div>
        <Badge variant="demo">DEMO VERİ</Badge>
      </CardHeader>
      <CardContent className="px-0 pb-2">
        <TableWrapper>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ürün</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead className="hidden sm:table-cell">Kaynak</TableHead>
                <TableHead className="text-right">Zaman</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {SAMPLE_RESEARCH.map((row) => (
                <TableRow key={row.product}>
                  <TableCell className="max-w-56 truncate text-sm">{row.product}</TableCell>
                  <TableCell>
                    <Badge variant={row.statusVariant}>
                      {row.statusVariant === "success" ? (
                        <CircleCheck aria-hidden />
                      ) : row.statusVariant === "warning" ? (
                        <CircleMinus aria-hidden />
                      ) : (
                        <CircleOff aria-hidden />
                      )}
                      {row.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden text-xs text-text-secondary sm:table-cell">
                    {row.source}
                  </TableCell>
                  <TableCell className="text-right text-xs text-text-secondary">{row.when}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableWrapper>
      </CardContent>
    </Card>
  );
}

export function SourceStatusCard() {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <div>
          <CardTitle>Kaynak durumları</CardTitle>
          <CardDescription>Sağlayıcı bağlantıları Faz 3’te yönetim ekranına taşınacak.</CardDescription>
        </div>
        <Database className="size-4 text-text-secondary" aria-hidden />
      </CardHeader>
      <CardContent className="space-y-2">
        {SOURCE_STATUS.map((source) => (
          <div
            key={source.name}
            className="flex items-center justify-between gap-3 rounded-lg border border-border-subtle px-3 py-2.5"
          >
            <div className="flex min-w-0 items-center gap-2.5">
              <span
                aria-hidden
                className={
                  source.ready
                    ? "size-2 shrink-0 rounded-full bg-status-success"
                    : "size-2 shrink-0 rounded-full bg-border-subtle"
                }
              />
              <p className="truncate text-sm">{source.name}</p>
            </div>
            <Badge variant={source.ready ? "success" : "neutral"}>
              {source.ready ? <CircleCheck aria-hidden /> : <CircleOff aria-hidden />}
              {source.status}
            </Badge>
          </div>
        ))}
        <p className="pt-1 text-[11px] leading-relaxed text-text-secondary">
          Gerçek sağlayıcı anahtarı tanımlanana kadar araştırmalar yalnızca DemoProvider ile
          çalışır; demo sonuçları her ekranda etiketlenir.
        </p>
      </CardContent>
    </Card>
  );
}

export function ResearchCtaCard() {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
        <Search className="size-6 text-text-secondary" aria-hidden />
        <div>
          <p className="text-sm font-semibold">İlk araştırmanızı başlatın</p>
          <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-text-secondary">
            Ürün kataloğu Faz 2’de eklenecek. O zamana kadar bu panel yer tutucu verilerle
            gezinilebilir.
          </p>
        </div>
        <Button variant="secondary" size="sm" disabled title="Faz 2 ile aktifleşecek">
          Ürünlere git
        </Button>
      </CardContent>
    </Card>
  );
}
