"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";

/** Kenar çubuğu oturum bilgisi + çıkış. */
export function SidebarSession({ email, role }: { email: string; role: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function logout() {
    setBusy(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="border-t border-white/10 px-5 py-4">
      <p className="truncate text-xs font-medium text-sidebar-foreground" title={email}>
        {email}
      </p>
      <p className="text-[11px] text-sidebar-muted">{role === "admin" ? "Yönetici" : "Üye"}</p>
      <Button
        variant="ghost"
        size="sm"
        className="mt-2 w-full justify-start text-sidebar-muted hover:text-sidebar-foreground"
        disabled={busy}
        onClick={logout}
      >
        <LogOut aria-hidden />
        Çıkış yap
      </Button>
    </div>
  );
}
