import type { ReactNode } from "react";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppTopbar } from "@/components/layout/app-topbar";

/**
 * Uygulama kabuğu: sol menü + üst bar + içerik alanı.
 * Masaüstü öncelikli; mobilde menü gizlenir (Faz 1'de çekmece eklenir).
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppTopbar />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1600px] p-4 md:p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
