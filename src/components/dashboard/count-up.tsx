"use client";

import * as React from "react";
import { useReducedMotion } from "motion/react";

// easeOutExpo — mismo carácter que la curva de marca, sin rebote.
const easeOutExpo = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

type CountUpProps = {
  value: number;
  decimals?: number;
  duration?: number; // ms
  suffix?: string;
  prefix?: string;
  className?: string;
};

/**
 * Numeral que cuenta hacia arriba al montar. Renderiza el valor final en el
 * primer paint (coincide con el SSR); la animación arranca en el efecto, de
 * modo que no hay desajuste de hidratación.
 */
export function CountUp({
  value,
  decimals = 0,
  duration = 1100,
  suffix = "",
  prefix = "",
  className,
}: CountUpProps) {
  const reduce = useReducedMotion();
  const [display, setDisplay] = React.useState(value);
  // Punto de partida de la animación: 0 al montar, valor previo al filtrar.
  const prevRef = React.useRef(0);

  React.useEffect(() => {
    if (reduce) {
      setDisplay(value);
      prevRef.current = value;
      return;
    }
    let raf = 0;
    let start: number | null = null;
    const from = prevRef.current;
    const step = (ts: number) => {
      if (start === null) start = ts;
      const t = Math.min(1, (ts - start) / duration);
      setDisplay(from + (value - from) * easeOutExpo(t));
      if (t < 1) raf = requestAnimationFrame(step);
      else {
        setDisplay(value);
        prevRef.current = value;
      }
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, duration, reduce]);

  const text = display.toLocaleString("es-VE", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return (
    <span className={className} suppressHydrationWarning>
      {prefix}
      {text}
      {suffix}
    </span>
  );
}
