import type React from "react";
import type { Metadata } from "next";
import "./globals.css";
import { Noto_Serif_SC } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { unstable_ViewTransition as ViewTransition } from "react";
const notoSerifSC = Noto_Serif_SC({
  subsets: ["latin", "latin-ext"],
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
    <html lang="en" suppressHydrationWarning className={notoSerifSC.variable}>
      <head />
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ViewTransition>{children}</ViewTransition>
        </ThemeProvider>
      </body>
    </html>
  );
}
