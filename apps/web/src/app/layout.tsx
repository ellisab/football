import type { Metadata } from "next";
import {
  Barlow,
  Barlow_Condensed,
  JetBrains_Mono,
} from "next/font/google";
import "./globals.css";

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
    <html lang="en">
      <body
        className={`${stadiumHeadingFont.variable} ${stadiumBodyFont.variable} ${monoFont.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
