# Skill: Premium Monochrome SaaS UI/UX

## Tasarım hedefi
Beyaz/siyah/gri dengesi üzerine kurulu, premium ve profesyonel bir ürün istihbaratı paneli. Veri yoğun ama sade; e-ticaret yönetim paneli gibi net ve verimli.

## Palet
Light: bg #F5F6F7, surface #FFFFFF, text #151719, secondary #697078, border #E2E5E8, sidebar #17191B, accent #B9E769.
Dark: bg #111315, surface #191C1F, elevated #202428, text #F4F5F6, secondary #9AA1A8, border #30363B, sidebar #0B0D0F, accent #B9E769.
Success #217A51, warning #A66B13, danger #B83A3A, info #446B91. Durum renkleri pastel/muted ve metinle desteklenmeli.

## Tipografi ve yoğunluk
- Geist Sans veya Inter; rakamlarda tabular-nums.
- Core dashboard için H1 28–32, H2 20–24, section 15–17, body 13–15 px.
- 8px spacing scale.
- Sidebar 248px, collapse 76px.
- Table row 52–60px; numeric cells right-aligned.
- Cards 12–16px radius; aşırı pill, gradient, glow ve drop shadow kullanma.

## Layout
Sidebar: Overview, Products, Research, Price monitoring, Pricing analysis, Data sources, Settings.
Topbar: breadcrumb, page title, global search, New research, provider status, theme toggle.
Dashboard: KPI strip, price movement chart, recent research table, alerts.
Product detail: facts, costs, exact/substitute/offers/history/pricing tabs.
Research: exact vs substitutes tabs, filters, provenance, stale/partial status.
Pricing: cost breakdown, break-even, recommendation cards, formula details.

## Veri gösterim kalitesi
- Kaynak adı ve son kontrol zamanı her offer satırında bulunmalı.
- Unknown stock “Bilinmiyor”; sayı yoksa sayı gösterme.
- Demo data her kart/sayfada görünür etiketlenmeli.
- Empty/loading/error/stale/partial state tamamlanmadan ekran bitmiş sayılmaz.
- Grafik boş tarih aralıklarını çizgiyle uydurmaz.
- Renk tek anlam taşımaz; text/icon ile destekle.

## Erişilebilirlik ve responsive
- WCAG AA kontrast hedefi.
- Visible focus, keyboard navigation, semantic HTML, label.
- Reduced motion.
- 1440x900 desktop, 1024x768 tablet, 390x844 mobile screenshot QA.
- Mobil tablo yatay scroll veya compact rows ile veri kaybetmeden uyarlanmalı.

## Anti-patterns
- Landing page hero stili dashboard'a taşınmaz.
- Her kartı farklı parlak renge boyama.
- Sadece dekoratif KPI/uydurma chart kullanma.
- Gerçek olmayan “%99 AI accuracy” gibi güven rozetleri üretme.
- Her yerde rounded-full ve büyük padding kullanma.
