'use client';

import { useState, useEffect, useCallback } from 'react';

/* ─── Slide 1: INTRO ──────────────────────────────────────────── */
function Slide1() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* top label bar */}
      <div className="page-grid" style={{ flex: '0 0 auto', borderBottom: 'none' }}>
        <div className="gc-1-2" style={{ background: 'var(--black)', padding: '14px 32px', display: 'flex', alignItems: 'center' }}>
          <span className="text-label" style={{ color: '#444' }}>■ ETHGlobal 2026 · Hackathon Submission</span>
        </div>
        <div className="gc-3-4" style={{ background: 'var(--black)', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
          {['1inch Aqua', 'Chainlink CRE'].map(n => (
            <span key={n} className="text-label" style={{ padding: '4px 10px', border: '1px solid #333', color: '#555' }}>{n}</span>
          ))}
        </div>
      </div>
      {/* hero display */}
      <div className="page-grid" style={{ flex: 1, borderTop: '1px solid var(--app-border)', borderBottom: 'none', alignItems: 'stretch' }}>
        <div className="gc-1-2 cell-pad" style={{ background: 'var(--black)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          <span className="text-label" style={{ color: '#444', marginBottom: 16 }}>■ Prediction Market Infrastructure</span>
          <div style={{ fontSize: 'clamp(48px,7vw,108px)', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 0.9, color: 'var(--white)' }}>
            PARLAY<br/><span style={{ color: 'var(--mint)' }}>MARKETS</span>
          </div>
          <p className="text-body" style={{ color: '#666', maxWidth: 460, marginTop: 20, marginBottom: 20 }}>
            The first on-chain parlay betting protocol. Combine 2–5 real-world prediction market questions into a single high-leverage bet. Priced by LMSR, settled by Chainlink, powered by 1inch Aqua.
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            {['LIVE ON SEPOLIA','LMSR PRICING','VIRTUAL LIQUIDITY'].map(t => (
              <span key={t} className="text-label" style={{ padding: '4px 10px', border: '1px solid #333', color: '#666' }}>{t}</span>
            ))}
          </div>
        </div>
        {/* sponsor logos — 3 in a row */}
        <div className="gc-3-4" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1, background: 'var(--app-border)' }}>

          {/* 1inch */}
          <div style={{ background: '#03080d', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://1inch.com/assets/images/footer/1inch-footer-logo.svg"
              alt="1inch"
              style={{ height: 28, filter: 'brightness(0) invert(1)', opacity: 0.9 }}
            />
            <span className="text-label" style={{ color: '#1dc3fa', opacity: 0.5, textAlign: 'center' }}>Virtual Liquidity Layer</span>
          </div>

          {/* Chainlink */}
          <div style={{ background: '#03040c', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32, overflow: 'hidden' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://cdn.prod.website-files.com/5f6b7190899f41fb70882d08/66560dd6ed44f1b79c527842_brand-logo-blue.svg"
              alt="Chainlink"
              style={{ width: 140, filter: 'brightness(1.2)' }}
            />
            <span className="text-label" style={{ color: '#375bd2', opacity: 0.5, textAlign: 'center' }}>Oracle Settlement</span>
          </div>


        </div>
      </div>
      {/* stats bar */}
      <div className="page-grid" style={{ flex: '0 0 auto', borderTop: '1px solid var(--app-border)' }}>
        {[['$83B','Global sports betting market 2023',true],['40%+','of sportsbook revenue from parlays',false],['$1B+','Polymarket volume in 2024',true],['0','On-chain parlay products today',false]].map(([n,l,accent],i) => (
          <div key={n as string} style={{ background: 'var(--black)', padding: '18px 28px', borderRight: i < 3 ? '1px solid var(--app-border)' : 'none' }}>
            <div className="text-stat" style={{ color: accent ? 'var(--mint)' : 'var(--white)', fontSize: 'clamp(28px,3.5vw,52px)' }}>{n}</div>
            <div className="text-label" style={{ color: '#444', marginTop: 4 }}>{l as string}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Slide 2: PROBLEM ────────────────────────────────────────── */
function Slide2() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ background: 'var(--black)', padding: '18px 32px', borderBottom: '1px solid var(--app-border)', flex: '0 0 auto' }}>
        <span className="text-label" style={{ color: '#444' }}>■ 02 — The Problem</span>
        <div style={{ fontSize: 'clamp(18px,2.2vw,28px)', fontWeight: 900, letterSpacing: '-0.02em', color: 'var(--white)', marginTop: 6 }}>Prediction markets are broken for retail.</div>
      </div>
      <div className="page-grid" style={{ flex: 1, borderBottom: 'none', alignItems: 'stretch' }}>
        {[
          ['Single outcome only','ef4444','1.4×','Every existing prediction market lets you bet on one outcome at a time. Max payout on a 70/30 market: 1.4×. No excitement, no leverage.'],
          ['No on-chain parlay','f59e0b','0','Traditional sportsbooks offer 4–16× parlays but charge 15–30% house edge. No DeFi equivalent exists. Zero transparency on how odds are set.'],
          ['Order books fail retail','ef4444','∅','Polymarket runs on order books. No counterparty = no trade. Illiquid markets mean no price discovery and no access for retail.'],
          ['LP capital is locked','f59e0b','100%','Existing AMM prediction markets require LPs to lock 100% upfront. High risk, low efficiency. Prevents participation.'],
        ].map(([title, col, big, desc]) => (
          <div key={title as string} style={{ background: 'var(--black)', padding: 'clamp(20px,2.5vw,40px)', display: 'flex', flexDirection: 'column', gap: 8, borderRight: '1px solid var(--app-border)' }}>
            <span className="text-label" style={{ color: `#${col}` }}>■ {title as string}</span>
            <div style={{ fontSize: 'clamp(36px,5vw,68px)', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1, color: `#${col}` }}>{big as string}</div>
            <p className="text-body" style={{ color: '#555', marginTop: 4 }}>{desc as string}</p>
          </div>
        ))}
      </div>
      <div className="page-grid" style={{ flex: '0 0 auto', borderTop: '1px solid var(--app-border)' }}>
        {[
          ['$33B Lost to House Edge','Traditional parlays charge 15–30%. Huge fees, zero transparency on pricing.'],
          ['No LMSR On-Chain','LMSR (the gold standard for prediction markets) has never been combined with cross-market parlay bets on-chain.'],
          ['DeFi Gap','$1B+ flows through Polymarket but only single-outcome bets. The parlay market — 40% of sportsbook revenue — is entirely untapped.'],
        ].map(([title, body], i) => (
          <div key={title as string} style={{ background: 'var(--black)', padding: '14px 24px', borderRight: i < 2 ? '1px solid var(--app-border)' : 'none', gridColumn: i === 0 ? '1/2' : i === 1 ? '2/3' : '3/5' }}>
            <div className="text-label" style={{ color: 'var(--white)', marginBottom: 6 }}>{title as string}</div>
            <p style={{ fontSize: 11, color: '#555', lineHeight: 1.6 }}>{body as string}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Slide 3: SOLUTION ───────────────────────────────────────── */
function Slide3() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ background: 'var(--black)', padding: '18px 32px', borderBottom: '1px solid var(--app-border)', flex: '0 0 auto' }}>
        <span className="text-label" style={{ color: '#444' }}>■ 03 — The Solution</span>
        <div style={{ fontSize: 'clamp(18px,2.2vw,28px)', fontWeight: 900, letterSpacing: '-0.02em', color: 'var(--white)', marginTop: 6 }}>On-chain parlays with bounded LP risk and no capital lockup.</div>
      </div>
      <div className="page-grid" style={{ flex: 1, alignItems: 'stretch' }}>
        {/* left: headline + comparison */}
        <div className="gc-1-2 cell-pad" style={{ background: 'var(--black)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 'clamp(28px,4vw,54px)', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.1, color: 'var(--white)', marginBottom: 12 }}>
              COMBINE.<br/>BET.<br/><span style={{ color: 'var(--mint)' }}>WIN BIG.</span>
            </div>
            <p className="text-body" style={{ color: '#555', maxWidth: 400, marginBottom: 20 }}>
              Pick 2–5 real-world questions from Polymarket. Stake USDC. If all legs resolve in your favour, collect a 4–16× payout. No sign-up. No custody. Fully on-chain.
            </p>
          </div>
          <div className="page-grid" style={{ background: 'var(--app-border)', borderLeft: 'none', borderRight: 'none' }}>
            <div className="gc-1-2" style={{ background: '#080808', padding: '12px 16px' }}>
              <span className="text-label" style={{ color: '#ef4444', display: 'block', marginBottom: 6 }}>■ Before (Polymarket)</span>
              <span style={{ fontSize: 11, color: '#444', lineHeight: 1.7 }}>Single outcome · Order book · 1.4× max · Counterparty needed</span>
            </div>
            <div className="gc-3-4" style={{ background: '#020e08', padding: '12px 16px' }}>
              <span className="text-label" style={{ color: 'var(--mint)', display: 'block', marginBottom: 6 }}>■ After (Parlay Markets)</span>
              <span style={{ fontSize: 11, color: '#555', lineHeight: 1.7 }}>2–5 legs · LMSR always-on · Up to 16× · No counterparty</span>
            </div>
          </div>
        </div>
        {/* right: differentiators */}
        <div className="gc-3-4 cell-pad" style={{ background: '#020e08', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <span className="text-label" style={{ color: '#444', marginBottom: 4 }}>■ How it's different</span>
          {[
            ['01','LMSR Pricing Engine','Mathematical formula = always-on liquidity. No counterparty. LP loss bounded by b·ln(N).'],
            ['02','1inch Aqua Virtual LP','LP USDC stays in wallet. Aqua only pulls on payouts. Zero capital lockup.'],
            ['03','Polymarket Data Feed','Real questions from the most liquid prediction market. Politics, crypto, sports.'],
            ['04','Chainlink CRE Settlement','Automated oracle resolution. No manual settlement. Trustless payout on winning parlays.'],
          ].map(([n,t,d]) => (
            <div key={n as string} style={{ display: 'flex', gap: 14, padding: '12px 14px', border: '1px solid var(--app-border)', background: 'rgba(0,220,130,0.03)' }}>
              <span className="text-label" style={{ color: 'var(--mint)', minWidth: 20 }}>{n}</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--white)', marginBottom: 3 }}>{t as string}</div>
                <div style={{ fontSize: 11, color: '#555', lineHeight: 1.6 }}>{d as string}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Slide 4: HOW IT WORKS (architecture flow) ─────────────── */
function Slide4() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--black)' }}>
      {/* header */}
      <div style={{ padding: '14px 32px', borderBottom: '1px solid var(--app-border)', flex: '0 0 auto' }}>
        <span className="text-label" style={{ color: '#444' }}>■ 04 — How It Works</span>
        <div style={{ fontSize: 'clamp(16px,2vw,24px)', fontWeight: 900, letterSpacing: '-0.02em', color: 'var(--white)', marginTop: 4 }}>
          How it works &nbsp;·&nbsp; <span className="text-label" style={{ color: '#555', fontWeight: 400 }}>PARLAY MARKETS · 1INCH AQUA · CHAINLINK CRE · POLYMARKET</span>
        </div>
      </div>

      {/* SVG diagram */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <svg viewBox="0 0 1200 490" width="100%" height="100%" preserveAspectRatio="xMidYMid meet"
          style={{ display: 'block' }}
          fontFamily='"Helvetica Neue", Arial, sans-serif'>

          {/* ── LP stick figure ── */}
          <circle cx="62" cy="52" r="14" fill="none" stroke="#666" strokeWidth="1.5"/>
          <line x1="62" y1="66" x2="62" y2="100" stroke="#666" strokeWidth="1.5"/>
          <line x1="62" y1="78" x2="44" y2="92" stroke="#666" strokeWidth="1.5"/>
          <line x1="62" y1="78" x2="80" y2="92" stroke="#666" strokeWidth="1.5"/>
          <line x1="62" y1="100" x2="48" y2="118" stroke="#666" strokeWidth="1.5"/>
          <line x1="62" y1="100" x2="76" y2="118" stroke="#666" strokeWidth="1.5"/>
          <text x="62" y="135" textAnchor="middle" fill="#999" fontSize="11" fontWeight="700" letterSpacing="0.06em">LP</text>
          <text x="62" y="150" textAnchor="middle" fill="#555" fontSize="10">$2032 USDC</text>

          {/* ── User stick figure ── */}
          <circle cx="62" cy="332" r="14" fill="none" stroke="#666" strokeWidth="1.5"/>
          <line x1="62" y1="346" x2="62" y2="380" stroke="#666" strokeWidth="1.5"/>
          <line x1="62" y1="358" x2="44" y2="372" stroke="#666" strokeWidth="1.5"/>
          <line x1="62" y1="358" x2="80" y2="372" stroke="#666" strokeWidth="1.5"/>
          <line x1="62" y1="380" x2="48" y2="398" stroke="#666" strokeWidth="1.5"/>
          <line x1="62" y1="380" x2="76" y2="398" stroke="#666" strokeWidth="1.5"/>
          <text x="62" y="415" textAnchor="middle" fill="#999" fontSize="11" fontWeight="700" letterSpacing="0.06em">User</text>
          <text x="62" y="430" textAnchor="middle" fill="#555" fontSize="10">MetaMask</text>

          {/* ── 1INCH AQUA group border ── */}
          <rect x="118" y="15" width="410" height="460" fill="none" stroke="#1dc3fa" strokeWidth="1" strokeDasharray="4 3" opacity="0.3" rx="2"/>
          <text x="130" y="11" fill="#1dc3fa" fontSize="9" fontWeight="700" letterSpacing="0.12em" opacity="0.7">1INCH AQUA</text>

          {/* Aqua box */}
          <rect x="130" y="28" width="385" height="96" fill="#03080d" stroke="#1dc3fa" strokeWidth="1" strokeOpacity="0.3" rx="2"/>
          <text x="146" y="52" fill="#1dc3fa" fontSize="14" fontWeight="800">Aqua</text>
          <text x="146" y="70" fill="#555" fontSize="10">virtual balance · one approval</text>
          <text x="146" y="86" fill="#333" fontSize="9" fontFamily="monospace">0x1111113CCf1426A8E30e2bfF5E005d929bF6a90a</text>
          <text x="146" y="100" fill="#1dc3fa" fontSize="9" opacity="0.5">ship() · pull()</text>

          {/* AquaParlayRouter box */}
          <rect x="130" y="168" width="385" height="110" fill="#031a0d" stroke="#00dc82" strokeWidth="1" strokeOpacity="0.25" rx="2"/>
          <text x="146" y="192" fill="#00dc82" fontSize="14" fontWeight="800">AquaParlayRouter</text>
          <text x="146" y="210" fill="#555" fontSize="10">LMSR pricing · payout calc</text>
          <text x="146" y="226" fill="#555" fontSize="10">buyParlay() · pull(LP)</text>
          <text x="146" y="244" fill="#333" fontSize="9" fontFamily="monospace">0x3617455115c85ab2bdb67c2dc8720d1d8afc0f76</text>
          <text x="146" y="260" fill="#00dc82" fontSize="9" opacity="0.5">0x3617...0f76</text>

          {/* ParlayVault box */}
          <rect x="130" y="328" width="385" height="96" fill="#060808" stroke="#888" strokeWidth="1" strokeOpacity="0.2" rx="2"/>
          <text x="146" y="352" fill="#ccc" fontSize="14" fontWeight="800">ParlayVault</text>
          <text x="146" y="370" fill="#555" fontSize="10">ticket NFT · stake · payout</text>
          <text x="146" y="388" fill="#333" fontSize="9" fontFamily="monospace">0x8d98ff91515b47f8a2b89d00cb597497dc47fbe0</text>
          <text x="146" y="404" fill="#888" fontSize="9" opacity="0.5">0x8d98...fbe0</text>

          {/* ── PREDICTION MARKET API group border ── */}
          <rect x="556" y="15" width="630" height="460" fill="none" stroke="#555" strokeWidth="1" strokeDasharray="4 3" opacity="0.3" rx="2"/>
          <text x="568" y="11" fill="#888" fontSize="9" fontWeight="700" letterSpacing="0.12em" opacity="0.7">PREDICTION MARKET API</text>

          {/* Polymarket box */}
          <rect x="568" y="28" width="606" height="85" fill="#030805" stroke="#00dc82" strokeWidth="1" strokeOpacity="0.25" rx="2"/>
          <text x="584" y="52" fill="#00dc82" fontSize="14" fontWeight="800">Polymarket</text>
          <text x="584" y="70" fill="#555" fontSize="10">real-world event questions</text>
          <text x="584" y="86" fill="#444" fontSize="9">30+ live binary markets</text>
          <text x="1050" y="52" textAnchor="end" fill="#00dc82" fontSize="9" opacity="0.4">gamma-api.polymarket.com</text>

          {/* Chainlink CRE box */}
          <rect x="568" y="128" width="606" height="85" fill="#03040c" stroke="#375bd2" strokeWidth="1" strokeOpacity="0.3" rx="2"/>
          <text x="584" y="152" fill="#375bd2" fontSize="14" fontWeight="800">Chainlink CRE</text>
          <text x="584" y="170" fill="#555" fontSize="10">oracle · auto-settlement</text>
          <text x="584" y="186" fill="#444" fontSize="9">watches SettlementRequested · resolves on-chain</text>

          {/* LmsrMarket x2 box */}
          <rect x="568" y="328" width="606" height="96" fill="#031a0d" stroke="#00dc82" strokeWidth="1" strokeOpacity="0.2" rx="2"/>
          <text x="584" y="352" fill="#00dc82" fontSize="14" fontWeight="800">LmsrMarket <tspan fontSize="11" opacity="0.6">×2</tspan></text>
          <text x="584" y="370" fill="#555" fontSize="10">LMSR pricing · 50/50 odds · always-on liquidity</text>
          <rect x="584" y="380" width="52" height="22" fill="#00dc82" rx="2"/>
          <text x="610" y="395" textAnchor="middle" fill="#000" fontSize="10" fontWeight="800">YES 0.50</text>
          <rect x="646" y="380" width="52" height="22" fill="#ef4444" rx="2"/>
          <text x="672" y="395" textAnchor="middle" fill="#fff" fontSize="10" fontWeight="800">NO 0.50</text>

          {/* ── ARROWS ── */}
          <defs>
            <marker id="arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill="#888"/>
            </marker>
            <marker id="arr-aqua" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill="#1dc3fa"/>
            </marker>
            <marker id="arr-mint" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill="#00dc82"/>
            </marker>
            <marker id="arr-blue" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill="#375bd2"/>
            </marker>
          </defs>

          {/* 1 ship: LP → Aqua */}
          <line x1="78" y1="76" x2="128" y2="66" stroke="#1dc3fa" strokeWidth="1.5" markerEnd="url(#arr-aqua)"/>
          <rect x="82" y="56" width="40" height="14" fill="#111" rx="2"/>
          <text x="102" y="67" textAnchor="middle" fill="#1dc3fa" fontSize="9" fontWeight="700">1 ship</text>

          {/* 2 buy: User → Router */}
          <line x1="78" y1="356" x2="128" y2="230" stroke="#888" strokeWidth="1.5" markerEnd="url(#arr)"/>
          <rect x="78" y="300" width="40" height="14" fill="#111" rx="2"/>
          <text x="98" y="311" textAnchor="middle" fill="#999" fontSize="9" fontWeight="700">2 buy</text>

          {/* 4 pull: Aqua → Router (internal downward) */}
          <line x1="322" y1="124" x2="322" y2="166" stroke="#1dc3fa" strokeWidth="1.5" markerEnd="url(#arr-aqua)" strokeDasharray="3 2"/>
          <rect x="302" y="140" width="40" height="14" fill="#111" rx="2"/>
          <text x="322" y="151" textAnchor="middle" fill="#1dc3fa" fontSize="9" fontWeight="700">4 pull</text>

          {/* 5 mint: Router → Vault (internal downward) */}
          <line x1="322" y1="278" x2="322" y2="326" stroke="#888" strokeWidth="1.5" markerEnd="url(#arr)"/>
          <rect x="302" y="296" width="40" height="14" fill="#111" rx="2"/>
          <text x="322" y="307" textAnchor="middle" fill="#999" fontSize="9" fontWeight="700">5 mint</text>

          {/* 3 check: Router → LmsrMarket (right diagonal) */}
          <line x1="516" y1="230" x2="566" y2="380" stroke="#00dc82" strokeWidth="1.5" markerEnd="url(#arr-mint)" strokeDasharray="4 2"/>
          <rect x="516" y="285" width="44" height="14" fill="#111" rx="2"/>
          <text x="538" y="296" textAnchor="middle" fill="#00dc82" fontSize="9" fontWeight="700">3 check</text>

          {/* prices: LmsrMarket → Router (back left diagonal) */}
          <line x1="564" y1="366" x2="516" y2="246" stroke="#00dc82" strokeWidth="1" markerEnd="url(#arr-mint)" strokeDasharray="3 2" opacity="0.5"/>
          <rect x="522" y="316" width="38" height="13" fill="#111" rx="2"/>
          <text x="541" y="326" textAnchor="middle" fill="#00dc82" fontSize="9" opacity="0.7">prices</text>

          {/* 6 ticket: Vault → User (left, dashed) */}
          <line x1="128" y1="390" x2="80" y2="380" stroke="#888" strokeWidth="1.5" markerEnd="url(#arr)" strokeDasharray="4 2"/>
          <rect x="90" y="370" width="44" height="14" fill="#111" rx="2"/>
          <text x="112" y="381" textAnchor="middle" fill="#999" fontSize="9" fontWeight="700">6 ticket</text>

          {/* 7 settle: Chainlink CRE → Vault (left diagonal) */}
          <line x1="566" y1="185" x2="516" y2="376" stroke="#375bd2" strokeWidth="1.5" markerEnd="url(#arr-blue)"/>
          <rect x="522" y="258" width="40" height="14" fill="#111" rx="2"/>
          <text x="542" y="269" textAnchor="middle" fill="#375bd2" fontSize="9" fontWeight="700">7 settle</text>

        </svg>
      </div>

      {/* legend */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', borderTop: '1px solid var(--app-border)', flex: '0 0 auto' }}>
        {[
          ['1 SHIP','LP registers virtual balance on Aqua','#1dc3fa'],
          ['2 BUY','User stakes USDC via Router','#888'],
          ['3 CHECK','Router reads LMSR price per leg','#00dc82'],
          ['4 PULL','Aqua calls transferFrom(LP → Vault)','#1dc3fa'],
          ['5 MINT','Router mints parlay ticket NFT','#888'],
          ['6 TICKET','User receives on-chain ticket','#888'],
          ['7 SETTLE','CRE resolves via oracle','#375bd2'],
        ].map(([step, desc, col], i) => (
          <div key={step as string} style={{ padding: '8px 12px', borderRight: i < 6 ? '1px solid var(--app-border)' : 'none' }}>
            <div className="text-label" style={{ color: col as string, marginBottom: 3 }}>{step}</div>
            <div style={{ fontSize: 9, color: '#444', lineHeight: 1.5 }}>{desc as string}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Slide 5: SPONSORS ──────────────────────────────────────── */
function Slide5() {
  const sps = [
    { name: '1inch Aqua', col: '#1dc3fa', role: 'Virtual Liquidity Layer', bg: '#03080d',
      what: 'LP registers virtual balance without locking USDC. Aqua only calls transferFrom(LP→Vault) when a user wins. Capital-efficient and risk-bounded.',
      code: 'ship(Router, strategy, [USDC], [$1945])\npull(LP, stratHash, USDC, $4.00)' },
    { name: 'Chainlink CRE', col: '#375bd2', role: 'Oracle Settlement', bg: '#03040c',
      what: 'Custom Runtime Environment watches for SettlementRequested events. Fetches outcome from Polymarket API off-chain. Calls MarketResolver.resolve() on-chain. Zero manual work.',
      code: '① emit SettlementRequested(matchId, addr)\n② CRE fetch from Polymarket API\n③ MarketResolver.resolve(matchId, Outcome)' },
    { name: 'Polymarket', col: '#00dc82', role: 'Real-World Market Data', bg: '#030805',
      what: '30+ live binary questions from gamma-api.polymarket.com. Politics, crypto, sports, geopolitics. Each maps to an LMSR contract on-chain.',
      code: 'GET /markets?active=true&closed=false\n{ question, outcomePrices: ["0.72","0.28"] }' },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ background: 'var(--black)', padding: '18px 32px', borderBottom: '1px solid var(--app-border)', flex: '0 0 auto' }}>
        <span className="text-label" style={{ color: '#444' }}>■ 05 — Sponsor Integrations</span>
        <div style={{ fontSize: 'clamp(18px,2.2vw,28px)', fontWeight: 900, letterSpacing: '-0.02em', color: 'var(--white)', marginTop: 6 }}>Three protocols. One unified parlay primitive.</div>
      </div>
      <div className="page-grid" style={{ flex: 1, alignItems: 'stretch' }}>
        {sps.map((sp) => (
          <div key={sp.name} style={{ background: sp.bg, padding: 'clamp(20px,2.5vw,36px)', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <span className="text-label" style={{ color: sp.col, opacity: 0.8 }}>{sp.role}</span>
            <div style={{ fontSize: 'clamp(18px,2.2vw,32px)', fontWeight: 900, letterSpacing: '-0.02em', color: sp.col }}>{sp.name}</div>
            <p className="text-body" style={{ color: '#555', flex: 1 }}>{sp.what}</p>
            <div style={{ fontFamily: 'monospace', fontSize: 10, lineHeight: 1.9, padding: '10px 12px', border: `1px solid ${sp.col}22`, background: 'rgba(255,255,255,0.02)', color: sp.col, whiteSpace: 'pre' }}>{sp.code}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Slide 6: LIVE ──────────────────────────────────────────── */
function Slide6() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ background: 'var(--black)', padding: '18px 32px', borderBottom: '1px solid var(--app-border)', flex: '0 0 auto' }}>
        <span className="text-label" style={{ color: '#444' }}>■ 06 — Deployed &amp; Working</span>
        <div style={{ fontSize: 'clamp(18px,2.2vw,28px)', fontWeight: 900, letterSpacing: '-0.02em', color: 'var(--white)', marginTop: 6 }}>Live on Sepolia. Contracts deployed. Tickets minting.</div>
      </div>
      <div className="page-grid" style={{ flex: 1, alignItems: 'stretch' }}>
        {/* contracts */}
        <div className="gc-1-2 cell-pad" style={{ background: 'var(--black)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 'clamp(40px,6vw,88px)', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1, color: 'var(--white)', marginBottom: 24 }}>
              BUILT<br/>TO<br/><span style={{ color: 'var(--mint)' }}>SHIP.</span>
            </div>
            {[
              ['AquaParlayRouter','0x3617455115c85ab2bdb67c2dc8720d1d8afc0f76'],
              ['ParlayVault','0x8d98ff91515b47f8a2b89d00cb597497dc47fbe0'],
              ['MarketResolver','0x5d5cc1cd24943ecf43ad5e88281393418ca06bea'],
              ['LmsrMarket ×2','0xdcd65f…7911d  ·  0x76048d…84aa'],
              ['Network','Sepolia · Chain ID 11155111'],
            ].map(([name, addr], i) => (
              <div key={name} style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 10, padding: '8px 0', borderTop: i > 0 ? '1px solid var(--app-border)' : 'none' }}>
                <span className="text-label" style={{ color: '#444' }}>{name}</span>
                <span style={{ fontFamily: 'monospace', fontSize: 10, color: name === 'Network' ? 'var(--mint)' : 'var(--white)' }}>{addr}</span>
              </div>
            ))}
          </div>
        </div>
        {/* metrics */}
        <div className="gc-3 cell-pad" style={{ background: '#020e08', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <span className="text-label" style={{ color: '#444' }}>■ Live metrics</span>
          {[['5+','Parlay tickets minted on-chain'],['$1945','USDC approved to Aqua (LP active)'],['30+','Real Polymarket questions in UI'],['4×','Payout on 2-leg 50/50 parlay']].map(([n,l]) => (
            <div key={n} style={{ padding: '12px 14px', border: '1px solid var(--app-border)', background: 'rgba(0,220,130,0.03)' }}>
              <div style={{ fontSize: 'clamp(22px,2.5vw,36px)', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1, color: 'var(--mint)' }}>{n}</div>
              <div className="text-label" style={{ color: '#444', marginTop: 4 }}>{l}</div>
            </div>
          ))}
        </div>
        {/* stack + badge */}
        <div className="gc-4 cell-pad" style={{ background: 'var(--black)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <span className="text-label" style={{ color: '#444', display: 'block', marginBottom: 10 }}>■ Submission</span>
            <div style={{ fontSize: 'clamp(28px,3.5vw,46px)', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.1, color: 'var(--white)', marginBottom: 12 }}>ETHGlobal<br/>2026</div>
            <p className="text-body" style={{ color: '#555', maxWidth: 220 }}>Built in 36 hours. 4 sponsor integrations. Contracts live on Sepolia.</p>
          </div>
          <div>
            <span className="text-label" style={{ color: '#444', display: 'block', marginBottom: 10 }}>■ Stack</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {['Next.js 14','wagmi v2','viem','Solidity','Foundry'].map(t => (
                <span key={t} className="text-label" style={{ padding: '3px 8px', border: '1px solid #333', color: '#666' }}>{t}</span>
              ))}
              {[['1inch Aqua','#1dc3fa'],['Chainlink CRE','#375bd2']].map(([t,c]) => (
                <span key={t} className="text-label" style={{ padding: '3px 8px', border: `1px solid ${c}44`, color: c }}>{t}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const SLIDES = [Slide1, Slide2, Slide3, Slide4, Slide5, Slide6];
const TITLES = ['Intro','Problem','Solution','How It Works','Sponsors','Live'];

export default function PitchPage() {
  const [cur, setCur] = useState(0);

  const go = useCallback((n: number) => {
    setCur((n + SLIDES.length) % SLIDES.length);
  }, []);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') go(cur + 1);
      if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   go(cur - 1);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [cur, go]);

  const Slide = SLIDES[cur];

  return (
    <div style={{ width: '100vw', height: '100vh', background: 'var(--black)', color: 'var(--white)', overflow: 'hidden', fontFamily: '"Helvetica Neue", Arial, sans-serif', display: 'flex', flexDirection: 'column' }}>
      {/* slide area */}
      <div style={{ flex: 1, overflow: 'hidden', border: '1px solid var(--app-border)', margin: '0 auto', width: '100%' }}>
        <Slide />
      </div>

      {/* nav bar — same style as dapp nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', height: 48, borderTop: '1px solid var(--app-border)', background: 'var(--black)', flexShrink: 0 }}>
        <a href="/" className="text-label" style={{ color: '#555', textDecoration: 'none' }}>← PARLAY MARKETS</a>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <button onClick={() => go(cur - 1)} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: 16 }}>←</button>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => setCur(i)}
                title={TITLES[i]}
                style={{ width: i === cur ? 24 : 6, height: 6, borderRadius: 3, background: i === cur ? 'var(--white)' : '#333', border: 'none', cursor: 'pointer', padding: 0, transition: 'all 0.2s' }}
              />
            ))}
          </div>
          <button onClick={() => go(cur + 1)} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: 16 }}>→</button>
        </div>
        <span className="text-label" style={{ color: '#555' }}>{TITLES[cur]} · {cur + 1} / {SLIDES.length}</span>
      </div>
    </div>
  );
}
