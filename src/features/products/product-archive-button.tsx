"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";

interface ProductArchiveButtonProps {
  productId: string;
  archived: boolean;
}

/** Arşivle/geri yükle aksiyonu; yıkıcı işlem onaylı modal ile yapılır. */
export function ProductArchiveButton({ productId, archived }: ProductArchiveButtonProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function act() {
    setBusy(true);
    try {
      await fetch(`/api/products/${productId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: archived ? "restore" : "archive" }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button
      variant={archived ? "secondary" : "ghost"}
      size="sm"
      disabled={busy}
      onClick={act}
    >
      {archived ? "Geri yükle" : "Arşivle"}
    </Button>
  );
}
