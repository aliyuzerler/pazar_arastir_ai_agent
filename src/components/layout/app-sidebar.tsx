"use client";

import { Activity } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { NAV_ITEMS } from "@/components/layout/nav-items";
import { cn } from "@/lib/utils";

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside
      data-testid="app-sidebar"
      className="hidden w-[248px] shrink-0 flex-col bg-sidebar text-sidebar-foreground md:flex"
    >
      <div className="flex items-center gap-2 px-5 py-5">
        <span className="flex size-8 items-center justify-center rounded-lg bg-accent text-accent-foreground">
          <Activity className="size-4" aria-hidden />
        </span>
        <div className="leading-tight">
          <p className="text-sm font-semibold">Product Intelligence</p>
          <p className="text-[11px] text-sidebar-muted">Pazar istihbarat paneli</p>
        </div>
      </div>

      <nav aria-label="Ana gezinme" className="flex-1 px-3 py-2">
        <ul className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                    active
                      ? "bg-sidebar-hover font-semibold text-sidebar-foreground"
                      : "text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-foreground",
                  )}
                >
                  <Icon className="size-4 shrink-0" aria-hidden />
                  {item.label}
                  {active ? <span className="ml-auto size-1.5 rounded-full bg-accent" aria-hidden /> : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-white/10 px-5 py-4 text-[11px] leading-relaxed text-sidebar-muted">
        <p>Yerel mod · Tek kullanıcı</p>
        <p>Kimlik doğrulama bu sürümde bulunmaz.</p>
      </div>
    </aside>
  );
}
