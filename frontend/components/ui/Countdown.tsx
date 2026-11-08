'use client';

import { useEffect, useState } from 'react';

function fmt(ms: number): string {
  if (ms <= 0) return 'LIVE';
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}H ${m.toString().padStart(2,'0')}M`;
  return `${m.toString().padStart(2,'0')}M ${sec.toString().padStart(2,'0')}S`;
}

export function Countdown({ target }: { target: number }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  return <span className="mono">{fmt(target - now)}</span>;
}
