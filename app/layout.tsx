import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "峰声 FIELD · 两种声音，一个现场",
  description: "围绕时代峰峻的观点对照与支持应援互动现场。",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
