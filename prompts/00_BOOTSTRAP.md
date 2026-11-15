# FAZ 0 — Repository bootstrap ve mimari iskelet

Önce `AGENTS.md`, `docs/00_SCOPE_AND_PRODUCT_VISION.md`, `docs/01_PRD.md`, `docs/02_ARCHITECTURE.md`, `docs/03_DATA_MODEL.md` ve ilgili skill'leri oku.

## Hedef
Çalışan Next.js + TypeScript + PostgreSQL + Drizzle iskeleti oluştur. Bu fazda kapsamlı dashboard özellikleri geliştirme.

## Yapılacaklar
1. Next.js App Router TypeScript projesi; strict TS.
2. Tailwind + shadcn/ui temel altyapısı, Lucide ikonları, Geist/Inter font.
3. Drizzle PostgreSQL connection ve schema/migration altyapısı.
4. `.env.example` ile Zod env validation.
5. Docker Compose ile local PostgreSQL bağlantısı.
6. `workspaces` tablosu ve default workspace seed.
7. Ortak API response/error envelope ve request id.
8. `/api/health` DB connectivity ve app readiness döndürsün.
9. ESLint, format, typecheck, Vitest ve Playwright altyapısı.
10. `src/` klasör yapısını mimari dokümandaki gibi kur.
11. Root layout ve boş app shell; sidebar ve topbar placeholder.
12. README'ye gerçek komutları yaz.

## Sınırlar
- Ürün CRUD, provider veya pricing henüz yok.
- Auth/signup UI yok.
- SQLite yok.
- Gerçek API secret zorunlu değil.

## Tamamlanma kriteri
Local PostgreSQL bağlanır, migration ve seed çalışır, `/api/health` healthy döner, app shell açılır, lint/typecheck/test/build başarılıdır.
