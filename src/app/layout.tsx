import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
          <p>本網站由 自由世界 獨立開發與營運</p>
          <p>客服信箱：freedomworld1023@gmail.com | 客服專線：0989851023</p>
        </footer>
      </body>
    </html>
  );
}
