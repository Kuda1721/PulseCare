import { useEffect, useRef, useState } from 'react';

interface Props {
  value: number;
  decimals?: number;
  duration?: number;
  className?: string;
}

export function AnimatedNumber({ value, decimals = 0, duration = 600, className = '' }: Props) {
  const [display, setDisplay] = useState(value);
  const prevRef = useRef(value);
  const rafRef = useRef<number>(0);
  const startRef = useRef<number>(0);
  const startValRef = useRef(value);

  useEffect(() => {
    if (value === prevRef.current) return;
    const from = prevRef.current;
    prevRef.current = value;
    startValRef.current = from;

    cancelAnimationFrame(rafRef.current);
    startRef.current = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startRef.current;
      const progress = Math.min(1, elapsed / duration);
      // ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = from + (value - from) * eased;
      setDisplay(parseFloat(current.toFixed(decimals)));
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value, decimals, duration]);

  return (
    <span className={className}>
      {decimals > 0 ? display.toFixed(decimals) : Math.round(display)}
    </span>
  );
}
