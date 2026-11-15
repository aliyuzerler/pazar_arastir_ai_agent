# 06 — UI/UX tasarım sistemi: Monochrome Intelligence

## Tasarım hedefi

Premium, kurumsal ve veri yoğun bir ürün istihbarat uygulaması. Kullanıcı bir e-ticaret operasyon paneli kullanıyor gibi hissetmeli; pazarlama landing page'i gibi değil. Beyaz ve siyahın dengeli karışımı, güçlü tipografi, yüksek tablo okunabilirliği ve az renkli vurgu kullanılmalı.

## Renk paleti

### Light theme
- Background: `#F5F6F7`
- Surface: `#FFFFFF`
- Surface subtle: `#F0F1F2`
- Text primary: `#151719`
- Text secondary: `#697078`
- Border: `#E2E5E8`
- Sidebar: `#17191B`
- Sidebar text: `#F4F5F6`
- Accent: `#B9E769` (kontrollü lime)
- Success: `#217A51`
- Warning: `#A66B13`
- Danger: `#B83A3A`
- Info: `#446B91`

### Dark theme
- Background: `#111315`
- Surface: `#191C1F`
- Surface elevated: `#202428`
- Text primary: `#F4F5F6`
- Text secondary: `#9AA1A8`
- Border: `#30363B`
- Sidebar: `#0B0D0F`
- Accent: `#B9E769`

Accent only for primary CTA, selected nav or very few positive signals. Do not color every card.

## Tipografi

- Primary: Geist Sans veya Inter.
- Numeric/table: Geist Mono / tabular numerals.
- H1: 28–32 px desktop; H2: 20–24 px; section title 15–17 px; body 13–15 px; secondary 12–13 px.
- Large headline/hero typography is not appropriate for core dashboard.

## Grid and spacing

- 8px spacing scale: 4, 8, 12, 16, 24, 32, 40.
- Desktop sidebar 248px expanded / 76px collapsed.
- Main max-width 1600px; dashboard content uses flexible grid.
- Table row 52–60px; compact density toggle optional.
- Card radius 12–16px; buttons 8–10px. Avoid excessive pill/capsule UI.
- Border-first separation; subtle shadows only on floating menus/dialogs.

## Main layout

Left sidebar:
- Overview
- Products
- Research
- Price monitoring
- Pricing analysis
- Data sources
- Settings

Top bar:
- breadcrumb/page title
- global product search
- “New research” primary CTA
- connection/status indicators
- theme toggle

Dashboard:
- greeting/context row (small)
- KPI strip: tracked products, research runs, price drops, source health
- price movement chart / recent activity
- recently researched products table
- latest alerts

Product detail:
- title + SKU/GTIN + status
- compact product facts and cost summary
- research CTA
- tabs exact / substitutes / all offers / history / pricing

Research result:
- market summary header
- exact vs substitute tabs, separate counts
- table-first results; card layout only for compact comparison on small screens
- filters and last-updated status
- source attribution always visible

Pricing:
- cost breakdown on left
- strategy recommendations on right
- break-even marker on chart
- formula and assumptions in expandable details

## Bileşen kuralları

- Buttons: primary filled, secondary outline, tertiary ghost.
- Status chips: muted; use text + icon. Demo status always visible.
- Tables: sticky header on long datasets, aligned numeric columns, sortable headers, keyboard navigable.
- Charts: no 3D, no decorative gradients, no misleading y-axis truncation without marker. Tooltip includes date, price, currency, source.
- Empty states: explain why there is no data and give next useful action.
- Stale states: show timestamp and refresh action.
- Partial state: “2 kaynak sonuç verdi, 1 kaynak yanıtlamadı” pattern.
- Confirmation modal: destructive operations only.
- Toasts: short success/error with actionable context.

## UX davranışı

- Search submit immediately creates visible research state.
- Long jobs show progress by source, not fake percent if unavailable. Use stage labels (Preparing, Searching, Normalizing, Matching, Saving).
- User should be able to view partial results while another provider is still pending if architecture allows.
- Filters preserve state in URL query params where practical.
- Product matching can be reviewed and corrected with one click; show why match was suggested.
- Price recommendation must expose assumptions rather than hiding them in tooltip only.
- On narrow screens, complex tables become horizontally scrollable or compact cards, not clipped data.

## Accessibility

- WCAG AA contrast target.
- All controls visible focus.
- No color-only statuses.
- Label every input and validation message.
- Use `aria-live` for research state changes.
- Respect reduced-motion setting.
- Keyboard accessible dropdown, dialog, tabs, table actions.

## Görsel kalite kontrolü

Her faz sonunda Playwright screenshot'ları 1440x900, 1024x768 ve 390x844 boyutlarında kontrol et. Sayfa taşması, üst üste binen metin, çok soluk kontrast, tablo satırının kesilmesi veya boş state eksikliği varsa faz geçmez.
