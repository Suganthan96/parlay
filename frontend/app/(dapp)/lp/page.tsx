'use client';

import { useState, useEffect } from 'react';
import { useCurrentAccount, useSuiClientContext, useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { mistToSui, suiToMist, getTreasuryId, getPackageId, getAdminCapId } from '@/lib/contracts';
import { useOwnedTickets, serverSettleTicket } from '@/lib/hooks';
import { txUrl } from '@/lib/sui-client';
import type { Network } from '@/lib/sui-client';

interface TreasuryState {
  balance: bigint;
  totalIn: bigint;
  totalOut: bigint;
}

function useTreasury(network: Network) {
  const treasuryId = getTreasuryId(network);
  const client     = useSuiClient();
  const [state,   setState]   = useState<TreasuryState | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!treasuryId) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        // gRPC client uses { objectId, include } not JSON-RPC { id, options }
        const obj = await (client as any).getObject({ objectId: treasuryId, include: { content: true } });
        if (cancelled) return;
        // gRPC returns content as BCS bytes (Uint8Array-like object)
        // Treasury layout: id(32) + balance.value(8) + total_staked(8) + total_paid_out(8)
        const rawContent = obj?.object?.content;
        if (rawContent) {
          const bytes = Uint8Array.from(Object.values(rawContent));
          const dv = new DataView(bytes.buffer);
          setState({
            balance:  dv.getBigUint64(32, true),
            totalIn:  dv.getBigUint64(40, true),
            totalOut: dv.getBigUint64(48, true),
          });
        }
      } catch (e) { console.warn('Treasury fetch failed:', e); }
      finally { if (!cancelled) setLoading(false); }
    };
    load();
    const id = setInterval(load, 15_000);
    return () => { cancelled = true; clearInterval(id); };
  }, [client, treasuryId]);

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

function useSeedTreasury(network: Network) {
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const [status, setStatus] = useState<'idle'|'pending'|'done'|'error'>('idle');
  const [txDigest, setTxDigest] = useState('');

  const seed = async (amountSui: number) => {
    const packageId  = getPackageId(network);
    const treasuryId = getTreasuryId(network);
    if (!packageId || !treasuryId) { alert('Contract not deployed'); return; }
    setStatus('pending');
    try {
      const tx = new Transaction();
      const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(suiToMist(amountSui))]);
      tx.moveCall({
        target: `${packageId}::parlay_vault::add_liquidity`,
        arguments: [tx.object(treasuryId), coin],
      });
      signAndExecute({ transaction: tx }, {
        onSuccess: (r: any) => { setTxDigest(r.digest); setStatus('done'); },
        onError:   (e: any) => { console.error(e); setStatus('error'); setTimeout(() => setStatus('idle'), 3000); },
      });
    } catch (e) { console.error(e); setStatus('error'); }
  };

  return { seed, status, txDigest };
}

