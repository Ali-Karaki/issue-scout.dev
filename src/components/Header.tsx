"use client";

import { Link } from "next-view-transitions";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";

export function Header() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const isIssues = pathname === "/issues" || pathname.startsWith("/project/");

  return (
    <header className="border-b border-zinc-700 bg-zinc-900/50">
      <nav className="max-w-4xl mx-auto px-6 py-5 flex items-center justify-between gap-4">
        <Link
          href="/"
          className="text-xl font-semibold flex items-center no-underline text-inherit hover:text-amber-500 transition-colors duration-200"
        >
          Issue<span className="text-amber-500">Scout</span>
        </Link>
        <div className="flex gap-6">
          <Link
            href="/"
            className={`relative text-base no-underline transition-colors duration-200 py-1 ${
              isHome ? "text-zinc-200" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Home
            {isHome && (
              <motion.span
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 rounded"
                layoutId="header-active"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
          </Link>
          <Link
            href="/issues"
            className={`relative text-base no-underline transition-colors duration-200 py-1 ${
              isIssues ? "text-zinc-200" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Issues
            {isIssues && (
              <motion.span
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 rounded"
                layoutId="header-active"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
          </Link>
        </div>
      </nav>
    </header>
  );
}
