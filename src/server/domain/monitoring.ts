/**
 * Uyarı değerlendirme (saf fonksiyonlar): fiyat düşüşü/yükselişi eşik ile,
 * bulunabilirlik değişimi yalnızca kaynak gerçekten veriyorsa.
 */
export interface AlertCandidate {
  type: "price_drop" | "price_rise" | "availability_change";
  thresholdPercent: number | null;
  message: string;
}

export interface PreviousObservation {
  priceAmount: string;
  availabilityStatus: string;
}

export interface CurrentObservation {
  priceAmount: string;
  availabilityStatus: string;
}

const AVAILABILITY_LABELS: Record<string, string> = {
  in_stock: "Stokta",
  limited_stock: "Az stok",
  out_of_stock: "Stokta yok",
  preorder: "Ön sipariş",
  unknown: "Bilinmiyor",
};

export function evaluateAlerts(
  previous: PreviousObservation,
  current: CurrentObservation,
  options: { thresholdPercent: number },
): AlertCandidate[] {
  const alerts: AlertCandidate[] = [];
  const oldPrice = Number(previous.priceAmount);
  const newPrice = Number(current.priceAmount);

  if (oldPrice > 0 && newPrice > 0 && oldPrice !== newPrice) {
    const changePercent = ((newPrice - oldPrice) / oldPrice) * 100;
    if (changePercent <= -options.thresholdPercent) {
      alerts.push({
        type: "price_drop",
        thresholdPercent: options.thresholdPercent,
        message: `Fiyat %${Math.abs(changePercent).toFixed(1)} düştü: ${oldPrice.toFixed(2)} → ${newPrice.toFixed(2)}`,
      });
    } else if (changePercent >= options.thresholdPercent) {
      alerts.push({
        type: "price_rise",
        thresholdPercent: options.thresholdPercent,
        message: `Fiyat %${changePercent.toFixed(1)} yükseldi: ${oldPrice.toFixed(2)} → ${newPrice.toFixed(2)}`,
      });
    }
  }

  if (
    previous.availabilityStatus !== current.availabilityStatus &&
    previous.availabilityStatus !== "unknown" &&
    current.availabilityStatus !== "unknown"
  ) {
    alerts.push({
      type: "availability_change",
      thresholdPercent: null,
      message: `Bulunabilirlik değişti: ${AVAILABILITY_LABELS[previous.availabilityStatus] ?? previous.availabilityStatus} → ${
        AVAILABILITY_LABELS[current.availabilityStatus] ?? current.availabilityStatus
      }`,
    });
  }

  return alerts;
}
