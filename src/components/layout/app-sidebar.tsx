"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Menu, X } from "lucide-react";

import { SidebarBrand, SidebarFooter, SidebarNav } from "@/components/layout/sidebar-nav";

/** Masaüstü sabit menü. */
export function AppSidebar() {
  return (
    <aside
      data-testid="app-sidebar"
      className="hidden w-[248px] shrink-0 flex-col bg-sidebar text-sidebar-foreground md:flex"
    >
      <SidebarBrand />
      <SidebarNav className="flex-1" />
      <SidebarFooter />
    </aside>
  );
}

/** Mobil/tablet çekmece menüsü (<1024px). */
export function MobileSidebar() {
  return (
    <DialogPrimitive.Root>
      <DialogPrimitive.Trigger asChild>
        <button
          type="button"
          aria-label="Menüyü aç"
          data-testid="mobile-menu-button"
          className="rounded-lg border border-border-subtle p-2 text-foreground hover:bg-surface-subtle md:hidden"
        >
          <Menu className="size-4" aria-hidden />
        </button>
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-black/40 md:hidden" />
        <DialogPrimitive.Content
          className="fixed inset-y-0 left-0 z-50 flex w-[272px] flex-col bg-sidebar text-sidebar-foreground shadow-xl focus:outline-none md:hidden"
          aria-describedby={undefined}
        >
          <div className="flex items-center justify-between pr-3">
            <SidebarBrand />
            <DialogPrimitive.Close aria-label="Menüyü kapat" className="rounded-lg p-1.5 text-sidebar-muted hover:bg-sidebar-hover">
              <X className="size-4" aria-hidden />
            </DialogPrimitive.Close>
          </div>
          <SidebarNav className="flex-1" />
          <SidebarFooter />
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
