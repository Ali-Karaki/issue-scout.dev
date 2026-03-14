import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "IssueScout",
  description: "Find OSS issues that don't appear to have an open PR referencing them",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-bg text-zinc-200 text-[15px] leading-relaxed font-sans antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-6 focus:z-50 focus:px-4 focus:py-2 focus:rounded-lg focus:bg-amber-600 focus:text-zinc-900 focus:outline-none"
        >
          Skip to content
        </a>
        <Header />
        <main id="main" tabIndex={-1}>{children}</main>
      </body>
    </html>
  );
}
