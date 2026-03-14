"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { useReducedMotion } from "motion/react";
import { fadeInUp, fadeInUpReduced, defaultTransition } from "@/lib/animations";

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

export function PageTransition({ children, className }: PageTransitionProps) {
  const [mounted, setMounted] = useState(false);
  const reduceMotion = useReducedMotion();
  const variants = reduceMotion ? fadeInUpReduced : fadeInUp;

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Render plain div on server/first paint to avoid motion style hydration mismatch
  if (!mounted) {
    return <div className={className}>{children}</div>;
  }

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
