"use client";

import { Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

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

interface PreviewRow {
  rowNumber: number;
  status: "valid" | "error";
  errors: string[];
}

interface PreviewResponse {
  totalRows: number;
  validCount: number;
  errorCount: number;
  rows: PreviewRow[];
  missingHeaders: string[];
}

const EXAMPLE_CSV = `title,sku,brand,model,gtin,category,unit_cost,currency,inbound_shipping_per_unit,packaging_cost,other_fixed_cost
Kablosuz Kulaklık ANC Pro,SKU-001,SesMark,ANC-P,8690000000012,Elektronik,850.00,TRY,12.50,3.00,2.00
Akıllı Ev Termostatı X1,SKU-002,Evmark,X1,,,,TRY,20.00,5.00,3.00`;

/** CSV içe aktarma: önizleme → hatalar düzeltilir → kalıcı içe aktarma. */
export default function ImportProductsPage() {
  const router = useRouter();
  const [csvText, setCsvText] = useState("");
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function post(dryRun: boolean) {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const response = await fetch("/api/products/import", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ csv: csvText, dryRun }),
      });
      const body = await response.json();
      if (!response.ok) {
        setError(body?.error?.message ?? "İstek başarısız.");
        return;
      }
      if (dryRun) {
        setPreview(body.data as PreviewResponse);
      } else {
        const data = body.data as { imported: number; skipped: number; errors: string[] };
        setPreview(null);
        setResult(
          `${data.imported} ürün içe aktarıldı, ${data.skipped} satır atlandı.` +
            (data.errors.length > 0 ? ` İlk hata: ${data.errors[0]}` : ""),
        );
        router.refresh();
      }
    } catch {
      setError("Sunucuya ulaşılamadı.");
    } finally {
      setBusy(false);
    }
  }

  async function onFileSelected(file: File | undefined) {
    if (!file) return;
    if (file.size > 512 * 1024) {
      setError("Dosya 512 KB sınırını aşıyor.");
      return;
    }
    const text = await file.text();
    setCsvText(text);
    setPreview(null);
    setResult(null);
  }

  return (
    <section aria-labelledby="import-title" className="mx-auto max-w-3xl space-y-4">
      <div>
        <h1 id="import-title" className="text-2xl font-semibold tracking-tight">
          CSV ile Ürün İçe Aktar
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Yalnızca kendi ürün kataloğunuz içindir. Zorunlu başlıklar:{" "}
          <code className="font-mono text-xs">title</code>,{" "}
          <code className="font-mono text-xs">unit_cost</code>,{" "}
          <code className="font-mono text-xs">currency</code>. En fazla 500 satır / 512 KB.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>1. Dosya seçin veya yapıştırın</CardTitle>
          <CardDescription>Sütun başlıkları Türkçe/İngilizce takma adlarla eşleştirilir.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <input
            type="file"
            accept=".csv,text/csv"
            aria-label="CSV dosyası seç"
            onChange={(e) => onFileSelected(e.target.files?.[0])}
            className="block w-full text-sm text-text-secondary file:mr-3 file:rounded-lg file:border file:border-border-subtle file:bg-surface-subtle file:px-3 file:py-1.5 file:text-sm"
          />
          <textarea
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            rows={8}
            aria-label="CSV içeriği"
            placeholder={EXAMPLE_CSV}
            className="w-full rounded-lg border border-border-subtle bg-surface p-3 font-mono text-xs"
          />
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" disabled={busy || csvText.trim().length === 0} onClick={() => post(true)}>
              Önizle
            </Button>
            <Button
              disabled={busy || !preview || preview.validCount === 0}
              title={!preview || preview.validCount === 0 ? "Önce geçerli satır bekleniyor" : undefined}
              onClick={() => post(false)}
            >
              <Upload aria-hidden />
              İçe Aktar ({preview?.validCount ?? 0} geçerli satır)
            </Button>
            <Button
              variant="ghost"
              disabled={busy}
              onClick={() => {
                setCsvText(EXAMPLE_CSV);
                setPreview(null);
                setResult(null);
                setError(null);
              }}
            >
              Örnek CSV doldur
            </Button>
          </div>
          {error ? (
            <p role="alert" className="text-sm text-status-danger">
              {error}
            </p>
          ) : null}
          {result ? (
            <p role="status" className="text-sm text-status-success">
              {result}
            </p>
          ) : null}
        </CardContent>
      </Card>

      {preview ? (
        <Card>
          <CardHeader>
            <CardTitle>2. Önizleme</CardTitle>
            <CardDescription>
              {preview.totalRows} satır · {preview.validCount} geçerli · {preview.errorCount} hatalı
              {preview.missingHeaders.length > 0
                ? ` · Eksik başlık: ${preview.missingHeaders.join(", ")}`
                : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TableWrapper>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Satır</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead>Hata / bilgi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.rows.map((row) => (
                    <TableRow key={row.rowNumber}>
                      <TableCell className="tabular-nums">{row.rowNumber}</TableCell>
                      <TableCell>
                        {row.status === "valid" ? (
                          <span className="text-xs font-medium text-status-success">Geçerli</span>
                        ) : (
                          <span className="text-xs font-medium text-status-danger">Hatalı</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-text-secondary">
                        {row.status === "valid" ? "— (yukarıdaki istemle kaydedilecek)" : row.errors.join(" | ")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableWrapper>
          </CardContent>
        </Card>
      ) : null}
    </section>
  );
}
