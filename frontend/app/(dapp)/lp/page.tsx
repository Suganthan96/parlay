'use client';

import { useState, useEffect } from 'react';
import { useCurrentAccount, useSuiClientContext } from '@mysten/dapp-kit';
import { getSuiObject } from '@/lib/tatum';
import { mistToSui, getTreasuryId, getPackageId } from '@/lib/contracts';
import { txUrl } from '@/lib/sui-client';
import type { Network } from '@/lib/sui-client';

interface TreasuryState {
  balance: bigint;
  totalIn: bigint;
  totalOut: bigint;
}

function useTreasury(network: Network) {
  const [state, setState]     = useState<TreasuryState | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const id = getTreasuryId(network);
    if (!id) return;
    setLoading(true);
    getSuiObject(id, network).then((obj: any) => {
      const fields = obj?.data?.content?.fields;
      if (!fields) return;
      setState({
        balance:  BigInt(fields.balance?.fields?.value ?? fields.balance ?? 0),
        totalIn:  BigInt(fields.total_staked ?? 0),
        totalOut: BigInt(fields.total_paid_out ?? 0),
      });
    }).catch(console.error).finally(() => setLoading(false));
  }, [network]);

  return { state, loading };
}

function StatCell({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div style={{ padding: '20px 24px', borderRight: '1px solid var(--border)' }}>
      <span className="text-label" style={{ display: 'block', fontSize: 9, color: '#aaa', marginBottom: 6 }}>■ {label}</span>
      <div style={{ fontSize: 24, fontWeight: 800 }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: '#888', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

export default function LpPage() {
  const account   = useCurrentAccount();
  const ctx       = useSuiClientContext();
  const network   = ctx.network as Network;
  const packageId = getPackageId(network);
  const treasuryId = getTreasuryId(network);
  const { state, loading } = useTreasury(network);

  const balanceSui = state ? mistToSui(state.balance) : 0;
  const totalIn    = state ? mistToSui(state.totalIn) : 0;
  const totalOut   = state ? mistToSui(state.totalOut) : 0;
  const pnl        = totalIn - totalOut;
  const edge       = totalIn > 0 ? ((pnl / totalIn) * 100) : 0;

  return (
    <div style={{ maxWidth: 1440, margin: '0 auto', borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)' }}>
      {/* Header */}
      <div style={{ background: 'var(--black)', padding: 'clamp(32px,5vw,72px) clamp(24px,4vw,56px)', borderBottom: '1px solid var(--border)' }}>
        <p className="text-label" style={{ color: '#555', marginBottom: 16, fontSize: 10 }}>■ HOUSE TREASURY · SUI LIQUIDITY POOL · 10% EDGE</p>
        <h1 className="text-display" style={{ color: 'var(--white)', fontSize: 'clamp(56px,9vw,140px)' }}>HOUSE<br/>TREASURY.</h1>
        <p style={{ color: '#555', marginTop: 16, fontSize: 13, maxWidth: 520 }}>
          All losing stakes fund winning payouts. The house keeps a 10% margin on every parlay. Max payout per ticket is capped at 100 SUI to protect the pool.
        </p>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderBottom: '1px solid var(--border)', background: 'var(--white)' }}>
        <StatCell label="FLOAT BALANCE" value={loading ? '…' : `${balanceSui.toFixed(2)} SUI`} sub="House liquidity pool" />
        <StatCell label="TOTAL STAKED" value={loading ? '…' : `${totalIn.toFixed(2)} SUI`} sub="All time player stakes" />
        <StatCell label="TOTAL PAID OUT" value={loading ? '…' : `${totalOut.toFixed(2)} SUI`} sub="All time winner payouts" />
        <StatCell label="HOUSE P&L" value={loading ? '…' : `${pnl >= 0 ? '+' : ''}${pnl.toFixed(2)} SUI`} sub={`${edge.toFixed(1)}% edge`} />
      </div>

      {/* How it works */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
        <div style={{ padding: '32px 40px', borderRight: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
          <span className="text-label" style={{ fontSize: 9, color: '#aaa', display: 'block', marginBottom: 20 }}>■ HOW IT WORKS</span>
          {[
            ['Deployer seeds 500 SUI float', 'Initial capital to cover early winners'],
            ['Bettors stake SUI to buy tickets', 'Stakes go into the treasury balance'],
            ['Losing stakes stay in treasury', 'Treasury grows each time a parlay fails'],
            ['10% margin built into odds', 'Quoted payout = fair payout × 0.9'],
            ['Max payout 100 SUI per ticket', 'Caps variance, protects the pool'],
          ].map(([title, desc], i) => (
            <div key={i} style={{ display: 'flex', gap: 16, marginBottom: 16, paddingBottom: 16, borderBottom: i < 4 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ width: 24, height: 24, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 10, fontWeight: 800 }}>{i + 1}</span>
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700 }}>{title}</div>
                <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ padding: '32px 40px', borderBottom: '1px solid var(--border)' }}>
          <span className="text-label" style={{ fontSize: 9, color: '#aaa', display: 'block', marginBottom: 20 }}>■ CONTRACT INFO · {network.toUpperCase()}</span>
          {[
            ['Package ID', packageId || 'Not deployed yet'],
            ['Treasury Object', treasuryId || 'Not deployed yet'],
            ['Network', network === 'testnet' ? 'Sui Testnet' : 'Sui Mainnet'],
            ['Wallet', account?.address ?? 'Not connected'],
          ].map(([label, val]) => (
            <div key={label as string} style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontSize: 10, color: '#aaa', marginBottom: 4 }}>{label as string}</div>
              <div style={{ fontSize: 11, fontFamily: 'monospace', wordBreak: 'break-all', color: 'var(--black)', fontWeight: 600 }}>{val as string}</div>
            </div>
          ))}

          {treasuryId && (
            <a
              href={`https://suiscan.xyz/${network}/object/${treasuryId}`}
              target="_blank"
              rel="noreferrer"
              style={{ display: 'block', padding: '12px 16px', background: 'var(--black)', color: 'var(--white)', textAlign: 'center', textDecoration: 'none', fontWeight: 700, fontSize: 11, letterSpacing: '0.08em' }}
            >
              VIEW TREASURY ON SUISCAN ↗
            </a>
          )}
        </div>
      </div>

      {/* Walrus memory section */}
      <div style={{ padding: '32px 40px', background: '#fafafa' }}>
        <span className="text-label" style={{ fontSize: 9, color: '#aaa', display: 'block', marginBottom: 16 }}>■ WALRUS MEMORY · TRUST SCORES · CREDIBILITY SYSTEM</span>
        <p style={{ fontSize: 13, color: '#555', maxWidth: 640, lineHeight: 1.6 }}>
          Every parlay pick is recorded to <strong>Walrus Memory</strong> — a decentralized memory layer. The system tracks each wallet&apos;s historical accuracy and builds a credibility score. Ticket metadata (legs, odds, timestamps) is stored as immutable Walrus blobs so outcomes are always verifiable on-chain.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1, marginTop: 24, background: 'var(--border)' }}>
          {[
            ['Picks recorded', 'Every buy_parlay call writes legs + odds to MemWal'],
            ['Outcomes logged', 'settle_won / settle_lost events update memory'],
            ['Credibility scores', 'Per-wallet win rate tracked across all parlays'],
          ].map(([title, desc]) => (
            <div key={title as string} style={{ background: 'var(--white)', padding: '20px 24px' }}>
              <div style={{ fontSize: 11, fontWeight: 800, marginBottom: 6 }}>{title as string}</div>
              <div style={{ fontSize: 11, color: '#888' }}>{desc as string}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
