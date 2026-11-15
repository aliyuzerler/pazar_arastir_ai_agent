"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { FieldError, FieldLabel, Input, Select, Textarea } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Product, ProductAttribute } from "@/server/db/schema";

const CURRENCIES = ["TRY", "USD", "EUR", "GBP"] as const;

interface ProductFormProps {
  initial?: Product;
}

interface FormState {
  title: string;
  sku: string;
  brand: string;
  model: string;
  mpn: string;
  gtin: string;
  category: string;
  description: string;
  productUrl: string;
  imageUrl: string;
  unitCost: string;
  currency: string;
  inboundShippingPerUnit: string;
  packagingCost: string;
  otherFixedCost: string;
}

function stateFromProduct(product?: Product): FormState {
  return {
    title: product?.title ?? "",
    sku: product?.sku ?? "",
    brand: product?.brand ?? "",
    model: product?.model ?? "",
    mpn: product?.mpn ?? "",
    gtin: product?.gtin ?? "",
    category: product?.category ?? "",
    description: product?.description ?? "",
    productUrl: product?.productUrl ?? "",
    imageUrl: product?.imageUrl ?? "",
    unitCost: product ? String(Number(product.unitCost)) : "",
    currency: product?.currency ?? "TRY",
    inboundShippingPerUnit: product ? String(Number(product.inboundShippingPerUnit)) : "0",
    packagingCost: product ? String(Number(product.packagingCost)) : "0",
    otherFixedCost: product ? String(Number(product.otherFixedCost)) : "0",
  };
}

/** Ürün ekleme/düzenleme formu. Doğrulama hataları sunucudan gelir ve alan
 * altında Türkçe gösterilir (TEST_02 md-11). */
