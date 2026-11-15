"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

/** Admin kullanıcı aksiyonları: rol, aktiflik, doğrulama. */
export function AdminUserActions({
  userId,
  email,
  role,
  isActive,
  emailVerified,
  isSelf,
}: {
  userId: string;
  email: string;
  role: string;
  isActive: boolean;
  emailVerified: boolean;
  isSelf: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function patch(body: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const payload = await response.json();
        setError(payload?.error?.message ?? "Güncelleme başarısız.");
        return;
      }
      router.refresh();
    } catch {
      setError("Sunucuya ulaşılamadı.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-1.5" data-testid={`user-actions-${email}`}>
      {emailVerified ? (
        <Badge variant="success">Doğrulanmış</Badge>
      ) : (
        <Button variant="secondary" size="sm" disabled={busy} onClick={() => patch({ emailVerified: true })}>
          Doğrula
        </Button>
      )}
      {role === "admin" ? (
        <Badge variant="info">Yönetici</Badge>
      ) : (
        <Button variant="secondary" size="sm" disabled={busy} onClick={() => patch({ role: "admin" })}>
          Yönetici yap
        </Button>
      )}
      {isSelf ? (
        <Badge variant="neutral">Siz</Badge>
      ) : isActive ? (
        <Button variant="ghost" size="sm" disabled={busy} onClick={() => patch({ isActive: false })}>
          Devre dışı bırak
        </Button>
      ) : (
        <Button variant="secondary" size="sm" disabled={busy} onClick={() => patch({ isActive: true })}>
          Etkinleştir
        </Button>
      )}
      {error ? (
        <p role="alert" className="basis-full text-right text-[11px] text-status-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
