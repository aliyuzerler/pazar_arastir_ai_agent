import type { ReactNode } from "react";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppTopbar } from "@/components/layout/app-topbar";
import { resolveWorkspaceContext } from "@/server/security/workspace-context";

/**
 * Uygulama kabuğu: sol menü + üst bar + içerik alanı. Middleware oturumu
 * garanti eder; burada kullanıcı bilgisi menüye eklenir.
 */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const { user } = await resolveWorkspaceContext();

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar user={{ email: user.email, role: user.role }} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppTopbar user={{ email: user.email, role: user.role }} />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1600px] p-4 md:p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
