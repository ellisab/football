import type { Metadata, Viewport } from "next";
import {
  JetBrains_Mono,
  Space_Grotesk,
} from "next/font/google";
import "./globals.css";
import { siteUrl } from "@/lib/site-config";
import { AppShell } from "@/features/shell/components/app-shell";

const stadiumBodyFont = Space_Grotesk({
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
    default: "spieltag.day",
    template: "%s | spieltag.day",
  },
  description: "Spieltagsergebnisse und Tabellen für deine Lieblingsligen.",
  applicationName: "spieltag.day",
  icons: {
    icon: [{ url: "/icon.svg?v=2", type: "image/svg+xml", sizes: "any" }],
    shortcut: "/icon.svg?v=2",
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "spieltag.day",
    title: "spieltag.day",
    description: "Spieltagsergebnisse und Tabellen für deine Lieblingsligen.",
  },
  twitter: {
    card: "summary_large_image",
    title: "spieltag.day",
    description: "Spieltagsergebnisse und Tabellen für deine Lieblingsligen.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#f7f6f2",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body
        className={`${stadiumBodyFont.variable} ${monoFont.variable} antialiased`}
      >
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