// Resolve Market panel — simulates what Chainlink CRE does when the game ends.
// In production this is called automatically by the oracle; in the demo the presenter
// clicks it after the "game period" to show the full settlement flow.
function ResolveMarketPanel({ network }: { network: Network }) {
  const adminCapId = getAdminCapId(network);
  const { tickets, isLoading, refetch } = useOwnedTickets(network);

  type Status = 'idle' | 'pending' | 'done' | 'error';
  const [statuses,   setStatuses]   = useState<Record<string, Status>>({});
  const [digests,    setDigests]    = useState<Record<string, string>>({});
  const [errors,     setErrors]     = useState<Record<string, string>>({});

  const openTickets = tickets.filter(t => t.status === 0);

  if (!adminCapId) return null;

  const resolve = async (ticketId: string, won: boolean) => {
    setStatuses(s => ({ ...s, [ticketId]: 'pending' }));
    const result = await serverSettleTicket(ticketId, won, network);
    if (result.ok) {
      setStatuses(s => ({ ...s, [ticketId]: 'done' }));
      setDigests(d => ({ ...d, [ticketId]: result.digest ?? '' }));
      setTimeout(refetch, 2_000);
    } else {
      setStatuses(s => ({ ...s, [ticketId]: 'error' }));
      setErrors(e => ({ ...e, [ticketId]: result.error ?? 'Failed' }));
      setTimeout(() => setStatuses(s => ({ ...s, [ticketId]: 'idle' })), 4_000);
    }
  };

  return (
    <div style={{ padding: '32px 40px', borderBottom: '1px solid var(--border)', background: '#f8fafc' }}>
      <span className="text-label" style={{ fontSize: 9, color: '#475569', display: 'block', marginBottom: 6 }}>■ MARKET RESOLUTION · ADMIN SETTLEMENT · WALRUS MEMORY LOG</span>
      <p style={{ fontSize: 11, color: '#64748b', marginBottom: 20, maxWidth: 560 }}>
        In production, Chainlink CRE automatically resolves each market once the game period ends and posts the result on-chain. Click to simulate market resolution for open tickets.
      </p>
      {isLoading ? (
        <span style={{ fontSize: 11, color: '#888' }}>Loading open tickets…</span>
      ) : openTickets.length === 0 ? (
        <span style={{ fontSize: 11, color: '#888' }}>No open tickets — all markets resolved.</span>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {openTickets.map(t => {
            const st = statuses[t.objectId] ?? 'idle';
            return (
              <div key={t.objectId} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'var(--white)', border: '1px solid var(--border)', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <div style={{ fontSize: 10, color: '#aaa', marginBottom: 2 }}>TICKET</div>
                  <div style={{ fontSize: 11, fontFamily: 'monospace', color: '#555' }}>
                    {t.objectId.slice(0, 10)}…{t.objectId.slice(-6)}
                  </div>
                  {t.legSummary && <div style={{ fontSize: 10, color: '#888', marginTop: 2 }}>{t.legSummary}</div>}
                </div>
                <div style={{ fontSize: 11, color: '#555', textAlign: 'right', minWidth: 120 }}>
                  <div>{mistToSui(t.stakeMist).toFixed(3)} SUI staked</div>
                  <div style={{ color: '#16a34a', fontSize: 10 }}>→ {mistToSui(t.payoutMist).toFixed(3)} SUI if WON</div>
                </div>
                {st === 'done' ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#16a34a' }}>✓ RESOLVED</span>
                    {digests[t.objectId] && (
                      <a href={txUrl(digests[t.objectId], network)} target="_blank" rel="noreferrer"
                        style={{ fontSize: 10, color: '#16a34a', fontFamily: 'monospace' }}>
                        tx ↗
                      </a>
                    )}
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => resolve(t.objectId, true)}
                      disabled={st === 'pending'}
                      style={{ padding: '8px 16px', background: '#16a34a', color: '#fff', border: 'none', cursor: st === 'pending' ? 'wait' : 'pointer', fontWeight: 800, fontSize: 10, letterSpacing: '0.06em', opacity: st === 'pending' ? 0.6 : 1 }}
                    >
                      {st === 'pending' ? 'RESOLVING…' : 'ALL LEGS WON ✓'}
                    </button>
                    <button
                      onClick={() => resolve(t.objectId, false)}
                      disabled={st === 'pending'}
                      style={{ padding: '8px 16px', background: '#64748b', color: '#fff', border: 'none', cursor: st === 'pending' ? 'wait' : 'pointer', fontWeight: 800, fontSize: 10, letterSpacing: '0.06em', opacity: st === 'pending' ? 0.6 : 1 }}
                    >
                      LEG LOST ✗
                    </button>
                  </div>
                )}
                {st === 'error' && <span style={{ fontSize: 10, color: '#dc2626' }}>{errors[t.objectId]}</span>}
              </div>
            );
          })}
        </div>
      )}
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
  const { seed, status: seedStatus, txDigest } = useSeedTreasury(network);
  const [seedAmount, setSeedAmount] = useState('10');

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
              href={`https://${network === 'mainnet' ? '' : 'testnet.'}suivision.xyz/object/${treasuryId}`}
              target="_blank"
              rel="noreferrer"
              style={{ display: 'block', padding: '12px 16px', background: 'var(--black)', color: 'var(--white)', textAlign: 'center', textDecoration: 'none', fontWeight: 700, fontSize: 11, letterSpacing: '0.08em' }}
            >
              VIEW TREASURY ON SUIVISION ↗
            </a>
          )}
        </div>
      </div>

      {/* Add Liquidity panel */}
      {account && (
        <div style={{ padding: '32px 40px', borderBottom: '1px solid var(--border)', background: 'var(--white)' }}>
          <span className="text-label" style={{ fontSize: 9, color: '#aaa', display: 'block', marginBottom: 20 }}>■ ADD LIQUIDITY · SEED HOUSE TREASURY</span>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div>
              <label style={{ fontSize: 10, color: '#888', display: 'block', marginBottom: 6 }}>AMOUNT (SUI)</label>
              <input
                type="number"
                min="0.1"
                step="1"
                value={seedAmount}
                onChange={e => setSeedAmount(e.target.value)}
                style={{ padding: '10px 14px', border: '1px solid var(--border)', fontSize: 14, fontWeight: 700, width: 140, outline: 'none', background: 'var(--white)', color: 'var(--black)' }}
              />
            </div>
            <div style={{ paddingTop: 22 }}>
              <button
                onClick={() => seed(parseFloat(seedAmount) || 1)}
                disabled={seedStatus === 'pending' || !parseFloat(seedAmount)}
                style={{
                  padding: '10px 24px',
                  background: seedStatus === 'done' ? '#16a34a' : seedStatus === 'error' ? '#dc2626' : 'var(--black)',
                  color: 'var(--white)',
                  border: 'none',
                  fontWeight: 800,
                  fontSize: 11,
                  letterSpacing: '0.08em',
                  cursor: seedStatus === 'pending' ? 'wait' : 'pointer',
                  opacity: seedStatus === 'pending' ? 0.7 : 1,
                }}
              >
                {seedStatus === 'pending' ? 'SENDING…' : seedStatus === 'done' ? 'ADDED ✓' : seedStatus === 'error' ? 'FAILED ✗' : 'ADD LIQUIDITY'}
              </button>
            </div>
            {seedStatus === 'done' && txDigest && (
              <div style={{ paddingTop: 26 }}>
                <a
                  href={`https://${network === 'mainnet' ? '' : 'testnet.'}suivision.xyz/txblock/${txDigest}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ fontSize: 10, color: '#16a34a', fontFamily: 'monospace' }}
                >
                  tx: {txDigest.slice(0, 20)}… ↗
                </a>
              </div>
            )}
          </div>
          <p style={{ fontSize: 11, color: '#888', marginTop: 12 }}>
            Calls <code style={{ fontFamily: 'monospace', background: '#f0f0f0', padding: '1px 4px' }}>parlay_vault::add_liquidity</code> — adds SUI to the shared treasury so bets can be paid out.
          </p>
        </div>
      )}

      {/* Market resolution (oracle simulation) */}
      <ResolveMarketPanel network={network} />

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
