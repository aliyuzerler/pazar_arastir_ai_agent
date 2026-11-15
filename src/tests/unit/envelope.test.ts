import { describe, expect, it } from "vitest";

import { apiFail, apiOk, getRequestId, zodErrorDetails } from "@/server/http/envelope";

describe("API yanıt zarfı", () => {
  it("başarılı yanıt sözleşmeye uygun şekildedir", () => {
    const res = apiOk({ hello: "world" }, { requestId: "req-1", dataMode: "demo" });
    expect(res.status).toBe(200);
  });

  it("hata yanıtı data:null ve error gövdesi taşır", () => {
    const res = apiFail(
      { code: "VALIDATION_ERROR", message: "Girdi doğrulanamadı.", details: [] },
      { requestId: "req-2", status: 400 },
    );
    expect(res.status).toBe(400);
  });

  it("requestId benzersiz üretilir ve x-request-id başlığına saygı duyar", () => {
    const a = getRequestId(null);
    const b = getRequestId(null);
    expect(a).not.toEqual(b);

    const req = new Request("http://localhost/api/health", {
      headers: { "x-request-id": "istek-123" },
    });
    expect(getRequestId(req)).toBe("istek-123");
  });

  it("zod hata detayları yol + mesaj taşır, değer taşımaz", () => {
    const details = zodErrorDetails([
      { path: ["product", "title"], message: "Başlık zorunludur." },
      { path: [], message: "Kök hata." },
    ]);
    expect(details).toEqual([
      { path: "product.title", message: "Başlık zorunludur." },
      { path: "(kök)", message: "Kök hata." },
    ]);
  });
});
