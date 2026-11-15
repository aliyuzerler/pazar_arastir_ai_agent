import { AlertTriangle, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ErrorStateProps {
  title?: string;
  description: string;
  onRetry?: () => void;
  className?: string;
}

/**
 * Hata durumu bileşeni: kullanıcıya ne olduğunu ve ne yapabileceğini söyler.
 * Hata mesajlarında secret/ham yanıt gösterilmez (güvenlik kuralı).
 */
export function ErrorState({
  title = "Bir sorun oluştu",
  description,
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-xl border border-status-danger/30 bg-status-danger/5 px-6 py-10 text-center",
        className,
      )}
    >
      <AlertTriangle aria-hidden className="size-7 text-status-danger" />
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="max-w-md text-xs leading-relaxed text-text-secondary">{description}</p>
      {onRetry ? (
        <Button variant="secondary" size="sm" className="mt-2" onClick={onRetry}>
          <RefreshCw aria-hidden />
          Yeniden dene
        </Button>
      ) : null}
    </div>
  );
}
