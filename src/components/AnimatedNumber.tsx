"use client";

import { useState, useEffect, useRef } from "react";
import { animate } from "motion/react";
import { useReducedMotion } from "motion/react";

interface AnimatedNumberProps {
  value: number;
  className?: string;
  /** Duration in seconds */
  duration?: number;
}

export function AnimatedNumber({
  value,
  className,
  duration = 0.4,
}: AnimatedNumberProps) {
  const [display, setDisplay] = useState(value);
  const prevRef = useRef(value);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) {
      setDisplay(value);
      prevRef.current = value;
      return;
    }
    const from = prevRef.current;
    const controls = animate(from, value, {
      duration,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    prevRef.current = value;
    return () => controls.stop();
  }, [value, duration, reduceMotion]);

  return <span className={className}>{display}</span>;
}
