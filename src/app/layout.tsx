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
    default: "Spieltag",
    template: "%s | Spieltag",
  },
  description: "Spieltagsergebnisse und Tabellen für deine Lieblingsligen.",
  applicationName: "Spieltag",
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Spieltag",
    title: "Spieltag",
    description: "Spieltagsergebnisse und Tabellen für deine Lieblingsligen.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Spieltag",
    description: "Spieltagsergebnisse und Tabellen für deine Lieblingsligen.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f2ec" },
    { media: "(prefers-color-scheme: dark)", color: "#07110f" },
  ],
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
