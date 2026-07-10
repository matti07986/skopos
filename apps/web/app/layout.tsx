import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ProjectProvider } from "@/components/ProjectContext";
import { DataProvider } from "@/components/DataContext";

const inter = Inter({
  subsets: ["latin"],
  display: "block",
  preload: true,
  fallback: ["system-ui", "-apple-system", "arial"],
  adjustFontFallback: true,
});

const SITE_URL = "https://skopos.ink";
const SITE_TITLE = "Skopos — Boring log infrastructure. Smart AI on top.";
const SITE_DESCRIPTION =
  "Log monitoring SaaS for indie developers and small teams. Reliable ingestion, fast search, sensible retention — and an AI chat layer on top so you can actually understand what's happening.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  icons: { icon: "/favicon.svg", apple: "/favicon.svg" },
  openGraph: {
    type: "website",
    url: SITE_URL,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    siteName: "Skopos",
    locale: "en_US",
    // The OG image is auto-picked up from app/opengraph-image.tsx
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    // The Twitter image is auto-picked up from app/twitter-image.tsx
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.className} h-full`} style={{ backgroundColor: "#000000" }}>
      <head></head>
      <body className={`${inter.className} bg-brand-bg text-[#e6edf3] min-h-full antialiased`} style={{ backgroundColor: "#000000", overflowX: "hidden" }}>
        <ProjectProvider>
          <DataProvider>
            {children}
          </DataProvider>
        </ProjectProvider>
      </body>
    </html>
  );
}
