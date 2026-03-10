import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from 'next/link';
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "自由世界 Freedom World",
  description: "一個活著的開放小說世界。你的每一個抉擇，都將永久改變它的走向。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <main className="flex-grow">
          {children}
        </main>
        <footer className="text-center p-6 text-sm text-neutral-500 bg-neutral-950 border-t border-neutral-900">
          <p>© 2026 自由江湖 Freedom World.</p>
          <p className="mt-1">本網站由 自由世界 獨立開發與營運 | 網站負責人：陳人瑜</p>
          <p className="mt-1">客服信箱：freedomworld1023@gmail.com | 客服專線：0989851023</p>
          <div className="mt-4 flex flex-wrap justify-center gap-4 text-xs">
            <Link href="/policy" className="hover:text-neutral-300 transition-colors">服務條款</Link>
            <span className="hidden sm:inline">|</span>
            <Link href="/policy" className="hover:text-neutral-300 transition-colors">隱私權政策</Link>
            <span className="hidden sm:inline">|</span>
            <Link href="/policy" className="hover:text-neutral-300 transition-colors">退款政策</Link>
            <span className="hidden sm:inline">|</span>
            <Link href="/policy" className="hover:text-neutral-300 transition-colors">消費者權益</Link>
          </div>
        </footer>
      </body>
    </html>
  );
}
