import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}

/**
 * Boş durum bileşeni: verinin neden olmadığını açıklar ve yararlı bir sonraki
 * adım önerir (docs/06 bileşen kuralları).
 */
export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border-subtle bg-surface px-6 py-12 text-center",
        className,
      )}
    >
      {Icon ? <Icon aria-hidden className="size-8 text-text-secondary" /> : null}
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="max-w-md text-xs leading-relaxed text-text-secondary">{description}</p>
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
