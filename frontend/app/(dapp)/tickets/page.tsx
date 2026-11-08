'use client';

import { useState } from 'react';
import { useCurrentAccount, useSuiClientContext } from '@mysten/dapp-kit';
import { useOwnedTickets, useClaim, useCashOut, useSuiUsdPrice } from '@/lib/hooks';
import { useParlayStore } from '@/lib/store';
import { mistToSui } from '@/lib/contracts';
import { txUrl, objectUrl } from '@/lib/sui-client';
import type { Network } from '@/lib/sui-client';

const STATUS_LABELS = ['OPEN', 'WON', 'LOST', 'CASHED OUT'];
const STATUS_COLORS = ['#00b894', '#16a34a', '#dc2626', '#888'];

function TicketCard({ ticket, network }: {
  ticket: ReturnType<typeof useOwnedTickets>['tickets'][number];
  network: Network;
}) {
  const ticketMeta                   = useParlayStore(s => s.ticketMeta);
  const { claim, isPending: claiming, isSuccess: claimed, txDigest: claimTx }   = useClaim();
  const { cashOut, isPending: cashingOut, isSuccess: cashedOut, txDigest: cashOutTx } = useCashOut();
  const [expanded, setExpanded]      = useState(true);
  const suiPrice                     = useSuiUsdPrice();

  const meta       = ticketMeta[ticket.objectId];
  const stakeSui   = mistToSui(ticket.stakeMist);
  const payoutSui  = mistToSui(ticket.payoutMist);
  const statusIdx  = ticket.status;
  const isOpen     = statusIdx === 0;
  const isWon      = statusIdx === 1;
  const isLost     = statusIdx === 2;

  const statusLabel = STATUS_LABELS[statusIdx] ?? 'OPEN';
  const statusColor = STATUS_COLORS[statusIdx] ?? '#888';
  const headerBg    = isWon ? '#f0fdf4' : isLost ? '#fff5f5' : 'var(--white)';

  const shortId = ticket.objectId
    ? ticket.objectId.slice(0, 8) + '…' + ticket.objectId.slice(-6)
    : '…';

  return (
    <div style={{ background: 'var(--white)', border: '1px solid var(--border)', overflow: 'hidden' }}>
      <div
        onClick={() => setExpanded(e => !e)}
        style={{ padding: '12px 20px', background: headerBg, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, borderBottom: expanded ? '1px solid var(--border)' : 'none' }}
      >
        <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.06em', minWidth: 80 }}>
          {shortId}
        </span>
        <span style={{ fontSize: 11, fontWeight: 800, color: statusColor, letterSpacing: '0.05em', flex: 1 }}>
          ● {statusLabel}
        </span>
        <span style={{ fontSize: 9, color: '#aaa', letterSpacing: '0.06em' }}>{ticket.legCount}-LEG</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#333' }}>{stakeSui.toFixed(4)} SUI</span>
        {isWon && <span style={{ fontSize: 11, fontWeight: 800, color: '#16a34a' }}>→ {payoutSui.toFixed(4)} SUI</span>}
        <span style={{ fontSize: 14, color: '#ccc', marginLeft: 4 }}>{expanded ? '▲' : '▼'}</span>
      </div>

      {expanded && (
        <>
          {/* Legs from local store */}
          {meta?.legs?.length ? (
            <div>
              {meta.legs.map((leg, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 20px', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 14, color: '#999', minWidth: 16, textAlign: 'center' }}>◌</span>
                  <div style={{ flex: 1, fontSize: 12, fontWeight: 600, color: '#333', lineHeight: 1.3 }}>
                    {leg.question} · {leg.outcome}
                  </div>
                  <div style={{ textAlign: 'right', fontSize: 11, color: '#888' }}>×{leg.price.toFixed(2)}</div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: 11, color: '#888' }}>{ticket.legSummary || `${ticket.legCount} legs`}</span>
            </div>
          )}

          {/* Financials */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderTop: '1px solid var(--border)' }}>
            <div style={{ padding: '14px 20px', borderRight: '1px solid var(--border)' }}>
              <span className="text-label" style={{ display: 'block', marginBottom: 4, fontSize: 9, color: '#aaa' }}>■ STAKE</span>
              <div style={{ fontSize: 20, fontWeight: 800 }}>{stakeSui.toFixed(4)} SUI</div>
              {suiPrice > 0 && <div style={{ fontSize: 10, color: '#888', marginTop: 2 }}>≈ ${(stakeSui * suiPrice).toFixed(2)}</div>}
            </div>
            <div style={{ padding: '14px 20px', background: isWon ? '#f0fdf4' : 'transparent' }}>
              <span className="text-label" style={{ display: 'block', marginBottom: 4, fontSize: 9, color: isWon ? '#16a34a' : '#aaa' }}>
                ■ {isWon ? 'PAYOUT' : isLost ? 'LOST' : 'IF ALL WIN'}
              </span>
              <div style={{ fontSize: 20, fontWeight: 800, color: isWon ? '#16a34a' : isLost ? '#dc2626' : 'var(--black)' }}>
                {isLost ? '—' : `${payoutSui.toFixed(4)} SUI`}
              </div>
              {suiPrice > 0 && !isLost && <div style={{ fontSize: 10, color: isWon ? '#16a34a' : '#888', marginTop: 2 }}>≈ ${(payoutSui * suiPrice).toFixed(2)}</div>}
            </div>
          </div>

          {/* Links */}
          <div style={{ padding: '10px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: 16, fontSize: 10, color: '#888' }}>
            {ticket.objectId && (
              <a href={objectUrl(ticket.objectId, network)} target="_blank" rel="noreferrer" style={{ color: 'var(--black)', fontWeight: 700 }}>
                View NFT on Sui ↗
              </a>
            )}
            {ticket.blobId && (
              <a href={`https://aggregator.walrus-testnet.walrus.space/v1/blobs/${ticket.blobId}`} target="_blank" rel="noreferrer" style={{ color: 'var(--black)', fontWeight: 700 }}>
                Walrus metadata ↗
              </a>
            )}
          </div>

          {/* Action buttons */}
          <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: 12, alignItems: 'center' }}>
            {isOpen && !cashedOut && (
              <button
                onClick={e => { e.stopPropagation(); cashOut(ticket.objectId, network); }}
                disabled={cashingOut}
                style={{ flex: 1, padding: '13px', background: 'var(--black)', color: 'var(--white)', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase' }}
              >
                {cashingOut ? 'CONFIRMING…' : 'CASH OUT EARLY →'}
              </button>
            )}
            {cashedOut && (
              <div style={{ flex: 1, display: 'flex', gap: 10, alignItems: 'center', padding: '13px', background: '#fafafa' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#888' }}>↩ CASHED OUT</span>
                {cashOutTx && <a href={txUrl(cashOutTx, network)} target="_blank" rel="noreferrer" style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--black)', textDecoration: 'underline' }}>{cashOutTx.slice(0, 10)}…↗</a>}
              </div>
            )}
            {isWon && !claimed && (
              <button
                onClick={e => { e.stopPropagation(); claim(ticket.objectId, network); }}
                disabled={claiming}
                style={{ flex: 1, padding: '14px', background: '#16a34a', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: 13, letterSpacing: '0.06em', textTransform: 'uppercase' }}
              >
                {claiming ? 'CLAIMING…' : `CLAIM ${payoutSui.toFixed(4)} SUI →`}
              </button>
            )}
            {claimed && (
              <div style={{ flex: 1, display: 'flex', gap: 10, alignItems: 'center' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#16a34a' }}>✓ CLAIMED — SUI SENT TO YOUR WALLET</span>
                {claimTx && <a href={txUrl(claimTx, network)} target="_blank" rel="noreferrer" style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--black)', textDecoration: 'underline' }}>{claimTx.slice(0,10)}…↗</a>}
              </div>
            )}
            {isLost && (
              <div style={{ flex: 1, padding: '13px', background: '#fff5f5', textAlign: 'center' }}>
                <span className="text-label" style={{ fontSize: 10, color: '#dc2626' }}>✕ PARLAY LOST — BETTER LUCK NEXT TIME</span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default function TicketsPage() {
  const account   = useCurrentAccount();
  const ctx       = useSuiClientContext();
  const network   = ctx.network as Network;
  const isConnected = !!account;
  const { tickets, isLoading } = useOwnedTickets(network);

  return (
    <div style={{ maxWidth: 1440, margin: '0 auto', borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)' }}>
      <div style={{ background: 'var(--black)', padding: 'clamp(32px,5vw,72px) clamp(24px,4vw,56px)', borderBottom: '1px solid var(--border)' }}>
        <p className="text-label" style={{ color: '#555', marginBottom: 16, fontSize: 10 }}>■ MY TICKETS · SUI NFT OBJECTS · WALRUS METADATA</p>
        <h1 className="text-display" style={{ color: 'var(--white)', fontSize: 'clamp(56px,9vw,140px)' }}>MY<br/>TICKETS.</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', borderBottom: '1px solid var(--border)', background: 'var(--white)' }}>
        <div style={{ padding: '16px 24px', borderRight: '1px solid var(--border)' }}>
          <span className="text-label" style={{ display: 'block', fontSize: 9, color: '#aaa', marginBottom: 4 }}>■ MY TICKETS</span>
          <span style={{ fontWeight: 800, fontSize: 22 }}>{isLoading ? '…' : tickets.length}</span>
        </div>
        <div style={{ padding: '16px 24px', borderRight: '1px solid var(--border)' }}>
          <span className="text-label" style={{ display: 'block', fontSize: 9, color: '#aaa', marginBottom: 4 }}>■ NETWORK</span>
          <span style={{ fontWeight: 800, fontSize: 14, textTransform: 'uppercase', color: network === 'testnet' ? '#7c3aed' : '#059669' }}>{network}</span>
        </div>
        <div style={{ padding: '16px 24px' }}>
          <span className="text-label" style={{ display: 'block', fontSize: 9, color: '#aaa', marginBottom: 4 }}>■ WALLET</span>
          <span style={{ fontWeight: 700, fontSize: 11, fontFamily: 'monospace' }}>{account?.address ?? '—'}</span>
        </div>
      </div>

      <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 16, alignItems: 'start' }}>
        {!isConnected ? (
          <div style={{ background: 'var(--white)', padding: 48, textAlign: 'center' }}>
            <span className="text-label" style={{ fontSize: 10, color: '#aaa' }}>CONNECT YOUR SUI WALLET TO SEE TICKETS.</span>
          </div>
        ) : isLoading ? (
          <div style={{ background: 'var(--white)', padding: 48, textAlign: 'center' }}>
            <span className="text-label" style={{ fontSize: 10, color: '#bbb' }}>LOADING TICKETS FROM SUI…</span>
          </div>
        ) : tickets.length === 0 ? (
          <div style={{ background: 'var(--white)', padding: 48, textAlign: 'center' }}>
            <span className="text-label" style={{ fontSize: 10, color: '#aaa' }}>YOU HAVE NO TICKETS ON {network.toUpperCase()}. BUY A PARLAY FIRST.</span>
          </div>
        ) : tickets.map(t => (
          <TicketCard key={t.objectId} ticket={t} network={network} />
        ))}
      </div>
    </div>
  );
}
