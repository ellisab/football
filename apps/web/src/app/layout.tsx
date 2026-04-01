import type { Metadata } from "next";
import {
  Barlow,
  Barlow_Condensed,
  JetBrains_Mono,
} from "next/font/google";
import "./globals.css";
import { siteUrl } from "@/lib/site-config";

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
  metadataBase: new URL(siteUrl),
  title: {
    default: "Spieltag-Atlas",
    template: "%s | Spieltag-Atlas",
  },
  description: "Spieltagsergebnisse und Tabellen für deine Lieblingsligen.",
  applicationName: "Spieltag-Atlas",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Spieltag-Atlas",
    title: "Spieltag-Atlas",
    description: "Spieltagsergebnisse und Tabellen für deine Lieblingsligen.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Spieltag-Atlas",
    description: "Spieltagsergebnisse und Tabellen für deine Lieblingsligen.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body
        className={`${stadiumHeadingFont.variable} ${stadiumBodyFont.variable} ${monoFont.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
