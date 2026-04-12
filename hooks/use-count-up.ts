'use client';

import { useState, useEffect, useRef } from 'react';

export function useCountUp(target: number, duration = 1200): number {
  const [value, setValue] = useState(0);
  const prevTarget = useRef<number | null>(null);

  useEffect(() => {
    if (target === 0 || target === prevTarget.current) return;
    prevTarget.current = target;

    setValue(0);
    const steps = 36;
    const interval = duration / steps;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setValue(Math.round(target * eased));
      if (step >= steps) {
        setValue(target);
        clearInterval(timer);
      }
    }, interval);
    return () => clearInterval(timer);
  }, [target, duration]);

  return value;
}
