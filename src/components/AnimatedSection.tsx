"use client";

import { motion } from "motion/react";
import { useReducedMotion } from "motion/react";
import {
  fadeInUp,
  fadeInUpReduced,
  staggerContainer,
  staggerItem,
  staggerItemFade,
  defaultTransition,
} from "@/lib/animations";

interface AnimatedSectionProps {
  children: React.ReactNode;
  className?: string;
  /** Use stagger for container with multiple children to animate */
  stagger?: boolean;
  /** Delay before animation starts (seconds) */
  delay?: number;
}

export function AnimatedSection({
  children,
  className,
  stagger = false,
  delay = 0,
}: AnimatedSectionProps) {
  const reduceMotion = useReducedMotion();
  const variants = reduceMotion ? fadeInUpReduced : fadeInUp;

  if (stagger) {
    return (
      <motion.div
        className={className}
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        transition={{
          ...defaultTransition,
          delayChildren: delay,
        }}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      className={className}
      variants={variants}
      initial="hidden"
      animate="visible"
      transition={{
        ...defaultTransition,
        delay,
      }}
    >
      {children}
    </motion.div>
  );
}

interface AnimatedItemProps {
  children: React.ReactNode;
  className?: string;
  /** Use fade-only variant (no y) for items inside stagger container */
  fadeOnly?: boolean;
}

export function AnimatedItem({
  children,
  className,
  fadeOnly = false,
}: AnimatedItemProps) {
  const variants = fadeOnly ? staggerItemFade : staggerItem;

  return (
    <motion.div className={className} variants={variants}>
      {children}
    </motion.div>
  );
}
