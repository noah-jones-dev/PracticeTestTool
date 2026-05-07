import { useEffect, useRef, useState } from 'react';

export function AnimatedNumber({ value, duration = 600 }) {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  const startRef = useRef(performance.now());
  const rafRef = useRef(null);

  useEffect(() => {
    fromRef.current = display;
    startRef.current = performance.now();
    cancelAnimationFrame(rafRef.current);

    const tick = () => {
      const t = Math.min(1, (performance.now() - startRef.current) / duration);
      const eased =
        t < 1
          ? 1 - Math.pow(1 - t, 3) + Math.sin(t * Math.PI) * 0.06 * (1 - t)
          : 1;
      const next = fromRef.current + (value - fromRef.current) * eased;
      setDisplay(Math.round(next));
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
      else setDisplay(value);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return <>{display}</>;
}

export function ScoreRing({ correct, incorrect, total, size = 160, stroke = 14 }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const correctLen = total > 0 ? (correct / total) * c : 0;
  const incorrectLen = total > 0 ? (incorrect / total) * c : 0;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--hairline)" strokeWidth={stroke} />
      <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--correct)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${correctLen} ${c}`}
          style={{ transition: 'stroke-dasharray .55s cubic-bezier(.5,1.6,.4,1)' }}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--incorrect)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${incorrectLen} ${c}`}
          strokeDashoffset={-correctLen}
          style={{ transition: 'stroke-dasharray .55s cubic-bezier(.5,1.6,.4,1), stroke-dashoffset .55s cubic-bezier(.5,1.6,.4,1)' }}
        />
      </g>
    </svg>
  );
}
