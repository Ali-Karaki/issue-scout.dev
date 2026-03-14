"use client";

import { Link } from "next-view-transitions";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { SUGGEST_ISSUE_URL } from "@/lib/constants";

export function Header() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const isIssues = pathname === "/issues" || pathname.startsWith("/project/");

  return (
    <header className="border-b border-zinc-700 bg-zinc-900/50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between gap-4 flex-wrap">
        <Link
          href="/"
          className="text-lg sm:text-xl font-semibold flex items-center no-underline text-inherit hover:text-amber-500 transition-colors duration-200"
        >
          Issue<span className="text-amber-500">Scout</span>
        </Link>
        <div className="flex gap-2 sm:gap-6 flex-wrap">
          <Link
            href="/"
            className={`relative text-base no-underline transition-colors duration-200 py-1 min-h-[44px] sm:min-h-0 flex items-center ${
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
            className={`relative text-base no-underline transition-colors duration-200 py-1 min-h-[44px] sm:min-h-0 flex items-center ${
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
          {SUGGEST_ISSUE_URL && (
            <a
              href={SUGGEST_ISSUE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-base text-zinc-400 hover:text-zinc-200 no-underline transition-colors duration-200 py-1 min-h-[44px] sm:min-h-0 flex items-center"
            >
              Suggest
            </a>
          )}
        </div>
      </nav>
    </header>
  );
}
