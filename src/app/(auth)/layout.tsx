import { BarChart3 } from "lucide-react";

export const dynamic = "force-dynamic";

/** Kimlik doğrulama sayfaları için sade, ortalı kabuk. */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="border-b border-border-subtle">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <span className="grid size-7 place-items-center rounded-lg bg-accent text-accent-foreground">
              <BarChart3 className="size-4" aria-hidden />
            </span>
            Product Intelligence
          </p>
          <p className="text-[11px] text-text-secondary">Pazar istihbarat paneli</p>
        </div>
      </header>
      <main className="mx-auto flex max-w-6xl items-start justify-center px-4 py-10">{children}</main>
      <footer className="border-t border-border-subtle py-4 text-center text-[11px] text-text-secondary">
        Yerel mod · Kimlik doğrulama bu sürümde etkindir · Demo veri etiketleriyle sunulur
      </footer>
    </div>
  );
}
