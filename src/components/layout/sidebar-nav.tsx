"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { NAV_ITEMS } from "@/components/layout/nav-items";
import { cn } from "@/lib/utils";

interface SidebarNavProps {
  onNavigate?: () => void;
  className?: string;
}

/** Gezinme listesi; aktif öğe aria-current ile de işaretlenir. */
export function SidebarNav({ onNavigate, className }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav aria-label="Ana gezinme" className={cn("px-3 py-2", className)}>
      <ul className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={onNavigate}
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
  );
}

export function SidebarBrand() {
  return (
    <div className="flex items-center gap-2 px-5 py-5">
      <span className="flex size-8 items-center justify-center rounded-lg bg-accent text-accent-foreground">
        <svg viewBox="0 0 16 16" className="size-4" aria-hidden fill="currentColor">
          <rect x="1" y="9" width="3" height="6" rx="0.8" />
          <rect x="6.5" y="5" width="3" height="10" rx="0.8" />
          <rect x="12" y="1" width="3" height="14" rx="0.8" />
        </svg>
      </span>
      <div className="leading-tight">
        <p className="text-sm font-semibold">Product Intelligence</p>
        <p className="text-[11px] text-sidebar-muted">Pazar istihbarat paneli</p>
      </div>
    </div>
  );
}

export function SidebarFooter() {
  return (
    <div className="border-t border-white/10 px-5 py-4 text-[11px] leading-relaxed text-sidebar-muted">
      <p>Yerel mod · Tek kullanıcı</p>
      <p>Kimlik doğrulama bu sürümde bulunmaz.</p>
    </div>
  );
}
