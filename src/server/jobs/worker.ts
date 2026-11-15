/**
 * Yerel izleme işçisi: `npm run worker`
 * Kontrollü döngü: her TICK_SECONDS'ta bir bounded batch çalıştırır.
 * Vercel'de sonsuz döngü YOK; orada /api/cron/monitoring kullanılır.
 */
import "dotenv/config";

import { createDb } from "@/server/db/driver";
import { runMonitoringBatch } from "@/server/jobs/monitoring-service";

const TICK_SECONDS = Number(process.env.WORKER_TICK_SECONDS ?? 30);
const MAX_CYCLES = Number(process.env.WORKER_MAX_CYCLES ?? 0); // 0 = sonsuz

async function tick(): Promise<void> {
  const db = createDb();
  const result = await runMonitoringBatch(db);
  console.log(
    JSON.stringify({
      event: "worker_tick",
      time: new Date().toISOString(),
      processed: result.processed,
      alertsCreated: result.alertsCreated,
      errors: result.errors,
    }),
  );
}

async function main(): Promise<void> {
  console.log(`Worker başladı (tick: ${TICK_SECONDS}s).`);
  let cycles = 0;
  while (true) {
    try {
      await tick();
    } catch (error) {
      console.error("Tick hatası:", error instanceof Error ? error.message : error);
    }
    cycles += 1;
    if (MAX_CYCLES > 0 && cycles >= MAX_CYCLES) {
      console.log("Maksimum döngüye ulaşıldı; worker kapanıyor.");
      process.exit(0);
    }
    await new Promise((resolve) => setTimeout(resolve, TICK_SECONDS * 1000));
  }
}

main().catch((error) => {
  console.error("Worker hatası:", error);
  process.exit(1);
});
