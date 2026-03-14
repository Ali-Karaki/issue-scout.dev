import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TanStack Unclaimed Issues",
  description: "View unclaimed issues across TanStack repositories",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-bg text-zinc-200 text-[15px] leading-relaxed">
        {children}
      </body>
    </html>
  );
}
