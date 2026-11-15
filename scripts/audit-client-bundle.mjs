#!/usr/bin/env node
/**
 * Client bundle denetimi: .next/static içinde secret/env anahtar adları
 * aranır; bulunan olursa exit 1 (TEST_09 md "secret browser bundle'a sızmıyor").
 * Kullanım: npm run build && npm run audit:bundle
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(".next/static");
const PATTERNS = [
  { name: "yerel DB parolası", regex: /productintel_local_password/ },
  { name: "DATAFORSEO anahtar değişkeni", regex: /DATAFORSEO_(LOGIN|PASSWORD)/ },
  { name: "SERPAPI anahtar değişkeni", regex: /SERPAPI_API_KEY/ },
  { name: "KEEPA anahtar değişkeni", regex: /KEEPA_API_KEY/ },
  { name: "GEMINI anahtar değişkeni", regex: /GEMINI_API_KEY/ },
  { name: "CRON_SECRET değeri", regex: /change-this-to-a-long-random-secret/ },
];

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) yield* walk(full);
    else yield full;
  }
}

let findings = 0;
try {
  for (const file of walk(ROOT)) {
    if (!/\.(js|css)$/.test(file)) continue;
    const content = readFileSync(file, "utf8");
    for (const pattern of PATTERNS) {
      if (pattern.regex.test(content)) {
        console.error(`SIZINTI: ${pattern.name} → ${file}`);
        findings += 1;
      }
    }
  }
} catch (error) {
  console.error(".next/static bulunamadı; önce `npm run build` çalıştırın.");
  process.exit(1);
}

if (findings > 0) {
  console.error(`${findings} sızıntı bulundu.`);
  process.exit(1);
}
console.log("Bundle denetimi temiz: secret sızıntısı yok.");
