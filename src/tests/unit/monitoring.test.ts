import { describe, expect, it } from "vitest";

import { evaluateAlerts } from "@/server/domain/monitoring";

describe("uyarı değerlendirme (TEST_07 md-6, md-7)", () => {
  it("eşik üzeri düşüş fiyat_drop üretir", () => {
    const alerts = evaluateAlerts(
      { priceAmount: "1000", availabilityStatus: "in_stock" },
      { priceAmount: "940", availabilityStatus: "in_stock" },
      { thresholdPercent: 5 },
    );
    expect(alerts).toHaveLength(1);
    expect(alerts[0].type).toBe("price_drop");
    expect(alerts[0].message).toContain("%6.0");
  });

  it("eşik altı değişim uyarı üretmez", () => {
    const alerts = evaluateAlerts(
      { priceAmount: "1000", availabilityStatus: "in_stock" },
      { priceAmount: "990", availabilityStatus: "in_stock" },
      { thresholdPercent: 5 },
    );
    expect(alerts).toHaveLength(0);
  });

  it("yükseliş price_rise üretir", () => {
    const alerts = evaluateAlerts(
      { priceAmount: "1000", availabilityStatus: "in_stock" },
      { priceAmount: "1080", availabilityStatus: "in_stock" },
      { thresholdPercent: 5 },
    );
    expect(alerts[0].type).toBe("price_rise");
  });

  it("bulunabilirlik değişimi ayrı uyarıdır", () => {
    const alerts = evaluateAlerts(
      { priceAmount: "1000", availabilityStatus: "in_stock" },
      { priceAmount: "1000", availabilityStatus: "out_of_stock" },
      { thresholdPercent: 5 },
    );
    expect(alerts).toHaveLength(1);
    expect(alerts[0].type).toBe("availability_change");
    expect(alerts[0].message).toContain("Stokta");
  });

  it("unknown durumlar availability uyarısı ÜRETMEZ (kaynak gerçekten vermelidir)", () => {
    const alerts = evaluateAlerts(
      { priceAmount: "1000", availabilityStatus: "unknown" },
      { priceAmount: "1000", availabilityStatus: "in_stock" },
      { thresholdPercent: 5 },
    );
    expect(alerts).toHaveLength(0);
  });
});
