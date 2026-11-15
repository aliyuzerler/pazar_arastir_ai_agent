"use client";

import Link from "next/link";
import { KeyRound } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { FieldError, FieldLabel, Input } from "@/components/ui/field";

/** Parolamı unuttum: her koşulda aynı bilgilendirme; yerel modda DEMO linki. */
export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ message: string; demoResetUrl: string | null } | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setFieldErrors({});
    setError(null);
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const body = await response.json();
      if (!response.ok) {
        const details = (body?.error?.details ?? []) as { path: string; message: string }[];
        const next: Record<string, string> = {};
        for (const detail of details) {
          if (!next[detail.path]) next[detail.path] = detail.message;
        }
        setFieldErrors(next);
        setError(body?.error?.message ?? "İstek başarısız.");
        return;
      }
      setResult({ message: body.data.message, demoResetUrl: body.data.demoResetUrl ?? null });
    } catch {
      setError("Sunucuya ulaşılamadı.");
    } finally {
      setBusy(false);
    }
  }

  if (result) {
    return (
      <div className="w-full max-w-sm space-y-4" data-testid="forgot-result">
        <div className="space-y-1">
          <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
            <KeyRound className="size-5" aria-hidden />
            İstek alındı
          </h1>
          <p className="text-sm text-text-secondary">{result.message}</p>
        </div>
        {result.demoResetUrl ? (
          <div className="rounded-xl border border-status-info/40 bg-status-info/5 p-4 text-xs" data-testid="demo-reset">
            <p className="mb-1.5 font-semibold">DEMO MOD</p>
            <p className="mb-2 text-text-secondary">Gerçek e-posta gönderilmedi; sıfırlama bağlantısı:</p>
            <Link href={result.demoResetUrl.replace(/^https?:\/\/[^/]+/, "")} className="font-medium underline">
              Parolamı sıfırla →
            </Link>
          </div>
        ) : null}
        <Button asChild variant="secondary" className="w-full">
          <Link href="/login">Giriş ekranına dön</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm space-y-4">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Parolamı unuttum</h1>
        <p className="text-sm text-text-secondary">
          Kayıtlı e-posta adresine tek kullanımlık sıfırlama bağlantısı gönderilir.
        </p>
      </div>
      <form onSubmit={submit} className="space-y-3 rounded-xl border border-border-subtle bg-surface p-5" noValidate>
        <div>
          <FieldLabel htmlFor="email">E-posta</FieldLabel>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={Boolean(fieldErrors.email)}
            required
          />
          <FieldError id="email-error">{fieldErrors.email}</FieldError>
        </div>
        {error ? (
          <p role="alert" className="rounded-lg border border-status-danger/30 bg-status-danger/5 px-3 py-2 text-xs text-status-danger">
            {error}
          </p>
        ) : null}
        <Button type="submit" disabled={busy} className="w-full">
          {busy ? "Gönderiliyor…" : "Sıfırlama bağlantısı gönder"}
        </Button>
      </form>
      <p className="text-xs text-text-secondary">
        Hesabını hatırladın mı?{" "}
        <Link href="/login" className="hover:text-foreground">
          Giriş yap →
        </Link>
      </p>
    </div>
  );
}
