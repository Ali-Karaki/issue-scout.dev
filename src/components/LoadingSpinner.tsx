"use client";

import { motion } from "motion/react";
import { fadeIn, defaultTransition } from "@/lib/animations";

interface LoadingSpinnerProps {
  message?: string;
  className?: string;
}

export function LoadingSpinner({ message = "Loading issues...", className }: LoadingSpinnerProps) {
  return (
    <motion.div
      className={`text-center py-16 text-zinc-500 ${className ?? ""}`}
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      transition={defaultTransition}
      role="status"
      aria-label="Loading"
    >
      <div className="w-10 h-10 border-2 border-zinc-600 border-t-amber-500 rounded-full animate-spin mx-auto mb-4" />
      <p>{message}</p>
    </motion.div>
  );
}
