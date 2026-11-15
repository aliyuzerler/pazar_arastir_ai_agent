import type { LucideIcon } from "lucide-react";

import { findNavItem } from "@/components/layout/nav-items";
import { EmptyState } from "@/components/feedback/empty-state";

interface PlaceholderPageProps {
  route: string;
}

/**
 * Faz 0 yer tutucu sayfası: gezinme rotalarının çalıştığını gösterir,
 * içeriğin sonraki fazlarda geleceğini açıkça belirtir.
 */
export function PlaceholderPage({ route }: PlaceholderPageProps) {
  const item = findNavItem(route);
  const Icon: LucideIcon = item.icon;
  return (
    <section aria-labelledby="page-title" className="space-y-4">
      <div>
        <h1 id="page-title" className="text-2xl font-semibold tracking-tight">
          {item.label}
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Bu bölüm sonraki geliştirme fazlarında aktifleşecek.
        </p>
      </div>
      <EmptyState
        icon={Icon}
        title="Bu ekran henüz yapım aşamasında"
        description={item.description}
      />
    </section>
  );
}
