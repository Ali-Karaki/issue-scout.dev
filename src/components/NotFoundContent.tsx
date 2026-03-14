"use client";

import { Link } from "next-view-transitions";
import { motion } from "motion/react";
import { fadeIn, defaultTransition } from "@/lib/animations";

export function NotFoundContent() {
  return (
    <motion.div
      className="max-w-4xl mx-auto px-4 sm:px-6 py-12"
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      transition={defaultTransition}
    >
      <h1 className="text-xl font-semibold text-zinc-100 mb-2">Page not found</h1>
      <p className="text-zinc-500 mb-4">
        The page you&apos;re looking for doesn&apos;t exist.
      </p>
      <Link
        href="/"
        className="text-amber-500 hover:text-amber-400 hover:underline transition-colors duration-200"
      >
        Back to home
      </Link>
    </motion.div>
  );
}
