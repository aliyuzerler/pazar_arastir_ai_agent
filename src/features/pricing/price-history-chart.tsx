"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface HistoryChartPoint {
  observedAt: string;
  ourPrice: number | null;
  providerPrice: number | null;
}

/**
 * Fiyat geçmişi grafiği. Noktalar yalnızca gerçek gözlemlerdir; eksik
 * günler veriyle doldurulmaz (iki nokta arasındaki çizgi trend okumasıdır,
 * günlük gözlem değildir — tooltip gerçek tarih/saati gösterir).
 */
export function PriceHistoryChart({ data, currency }: { data: HistoryChartPoint[]; currency: string }) {
  return (
    <div className="h-72 w-full" data-testid="price-history-chart">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
          <CartesianGrid stroke="var(--border-subtle)" strokeDasharray="3 3" />
          <XAxis
            dataKey="observedAt"
            tick={{ fontSize: 11, fill: "var(--text-secondary)" }}
            tickFormatter={(value: string) =>
              new Date(value).toLocaleDateString("tr-TR", { day: "2-digit", month: "short" })
            }
          />
          <YAxis
            tick={{ fontSize: 11, fill: "var(--text-secondary)" }}
            domain={["auto", "auto"]}
            tickFormatter={(value: number) => value.toLocaleString("tr-TR")}
          />
          <Tooltip
            formatter={(value: number | string, name: string) => [
              `${Number(value).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ${currency}`,
              name,
            ]}
            labelFormatter={(label: string) =>
              new Date(label).toLocaleString("tr-TR", { dateStyle: "medium", timeStyle: "short" })
            }
            contentStyle={{
              background: "var(--surface)",
              border: "1px solid var(--border-subtle)",
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line
            type="monotone"
            dataKey="ourPrice"
            name="Kendi gözlemlerimiz"
            stroke="#151719"
            strokeWidth={2}
            dot={{ r: 3 }}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="providerPrice"
            name="Sağlayıcı geçmişi"
            stroke="#446B91"
            strokeWidth={2}
            strokeDasharray="6 3"
            dot={{ r: 3 }}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
