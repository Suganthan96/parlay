'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSuiClientContext } from '@mysten/dapp-kit';
import { useParlayStore } from '@/lib/store';
import { useSuiUsdPrice } from '@/lib/hooks';
import type { PolyMarket } from '@/app/api/polymarkets/route';
import type { SportEvent } from '@/app/api/sports/route';
import type { Network } from '@/lib/sui-client';

// ── Sport icon map ─────────────────────────────────────────────────────────────

const SPORT_ICON: Record<string, string> = {
  nfl: '🏈', nba: '🏀', soccer: '⚽', mma: '🥊',
};

const SPORT_LABEL: Record<string, string> = {
  nfl: 'NFL', nba: 'NBA', soccer: 'EPL', mma: 'UFC',
};

// ── Sport event card ───────────────────────────────────────────────────────────

function SportCard({ event }: { event: SportEvent }) {
  const { addLeg, hasMarket } = useParlayStore();
  const inHome = hasMarket(`${event.matchId}-home`);
  const inAway = hasMarket(`${event.matchId}-away`);
  const homeProb = 1 / event.homeOdds;
  const awayProb = 1 / event.awayOdds;
  const kicks = new Date(event.kickoff * 1000).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  });
  const statusColor = event.status === 'in_progress' ? '#16a34a' : event.status === 'final' ? '#888' : '#f59e0b';
  const statusText  = event.status === 'in_progress' ? 'LIVE' : event.status === 'final' ? 'FINAL' : 'UPCOMING';

  return (
    <div style={{ background: 'var(--white)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="text-label" style={{ fontSize: 9, color: '#888' }}>
          {SPORT_ICON[event.sport]} {SPORT_LABEL[event.sport]} · {kicks}
        </span>
        <span style={{ fontSize: 9, fontWeight: 800, color: statusColor, letterSpacing: '0.08em' }}>■ {statusText}</span>
      </div>
      <div style={{ padding: '20px 16px', flex: 1 }}>
        <p style={{ fontSize: 14, fontWeight: 800, lineHeight: 1.3, marginBottom: 16 }}>
          {event.homeTeam} vs {event.awayTeam}
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <button
            onClick={() => addLeg({
              marketId:      `${event.matchId}-home`,
              marketLabel:   `${event.homeTeam} vs ${event.awayTeam}`,
              outcome:       `${event.homeTeam} Win`,
              price:         homeProb,
              marketObjectId: event.suiObjectId || undefined,
              outcomeIdx:    1,
            })}
            disabled={inHome || event.status === 'final'}
            style={{ padding: '14px 8px', background: inHome ? '#00dc8215' : event.status === 'final' ? '#f5f5f5' : '#00dc82', color: inHome ? '#00dc82' : event.status === 'final' ? '#bbb' : '#000', border: inHome ? '1px solid #00dc8244' : 'none', cursor: (inHome || event.status === 'final') ? 'default' : 'pointer', fontWeight: 900, fontSize: 12, textAlign: 'center' }}
          >
            <div style={{ fontSize: 20, fontWeight: 900 }}>{event.homeOdds.toFixed(2)}×</div>
            <div style={{ fontSize: 10, opacity: 0.8 }}>{inHome ? '✓ IN PARLAY' : event.homeTeam.split(' ').pop()?.toUpperCase()}</div>
          </button>
          <button
            onClick={() => addLeg({
              marketId:      `${event.matchId}-away`,
              marketLabel:   `${event.homeTeam} vs ${event.awayTeam}`,
              outcome:       `${event.awayTeam} Win`,
              price:         awayProb,
              marketObjectId: event.suiObjectId || undefined,
              outcomeIdx:    2,
            })}
            disabled={inAway || event.status === 'final'}
            style={{ padding: '14px 8px', background: 'transparent', color: inAway ? '#555' : event.status === 'final' ? '#bbb' : 'var(--black)', border: `1px solid ${inAway ? '#1a1a1a' : 'var(--border)'}`, cursor: (inAway || event.status === 'final') ? 'default' : 'pointer', fontWeight: 900, fontSize: 12, textAlign: 'center' }}
          >
            <div style={{ fontSize: 20, fontWeight: 900 }}>{event.awayOdds.toFixed(2)}×</div>
            <div style={{ fontSize: 10, opacity: 0.8 }}>{inAway ? '✓ IN PARLAY' : event.awayTeam.split(' ').pop()?.toUpperCase()}</div>
          </button>
        </div>
        <div style={{ marginTop: 10, height: 4, background: '#f5f5f5', borderRadius: 2, overflow: 'hidden', display: 'flex' }}>
          <div style={{ height: '100%', width: `${homeProb * 100}%`, background: '#00dc82', transition: 'width 0.3s' }} />
          <div style={{ height: '100%', flex: 1, background: '#dc2626', opacity: 0.4 }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 10, color: '#888' }}>
          <span>{(homeProb * 100).toFixed(0)}% {event.homeTeam.split(' ').pop()}</span>
          <span>{(awayProb * 100).toFixed(0)}% {event.awayTeam.split(' ').pop()}</span>
        </div>
      </div>
    </div>
  );
}

