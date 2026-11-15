"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserPlus, MailCheck } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { FieldError, FieldLabel, Input } from "@/components/ui/field";

/** Kayıt formu: başarıda doğrulama adımına yönlendirir. Yerel modda
 *  doğrulama bağlantısı DEMO etiketiyle gösterilir. */
export function RegisterForm() {
  const router = useRouter();
  const [form, setForm] = useState({ displayName: "", email: "", password: "" });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ email: string; demoVerificationUrl: string | null } | null>(null);

  function set(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setFieldErrors({});
    setError(null);
    try {
      const response = await fetch("/api/auth/register", {
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
        setFieldErrors(next);
        setError(body?.error?.message ?? "Kayıt başarısız.");
        return;
      }
      setDone({ email: form.email, demoVerificationUrl: body.data.demoVerificationUrl ?? null });
    } catch {
      setError("Sunucuya ulaşılamadı.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="w-full max-w-sm space-y-4" data-testid="register-success">
        <div className="space-y-1">
          <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
            <MailCheck className="size-5 text-status-success" aria-hidden />
            E-postanı kontrol et
          </h1>
          <p className="text-sm text-text-secondary">
            <strong>{done.email}</strong> adresine doğrulama bağlantısı gönderildi. Giriş yapmadan önce
            adresini doğrulaman gerekir.
          </p>
        </div>
        {done.demoVerificationUrl ? (
          <div className="rounded-xl border border-status-info/40 bg-status-info/5 p-4 text-xs" data-testid="demo-verification">
            <p className="mb-1.5 font-semibold">DEMO MOD</p>
            <p className="mb-2 text-text-secondary">
              Gerçek e-posta gönderimi yapılmadı; yerel modda bağlantı aşağıdadır.
            </p>
            <Link href={done.demoVerificationUrl.replace(/^https?:\/\/[^/]+/, "")} className="font-medium underline">
              Doğrulama bağlantısını aç →
            </Link>
          </div>
        ) : null}
        <Button variant="secondary" className="w-full" onClick={() => router.push("/login")}>
          Giriş ekranına dön
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm space-y-4">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Hesap oluştur</h1>
        <p className="text-sm text-text-secondary">Kayıtla birlikte kendi çalışma alanın açılır.</p>
      </div>

      <form onSubmit={submit} className="space-y-3 rounded-xl border border-border-subtle bg-surface p-5" noValidate>
        <div>
          <FieldLabel htmlFor="displayName">Ad soyad</FieldLabel>
          <Input
            id="displayName"
            value={form.displayName}
            onChange={(e) => set("displayName", e.target.value)}
            placeholder="Örn. Ali Yüzlerler"
            aria-invalid={Boolean(fieldErrors.displayName)}
            required
          />
          <FieldError id="displayName-error">{fieldErrors.displayName}</FieldError>
        </div>
        <div>
          <FieldLabel htmlFor="email">E-posta</FieldLabel>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
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
            autoComplete="new-password"
            value={form.password}
            onChange={(e) => set("password", e.target.value)}
            aria-invalid={Boolean(fieldErrors.password)}
            aria-describedby="password-hint"
            required
          />
          <p id="password-hint" className="mt-1 text-[11px] text-text-secondary">
            En az 10 karakter; büyük harf, küçük harf ve rakam içermelidir.
          </p>
          <FieldError id="password-error">{fieldErrors.password}</FieldError>
        </div>
        {error ? (
          <p role="alert" className="rounded-lg border border-status-danger/30 bg-status-danger/5 px-3 py-2 text-xs text-status-danger">
            {error}
          </p>
        ) : null}
        <Button type="submit" disabled={busy} className="w-full">
          <UserPlus aria-hidden />
          {busy ? "Kayıt oluşturuluyor…" : "Hesap oluştur"}
        </Button>
      </form>

      <p className="text-xs text-text-secondary">
        Hesabın var mı?{" "}
        <Link href="/login" className="hover:text-foreground">
          Giriş yap →
        </Link>
      </p>
    </div>
  );
}
