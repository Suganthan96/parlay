'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ParlayLogo } from './ui/ParlayLogo';
import clsx from 'clsx';

const NAV = [
  { label: 'Markets', href: '/' },
  { label: 'Parlay',  href: '/parlay' },
  { label: 'Tickets', href: '/tickets' },
  { label: 'LP',      href: '/lp' },
];

function LiveClock() {
  const [time, setTime] = useState('');
  useEffect(() => {
    const tick = () => {
      const d = new Date();
      const t = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' });
      setTime(`${t} IST`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return <span>{time}</span>;
}

export function TopBar() {
  const path = usePathname();
  return (
    <header style={{ borderBottom: '1px solid var(--border)', background: 'var(--paper)', position: 'sticky', top: 0, zIndex: 100 }}>
      <div style={{ maxWidth: 1440, margin: '0 auto', display: 'grid', gridTemplateColumns: 'auto 1fr auto', borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)' }}>
        {/* Logo cell */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 24px', borderRight: '1px solid var(--border)', textDecoration: 'none', color: 'var(--ink)' }}>
          <ParlayLogo size={22} />
          <span style={{ fontWeight: 600, fontSize: 13, letterSpacing: '-0.01em' }}>PARLAY</span>
        </Link>

        {/* Clock */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '0 20px', borderRight: '1px solid var(--border)' }}>
          <span className="mono" style={{ fontSize: 10 }}><LiveClock /></span>
        </div>

        {/* Nav */}
        <nav style={{ display: 'flex', alignItems: 'center' }}>
          {NAV.map(n => (
            <Link
              key={n.href}
              href={n.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                height: '100%',
                padding: '14px 18px',
                borderRight: '1px solid var(--border)',
                textDecoration: 'none',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: path === n.href ? 'var(--paper)' : 'var(--ink)',
                background: path === n.href ? 'var(--ink)' : 'transparent',
              }}
            >
              {n.label}
            </Link>
          ))}
          <div style={{ padding: '14px 24px', background: 'var(--ink)', color: 'var(--paper)' }}>
            <span className="mono">
              {process.env.NEXT_PUBLIC_MOCK === 'true' ? '● MOCK MODE' : 'CONNECT →'}
            </span>
          </div>
        </nav>
      </div>
    </header>
  );
}
