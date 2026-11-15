"use client";

import { Loader2, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";

interface ResearchLauncherProps {
  productId: string;
}

/** Ürün detayından araştırma başlatır; sonuç sayfasına yönlendirir. */
export function ResearchLauncher({ productId }: ResearchLauncherProps) {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setRunning(true);
    setError(null);
    try {
      const response = await fetch("/api/research", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          productId,
          idempotencyKey: crypto.randomUUID(),
        }),
      });
      const body = await response.json();
      if (!response.ok) {
        setError(body?.error?.message ?? "Araştırma başlatılamadı.");
        return;
      }
      router.push(`/research/${body.data.run.id}`);
      router.refresh();
    } catch {
      setError("Sunucuya ulaşılamadı.");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button onClick={start} disabled={running}>
        {running ? <Loader2 className="animate-spin" aria-hidden /> : <Search aria-hidden />}
        {running ? "Araştırılıyor…" : "Piyasayı Araştır"}
      </Button>
      {error ? (
        <p role="alert" className="text-xs text-status-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