// ── Polymarket modal ──────────────────────────────────────────────────────────

function MarketDetailModal({ market, onClose }: { market: PolyMarket; onClose: () => void }) {
  const { addLeg, hasMarket } = useParlayStore();
  const marketId = `poly-${market.id}`;
  const inYes    = hasMarket(marketId);
  const inNo     = hasMarket(`${marketId}-no`);
  const daysLeft = Math.max(0, Math.ceil((new Date(market.endDate).getTime() - Date.now()) / 86400000));
  const vol = market.volume24hr >= 1_000_000 ? `$${(market.volume24hr/1_000_000).toFixed(1)}M` : `$${(market.volume24hr/1000).toFixed(0)}k`;

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#0a0a0a', border: '1px solid #1e1e1e', width: '100%', maxWidth: 760, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 48px 96px rgba(0,0,0,0.8)' }}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid #1a1a1a', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            {market.image && <img src={market.image} alt="" style={{ width: 48, height: 48, objectFit: 'cover', flexShrink: 0, borderRadius: 3 }} />}
            <div>
              <p style={{ fontSize: 11, color: '#777', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>POLYMARKET · {daysLeft}d left · {vol} 24h vol</p>
              <p style={{ fontSize: 20, fontWeight: 800, color: '#fff', lineHeight: 1.35, maxWidth: 600 }}>{market.question}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#777', cursor: 'pointer', fontSize: 22, lineHeight: 1, flexShrink: 0, padding: 4 }}>✕</button>
        </div>
        <div style={{ padding: '24px' }}>
          <div style={{ display: 'flex', gap: 24, marginBottom: 24 }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 10, color: '#00dc82', fontWeight: 700, letterSpacing: '0.08em', marginBottom: 4 }}>YES</p>
              <p style={{ fontSize: 48, fontWeight: 900, letterSpacing: '-0.04em', color: '#00dc82', lineHeight: 1 }}>{(market.yesPrice * 100).toFixed(0)}%</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 10, color: '#777', fontWeight: 700, letterSpacing: '0.08em', marginBottom: 4 }}>NO</p>
              <p style={{ fontSize: 48, fontWeight: 900, letterSpacing: '-0.04em', color: '#777', lineHeight: 1 }}>{((1-market.yesPrice) * 100).toFixed(0)}%</p>
            </div>
          </div>
          <div style={{ height: 8, background: '#1a1a1a', borderRadius: 4, overflow: 'hidden', display: 'flex', marginBottom: 24 }}>
            <div style={{ height: '100%', width: `${market.yesPrice * 100}%`, background: 'linear-gradient(90deg,#00dc82,#00b87a)', transition: 'width 0.5s' }} />
            <div style={{ height: '100%', flex: 1, background: '#dc2626', opacity: 0.5 }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button
              onClick={() => { addLeg({ marketId, marketLabel: market.question, outcome: 'YES', price: market.yesPrice }); onClose(); }}
              disabled={inYes}
              style={{ width: '100%', padding: '16px', background: inYes ? '#00dc8215' : '#00dc82', color: inYes ? '#00dc82' : '#000', border: inYes ? '1px solid #00dc8244' : 'none', cursor: inYes ? 'default' : 'pointer', fontWeight: 900, fontSize: 13, letterSpacing: '0.1em', textTransform: 'uppercase' }}
            >
              {inYes ? '✓ YES IN PARLAY' : `+ YES  ${(market.yesPrice * 100).toFixed(0)}%  →  ${(1/market.yesPrice).toFixed(2)}×`}
            </button>
            <button
              onClick={() => { addLeg({ marketId: `${marketId}-no`, marketLabel: market.question, outcome: 'NO', price: market.noPrice }); onClose(); }}
              disabled={inNo}
              style={{ width: '100%', padding: '16px', background: 'transparent', color: inNo ? '#555' : '#ccc', border: `1px solid ${inNo ? '#1a1a1a' : '#2a2a2a'}`, cursor: inNo ? 'default' : 'pointer', fontWeight: 900, fontSize: 13, letterSpacing: '0.1em', textTransform: 'uppercase' }}
            >
              {inNo ? '✓ NO IN PARLAY' : `+ NO  ${((1-market.yesPrice) * 100).toFixed(0)}%  →  ${(1/market.noPrice).toFixed(2)}×`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PolyCard({ market, onClick }: { market: PolyMarket; onClick: () => void }) {
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
          {inParlay ? '✓ IN PARLAY' : 'TAP TO VIEW & ADD'}
        </span>
        <span style={{ fontSize: 11, color: '#ccc' }}>↗</span>
      </div>
    </div>
  );
}

// ── Sport tab filter ───────────────────────────────────────────────────────────

type SportTab = 'all' | 'nfl' | 'nba' | 'soccer' | 'mma';
type PolyTab  = 'all' | 'politics' | 'crypto' | 'sports' | 'world';

function inferCategory(q: string): PolyTab {
  const t = q.toLowerCase();
  if (/bitcoin|eth|crypto|btc|sol|token|coin|defi|nft|polymarket|blockchain/.test(t)) return 'crypto';
  if (/election|president|senate|congress|vote|trump|biden|democrat|republican|prime minister|parliament/.test(t)) return 'politics';
  if (/win|championship|league|season|nba|nfl|epl|fifa|super bowl|world cup|match|game|sport/.test(t)) return 'sports';
  return 'world';
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function MarketsPage() {
  const [sports,      setSports]      = useState<SportEvent[]>([]);
  const [polymarkets, setPolymarkets] = useState<PolyMarket[]>([]);
  const [sportsLoading, setSportsLoading] = useState(true);
  const [polyLoading,   setPolyLoading]   = useState(true);
  const [sportTab,    setSportTab]    = useState<SportTab>('all');
  const [polyTab,     setPolyTab]     = useState<PolyTab>('all');
  const [selected,    setSelected]    = useState<PolyMarket | null>(null);

  const { legs } = useParlayStore();
  const suiPrice = useSuiUsdPrice();
  const ctx      = useSuiClientContext();
  const network  = ctx.network as Network;

  useEffect(() => {
    fetch('/api/sports')
      .then(r => r.json())
      .then(d => { setSports(Array.isArray(d) ? d : []); setSportsLoading(false); })
      .catch(() => setSportsLoading(false));
  }, []);

  useEffect(() => {
    fetch('/api/polymarkets')
      .then(r => r.json())
      .then(d => { setPolymarkets(Array.isArray(d) ? d : []); setPolyLoading(false); })
      .catch(() => setPolyLoading(false));
  }, []);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') setSelected(null); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  // Sport tabs
  const sportTabs: { key: SportTab; label: string; icon: string }[] = [
    { key: 'all',    label: 'ALL SPORTS', icon: '🏆' },
    { key: 'nfl',    label: 'NFL',        icon: '🏈' },
    { key: 'nba',    label: 'NBA',        icon: '🏀' },
    { key: 'soccer', label: 'EPL',        icon: '⚽' },
    { key: 'mma',    label: 'UFC',        icon: '🥊' },
  ];

  const filteredSports = sportTab === 'all' ? sports : sports.filter(s => s.sport === sportTab);
  const sportCounts: Record<SportTab, number> = {
    all:    sports.length,
    nfl:    sports.filter(s => s.sport === 'nfl').length,
    nba:    sports.filter(s => s.sport === 'nba').length,
    soccer: sports.filter(s => s.sport === 'soccer').length,
    mma:    sports.filter(s => s.sport === 'mma').length,
  };

  // Poly tabs
  const polyTabs: { key: PolyTab; label: string }[] = [
    { key: 'all',      label: 'ALL' },
    { key: 'politics', label: 'ELECTIONS' },
    { key: 'sports',   label: 'SPORTS' },
    { key: 'crypto',   label: 'CRYPTO' },
    { key: 'world',    label: 'CULTURE & WORLD' },
  ];
  const filteredPoly = polyTab === 'all'
    ? polymarkets
    : polymarkets.filter(m => inferCategory(m.question) === polyTab);
  const polyCounts: Record<PolyTab, number> = {
    all:      polymarkets.length,
    politics: polymarkets.filter(m => inferCategory(m.question) === 'politics').length,
    sports:   polymarkets.filter(m => inferCategory(m.question) === 'sports').length,
    crypto:   polymarkets.filter(m => inferCategory(m.question) === 'crypto').length,
    world:    polymarkets.filter(m => inferCategory(m.question) === 'world').length,
  };

  return (
    <div style={{ maxWidth: 1440, margin: '0 auto', borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)' }}>
      {selected && <MarketDetailModal market={selected} onClose={() => setSelected(null)} />}

      {/* Hero */}
      <div className="page-grid" style={{ borderBottom: 'none' }}>
        <div className="gc-1-2 flex flex-col justify-end cell-pad-lg" style={{ background: 'var(--black)', minHeight: 'clamp(200px,28vh,340px)' }}>
          <p className="text-label" style={{ color: '#666', marginBottom: 16, fontSize: 10 }}>■ SPORTS · ELECTIONS · CULTURE · MARKETS</p>
          <h1 className="text-display" style={{ color: 'var(--white)', fontSize: 'clamp(56px,8vw,120px)' }}>Markets</h1>
        </div>
        <div className="gc-3 flex flex-col justify-between cell-pad" style={{ borderLeft: '1px solid var(--border)', minHeight: 'clamp(200px,28vh,340px)' }}>
          <p className="text-label" style={{ fontSize: 10, color: '#aaa' }}>■ HOW TO PLAY</p>
          {[
            { n: '01', t: 'Pick an event', d: 'Tap any game or market — sports, elections, culture — to add it to your parlay' },
            { n: '02', t: 'Set your stake', d: 'Enter SUI in the builder. Payout in SUI + USD via Tatum Prices API.' },
            { n: '03', t: 'Buy on Sui',     d: 'One transaction — Ticket NFT minted on Sui, metadata on Walrus.' },
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
          <p className="text-label" style={{ fontSize: 10 }}>■ LIVE DATA SOURCES</p>
          <div>
            <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>ESPN Sports API</p>
            <p style={{ fontSize: 11, color: '#555', lineHeight: 1.5, marginBottom: 10 }}>Real-time NFL, NBA, EPL, UFC odds computed from live team win records.</p>
            <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Polymarket</p>
            <p style={{ fontSize: 11, color: '#555', lineHeight: 1.5, marginBottom: 10 }}>Live prediction markets for elections, culture, crypto, world events.</p>
            <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Tatum RPC + Walrus Memory</p>
            <p style={{ fontSize: 11, color: '#555', lineHeight: 1.5 }}>All on-chain reads via Tatum. Credibility scores stored on Walrus.</p>
            {suiPrice > 0 && <p style={{ marginTop: 8, fontSize: 11, color: '#333', fontWeight: 700 }}>1 SUI = ${suiPrice.toFixed(4)} · {network.toUpperCase()}</p>}
          </div>
        </div>
      </div>

      {/* ── Live Sports (ESPN real data) ── */}
      <div style={{ borderTop: '1px solid var(--border)' }}>
        <div style={{ padding: '12px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span className="text-label" style={{ fontSize: 9, background: '#000', color: '#fff', padding: '2px 8px', marginRight: 4 }}>■ LIVE SPORTS ODDS</span>
          {sportTabs.map(tab => (
            <button key={tab.key} onClick={() => setSportTab(tab.key)} style={{ padding: '3px 10px', fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer', border: '1px solid var(--border)', background: sportTab === tab.key ? 'var(--black)' : 'transparent', color: sportTab === tab.key ? 'var(--white)' : 'var(--black)' }}>
              {tab.icon} {tab.label}{sportCounts[tab.key] > 0 && <span style={{ marginLeft: 4, fontSize: 9, opacity: 0.6 }}>({sportCounts[tab.key]})</span>}
            </button>
          ))}
          {!sportsLoading && <span style={{ marginLeft: 'auto', fontSize: 11, color: '#888' }}>{filteredSports.length} events · ESPN</span>}
        </div>
        {sportsLoading ? (
          <div style={{ padding: 32, textAlign: 'center' }}>
            <span className="text-label" style={{ fontSize: 10, color: '#bbb' }}>FETCHING LIVE SPORTS ODDS…</span>
          </div>
        ) : filteredSports.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center' }}>
            <span className="text-label" style={{ fontSize: 10, color: '#bbb' }}>NO {sportTab.toUpperCase()} EVENTS RIGHT NOW — CHECK BACK SOON</span>
          </div>
        ) : (
          <div style={{ padding: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 1, background: 'var(--border)' }}>
            {filteredSports.map(e => <SportCard key={e.matchId} event={e} />)}
          </div>
        )}
      </div>

      {/* ── Elections, Culture & Markets (Polymarket) ── */}
      <div style={{ borderTop: '1px solid var(--border)' }}>
        <div style={{ padding: '12px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span className="text-label" style={{ fontSize: 9, background: '#6366f1', color: '#fff', padding: '2px 8px', marginRight: 4 }}>■ ELECTIONS · CULTURE · MARKETS</span>
          {polyTabs.map(tab => (
            <button key={tab.key} onClick={() => setPolyTab(tab.key)} style={{ padding: '3px 10px', fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer', border: '1px solid var(--border)', background: polyTab === tab.key ? 'var(--black)' : 'transparent', color: polyTab === tab.key ? 'var(--white)' : 'var(--black)' }}>
              {tab.label}{polyCounts[tab.key] > 0 && <span style={{ marginLeft: 4, fontSize: 9, opacity: 0.6 }}>({polyCounts[tab.key]})</span>}
            </button>
          ))}
          {!polyLoading && <span style={{ marginLeft: 'auto', fontSize: 11, color: '#888' }}>{filteredPoly.length} markets · Polymarket</span>}
        </div>
        {polyLoading ? (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <span className="text-label" style={{ fontSize: 10, color: '#bbb' }}>FETCHING LIVE MARKETS…</span>
          </div>
        ) : (
          <div style={{ padding: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 1, background: 'var(--border)' }}>
            {filteredPoly.map(m => <PolyCard key={m.id} market={m} onClick={() => setSelected(m)} />)}
          </div>
        )}
      </div>
    </div>
  );
}
