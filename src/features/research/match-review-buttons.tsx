"use client";

import { Check, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";

interface MatchReviewButtonsProps {
  matchId: string;
  reviewStatus: string;
}

/** Eşleşme onay/red aksiyonu; karar kalıcıdır (review_status). */
export function MatchReviewButtons({ matchId, reviewStatus }: MatchReviewButtonsProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(reviewStatus);

  async function decide(decision: "approved" | "rejected") {
    setBusy(true);
    try {
      const response = await fetch(`/api/matches/${matchId}/review`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ decision }),
      });
      if (response.ok) {
        setStatus(decision);
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  if (status === "approved") {
    return (
      <span className="text-xs font-medium text-status-success" data-testid={`match-approved-${matchId}`}>
        Onaylandı
      </span>
    );
  }
  if (status === "rejected") {
    return (
      <span className="text-xs font-medium text-status-danger" data-testid={`match-rejected-${matchId}`}>
        Reddedildi
      </span>
    );
  }

  return (
    <div className="flex justify-end gap-1.5">
      <Button
        variant="secondary"
        size="sm"
        disabled={busy}
        onClick={() => decide("approved")}
        aria-label="Eşleşmeyi onayla"
      >
        <Check aria-hidden />
        Onayla
      </Button>
      <Button
        variant="ghost"
        size="sm"
        disabled={busy}
        onClick={() => decide("rejected")}
        aria-label="Eşleşmeyi reddet"
      >
        <X aria-hidden />
        Reddet
      </Button>
    </div>
  );
}
