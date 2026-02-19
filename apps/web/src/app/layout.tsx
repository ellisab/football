import type { Metadata } from "next";
import { JetBrains_Mono, Manrope, Playfair_Display } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/shared/providers/theme-provider";

const displayFont = Playfair_Display({
  weight: ["500", "700"],
  subsets: ["latin"],
  variable: "--font-display",
});

const bodyFont = Manrope({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-body",
});

const monoFont = JetBrains_Mono({
  weight: ["400", "600"],
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Matchday Atlas",
  description: "Matchday results and tables for your favorite leagues.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${displayFont.variable} ${bodyFont.variable} ${monoFont.variable} antialiased`}
      >
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
