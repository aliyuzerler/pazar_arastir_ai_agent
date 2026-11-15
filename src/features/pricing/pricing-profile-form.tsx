"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { FieldError, FieldLabel, Input, Select } from "@/components/ui/field";

/**
 * Fiyatlandırma profili formu. Oranlar 0-1 aralığında ondalık girilir
 * (örn. 0.15 = %15); vergi modu ve komisyon tabanı açık yapılandırmadır.
 */
export function PricingProfileForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    marketplaceFeeRate: "0.15",
    paymentFeeRate: "0.03",
    otherVariableFeeRate: "0.00",
    targetMarginRate: "0.20",
    fixedPerOrderCost: "10.00",
    taxMode: "not_modelled",
    commissionBase: "gross_price",
    currency: "TRY",
    isDefault: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function set(key: keyof typeof form, value: string | boolean) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setErrors({});
    setFormError(null);
    try {
      const response = await fetch("/api/pricing-profiles", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      const body = await response.json();
      if (!response.ok) {
        const details = (body?.error?.details ?? []) as { path: string; message: string }[];
        const next: Record<string, string> = {};
        for (const detail of details) {
          if (!next[detail.path]) next[detail.path] = detail.message;
        }
        setErrors(next);
        setFormError(body?.error?.message ?? "Kayıt başarısız.");
        return;
      }
      router.refresh();
    } catch {
      setFormError("Sunucuya ulaşılamadı.");
    } finally {
      setSaving(false);
    }
  }

  const rateField = (key: "marketplaceFeeRate" | "paymentFeeRate" | "otherVariableFeeRate" | "targetMarginRate", label: string) => (
    <div>
      <FieldLabel htmlFor={key}>{label}</FieldLabel>
      <Input
        id={key}
        inputMode="decimal"
        value={form[key] as string}
        onChange={(e) => set(key, e.target.value)}
        aria-invalid={Boolean(errors[key])}
        aria-describedby={errors[key] ? `${key}-error` : undefined}
      />
      <FieldError id={`${key}-error`}>{errors[key]}</FieldError>
    </div>
  );

  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2" noValidate>
      <div className="sm:col-span-2">
        <FieldLabel htmlFor="profile-name">Profil adı</FieldLabel>
        <Input
          id="profile-name"
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="Örn. Pazaryeri Standart"
          aria-invalid={Boolean(errors.name)}
          required
        />
        <FieldError id="name-error">{errors.name}</FieldError>
      </div>
      {rateField("marketplaceFeeRate", "Pazaryeri komisyonu (0-1, ör. 0.15)")}
      {rateField("paymentFeeRate", "Ödeme komisyonu (0-1)")}
      {rateField("otherVariableFeeRate", "Diğer değişken kesinti (0-1)")}
      {rateField("targetMarginRate", "Hedef katkı marjı (0-1)")}
      <div>
        <FieldLabel htmlFor="fixedPerOrderCost">Sipariş başına sabit maliyet</FieldLabel>
        <Input
          id="fixedPerOrderCost"
          inputMode="decimal"
          value={form.fixedPerOrderCost}
          onChange={(e) => set("fixedPerOrderCost", e.target.value)}
        />
        <FieldError id="fixedPerOrderCost-error">{errors.fixedPerOrderCost}</FieldError>
      </div>
      <div>
        <FieldLabel htmlFor="taxMode">Vergi modu</FieldLabel>
        <Select id="taxMode" value={form.taxMode} onChange={(e) => set("taxMode", e.target.value)}>
          <option value="not_modelled">Modellemede yok</option>
          <option value="inclusive">Fiyata dahil</option>
          <option value="exclusive">Fiyata dahil değil</option>
        </Select>
      </div>
      <div>
        <FieldLabel htmlFor="commissionBase">Komisyon tabanı</FieldLabel>
        <Select
          id="commissionBase"
          value={form.commissionBase}
          onChange={(e) => set("commissionBase", e.target.value)}
        >
          <option value="gross_price">Brüt fiyat</option>
          <option value="net_price">Net fiyat</option>
          <option value="custom">Özel</option>
        </Select>
      </div>
      <div>
        <FieldLabel htmlFor="profile-currency">Para birimi</FieldLabel>
        <Select id="profile-currency" value={form.currency} onChange={(e) => set("currency", e.target.value)}>
          {["TRY", "USD", "EUR", "GBP"].map((currency) => (
            <option key={currency} value={currency}>
              {currency}
            </option>
          ))}
        </Select>
      </div>
      <label className="flex items-center gap-2 text-sm sm:col-span-2">
        <input
          type="checkbox"
          checked={form.isDefault}
          onChange={(e) => set("isDefault", e.target.checked)}
          className="size-4"
        />
        Varsayılan profil olarak işaretle
      </label>
      {formError ? (
        <p role="alert" className="sm:col-span-2 text-sm text-status-danger">
          {formError}
        </p>
      ) : null}
      <div className="sm:col-span-2">
        <Button type="submit" disabled={saving}>
          {saving ? "Kaydediliyor…" : "Profili kaydet"}
        </Button>
      </div>
    </form>
  );
}
