# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: products.spec.ts >> Faz 2 - ürün kataloğu yolculuğu >> CSV önizleme hatalı satırları işaretler ve içe aktarma çalışır
- Location: src/tests/e2e/products.spec.ts:75:3

# Error details

```
Test timeout of 60000ms exceeded.
```

# Page snapshot

```yaml
- generic [ref=e2]:
  - complementary [ref=e3]:
    - generic [ref=e10]:
      - paragraph [ref=e11]: Product Intelligence
      - paragraph [ref=e12]: Pazar istihbarat paneli
    - navigation "Ana gezinme" [ref=e13]:
      - list [ref=e14]:
        - listitem [ref=e15]:
          - link "Genel Bakış" [ref=e16] [cursor=pointer]:
            - /url: /dashboard
        - listitem [ref=e22]:
          - link "Ürünler" [ref=e23] [cursor=pointer]:
            - /url: /products
        - listitem [ref=e28]:
          - link "Araştırma" [ref=e29] [cursor=pointer]:
            - /url: /research
        - listitem [ref=e33]:
          - link "Fiyat İzleme" [ref=e34] [cursor=pointer]:
            - /url: /monitoring
        - listitem [ref=e38]:
          - link "Fiyat Analizi" [ref=e39] [cursor=pointer]:
            - /url: /pricing-analysis
        - listitem [ref=e42]:
          - link "Veri Kaynakları" [ref=e43] [cursor=pointer]:
            - /url: /data-sources
        - listitem [ref=e48]:
          - link "Ayarlar" [ref=e49] [cursor=pointer]:
            - /url: /settings
    - generic [ref=e53]:
      - paragraph [ref=e54]: Yerel mod · Tek kullanıcı
      - paragraph [ref=e55]: Kimlik doğrulama bu sürümde bulunmaz.
  - generic [ref=e56]:
    - banner [ref=e57]:
      - button "Menüyü aç" [ref=e58]
      - generic [ref=e60]:
        - paragraph [ref=e61]: Genel Bakış
        - paragraph [ref=e62]: Product Intelligence
      - searchbox "Global ürün arama" [disabled] [ref=e67]
      - generic [ref=e68]:
        - generic [ref=e69]: "Kaynaklar: 1/4 hazır"
        - text: DEMO MOD
        - button "Yeni Araştırma" [ref=e70]
        - button "Koyu temaya geç" [ref=e72]
    - main [ref=e75]:
      - region "CSV ile Ürün İçe Aktar" [ref=e77]:
        - generic [ref=e78]:
          - heading "CSV ile Ürün İçe Aktar" [level=1] [ref=e79]
          - paragraph [ref=e80]:
            - text: "Yalnızca kendi ürün kataloğunuz içindir. Zorunlu başlıklar:"
            - code [ref=e81]: title
            - text: ","
            - code [ref=e82]: unit_cost
            - text: ","
            - code [ref=e83]: currency
            - text: . En fazla 500 satır / 512 KB.
        - generic [ref=e84]:
          - generic [ref=e85]:
            - heading "1. Dosya seçin veya yapıştırın" [level=3] [ref=e86]
            - paragraph [ref=e87]: Sütun başlıkları Türkçe/İngilizce takma adlarla eşleştirilir.
          - generic [ref=e88]:
            - button "CSV dosyası seç" [ref=e89]
            - textbox "CSV içeriği" [active] [ref=e90]:
              - /placeholder: "title,sku,brand,model,gtin,category,unit_cost,currency,inbound_shipping_per_unit,packaging_cost,other_fixed_cost\nKablosuz Kulaklık ANC Pro,SKU-001,SesMark,ANC-P,8690000000012,Elektronik,850.00,TRY,12.50,3.00,2.00\nAkıllı Ev Termostatı X1,SKU-002,Evmark,X1,,,,TRY,20.00,5.00,3.00"
              - text: title,sku,gtin,unit_cost,currency CSV Ürün A 217193,CSVA-217193,,199.90,TRY Hatalı Satır,,,abc,TRY
            - generic [ref=e91]:
              - button "Önizle" [disabled] [ref=e92]
              - button "İçe Aktar (0 geçerli satır)" [disabled] [ref=e93]
              - button "Örnek CSV doldur" [ref=e97]
```