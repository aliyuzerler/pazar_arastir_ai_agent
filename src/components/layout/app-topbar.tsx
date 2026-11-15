"use client";

import { Moon, Plus, Search, Sun } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { MobileSidebar } from "@/components/layout/app-sidebar";
import { findNavItem } from "@/components/layout/nav-items";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";

type Theme = "light" | "dark";

function readInitialTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const stored = window.localStorage.getItem("pi-theme");
  return stored === "dark" || stored === "light" ? stored : "light";
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
}

/**
 * Üst bar: menü (mobil), sayfa başlığı, arama yer tutucusu, yeni araştırma
 * CTA'sı, sağlayıcı sağlığı ve tema düğmesi.
 */
export function AppTopbar() {
  const pathname = usePathname();
  const navItem = findNavItem(pathname);
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const initial = readInitialTheme();
    setTheme(initial);
    applyTheme(initial);
  }, []);

  function toggleTheme() {
    const next: Theme = theme === "light" ? "dark" : "light";
    setTheme(next);
    applyTheme(next);
    window.localStorage.setItem("pi-theme", next);
  }

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-3 border-b border-border-subtle bg-surface px-4 md:px-6">
      <MobileSidebar />

      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{navItem.label}</p>
        <p className="truncate text-[11px] text-text-secondary">Product Intelligence</p>
      </div>

      <div className="relative ml-auto hidden max-w-72 flex-1 items-center lg:flex">
        <Search className="pointer-events-none absolute left-2.5 size-4 text-text-secondary" aria-hidden />
        <input
          type="search"
          placeholder="Ürün ara (Faz 2'de aktif)"
          aria-label="Global ürün arama"
          disabled
          className="h-9 w-full rounded-lg border border-border-subtle bg-surface-subtle pl-8 pr-3 text-sm text-text-secondary placeholder:text-text-secondary/70"
        />
      </div>

      <div className="ml-auto flex items-center gap-2 lg:ml-0">
        <Tooltip label="DemoProvider hazır; gerçek sağlayıcı anahtarı tanımlı değil.">
          <span
            data-testid="provider-health"
            className="hidden items-center gap-1.5 rounded-lg border border-border-subtle px-2 py-1.5 text-xs text-text-secondary sm:flex"
          >
            <span aria-hidden className="size-2 rounded-full bg-status-success" />
            Kaynaklar: 1/4 hazır
          </span>
        </Tooltip>
        <Badge variant="warning" aria-label="Sağlayıcı modu: demo">
          DEMO MOD
        </Badge>
        <Button size="md">
          <Plus aria-hidden />
          <span className="hidden sm:inline">Yeni Araştırma</span>
        </Button>
        <Button
          variant="secondary"
          size="icon"
          onClick={toggleTheme}
          data-testid="theme-toggle"
          aria-label={theme === "light" ? "Koyu temaya geç" : "Açık temaya geç"}
        >
          {theme === "light" ? <Moon aria-hidden /> : <Sun aria-hidden />}
        </Button>
      </div>
    </header>
  );
}
