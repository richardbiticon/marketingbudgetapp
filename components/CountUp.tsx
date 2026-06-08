"use client";
import * as React from "react";
import { animate } from "framer-motion";

// Counts a number up on mount and whenever the target changes.
export function CountUp({
  value,
  format,
  className,
  duration = 0.9,
}: {
  value: number;
  format: (n: number) => string;
  className?: string;
  duration?: number;
}) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const prev = React.useRef(0);

  React.useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const controls = animate(prev.current, value, {
      duration,
      ease: [0.2, 0.7, 0.2, 1],
      onUpdate(v) {
        node.textContent = format(v);
      },
    });
    prev.current = value;
    return () => controls.stop();
  }, [value, duration, format]);

  return <span ref={ref} className={className}>{format(value)}</span>;
}
