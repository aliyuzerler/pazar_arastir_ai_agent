"use client";

import { Play, ToggleLeft, ToggleRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/field";

/** İzleme aç/kapat + sıklık + manuel koşturma aksiyonları. */
export function MonitoringJobActions({
  productId,
  trackingEnabled,
  frequencyHours,
}: {
  productId: string;
  trackingEnabled: boolean;
  frequencyHours: number;
}) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(trackingEnabled);
  const [frequency, setFrequency] = useState(String(frequencyHours));
  const [busy, setBusy] = useState(false);

  async function update(nextEnabled: boolean, nextFrequency?: string) {
    setBusy(true);
    try {
      await fetch(`/api/monitoring/${productId}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          trackingEnabled: nextEnabled,
          frequencyHours: nextFrequency ? Number(nextFrequency) : undefined,
        }),
      });
      setEnabled(nextEnabled);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function runNow() {
    setBusy(true);
    try {
      await fetch(`/api/monitoring/${productId}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ trackingEnabled: true, frequencyHours: Number(frequency) }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center justify-end gap-1.5">
      <Select
        aria-label="Kontrol sıklığı"
        value={frequency}
        disabled={busy}
        onChange={(e) => {
          setFrequency(e.target.value);
          void update(enabled, e.target.value);
        }}
        className="h-8 w-24 text-xs"
      >
        {["6", "12", "24", "48"].map((hours) => (
          <option key={hours} value={hours}>
            {hours} saat
          </option>
        ))}
      </Select>
      <Button
        variant="ghost"
        size="sm"
        disabled={busy}
        aria-label={enabled ? "İzlemeyi durdur" : "İzlemeyi başlat"}
        onClick={() => update(!enabled)}
      >
        {enabled ? <ToggleRight aria-hidden /> : <ToggleLeft aria-hidden />}
        {enabled ? "Açık" : "Kapalı"}
      </Button>
      <Button variant="secondary" size="sm" disabled={busy || !enabled} onClick={runNow} aria-label="Şimdi kontrol et">
        <Play aria-hidden />
        Çalıştır
      </Button>
    </div>
  );
}

/** Etkinlik öğesini okundu işaretler. */
export function MarkAlertRead({ alertId }: { alertId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function mark() {
    setBusy(true);
    try {
      await fetch(`/api/alerts/${alertId}/read`, { method: "POST" });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button variant="ghost" size="sm" disabled={busy} onClick={mark}>
      Okundu
    </Button>
  );
}
