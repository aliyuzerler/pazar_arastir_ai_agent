#!/usr/bin/env node
/**
 * Görsel QA yakalama betiği (docs/06 görsel kalite kontrolü).
 * Kullanım: node scripts/capture-screens.mjs <fazAdi> <rota> [<rota>...]
 * Örnek:    node scripts/capture-screens.mjs faz-0 /dashboard
 * Çıktılar docs/screenshots/<fazAdi>-<rota-adi>-{light,dark,mobile}.png
 * Sunucu zaten çalışıyor olmalı (npm run dev).
 */
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";
import path from "node:path";

const phase = process.argv[2];
const routes = process.argv.slice(3);
if (!phase || routes.length === 0) {
  console.error("Kullanım: node scripts/capture-screens.mjs <faz> <rota> [...]");
  process.exit(1);
}

const BASE = process.env.CAPTURE_BASE_URL ?? "http://localhost:3000";
const OUT = path.resolve("docs/screenshots");
mkdirSync(OUT, { recursive: true });

const VIEWPORTS = [
  { suffix: "light", width: 1440, height: 900, theme: "light", fullPage: false },
  { suffix: "dark", width: 1440, height: 900, theme: "dark", fullPage: false },
  { suffix: "mobile", width: 390, height: 844, theme: "light", fullPage: true },
];

const browser = await chromium.launch();
for (const route of routes) {
  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();
    await page.addInitScript((theme) => {
      window.localStorage.setItem("pi-theme", theme);
    }, vp.theme);
    await page.goto(BASE + route, { waitUntil: "networkidle" });
    await page.waitForTimeout(400);
    const routeName = route === "/" ? "root" : route.replace(/^\//, "").replace(/\//g, "-");
    const file = path.join(OUT, `${phase}-${routeName}-${vp.suffix}.png`);
    await page.screenshot({ path: file, fullPage: vp.fullPage });
    console.log("kaydedildi:", file);
    await context.close();
  }
}
await browser.close();
console.log("Tamamlandı.");