export function ProductForm({ initial }: ProductFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() => stateFromProduct(initial));
  const [attributes, setAttributes] = useState<ProductAttribute[]>(initial?.attributes ?? []);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setFieldErrors({});
    setFormError(null);

    const payload = {
      title: form.title,
      sku: form.sku,
      brand: form.brand,
      model: form.model,
      mpn: form.mpn,
      gtin: form.gtin,
      category: form.category,
      description: form.description,
      productUrl: form.productUrl,
      imageUrl: form.imageUrl,
      attributes,
      unitCost: form.unitCost,
      currency: form.currency,
      inboundShippingPerUnit: form.inboundShippingPerUnit,
      packagingCost: form.packagingCost,
      otherFixedCost: form.otherFixedCost,
    };

    try {
      const response = await fetch(initial ? `/api/products/${initial.id}` : "/api/products", {
        method: initial ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(initial ? { action: "update", fields: payload } : payload),
      });
      const body = await response.json();
      if (!response.ok) {
        const details = (body?.error?.details ?? []) as { path: string; message: string }[];
        const nextErrors: Record<string, string> = {};
        for (const detail of details) {
          const key = detail.path.split(".")[0];
          if (key && !nextErrors[key]) nextErrors[key] = detail.message;
        }
        setFieldErrors(nextErrors);
        setFormError(body?.error?.message ?? "Kayıt başarısız oldu.");
        return;
      }
      const productId = (body.data as Product).id;
      router.push(`/products/${productId}`);
      router.refresh();
    } catch {
      setFormError("Sunucuya ulaşılamadı. Bağlantınızı kontrol edin.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <Card>
        <CardHeader>
          <CardTitle>Ürün kimliği</CardTitle>
          <CardDescription>Zorunlu alanlar * ile işaretlidir.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <FieldLabel htmlFor="title" required>
              Ürün başlığı
            </FieldLabel>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              aria-invalid={Boolean(fieldErrors.title)}
              aria-describedby={fieldErrors.title ? "title-error" : undefined}
              required
            />
            <FieldError id="title-error">{fieldErrors.title}</FieldError>
          </div>
          <div>
            <FieldLabel htmlFor="sku">SKU (stok kodu)</FieldLabel>
            <Input id="sku" value={form.sku} onChange={(e) => set("sku", e.target.value)} />
          </div>
          <div>
            <FieldLabel htmlFor="gtin">GTIN / EAN / UPC</FieldLabel>
            <Input
              id="gtin"
              value={form.gtin}
              onChange={(e) => set("gtin", e.target.value)}
              placeholder="8690000000000"
              aria-invalid={Boolean(fieldErrors.gtin)}
              aria-describedby={fieldErrors.gtin ? "gtin-error" : undefined}
            />
            <FieldError id="gtin-error">{fieldErrors.gtin}</FieldError>
          </div>
          <div>
            <FieldLabel htmlFor="brand">Marka</FieldLabel>
            <Input id="brand" value={form.brand} onChange={(e) => set("brand", e.target.value)} />
          </div>
          <div>
            <FieldLabel htmlFor="model">Model</FieldLabel>
            <Input id="model" value={form.model} onChange={(e) => set("model", e.target.value)} />
          </div>
          <div>
            <FieldLabel htmlFor="mpn">MPN (üretici kodu)</FieldLabel>
            <Input id="mpn" value={form.mpn} onChange={(e) => set("mpn", e.target.value)} />
          </div>
          <div>
            <FieldLabel htmlFor="category">Kategori</FieldLabel>
            <Input
              id="category"
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
              placeholder="Elektronik / Ses Sistemleri"
            />
          </div>
          <div className="sm:col-span-2">
            <FieldLabel htmlFor="description">Açıklama</FieldLabel>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </div>
          <div>
            <FieldLabel htmlFor="productUrl">Ürün URL (https)</FieldLabel>
            <Input
              id="productUrl"
              type="url"
              value={form.productUrl}
              onChange={(e) => set("productUrl", e.target.value)}
              aria-invalid={Boolean(fieldErrors.productUrl)}
              aria-describedby={fieldErrors.productUrl ? "productUrl-error" : undefined}
            />
            <FieldError id="productUrl-error">{fieldErrors.productUrl}</FieldError>
          </div>
          <div>
            <FieldLabel htmlFor="imageUrl">Görsel URL (https)</FieldLabel>
            <Input
              id="imageUrl"
              type="url"
              value={form.imageUrl}
              onChange={(e) => set("imageUrl", e.target.value)}
              aria-invalid={Boolean(fieldErrors.imageUrl)}
              aria-describedby={fieldErrors.imageUrl ? "imageUrl-error" : undefined}
            />
            <FieldError id="imageUrl-error">{fieldErrors.imageUrl}</FieldError>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Maliyet girdileri</CardTitle>
          <CardDescription>
            Birim maliyet ve sabit giderler fiyat öneri motorunda (Faz 6) kullanılır.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <FieldLabel htmlFor="unitCost" required>
              Birim alış maliyeti
            </FieldLabel>
            <Input
              id="unitCost"
              inputMode="decimal"
              value={form.unitCost}
              onChange={(e) => set("unitCost", e.target.value)}
              placeholder="850.00"
              aria-invalid={Boolean(fieldErrors.unitCost)}
              aria-describedby={fieldErrors.unitCost ? "unitCost-error" : undefined}
              required
            />
            <FieldError id="unitCost-error">{fieldErrors.unitCost}</FieldError>
          </div>
          <div>
            <FieldLabel htmlFor="currency" required>
              Para birimi
            </FieldLabel>
            <Select
              id="currency"
              value={form.currency}
              onChange={(e) => set("currency", e.target.value)}
            >
              {CURRENCIES.map((currency) => (
                <option key={currency} value={currency}>
                  {currency}
                </option>
              ))}
            </Select>
            <FieldError id="currency-error">{fieldErrors.currency}</FieldError>
          </div>
          <div>
            <FieldLabel htmlFor="inboundShippingPerUnit">Giriş kargo / birim</FieldLabel>
            <Input
              id="inboundShippingPerUnit"
              inputMode="decimal"
              value={form.inboundShippingPerUnit}
              onChange={(e) => set("inboundShippingPerUnit", e.target.value)}
              aria-invalid={Boolean(fieldErrors.inboundShippingPerUnit)}
              aria-describedby={
                fieldErrors.inboundShippingPerUnit ? "inboundShippingPerUnit-error" : undefined
              }
            />
            <FieldError id="inboundShippingPerUnit-error">
              {fieldErrors.inboundShippingPerUnit}
            </FieldError>
          </div>
          <div>
            <FieldLabel htmlFor="packagingCost">Paketleme maliyeti</FieldLabel>
            <Input
              id="packagingCost"
              inputMode="decimal"
              value={form.packagingCost}
              onChange={(e) => set("packagingCost", e.target.value)}
            />
          </div>
          <div>
            <FieldLabel htmlFor="otherFixedCost">Diğer sabit maliyet</FieldLabel>
            <Input
              id="otherFixedCost"
              inputMode="decimal"
              value={form.otherFixedCost}
              onChange={(e) => set("otherFixedCost", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>Ürün özellikleri</CardTitle>
            <CardDescription>Renk, kapasite, paket adedi gibi varyant bilgileri.</CardDescription>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setAttributes((prev) => [...prev, { key: "", value: "" }])}
          >
            Özellik ekle
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {attributes.length === 0 ? (
            <p className="text-xs text-text-secondary">Henüz özellik eklenmedi.</p>
          ) : null}
          {attributes.map((attribute, index) => (
            <div key={index} className="flex gap-2">
              <Input
                value={attribute.key}
                placeholder="Özellik (örn. Renk)"
                aria-label={`Özellik adı ${index + 1}`}
                onChange={(e) =>
                  setAttributes((prev) =>
                    prev.map((item, i) => (i === index ? { ...item, key: e.target.value } : item)),
                  )
                }
              />
              <Input
                value={attribute.value}
                placeholder="Değer (örn. Siyah)"
                aria-label={`Özellik değeri ${index + 1}`}
                onChange={(e) =>
                  setAttributes((prev) =>
                    prev.map((item, i) => (i === index ? { ...item, value: e.target.value } : item)),
                  )
                }
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-label={`Özellik ${index + 1} kaldır`}
                onClick={() => setAttributes((prev) => prev.filter((_, i) => i !== index))}
              >
                Kaldır
              </Button>
            </div>
          ))}
          <FieldError id="attributes-error">{fieldErrors.attributes}</FieldError>
        </CardContent>
      </Card>

      {formError ? (
        <p role="alert" className="rounded-lg border border-status-danger/30 bg-status-danger/5 px-3 py-2 text-sm text-status-danger">
          {formError}
        </p>
      ) : null}

      <div className="flex gap-2">
        <Button type="submit" disabled={saving}>
          {saving ? "Kaydediliyor…" : initial ? "Değişiklikleri kaydet" : "Ürünü kaydet"}
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.back()}>
          Vazgeç
        </Button>
      </div>
    </form>
  );
}
