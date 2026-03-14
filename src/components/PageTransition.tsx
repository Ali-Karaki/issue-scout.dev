"use client";

import { motion } from "motion/react";
import { useReducedMotion } from "motion/react";
import { fadeInUp, fadeInUpReduced, defaultTransition } from "@/lib/animations";

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

export function PageTransition({ children, className }: PageTransitionProps) {
  const reduceMotion = useReducedMotion();
  const variants = reduceMotion ? fadeInUpReduced : fadeInUp;

  return (
    <motion.div
      className={className}
      variants={variants}
      initial="hidden"
      animate="visible"
      transition={defaultTransition}
    >
      {children}
    </motion.div>
  );
}
