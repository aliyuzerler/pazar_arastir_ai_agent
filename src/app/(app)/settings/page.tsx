import { ShieldCheck, ShieldAlert, Database, KeyRound, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getEnv } from "@/lib/env";
import { getDbDriverName } from "@/server/db/driver";
import { resolveWorkspaceContext } from "@/server/security/workspace-context";

export const dynamic = "force-dynamic";

/**
 * Ayarlar: workspace bilgisi, çalışma modu ve SaaS öncesi release gate listesi.
 * Bu ekran secret göstermez; yalnızca yapılandırma DURUMUNU bildirir.
 */
export default async function SettingsPage() {
  const env = getEnv();
  const { workspace } = await resolveWorkspaceContext();
  const isLocal = env.APP_MODE === "local";
  const prodReady = process.env.PROD_READY === "true";
  const cronConfigured =
    Boolean(env.CRON_SECRET) && env.CRON_SECRET !== "change-this-to-a-long-random-secret";

  const gates = [
    {
      label: "Kimlik doğrulama / oturum yönetimi",
      done: false,
      note: "Bu sürüm tek kullanıcı yerel mod içindir; SaaS yayın öncesi zorunlu.",
    },
    {
      label: "Yönetilen PostgreSQL bağlantısı",
      done: !env.DATABASE_URL.includes("productintel_local_password"),
      note: "Varsayılan yerel parola üretimde kabul edilmez.",
    },
    {
      label: "CRON_SECRET tanımlı",
      done: cronConfigured,
      note: "Zamanlanmış izleme ucu bu anahtarla korunur.",
    },
    {
      label: "PROD_READY=true (bilinçli onay)",
      done: prodReady,
      note: "Sunucu, onay olmadan üretim modunda başlamaz (instrumentation gate).",
    },
  ];

  return (
    <section aria-labelledby="settings-title" className="space-y-4">
      <header>
        <h1 id="settings-title" className="text-2xl font-semibold tracking-tight">
          Ayarlar
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Çalışma alanı, mod ve sürüm kapısı durumu. API anahtarları bu ekranda
          gösterilmez ve yalnızca sunucu tarafında saklanır.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Çalışma alanı</CardTitle>
              <CardDescription>Tek kiracılı yerel modun workspace kaydı.</CardDescription>
            </div>
            <Users className="size-4 text-text-secondary" aria-hidden />
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <div>
                <dt className="text-xs text-text-secondary">Ad</dt>
                <dd className="font-medium">{workspace.name}</dd>
              </div>
              <div>
                <dt className="text-xs text-text-secondary">Slug</dt>
                <dd className="font-mono text-xs">{workspace.slug}</dd>
              </div>
              <div>
                <dt className="text-xs text-text-secondary">Ülke / locale</dt>
                <dd className="font-medium">
                  {workspace.defaultCountry} · {workspace.defaultLocale}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-text-secondary">Para birimi</dt>
                <dd className="font-medium">{workspace.defaultCurrency}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Çalışma modu</CardTitle>
              <CardDescription>Veri kaynağı ve altyapı durumu.</CardDescription>
            </div>
            <Database className="size-4 text-text-secondary" aria-hidden />
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="flex items-center gap-2">
              <Badge variant={isLocal ? "info" : "warning"}>{isLocal ? "YEREL MOD" : "ÜRETİM MODU"}</Badge>
              {isLocal
                ? "Kimlik doğrulama yoktur; yalnızca localhost kullanımı içindir."
                : "Release gate denetlenir."}
            </p>
            <p className="flex items-center gap-2">
              <Badge variant="neutral">DB sürücü: {getDbDriverName()}</Badge>
              <Badge variant="neutral">Sağlayıcı modu: {env.PROVIDER_MODE}</Badge>
            </p>
            <p className="text-xs text-text-secondary">
              Günlük sağlayıcı sorgu bütçesi: {env.MAX_DAILY_QUERIES} sorgu.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>SaaS yayın kapısı (release gate)</CardTitle>
            <CardDescription>
              Bu liste, yerel uygulamadan SaaS’a geçerken tamamlanması zorunlu adımları gösterir.
            </CardDescription>
          </div>
          {isLocal ? (
            <Badge variant="info">
              <ShieldCheck aria-hidden />
              Yerel mod: kapı beklenmiyor
            </Badge>
          ) : prodReady ? (
            <Badge variant="success">
              <ShieldCheck aria-hidden />
              PROD_READY onaylı
            </Badge>
          ) : (
            <Badge variant="danger">
              <ShieldAlert aria-hidden />
              Üretim başlangıcı engelli
            </Badge>
          )}
        </CardHeader>
        <CardContent className="space-y-2">
          {gates.map((gate) => (
            <div
              key={gate.label}
              className="flex items-start justify-between gap-3 rounded-lg border border-border-subtle px-3 py-2.5"
            >
              <div>
                <p className="text-sm font-medium">{gate.label}</p>
                <p className="text-[11px] text-text-secondary">{gate.note}</p>
              </div>
              <Badge variant={gate.done ? "success" : "warning"}>
                <KeyRound aria-hidden />
                {gate.done ? "Tamam" : "Bekliyor"}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </section>
  );
}
