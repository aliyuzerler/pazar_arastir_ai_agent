"use client";

import { Moon, Plus, Search, Sun } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { findNavItem } from "@/components/layout/nav-items";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Theme = "light" | "dark";

function readInitialTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const stored = window.localStorage.getItem("pi-theme");
  return stored === "dark" || stored === "light" ? stored : "light";
}

/**
 * Üst bar: sayfa başlığı, arama yer tutucusu, yeni araştırma CTA'sı,
 * sağlayıcı durumu ve tema düğmesi.
 */
export function AppTopbar() {
  const pathname = usePathname();
  const navItem = findNavItem(pathname);
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const initial = readInitialTheme();
    setTheme(initial);
    document.documentElement.classList.toggle("dark", initial === "dark");
  }, []);

  function toggleTheme() {
    const next: Theme = theme === "light" ? "dark" : "light";
    setTheme(next);
    window.localStorage.setItem("pi-theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
  }

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-3 border-b border-border-subtle bg-surface px-4 md:px-6">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{navItem.label}</p>
        <p className="truncate text-[11px] text-text-secondary">Product Intelligence</p>
      </div>

      <div className="relative ml-auto hidden max-w-72 flex-1 items-center lg:flex">
        <Search className="pointer-events-none absolute left-2.5 size-4 text-text-secondary" aria-hidden />
        <input
          type="search"
          placeholder="Ürün ara (yakında)"
          aria-label="Global ürün arama"
          disabled
          className="h-9 w-full rounded-lg border border-border-subtle bg-surface-subtle pl-8 pr-3 text-sm text-text-secondary placeholder:text-text-secondary/70"
        />
      </div>

      <div className="ml-auto flex items-center gap-2 lg:ml-0">
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
          aria-label={theme === "light" ? "Koyu temaya geç" : "Açık temaya geç"}
        >
          {theme === "light" ? <Moon aria-hidden /> : <Sun aria-hidden />}
        </Button>
      </div>
    </header>
  );
}
