'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MOCK_SLIPS } from '@/lib/mock';
import { Countdown } from '@/components/ui/Countdown';
import { useParlayStore } from '@/lib/store';
import type { Slip } from '@/lib/types';

type Sort = 'copies' | 'kickoff' | 'payout';

function SlipCard({ slip }: { slip: Slip }) {
  const { addLeg, clearLegs } = useParlayStore();

  function copySlip() {
    clearLegs();
    slip.legs.forEach(l => addLeg(l));
  }

  return (
    <div style={{ background: 'var(--white)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
        <span className="text-label" style={{ fontSize: 10 }}>■ {slip.creator}</span>
        <Countdown target={slip.kickoff} />
      </div>

      <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {slip.legs.map((leg, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>{leg.marketLabel}</span>
            <span className="text-label" style={{ fontSize: 11 }}>{leg.price.toFixed(2)}</span>
          </div>
        ))}
      </div>

      <div className="page-grid" style={{ background: 'var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="gc-1-2" style={{ background: 'var(--white)', padding: '16px' }}>
          <span className="text-label" style={{ display: 'block', marginBottom: 6, fontSize: 10 }}>■ COPIES</span>
          <div style={{ fontSize: 'clamp(36px,5vw,64px)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1 }}>{slip.copies}</div>
        </div>
        <div className="gc-3-4" style={{ background: 'var(--white)', padding: '16px' }}>
          <span className="text-label" style={{ display: 'block', marginBottom: 6, fontSize: 10 }}>■ QUOTED PRICE</span>
          <div style={{ fontSize: 'clamp(36px,5vw,64px)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1 }}>{slip.quotedPrice.toFixed(3)}</div>
        </div>
      </div>

      <div style={{ padding: '16px' }}>
        <Link href="/parlay" onClick={copySlip}
          style={{ display: 'flex', justifyContent: 'center', padding: '12px', background: 'var(--black)', color: 'var(--white)', textDecoration: 'none', fontWeight: 700, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          COPY SLIP →
        </Link>
      </div>
    </div>
  );
}

export default function SlipsPage() {
  const [sort, setSort] = useState<Sort>('copies');
  const sorted = [...MOCK_SLIPS].sort((a, b) =>
    sort === 'copies'  ? b.copies - a.copies :
    sort === 'kickoff' ? a.kickoff - b.kickoff :
    a.quotedPrice - b.quotedPrice
  );

  return (
    <div style={{ maxWidth: 1440, margin: '0 auto', borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)' }}>
      {/* Headline */}
      <div style={{ background: 'var(--white)', padding: 'clamp(32px,5vw,72px) clamp(24px,4vw,56px)', borderBottom: '1px solid var(--border)' }}>
        <p className="text-label" style={{ color: '#aaa', marginBottom: 16, fontSize: 10 }}>■ TOP SLIPS · ON-CHAIN</p>
        <h1 className="text-display" style={{ fontSize: 'clamp(56px,9vw,140px)' }}>COPY THE<br/>CROWD.</h1>
      </div>

      {/* Sort bar */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--white)' }}>
        <span className="text-label" style={{ padding: '14px 20px', fontSize: 10, color: '#aaa', borderRight: '1px solid var(--border)' }}>SORT BY:</span>
        {(['copies', 'kickoff', 'payout'] as Sort[]).map(s => (
          <button key={s} onClick={() => setSort(s)}
            style={{ padding: '14px 20px', borderRight: '1px solid var(--border)', background: sort === s ? 'var(--black)' : 'transparent', color: sort === s ? 'var(--white)' : 'var(--black)', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            {s === 'copies' ? 'MOST COPIED' : s === 'kickoff' ? 'KICKING OFF SOON' : 'HIGHEST PAYOUT'}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div style={{ padding: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 1, background: 'var(--border)', margin: 24 }}>
        {sorted.map(s => <SlipCard key={s.id} slip={s} />)}
      </div>
    </div>
  );
}
