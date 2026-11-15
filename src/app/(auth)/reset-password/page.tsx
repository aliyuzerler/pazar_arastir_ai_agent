"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { LockKeyhole } from "lucide-react";
import { Suspense, useState } from "react";

import { Button } from "@/components/ui/button";
import { FieldError, FieldLabel, Input } from "@/components/ui/field";

function ResetPasswordInner() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (password !== password2) {
      setError("Parolalar eşleşmiyor.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const body = await response.json();
      if (!response.ok) {
        setError(body?.error?.message ?? "Sıfırlama başarısız.");
        return;
      }
      setDone(true);
    } catch {
      setError("Sunucuya ulaşılamadı.");
    } finally {
      setBusy(false);
    }
  }

  if (!token) {
    return (
      <div className="w-full max-w-sm space-y-3">
        <h1 className="text-xl font-semibold tracking-tight">Geçersiz bağlantı</h1>
        <p className="text-sm text-text-secondary">
          Sıfırlama belirteci bulunamadı. Bağlantının tamamını kullandığınızdan emin olun.
        </p>
        <Button asChild variant="secondary" className="w-full">
          <Link href="/forgot-password">Yeni sıfırlama isteği</Link>
        </Button>
      </div>
    );
  }

  if (done) {
    return (
      <div className="w-full max-w-sm space-y-4" data-testid="reset-success">
        <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
          <LockKeyhole className="size-5 text-status-success" aria-hidden />
          Parolan güncellendi
        </h1>
        <p className="text-sm text-text-secondary">Yeni parolanla giriş yapabilirsin.</p>
        <Button asChild className="w-full">
          <Link href="/login">Giriş yap →</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm space-y-4">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Yeni parola</h1>
        <p className="text-sm text-text-secondary">
          En az 10 karakter; büyük harf, küçük harf ve rakam içermelidir.
        </p>
      </div>
      <form onSubmit={submit} className="space-y-3 rounded-xl border border-border-subtle bg-surface p-5" noValidate>
        <div>
          <FieldLabel htmlFor="password">Yeni parola</FieldLabel>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div>
          <FieldLabel htmlFor="password2">Yeni parola (tekrar)</FieldLabel>
          <Input
            id="password2"
            type="password"
            autoComplete="new-password"
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
            required
          />
        </div>
        {error ? (
          <p role="alert" className="rounded-lg border border-status-danger/30 bg-status-danger/5 px-3 py-2 text-xs text-status-danger">
            {error}
          </p>
        ) : null}
        <Button type="submit" disabled={busy} className="w-full">
          {busy ? "Kaydediliyor…" : "Parolayı güncelle"}
        </Button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordInner />
    </Suspense>
  );
}
