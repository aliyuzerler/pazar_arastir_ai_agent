"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { LogIn } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { FieldError, FieldLabel, Input } from "@/components/ui/field";

const ERROR_MESSAGES: Record<string, string> = {
  INVALID_CREDENTIALS: "E-posta veya parola hatalı.",
  EMAIL_NOT_VERIFIED: "E-posta adresiniz doğrulanmadı. Doğrulama bağlantınızı kontrol edin.",
  ACCOUNT_DISABLED: "Hesabınız devre dışı bırakılmış. Yöneticinizle görüşün.",
  RATE_LIMITED: "Çok fazla deneme; bir dakika sonra tekrar deneyin.",
};

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setFieldErrors({});
    setError(null);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const body = await response.json();
      if (!response.ok) {
        setError(ERROR_MESSAGES[body?.error?.code] ?? "Giriş başarısız.");
        return;
      }
      const next = params.get("next");
      router.push(next && next.startsWith("/") ? next : "/dashboard");
      router.refresh();
    } catch {
      setError("Sunucuya ulaşılamadı.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="w-full max-w-sm space-y-4">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Giriş yap</h1>
        <p className="text-sm text-text-secondary">Panelinize erişmek için hesabınıza giriş yapın.</p>
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
        <div>
          <FieldLabel htmlFor="password">Parola</FieldLabel>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error ? (
          <p role="alert" className="rounded-lg border border-status-danger/30 bg-status-danger/5 px-3 py-2 text-xs text-status-danger">
            {error}
          </p>
        ) : null}
        <Button type="submit" disabled={busy} className="w-full">
          <LogIn aria-hidden />
          {busy ? "Giriş yapılıyor…" : "Giriş yap"}
        </Button>
      </form>

      <div className="flex items-center justify-between text-xs text-text-secondary">
        <Link href="/forgot-password" className="hover:text-foreground">
          Parolamı unuttum
        </Link>
        <Link href="/register" className="hover:text-foreground">
          Hesap oluştur →
        </Link>
      </div>
    </div>
  );
}
