import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KSLA Growth OS",
  description: "KSLA独自の7s Demandを軸にしたバドミントン選手の成長管理アプリ",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "KSLA Growth OS",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f745d",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
