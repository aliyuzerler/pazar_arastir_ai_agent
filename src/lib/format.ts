/** Para ve tarih gösterimi (tr-TR). Para hesapları Decimal ile yapılır;
 * bu yardımcılar yalnızca gösterim içindir. */

export function formatMoney(amount: string | number | null, currency: string): string {
  if (amount === null || amount === "") return "Bilgi yok";
  const value = typeof amount === "string" ? Number(amount) : amount;
  if (Number.isNaN(value)) return "Bilgi yok";
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency }).format(value);
}

export function formatDateTime(date: Date | string | null): string {
  if (!date) return "Bilgi yok";
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeStyle: "short" }).format(d);
}

export function formatPercent(rate: string | number): string {
  const value = typeof rate === "string" ? Number(rate) : rate;
  if (Number.isNaN(value)) return "Bilgi yok";
  return `%${(value * 100).toLocaleString("tr-TR", { maximumFractionDigits: 2 })}`;
}
