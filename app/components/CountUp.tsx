"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  end: number;
  decimals?: number;
  duration?: number;
}

export default function CountUp({ end, decimals = 0, duration = 1500 }: Props) {
  const [value, setValue] = useState(0);
  const spanRef = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = spanRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const startTime = performance.now();
          const step = (now: number) => {
            const progress = Math.min((now - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = eased * end;
            setValue(parseFloat(current.toFixed(decimals)));
            if (progress < 1) {
              requestAnimationFrame(step);
            } else {
              setValue(end);
            }
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [end, decimals, duration]);

  const display =
    decimals === 0 ? Math.round(value).toLocaleString() : value.toFixed(decimals);

  return <span ref={spanRef}>{display}</span>;
}
