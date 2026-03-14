import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ViewTransitions } from "next-view-transitions";
import "./globals.css";
import { Header } from "@/components/Header";
import { JsonLd } from "@/components/JsonLd";
import { SWRCacheProvider } from "@/components/SWRCacheProvider";
import { TooltipProvider } from "@/components/ui/Tooltip";
import { SITE_URL } from "@/lib/constants";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

const siteUrl = SITE_URL;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "IssueScout",
    template: "%s | IssueScout",
  },
  description:
    "Find OSS issues that don't appear to have an open PR referencing them",
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "IssueScout",
    title: "IssueScout",
    description:
      "Find OSS issues that don't appear to have an open PR referencing them",
  },
  twitter: {
    card: "summary_large_image",
    title: "IssueScout",
    description:
      "Find OSS issues that don't appear to have an open PR referencing them",
  },
  alternates: {
    canonical: siteUrl,
  },
};

export const viewport: Viewport = {
  themeColor: "#0d0d0f",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ViewTransitions>
      <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-bg text-zinc-200 text-[15px] leading-relaxed font-sans antialiased">
        <JsonLd />
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 sm:focus:left-6 focus:z-50 focus:px-4 focus:py-2 focus:rounded-lg focus:bg-amber-600 focus:text-zinc-900 focus:outline-none"
        >
          Skip to content
        </a>
        <Header />
        <TooltipProvider>
          <SWRCacheProvider>
            <main id="main" tabIndex={-1}>{children}</main>
          </SWRCacheProvider>
        </TooltipProvider>
      </body>
    </html>
    </ViewTransitions>
  );
}
