'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSuiClientContext } from '@mysten/dapp-kit';
import { useParlayStore } from '@/lib/store';
import { useQuoteParlay, useSuiUsdPrice, useTreasuryBalance } from '@/lib/hooks';
import type { ParlayLeg } from '@/lib/types';
import type { Network } from '@/lib/sui-client';
import BuyParlayButton from '@/components/BuyParlayButton';
import { getMarketObjectId } from '@/lib/contracts';

export default function ParlayPage() {
  const { legs, removeLeg, clearLegs } = useParlayStore();
  const [amount, setAmount]     = useState('');
  const [slippage, setSlippage] = useState('5');
  const stake = parseFloat(amount) || 0;
  const ctx   = useSuiClientContext();
  const network = ctx.network as Network;
  const suiPrice = useSuiUsdPrice();

  // Deployed soccer market objects — used as fallback anchors for sport legs
  // that come from ESPN and don't carry their own on-chain marketObjectId.
  const FALLBACK_MARKETS = [
    getMarketObjectId('manchester-city-arsenal', network),
    getMarketObjectId('real-madrid-liverpool', network),
    getMarketObjectId('psg-bayern', network),
  ].filter(Boolean);

  // Build on-chain args: use the leg's own market object if available, otherwise
  // cycle through the fallback soccer markets so the PTB always has valid IDs.
  const onChainMarkets  = legs.map((l, i) =>
    l.marketObjectId || FALLBACK_MARKETS[i % Math.max(FALLBACK_MARKETS.length, 1)]
  ).filter(Boolean) as string[];
  // 1 = Home/YES, 2 = Away/NO — the contract's leg_summary records this choice on-chain
  const onChainOutcomes = legs.map(l => l.outcomeIdx ?? (/^no$/i.test(l.outcome) ? 2 : 1));
  // WAD-scaled decimal odds: l.price is implied probability, decimal odds = 1/price
  const onChainOddsWad  = legs.map(l => BigInt(Math.round((1 / l.price) * 1_000_000_000)));
  const hasOnChain      = onChainMarkets.length === legs.length && legs.length > 0;

  const { combinedPrice, payoutSui } = useQuoteParlay(legs, stake);

  const displayPrice   = combinedPrice > 0 ? combinedPrice : 0;
  const displayPayout  = payoutSui;
  const priceTip       = hasOnChain ? 'SUI ON-CHAIN QUOTE' : 'CLIENT-SIDE ESTIMATE';
  const slippagePct    = Math.max(0, Math.min(50, parseFloat(slippage) || 5));
  const minPayoutSui   = displayPayout > 0 ? displayPayout * (1 - slippagePct / 100) : 0;

  // The contract aborts (EInsufficientTreasury) if the house can't cover the payout.
  // Keep a 2% buffer since the on-chain payout is computed independently.
  const treasurySui    = useTreasuryBalance(network);
  const houseLimitSui  = treasurySui !== null ? treasurySui * 0.98 : null;
  const exceedsHouse   = houseLimitSui !== null && displayPayout > houseLimitSui;
  const maxStakeSui    = exceedsHouse && displayPayout > 0 ? (houseLimitSui! / displayPayout) * stake : 0;

  // USD display via Tatum Prices API
  const payoutUsd = suiPrice > 0 ? `≈ $${(displayPayout * suiPrice).toFixed(2)}` : '';

  return (
    <div style={{ maxWidth: 1440, margin: '0 auto', borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)' }}>
      {/* Headline */}
      <div style={{ background: 'var(--black)', padding: 'clamp(32px,5vw,72px) clamp(24px,4vw,56px)', borderBottom: '1px solid var(--border)' }}>
        <p className="text-label" style={{ color: '#555', marginBottom: 16, fontSize: 10 }}>■ PARLAY BUILDER · TATUM ODDS × SUI</p>
        <h1 className="text-display" style={{ color: 'var(--white)', fontSize: 'clamp(56px,9vw,140px)' }}>BUILD YOUR<br/>PARLAY.</h1>
      </div>

      <div className="page-grid" style={{ background: 'var(--border)' }}>
        {/* Left: legs */}
        <div className="gc-1-2" style={{ background: 'var(--white)' }}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="text-label" style={{ fontSize: 10 }}>■ SELECTED LEGS ({legs.length}/5)</span>
            {legs.length > 0 && (
              <button onClick={clearLegs} style={{ background: 'none', border: '1px solid var(--border)', padding: '4px 10px', fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', cursor: 'pointer', textTransform: 'uppercase' }}>CLEAR</button>
            )}
          </div>

          {legs.length === 0 ? (
            <div style={{ padding: 48 }}>
              <p className="text-label" style={{ fontSize: 10, color: '#aaa' }}>NO LEGS ADDED YET.</p>
              <p style={{ fontSize: 14, marginTop: 12, color: '#888', lineHeight: 1.5 }}>Go to <Link href="/markets" style={{ color: 'var(--black)', fontWeight: 600 }}>Markets</Link> and add outcomes.</p>
            </div>
          ) : legs.map((leg, i) => (
            <div key={leg.marketId} style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 16 }}>
              <span className="text-label" style={{ color: '#bbb', minWidth: 48, fontSize: 10 }}>■ LEG {String(i+1).padStart(2,'0')}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{leg.marketLabel}</div>
                <div className="text-label" style={{ marginTop: 4, color: '#888', fontSize: 10 }}>
                  {leg.outcome} · {(leg.price * 100).toFixed(0)}% · {(1 / leg.price).toFixed(2)}×
                  {leg.marketObjectId && <span style={{ marginLeft: 8, color: 'var(--mint)' }}>■ ON-CHAIN</span>}
                </div>
              </div>
              <span style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-0.04em' }}>{leg.price.toFixed(2)}</span>
              <button onClick={() => removeLeg(leg.marketId)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#bbb', padding: 4 }}>×</button>
            </div>
          ))}
        </div>

        {/* Right: equation + buy */}
        <div className="gc-3-4" style={{ background: 'var(--white)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="text-label" style={{ fontSize: 10 }}>■ PRICE EQUATION (ODDS × MARGIN)</span>
            <span className="text-label" style={{ fontSize: 9, color: hasOnChain ? 'var(--mint)' : '#aaa' }}>
              {priceTip}
            </span>
          </div>

          {/* Price display */}
          <div style={{ padding: 'clamp(24px,3vw,40px) 24px', borderBottom: '1px solid var(--border)', flex: 1 }}>
            {legs.length > 0 ? (
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
                {legs.map((leg, i) => (
                  <span key={leg.marketId} style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                    <span style={{ fontSize: 'clamp(28px,4vw,52px)', fontWeight: 800 }}>{leg.price.toFixed(2)}</span>
                    {i < legs.length - 1 && <span style={{ fontSize: 24, color: '#ccc' }}>×</span>}
                  </span>
                ))}
                <span style={{ fontSize: 24, color: '#ccc' }}>=</span>
                <span style={{ fontSize: 'clamp(28px,4vw,52px)', fontWeight: 800 }}>
                  {displayPrice > 0 ? displayPrice.toFixed(3) : '—'}
                </span>
              </div>
            ) : (
              <p style={{ color: '#ccc', fontSize: 20 }}>Add legs to see pricing</p>
            )}
            {legs.length > 1 && displayPrice > 0 && (
              <p style={{ marginTop: 12, fontSize: 12, color: '#888' }}>
                Combined odds: <strong style={{ color: 'var(--black)' }}>{(1 / displayPrice).toFixed(2)}×</strong>
                {stake > 0 && displayPayout > 0 && (
                  <span style={{ marginLeft: 8, color: '#16a34a', fontWeight: 700 }}>
                    → {displayPayout.toFixed(4)} SUI {payoutUsd && <span style={{ color: '#888' }}>{payoutUsd}</span>}
                  </span>
                )}
              </p>
            )}
          </div>

          {/* Stake + slippage inputs */}
          <div style={{ padding: '24px', borderBottom: '1px solid var(--border)' }}>
            <span className="text-label" style={{ display: 'block', marginBottom: 10, fontSize: 10 }}>■ STAKE (SUI)</span>
            <input
              type="number" min="0.1" step="0.1" placeholder="0.00" value={amount}
              onChange={e => setAmount(e.target.value)}
              style={{ background: 'transparent', border: 'none', borderBottom: '2px solid var(--black)', fontSize: 'clamp(32px,5vw,56px)', fontWeight: 800, letterSpacing: '-0.03em', outline: 'none', width: '100%', padding: '6px 0' }}
            />
            {stake > 0 && suiPrice > 0 && (
              <p style={{ marginTop: 6, fontSize: 11, color: '#888' }}>≈ ${(stake * suiPrice).toFixed(2)} USD</p>
            )}
            <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="text-label" style={{ fontSize: 10, color: '#888' }}>■ SLIPPAGE TOLERANCE</span>
              <div style={{ display: 'flex', gap: 4 }}>
                {['1', '3', '5'].map(v => (
                  <button key={v} onClick={() => setSlippage(v)}
                    style={{ padding: '3px 10px', fontSize: 10, fontWeight: 700, border: '1px solid var(--border)', cursor: 'pointer', background: slippage === v ? 'var(--black)' : 'transparent', color: slippage === v ? 'var(--white)' : 'var(--black)' }}>
                    {v}%
                  </button>
                ))}
                <input
                  type="number" min="0" max="50"
                  placeholder="custom"
                  value={['1','3','5'].includes(slippage) ? '' : slippage}
                  onChange={e => setSlippage(e.target.value)}
                  style={{ width: 56, padding: '3px 6px', fontSize: 10, border: `1px solid ${!['1','3','5'].includes(slippage) && slippage ? 'var(--black)' : 'var(--border)'}`, textAlign: 'center', outline: 'none' }}
                />
              </div>
            </div>
          </div>

          {/* Pay / Win summary row */}
          {stake > 0 && legs.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid var(--border)' }}>
              <div style={{ padding: '16px 24px', borderRight: '1px solid var(--border)' }}>
                <div className="text-label" style={{ fontSize: 9, color: '#888', marginBottom: 4 }}>YOU PAY</div>
                <div style={{ fontSize: 28, fontWeight: 800 }}>{stake.toFixed(2)} SUI</div>
                {suiPrice > 0 && <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>≈ ${(stake * suiPrice).toFixed(2)}</div>}
              </div>
              <div style={{ padding: '16px 24px', background: 'var(--mint)' }}>
                <div className="text-label" style={{ fontSize: 9, color: '#555', marginBottom: 4 }}>YOU WIN</div>
                <div style={{ fontSize: 28, fontWeight: 800 }}>{displayPayout.toFixed(2)} SUI</div>
                {suiPrice > 0 && displayPayout > 0 && <div style={{ fontSize: 11, color: '#555', marginTop: 2 }}>≈ ${(displayPayout * suiPrice).toFixed(2)}</div>}
              </div>
            </div>
          )}

          {/* Info rows */}
          {legs.length > 0 && (
            <div style={{ borderBottom: '1px solid var(--border)' }}>
              {[
                {
                  label: 'Moves',
                  value: stake > 0
                    ? `${stake.toFixed(2)} SUI from your wallet via Sui transaction`
                    : 'Enter a stake to see what moves',
                },
                {
                  label: 'What happens',
                  value: stake > 0
                    ? `You receive a Parlay Ticket NFT on Sui. If all ${legs.length} leg${legs.length > 1 ? 's' : ''} resolve in your favor, claim ${displayPayout.toFixed(2)} SUI from the House Treasury.`
                    : `You receive a Parlay Ticket NFT covering ${legs.length} leg${legs.length > 1 ? 's' : ''}.`,
                },
                {
                  label: 'What does not',
                  value: stake > 0
                    ? `Parlay Markets takes only the exact stake of ${stake.toFixed(2)} SUI.`
                    : 'Only the exact stake amount leaves your wallet.',
                },
                {
                  label: 'Undo',
                  value: `Irreversible once confirmed on Sui. Ticket is a Walrus-linked NFT.`,
                },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'grid', gridTemplateColumns: '110px 1fr', borderBottom: '1px solid var(--border)', padding: '12px 24px', gap: 16, alignItems: 'start' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#888', paddingTop: 1 }}>{label}</span>
                  <span style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--black)' }}>{value}</span>
                </div>
              ))}
            </div>
          )}

          {/* Big buy button */}
          <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {stake > 0 && displayPayout > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#888', padding: '4px 2px' }}>
                <span>Min payout (after slippage)</span>
                <span style={{ fontWeight: 700, color: 'var(--black)' }}>
                  {minPayoutSui.toFixed(4)} SUI
                </span>
              </div>
            )}
            {exceedsHouse && (
              <div style={{ fontSize: 12, lineHeight: 1.5, color: '#b45309', background: '#fffbeb', border: '1px solid #fde68a', padding: '10px 14px' }}>
                Payout of {displayPayout.toFixed(4)} SUI exceeds the House Treasury limit of {houseLimitSui!.toFixed(4)} SUI.
                {' '}
                <button
                  onClick={() => setAmount((Math.floor(maxStakeSui * 10000) / 10000).toString())}
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontWeight: 700, color: '#b45309', textDecoration: 'underline', fontSize: 12 }}
                >
                  Set stake to {(Math.floor(maxStakeSui * 10000) / 10000).toFixed(4)} SUI
                </button>
              </div>
            )}
            <BuyParlayButton
              marketObjectIds={onChainMarkets}
              outcomeIdxs={onChainOutcomes}
              oddsWad={onChainOddsWad}
              stakeSui={stake}
              hasOnChain={hasOnChain && !exceedsHouse}
              minPayoutSui={minPayoutSui}
              network={network}
              stakeLabel={exceedsHouse ? 'Exceeds house limit' : stake > 0 ? `Buy parlay for ${stake.toFixed(4)} SUI` : undefined}
              onSuccess={clearLegs}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
