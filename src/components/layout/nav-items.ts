import { BarChart3, Database, LayoutDashboard, Package, Search, Settings, TrendingUp, Wallet } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  description: string;
}

/** Sol menü öğeleri (docs/06_UI_UX_DESIGN_SYSTEM.md ana düzen). */
export const NAV_ITEMS: NavItem[] = [
  {
    href: "/dashboard",
    label: "Genel Bakış",
    icon: LayoutDashboard,
    description: "Özet metrikler, son araştırmalar ve kaynak durumu burada yer alacak.",
  },
  {
    href: "/products",
    label: "Ürünler",
    icon: Package,
    description: "Ürün kataloğu, maliyet girdileri ve CSV içe aktarma burada olacak.",
  },
  {
    href: "/research",
    label: "Araştırma",
    icon: Search,
    description: "Piyasa araştırma sonuçları, birebir ve muadil eşleşmeler burada listelenecek.",
  },
  {
    href: "/monitoring",
    label: "Fiyat İzleme",
    icon: TrendingUp,
    description: "Zamanlanmış fiyat/stok kontrolleri ve uyarılar burada görünecek.",
  },
  {
    href: "/pricing-analysis",
    label: "Fiyat Analizi",
    icon: BarChart3,
    description: "Başa baş fiyat, marj senaryoları ve öneriler burada hesaplanacak.",
  },
  {
    href: "/data-sources",
    label: "Veri Kaynakları",
    icon: Database,
    description: "Sağlayıcı bağlantı durumları ve kapsamları burada yönetilecek.",
  },
  {
    href: "/settings",
    label: "Ayarlar",
    icon: Settings,
    description: "Pazar, para birimi, izleme sıklığı ve demo veri tercihleri burada olacak.",
  },
];

export function findNavItem(href: string): NavItem {
  return NAV_ITEMS.find((item) => item.href === href) ?? NAV_ITEMS[0];
}

export const WALLET_ICON = Wallet;
