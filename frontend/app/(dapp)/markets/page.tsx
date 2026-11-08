'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSuiClientContext } from '@mysten/dapp-kit';
import { useParlayStore } from '@/lib/store';
import { useFootballOdds, useSuiUsdPrice } from '@/lib/hooks';
import type { PolyMarket } from '@/app/api/polymarkets/route';
import type { BookmakerOdds } from '@/lib/tatum';
import type { Network } from '@/lib/sui-client';

// ── Chart helpers (unchanged from original) ───────────────────────────────────

type PricePoint = { t: number; p: number };

function seeded(seed: number) {
  let s = seed;
  return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff; };
}

function simulatePath(endPrice: number, seed: number, steps = 60): number[] {
  const rng = seeded(seed);
  const pts: number[] = [];
  let v = 0.4 + rng() * 0.2;
  for (let i = 0; i < steps; i++) {
    const drift = (endPrice - v) * 0.06;
    v = Math.min(0.98, Math.max(0.02, v + drift + (rng() - 0.5) * 0.04));
    pts.push(v);
  }
  pts[pts.length - 1] = endPrice;
  return pts;
}

function Chart3D({ history, currentPrice, loading, marketSeed = 1, color = '#00dc82' }: {
  history: PricePoint[]; currentPrice: number; loading: boolean; marketSeed?: number; color?: string;
}) {
  const W = 480, H = 220;
  const pad = { l: 32, r: 12, t: 14, b: 28 };
  const iW = W - pad.l - pad.r;
  const iH = H - pad.t - pad.b;

  const isFallback = !loading && history.length < 2;
  const rawPts = history.length > 1
    ? history.map(h => h.p)
    : loading ? null : simulatePath(currentPrice, marketSeed);
  const pts = rawPts && rawPts.length > 1 ? rawPts : null;
  const x = (i: number, len: number) => pad.l + (i / (len - 1)) * iW;
  const y = (v: number) => pad.t + (1 - Math.min(1, Math.max(0, v))) * iH;
  const gradId = `grad-${marketSeed}`;

  return (
    <div style={{ perspective: '800px', perspectiveOrigin: '50% 65%' }}>
      <div style={{ transform: 'rotateX(22deg) rotateY(-5deg) scale(1.05)', transformOrigin: '50% 50%', transformStyle: 'preserve-3d', filter: 'drop-shadow(0 12px 24px rgba(0,220,130,0.08))' }}>
        <svg width={W} height={H} style={{ display: 'block' }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={color} stopOpacity="0.35" />
              <stop offset="100%" stopColor={color} stopOpacity="0.0" />
            </linearGradient>
          </defs>
          {[0.2, 0.4, 0.6, 0.8].map(g => (
            <g key={g}>
              <line x1={pad.l} y1={y(g)} x2={W - pad.r} y2={y(g)} stroke="#ffffff12" strokeWidth={1} strokeDasharray="4 4" />
              <text x={pad.l - 5} y={y(g) + 4} textAnchor="end" fill="#666" fontSize={11} fontFamily="monospace">{(g * 100).toFixed(0)}%</text>
            </g>
          ))}
          <line x1={pad.l} y1={H - pad.b} x2={W - pad.r} y2={H - pad.b} stroke="#333" strokeWidth={1} />
          <text x={pad.l} y={H - pad.b + 15} fill="#666" fontSize={11} fontFamily="monospace">30d ago</text>
          <text x={W - pad.r} y={H - pad.b + 15} textAnchor="end" fill="#666" fontSize={11} fontFamily="monospace">now</text>
          {loading && <text x={W / 2} y={H / 2} textAnchor="middle" fill="#555" fontSize={13} fontFamily="monospace">LOADING…</text>}
          {pts && (() => {
            const len = pts.length;
            const fillPath = `M${x(0,len)},${y(pts[0])} ` + pts.slice(1).map((v,i)=>`L${x(i+1,len)},${y(v)}`).join(' ') + ` L${x(len-1,len)},${H-pad.b} L${x(0,len)},${H-pad.b} Z`;
            const linePts = pts.map((v,i)=>`${x(i,len)},${y(v)}`).join(' ');
            const lastX = x(len-1,len); const lastY = y(pts[len-1]);
            return (
              <>
                <path d={fillPath} fill={`url(#${gradId})`} />
                <polyline points={linePts} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
                <circle cx={lastX} cy={lastY} r={6} fill={color} opacity={0.15} />
                <circle cx={lastX} cy={lastY} r={3.5} fill={color} />
                <line x1={lastX} y1={lastY} x2={W-pad.r} y2={lastY} stroke={color} strokeWidth={1} strokeDasharray="3 3" opacity={0.4} />
                <text x={W-pad.r+2} y={lastY+4} fill={color} fontSize={11} fontFamily="monospace" fontWeight="700">{(pts[len-1]*100).toFixed(0)}%</text>
              </>
            );
          })()}
        </svg>
      </div>
      {isFallback && <p style={{ fontSize: 10, color: '#555', textAlign: 'right', marginTop: 6, letterSpacing: '0.08em', fontFamily: 'monospace' }}>SIMULATED · TATUM BOOKMAKER ODDS</p>}
    </div>
  );
}

// ── Football Market Card (Tatum + Sui on-chain) ───────────────────────────────

function FootballCard({ match, suiPrice }: { match: BookmakerOdds; suiPrice: number }) {
  const { addLeg, hasMarket } = useParlayStore();
  const inHome = hasMarket(`${match.matchId}-home`);
  const inAway = hasMarket(`${match.matchId}-away`);
  const homeProb = 1 / match.homeOdds;
  const awayProb = 1 / match.awayOdds;
  const kicks = new Date(match.kickoff * 1000).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <div style={{ background: 'var(--white)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="text-label" style={{ fontSize: 9, color: '#888' }}>⚽ FOOTBALL · {kicks}</span>
        <span style={{ fontSize: 9, color: 'var(--mint)', fontWeight: 800 }}>■ TATUM ODDS</span>
      </div>
      <div style={{ padding: '20px 16px', flex: 1 }}>
        <p style={{ fontSize: 14, fontWeight: 800, lineHeight: 1.3, marginBottom: 16 }}>
          {match.homeTeam} vs {match.awayTeam}
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <button
            onClick={() => addLeg({ marketId: `${match.matchId}-home`, marketLabel: `${match.homeTeam} vs ${match.awayTeam}`, outcome: `${match.homeTeam} Win`, price: homeProb, marketObjectId: match.matchId, outcomeIdx: 1 })}
            disabled={inHome}
            style={{ padding: '14px 8px', background: inHome ? '#00dc8215' : '#00dc82', color: inHome ? '#00dc82' : '#000', border: inHome ? '1px solid #00dc8244' : 'none', cursor: inHome ? 'default' : 'pointer', fontWeight: 900, fontSize: 12, textAlign: 'center' }}
          >
            <div style={{ fontSize: 20, fontWeight: 900 }}>{match.homeOdds.toFixed(2)}×</div>
            <div style={{ fontSize: 10, opacity: 0.8 }}>{inHome ? '✓ IN PARLAY' : match.homeTeam.split(' ').pop()?.toUpperCase()}</div>
          </button>
          <button
            onClick={() => addLeg({ marketId: `${match.matchId}-away`, marketLabel: `${match.homeTeam} vs ${match.awayTeam}`, outcome: `${match.awayTeam} Win`, price: awayProb, marketObjectId: match.matchId, outcomeIdx: 2 })}
            disabled={inAway}
            style={{ padding: '14px 8px', background: 'transparent', color: inAway ? '#555' : 'var(--black)', border: `1px solid ${inAway ? '#1a1a1a' : 'var(--border)'}`, cursor: inAway ? 'default' : 'pointer', fontWeight: 900, fontSize: 12, textAlign: 'center' }}
          >
            <div style={{ fontSize: 20, fontWeight: 900 }}>{match.awayOdds.toFixed(2)}×</div>
            <div style={{ fontSize: 10, opacity: 0.8 }}>{inAway ? '✓ IN PARLAY' : match.awayTeam.split(' ').pop()?.toUpperCase()}</div>
          </button>
        </div>
        <div style={{ marginTop: 10, height: 4, background: '#f5f5f5', borderRadius: 2, overflow: 'hidden', display: 'flex' }}>
          <div style={{ height: '100%', width: `${homeProb * 100}%`, background: '#00dc82', transition: 'width 0.3s' }} />
          <div style={{ height: '100%', flex: 1, background: '#dc2626', opacity: 0.4 }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 10, color: '#888' }}>
          <span>{(homeProb * 100).toFixed(0)}% home</span>
          <span>{(awayProb * 100).toFixed(0)}% away</span>
        </div>
      </div>
    </div>
  );
}

// ── Polymarket modal (unchanged logic, updated leg type) ──────────────────────

function MarketDetailModal({ market, onClose }: { market: PolyMarket; onClose: () => void }) {
  const { addLeg, hasMarket } = useParlayStore();
  const [history, setHistory]           = useState<PricePoint[]>([]);
  const [chartLoading, setChartLoading] = useState(true);

  const marketId = `poly-${market.id}`;
  const inYes    = hasMarket(marketId);
  const inNo     = hasMarket(`${marketId}-no`);
  const daysLeft = Math.max(0, Math.ceil((new Date(market.endDate).getTime() - Date.now()) / 86400000));
  const vol = market.volume24hr >= 1_000_000 ? `$${(market.volume24hr/1_000_000).toFixed(1)}M` : `$${(market.volume24hr/1000).toFixed(0)}k`;
  const liq = market.liquidity  >= 1_000_000 ? `$${(market.liquidity/1_000_000).toFixed(1)}M` : `$${(market.liquidity/1000).toFixed(0)}k`;

  useEffect(() => {
    if (!market.clobTokenId) { setChartLoading(false); return; }
    setChartLoading(true);
    fetch(`/api/pricehistory?tokenId=${market.clobTokenId}`)
      .then(r => r.json())
      .then((data: PricePoint[]) => { setHistory(Array.isArray(data) ? data : []); setChartLoading(false); })
      .catch(() => setChartLoading(false));
  }, [market.clobTokenId]);

  const marketSeed = market.id.split('').reduce((a,c) => a + c.charCodeAt(0), 0);

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#0a0a0a', border: '1px solid #1e1e1e', width: '100%', maxWidth: 1060, maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 48px 96px rgba(0,0,0,0.8)' }}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid #1a1a1a', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            {market.image && <img src={market.image} alt="" style={{ width: 48, height: 48, objectFit: 'cover', flexShrink: 0, borderRadius: 3 }} />}
            <div>
              <p style={{ fontSize: 11, color: '#777', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>POLYMARKET · {daysLeft}d left · {vol} 24h vol</p>
              <p style={{ fontSize: 20, fontWeight: 800, color: '#fff', lineHeight: 1.35, maxWidth: 700 }}>{market.question}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#777', cursor: 'pointer', fontSize: 22, lineHeight: 1, flexShrink: 0, padding: 4 }}>✕</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 0 }}>
          <div style={{ padding: '24px 24px 20px', borderRight: '1px solid #1a1a1a' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <p style={{ fontSize: 11, color: '#666', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>■ YES PROBABILITY — 30 DAY {history.length > 1 ? 'REAL DATA' : 'SIMULATED'}</p>
              <div style={{ display: 'flex', gap: 20, alignItems: 'baseline' }}>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 10, color: '#00dc82', fontWeight: 700, letterSpacing: '0.08em', marginBottom: 2 }}>YES</p>
                  <p style={{ fontSize: 40, fontWeight: 900, letterSpacing: '-0.04em', color: '#00dc82', lineHeight: 1 }}>{(market.yesPrice * 100).toFixed(0)}%</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 10, color: '#777', fontWeight: 700, letterSpacing: '0.08em', marginBottom: 2 }}>NO</p>
                  <p style={{ fontSize: 40, fontWeight: 900, letterSpacing: '-0.04em', color: '#777', lineHeight: 1 }}>{((1-market.yesPrice) * 100).toFixed(0)}%</p>
                </div>
              </div>
            </div>
            <div style={{ width: '100%', overflowX: 'hidden' }}>
              <Chart3D history={history} currentPrice={market.yesPrice} loading={chartLoading} marketSeed={marketSeed} />
            </div>
            <div style={{ height: 6, background: '#1a1a1a', marginTop: 16, borderRadius: 3, overflow: 'hidden', display: 'flex' }}>
              <div style={{ height: '100%', width: `${market.yesPrice * 100}%`, background: 'linear-gradient(90deg,#00dc82,#00b87a)', transition: 'width 0.5s' }} />
              <div style={{ height: '100%', flex: 1, background: '#dc2626', opacity: 0.5 }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 7 }}>
              <span style={{ fontSize: 12, color: '#00dc82', fontWeight: 700 }}>YES {(market.yesPrice * 100).toFixed(1)}%</span>
              <span style={{ fontSize: 12, color: '#dc2626', fontWeight: 700, opacity: 0.7 }}>NO {((1-market.yesPrice) * 100).toFixed(1)}%</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, background: '#1a1a1a', marginTop: 20 }}>
              {[{ label: '24H VOLUME', value: vol }, { label: 'LIQUIDITY', value: liq }, { label: 'CLOSES IN', value: `${daysLeft}d` }, { label: 'CLOB PTS', value: chartLoading ? '…' : history.length > 0 ? `${history.length}` : 'SIM' }].map(s => (
                <div key={s.label} style={{ background: '#0a0a0a', padding: '12px 14px' }}>
                  <p style={{ fontSize: 10, color: '#666', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>{s.label}</p>
                  <p style={{ fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>{s.value}</p>
                </div>
              ))}
            </div>
          </div>
          <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ padding: '14px', border: '1px solid #1a1a1a', background: '#060606' }}>
              <p style={{ fontSize: 11, color: '#666', fontWeight: 700, letterSpacing: '0.08em', marginBottom: 10, textTransform: 'uppercase' }}>■ HOW IT SETTLES</p>
              <p style={{ fontSize: 13, color: '#888', lineHeight: 1.65 }}>
                Admin resolves the market on Sui after the event. Your Ticket NFT is then claimable from the House Treasury. Walrus Memory records all outcomes.
              </p>
            </div>
            <div style={{ flex: 1 }} />
            <div style={{ padding: '14px', border: '1px solid #1a1a1a', background: '#060606' }}>
              <p style={{ fontSize: 11, color: '#666', fontWeight: 700, letterSpacing: '0.08em', marginBottom: 12, textTransform: 'uppercase' }}>■ ADD TO PARLAY</p>
              <button
                onClick={() => { addLeg({ marketId, marketLabel: market.question, outcome: 'YES', price: market.yesPrice }); onClose(); }}
                disabled={inYes}
                style={{ width: '100%', padding: '16px', background: inYes ? '#00dc8215' : '#00dc82', color: inYes ? '#00dc82' : '#000', border: inYes ? '1px solid #00dc8244' : 'none', cursor: inYes ? 'default' : 'pointer', fontWeight: 900, fontSize: 13, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}
              >
                {inYes ? '✓ YES IN PARLAY' : `+ YES  ${(market.yesPrice * 100).toFixed(0)}%`}
              </button>
              <button
                onClick={() => { addLeg({ marketId: `${marketId}-no`, marketLabel: market.question, outcome: 'NO', price: market.noPrice }); onClose(); }}
                disabled={inNo}
                style={{ width: '100%', padding: '16px', background: 'transparent', color: inNo ? '#555' : '#ccc', border: `1px solid ${inNo ? '#1a1a1a' : '#2a2a2a'}`, cursor: inNo ? 'default' : 'pointer', fontWeight: 900, fontSize: 13, letterSpacing: '0.1em', textTransform: 'uppercase' }}
              >
                {inNo ? '✓ NO IN PARLAY' : `+ NO  ${((1-market.yesPrice) * 100).toFixed(0)}%`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PolyCard({ market, onClick }: { market: PolyMarket; idx: number; onClick: () => void }) {
  const { hasMarket } = useParlayStore();
  const inParlay = hasMarket(`poly-${market.id}`);
  const daysLeft = Math.max(0, Math.ceil((new Date(market.endDate).getTime() - Date.now()) / 86400000));

  return (
    <div onClick={onClick} style={{ background: 'var(--white)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', cursor: 'pointer', transition: 'box-shadow 0.15s' }}
      onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.12)')}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
    >
      <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="text-label" style={{ fontSize: 9, color: '#888' }}>POLYMARKET · {daysLeft}d left</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {market.volume24hr >= 500_000 && <span style={{ fontSize: 8, fontWeight: 800, color: '#fff', background: '#f59e0b', padding: '1px 5px', letterSpacing: '0.08em' }}>HOT</span>}
          <span style={{ fontSize: 11, color: '#888', fontWeight: 600 }}>${(market.liquidity / 1000).toFixed(0)}k liq</span>
        </div>
      </div>
      <div style={{ padding: '20px 16px', display: 'flex', alignItems: 'flex-start', gap: 12, flex: 1 }}>
        {market.image && <img src={market.image} alt="" style={{ width: 36, height: 36, borderRadius: 4, objectFit: 'cover', flexShrink: 0 }} />}
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.4, margin: '0 0 14px' }}>{market.question}</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.04em', color: '#16a34a' }}>{(market.yesPrice * 100).toFixed(0)}%</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#16a34a' }}>YES</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.04em', color: '#dc2626', opacity: 0.75 }}>{((1-market.yesPrice) * 100).toFixed(0)}%</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#dc2626', opacity: 0.75 }}>NO</span>
            </div>
          </div>
          <div style={{ height: 6, background: '#f5f5f5', borderRadius: 3, overflow: 'hidden', display: 'flex' }}>
            <div style={{ height: '100%', width: `${market.yesPrice * 100}%`, background: '#16a34a', borderRadius: '3px 0 0 3px', transition: 'width 0.3s' }} />
            <div style={{ height: '100%', flex: 1, background: '#dc2626', opacity: 0.4 }} />
          </div>
        </div>
      </div>
      <div style={{ padding: '8px 16px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 9, color: '#bbb', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          {inParlay ? '✓ IN PARLAY' : 'TAP TO VIEW CHART'}
        </span>
        <span style={{ fontSize: 11, color: '#ccc' }}>↗</span>
      </div>
    </div>
  );
}

type Filter = 'all' | 'politics' | 'crypto' | 'sports' | 'world';

function inferCategory(q: string): Filter {
  const t = q.toLowerCase();
  if (/bitcoin|eth|crypto|btc|sol|token|coin|defi|nft|polymarket|blockchain/.test(t)) return 'crypto';
  if (/election|president|senate|congress|vote|trump|biden|democrat|republican|prime minister|parliament/.test(t)) return 'politics';
  if (/win|championship|league|season|nba|nfl|epl|fifa|super bowl|world cup|match|game|sport/.test(t)) return 'sports';
  return 'world';
}

export default function MarketsPage() {
  const [polymarkets, setPolymarkets] = useState<PolyMarket[]>([]);
  const [loading, setLoading]         = useState(true);
  const [filter, setFilter]           = useState<Filter>('all');
  const [selected, setSelected]       = useState<PolyMarket | null>(null);
  const { legs }  = useParlayStore();
  const { odds: footballOdds, loading: footballLoading } = useFootballOdds();
  const suiPrice  = useSuiUsdPrice();
  const ctx       = useSuiClientContext();
  const network   = ctx.network as Network;

  useEffect(() => {
    fetch('/api/polymarkets')
      .then(r => r.json())
      .then(data => { setPolymarkets(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') setSelected(null); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  const filtered = filter === 'all' ? polymarkets : polymarkets.filter(m => inferCategory(m.question) === filter);
  const categoryCounts: Record<Filter, number> = {
    all:      polymarkets.length,
    politics: polymarkets.filter(m => inferCategory(m.question) === 'politics').length,
    crypto:   polymarkets.filter(m => inferCategory(m.question) === 'crypto').length,
    sports:   polymarkets.filter(m => inferCategory(m.question) === 'sports').length,
    world:    polymarkets.filter(m => inferCategory(m.question) === 'world').length,
  };

  return (
    <div style={{ maxWidth: 1440, margin: '0 auto', borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)' }}>
      {selected && <MarketDetailModal market={selected} onClose={() => setSelected(null)} />}

      {/* Hero */}
      <div className="page-grid" style={{ borderBottom: 'none' }}>
        <div className="gc-1-2 flex flex-col justify-end cell-pad-lg" style={{ background: 'var(--black)', minHeight: 'clamp(200px,28vh,340px)' }}>
          <p className="text-label" style={{ color: '#666', marginBottom: 16, fontSize: 10 }}>■ REAL WORLD EVENTS × TATUM ODDS × SUI</p>
          <h1 className="text-display" style={{ color: 'var(--white)', fontSize: 'clamp(56px,8vw,120px)' }}>Markets</h1>
        </div>
        <div className="gc-3 flex flex-col justify-between cell-pad" style={{ borderLeft: '1px solid var(--border)', minHeight: 'clamp(200px,28vh,340px)' }}>
          <p className="text-label" style={{ fontSize: 10, color: '#aaa' }}>■ HOW TO PLAY</p>
          {[
            { n: '01', t: 'Pick a match',    d: 'Tap a football match or Polymarket event to add YES/HOME or NO/AWAY to your parlay' },
            { n: '02', t: 'Set your stake',  d: 'Enter SUI in the Parlay builder. See payout in SUI + USD via Tatum Prices API.' },
            { n: '03', t: 'Buy on Sui',      d: 'One transaction — Ticket NFT minted on Sui, metadata stored on Walrus.' },
          ].map(s => (
            <div key={s.n} style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
              <span style={{ fontWeight: 800, fontSize: 11, color: '#ccc', minWidth: 24 }}>{s.n}</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 12 }}>{s.t}</div>
                <div style={{ fontSize: 11, color: '#888' }}>{s.d}</div>
              </div>
            </div>
          ))}
          <Link href="/parlay" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none', fontWeight: 700, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            {legs.length > 0 ? `Build parlay (${legs.length} leg${legs.length > 1 ? 's' : ''})` : 'Build a parlay'} <span style={{ background: 'var(--black)', color: 'var(--white)', padding: '4px 8px' }}>→</span>
          </Link>
        </div>
        <div className="gc-4 flex flex-col justify-between cell-pad" style={{ background: 'var(--mint)', borderLeft: '1px solid var(--border)', minHeight: 'clamp(200px,28vh,340px)' }}>
          <p className="text-label" style={{ fontSize: 10 }}>■ POWERED BY</p>
          <div>
            <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>Tatum Prediction API</p>
            <p style={{ fontSize: 11, color: '#555', lineHeight: 1.5, marginBottom: 8 }}>Live bookmaker odds from Tatum. Odds update continuously before kickoff.</p>
            <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Walrus Memory trust scores</p>
            <p style={{ fontSize: 11, color: '#555', lineHeight: 1.5 }}>Your win rate is remembered on Walrus. Build credibility and earn badges.</p>
            {suiPrice > 0 && <p style={{ marginTop: 8, fontSize: 11, color: '#333', fontWeight: 700 }}>1 SUI = ${suiPrice.toFixed(4)} · {network.toUpperCase()}</p>}
          </div>
        </div>
      </div>

      {/* Football markets (Tatum + Sui on-chain) */}
      <div style={{ borderTop: '1px solid var(--border)' }}>
        <div style={{ padding: '12px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="text-label" style={{ fontSize: 9, background: '#00dc82', color: '#000', padding: '2px 8px' }}>⚽ FOOTBALL · TATUM ODDS</span>
          {!footballLoading && <span style={{ fontSize: 11, color: '#888' }}>{footballOdds.length} matches</span>}
        </div>
        {footballLoading ? (
          <div style={{ padding: 32, textAlign: 'center' }}>
            <span className="text-label" style={{ fontSize: 10, color: '#bbb' }}>FETCHING LIVE ODDS…</span>
          </div>
        ) : (
          <div style={{ padding: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 1, background: 'var(--border)' }}>
            {footballOdds.map(m => <FootballCard key={m.matchId} match={m} suiPrice={suiPrice} />)}
          </div>
        )}
      </div>

      {/* Polymarket live markets */}
      <div style={{ borderTop: '1px solid var(--border)' }}>
        <div style={{ padding: '12px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span className="text-label" style={{ fontSize: 9, background: '#6366f1', color: '#fff', padding: '2px 8px' }}>■ POLYMARKET · LIVE ODDS</span>
          {(['all', 'politics', 'crypto', 'sports', 'world'] as Filter[]).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ padding: '3px 10px', fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer', border: '1px solid var(--border)', background: filter === f ? 'var(--black)' : 'transparent', color: filter === f ? 'var(--white)' : 'var(--black)' }}>
              {f}{!loading && categoryCounts[f] > 0 && <span style={{ marginLeft: 5, fontSize: 9, opacity: 0.6, fontWeight: 600 }}>({categoryCounts[f]})</span>}
            </button>
          ))}
          {!loading && <span style={{ marginLeft: 'auto', fontSize: 11, color: '#888' }}>{filtered.length} markets</span>}
        </div>
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <span className="text-label" style={{ fontSize: 10, color: '#bbb' }}>FETCHING LIVE MARKETS…</span>
          </div>
        ) : (
          <div style={{ padding: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 1, background: 'var(--border)' }}>
            {filtered.map((m, i) => <PolyCard key={m.id} market={m} idx={i} onClick={() => setSelected(m)} />)}
          </div>
        )}
      </div>
    </div>
  );
}
