import type { Metadata } from "next";
import {
  Barlow,
  Barlow_Condensed,
  DM_Sans,
  DM_Serif_Display,
  JetBrains_Mono,
} from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/shared/providers/theme-provider";

const stadiumHeadingFont = Barlow_Condensed({
  weight: ["600", "700", "800", "900"],
  subsets: ["latin"],
  variable: "--font-stadium-heading",
});

const stadiumBodyFont = Barlow({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-stadium-body",
});

const gazetteHeadingFont = DM_Serif_Display({
  weight: ["400"],
  subsets: ["latin"],
  variable: "--font-gazette-heading",
});

const gazetteBodyFont = DM_Sans({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  variable: "--font-gazette-body",
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
        className={`${stadiumHeadingFont.variable} ${stadiumBodyFont.variable} ${gazetteHeadingFont.variable} ${gazetteBodyFont.variable} ${monoFont.variable} antialiased`}
      >
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
