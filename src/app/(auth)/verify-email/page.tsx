"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { MailCheck, ShieldX } from "lucide-react";
import { Suspense, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

function VerifyEmailInner() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [state, setState] = useState<"loading" | "ok" | "invalid">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setState("invalid");
      setMessage("Doğrulama belirteci bulunamadı. Bağlantının tamamını kullandığınızdan emin olun.");
      return;
    }
    void (async () => {
      try {
        const response = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const body = await response.json();
        if (!response.ok) {
          setState("invalid");
          setMessage(body?.error?.message ?? "Doğrulama başarısız.");
          return;
        }
        setState("ok");
      } catch {
        setState("invalid");
        setMessage("Sunucuya ulaşılamadı.");
      }
    })();
  }, [token]);

  return (
    <div className="w-full max-w-sm space-y-4" data-testid="verify-email-result">
      {state === "loading" ? (
        <div className="rounded-xl border border-border-subtle bg-surface p-5 text-sm text-text-secondary">
          E-posta adresiniz doğrulanıyor…
        </div>
      ) : state === "ok" ? (
        <div className="space-y-4">
          <div className="space-y-1">
            <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
              <MailCheck className="size-5 text-status-success" aria-hidden />
              E-posta adresin doğrulandı
            </h1>
            <p className="text-sm text-text-secondary">
              Hesabın aktif. Artık paneline giriş yapabilirsin.
            </p>
          </div>
          <Button asChild className="w-full">
            <Link href="/login">Giriş yap →</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-1">
            <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
              <ShieldX className="size-5 text-status-danger" aria-hidden />
              Doğrulama başarısız
            </h1>
            <p className="text-sm text-text-secondary">{message}</p>
          </div>
          <Button asChild variant="secondary" className="w-full">
            <Link href="/register">Yeni kayıt denemesi</Link>
          </Button>
        </div>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailInner />
    </Suspense>
  );
}
