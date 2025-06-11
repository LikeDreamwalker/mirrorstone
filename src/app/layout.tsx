import type { Metadata } from "next";
import "./globals.css";

import { Noto_Serif_SC } from "next/font/google";

const notoSerifSC = Noto_Serif_SC({
  subsets: ["latin", "latin-ext"], // Add the subsets you need
  weight: ["200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-noto-serif-sc",
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  title: "MirrorStone",
  description: "AI Assistant by LikeDreamwalker",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={notoSerifSC.className}>
      <body>{children}</body>
    </html>
  );
}
