import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "latin-ext"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  title: "Product Intelligence",
  description: "Ürün araştırma, rakip fiyat takibi ve satış fiyatı karar destek sistemi",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <head>
        {/* Tema tercihini ilk boyamadan önce uygula (flash önleme). */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var t=localStorage.getItem('pi-theme');if(t==='dark'){document.documentElement.classList.add('dark')}}catch(e){}",
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
