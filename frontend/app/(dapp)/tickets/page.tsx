'use client';

import { useState, useEffect } from 'react';
import { useCurrentAccount, useSuiClientContext } from '@mysten/dapp-kit';
import { useOwnedTickets, useClaim, useCashOut, useSuiUsdPrice } from '@/lib/hooks';
import { walrusBlobUrl, memoryBlobUrl } from '@/lib/walrus';
import { useParlayStore } from '@/lib/store';
import { mistToSui, matchLabelFromMarketId } from '@/lib/contracts';
import { txUrl, objectUrl } from '@/lib/sui-client';
import type { Network } from '@/lib/sui-client';

const STATUS_LABELS = ['OPEN', 'WON', 'LOST', 'CASHED OUT'];
const STATUS_COLORS = ['#00b894', '#16a34a', '#dc2626', '#888'];
const STATUS_BG     = ['#f0fffe', '#f0fdf4', '#fff5f5', '#f8f8f8'];
const OUTCOME_LABEL: Record<number, string> = { 1: 'Home Win', 2: 'Away Win', 3: 'Draw' };

type TicketItem = ReturnType<typeof useOwnedTickets>['tickets'][number];

// ── Full-detail modal ─────────────────────────────────────────────────────────

function TicketModal({ ticket, network, onClose }: {
  ticket: TicketItem;
  network: Network;
  onClose: () => void;
}) {
  const ticketMeta = useParlayStore(s => s.ticketMeta);
  const { claim, isPending: claiming, isSuccess: claimed, txDigest: claimTx }         = useClaim();
  const { cashOut, isPending: cashingOut, isSuccess: cashedOut, txDigest: cashOutTx } = useCashOut();
  const suiPrice = useSuiUsdPrice();

  // Fetch Walrus blob for full question text
  type WalrusLeg = { market: string; outcome: string; odds?: number };
  const [walrusLegs, setWalrusLegs] = useState<WalrusLeg[] | null>(null);

  useEffect(() => {
    if (!ticket.blobId) return;
    fetch(`https://aggregator.walrus-testnet.walrus.space/v1/blobs/${ticket.blobId}`)
      .then(r => r.ok ? r.json() : null)
      .then((data: any) => {
        if (Array.isArray(data?.legs)) setWalrusLegs(data.legs);
      })
      .catch(() => {});
  }, [ticket.blobId]);

  const meta        = ticketMeta[ticket.objectId] ?? ticketMeta[ticket.txDigest];
  const stakeSui    = mistToSui(ticket.stakeMist);
  const payoutSui   = mistToSui(ticket.payoutMist);
  const statusIdx   = ticket.status;
  const isOpen      = statusIdx === 0;
  const isWon       = statusIdx === 1;
  const isLost      = statusIdx === 2;
  const statusLabel = STATUS_LABELS[statusIdx] ?? 'OPEN';
  const statusColor = STATUS_COLORS[statusIdx] ?? '#888';
  const txHash      = meta?.txHash || ticket.txDigest;
  const memoryId    = meta?.memoryId ?? '';
  const memoryLink  = memoryId ? memoryBlobUrl(memoryId) : '';

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // On-chain legSummary parts: "Home, Away, Home" → ["Home", "Away", "Home"]
  const modalSummaryParts = (ticket.legSummary ?? '').split(', ').filter(Boolean);

  // Build legs — priority: Walrus blob > local store > on-chain legSummary > BCS raw byte
  const legRows: Array<{ label: string; outcome: string }> = walrusLegs?.length
    ? walrusLegs.map(l => ({ label: l.market, outcome: l.outcome }))
    : meta?.legs?.length
      ? meta.legs.map(l => ({ label: l.question, outcome: l.outcome }))
      : (ticket.legMarketIds ?? []).map((mid, i) => {
          const label   = matchLabelFromMarketId(mid, network);
          const teams   = label.split(' vs ');
          const rawPart = modalSummaryParts[i];
          const outcome = rawPart === 'Home'
            ? (teams[0]?.trim() ?? 'Home') + ' Win'
            : rawPart === 'Away'
              ? (teams[1]?.trim() ?? 'Away') + ' Win'
              : OUTCOME_LABEL[ticket.legOutcomes?.[i] ?? 0]
                ?? `Outcome ${ticket.legOutcomes?.[i] ?? '?'}`;
          return { label, outcome };
        });

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
          zIndex: 1000, backdropFilter: 'blur(2px)',
        }}
      />

      {/* Panel */}
      <div style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%,-50%)',
        width: 'min(520px, calc(100vw - 32px))',
        maxHeight: 'calc(100vh - 48px)',
        overflowY: 'auto',
        background: 'var(--white)',
        border: '1px solid var(--border)',
        zIndex: 1001,
        boxShadow: '0 24px 80px rgba(0,0,0,0.25)',
      }}>
        {/* Modal header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 24px', borderBottom: '1px solid var(--border)',
          background: STATUS_BG[statusIdx] ?? 'var(--white)',
        }}>
          <div>
            <span className="text-label" style={{ fontSize: 9, color: '#888', display: 'block', marginBottom: 4 }}>
              ■ PARLAY TICKET · {ticket.legCount}-LEG
            </span>
            <span style={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 700, color: '#333' }}>
              {ticket.objectId.slice(0, 10)}…{ticket.objectId.slice(-8)}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: statusColor, letterSpacing: '0.05em' }}>
              ● {statusLabel}
            </span>
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#999', lineHeight: 1, padding: '0 4px' }}
            >
              ×
            </button>
          </div>
        </div>

        {/* Legs */}
        <div style={{ borderBottom: '1px solid var(--border)' }}>
          <div style={{ padding: '12px 24px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="text-label" style={{ fontSize: 9, color: '#aaa' }}>■ YOUR PICKS</span>
            <span style={{ fontSize: 9, color: '#aaa', letterSpacing: '0.06em' }}>ALL MUST WIN FOR PAYOUT</span>
          </div>
          {legRows.map((leg, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'flex-start', gap: 16,
              padding: '14px 24px',
              borderTop: i > 0 ? '1px solid var(--border)' : 'none',
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: 'var(--black)', color: 'var(--white)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 800, flexShrink: 0, marginTop: 1,
              }}>
                {i + 1}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 13, fontWeight: 700, color: '#111',
                  lineHeight: 1.35, marginBottom: 4,
                  wordBreak: 'break-word',
                }}>
                  {leg.label}
                </div>
                <span style={{
                  display: 'inline-block',
                  fontSize: 10, fontWeight: 700,
                  color: '#16a34a', background: '#f0fdf4',
                  padding: '2px 8px', letterSpacing: '0.04em',
                }}>
                  {leg.outcome}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Financials */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid var(--border)' }}>
          <div style={{ padding: '20px 24px', borderRight: '1px solid var(--border)' }}>
            <span className="text-label" style={{ display: 'block', fontSize: 9, color: '#aaa', marginBottom: 6 }}>■ STAKE</span>
            <div style={{ fontSize: 24, fontWeight: 800 }}>{stakeSui.toFixed(4)}</div>
            <div style={{ fontSize: 10, color: '#aaa', marginTop: 2 }}>SUI{suiPrice > 0 ? ` · $${(stakeSui * suiPrice).toFixed(2)}` : ''}</div>
          </div>
          <div style={{ padding: '20px 24px', background: isWon ? '#f0fdf4' : 'transparent' }}>
            <span className="text-label" style={{ display: 'block', fontSize: 9, color: isWon ? '#16a34a' : '#aaa', marginBottom: 6 }}>
              ■ {isWon ? 'PAYOUT' : isLost ? 'LOST' : 'IF ALL WIN'}
            </span>
            <div style={{ fontSize: 24, fontWeight: 800, color: isWon ? '#16a34a' : isLost ? '#dc2626' : 'var(--black)' }}>
              {isLost ? '—' : payoutSui.toFixed(4)}
            </div>
            {!isLost && <div style={{ fontSize: 10, color: isWon ? '#16a34a' : '#aaa', marginTop: 2 }}>
              SUI{suiPrice > 0 ? ` · $${(payoutSui * suiPrice).toFixed(2)}` : ''}
            </div>}
          </div>
        </div>

        {/* Links: NFT · tx · Walrus */}
        <div style={{ padding: '12px 24px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          <a href={objectUrl(ticket.objectId, network)} target="_blank" rel="noreferrer"
            style={{ fontSize: 10, fontWeight: 700, color: 'var(--black)', textDecoration: 'none' }}>
            View NFT on Sui ↗
          </a>
          {txHash && (
            <a href={txUrl(txHash, network)} target="_blank" rel="noreferrer"
              style={{ fontSize: 10, fontWeight: 700, color: '#7c3aed', fontFamily: 'monospace', textDecoration: 'none' }}>
              Buy tx {txHash.slice(0, 8)}…{txHash.slice(-4)} ↗
            </a>
          )}
          {ticket.blobId && (
            <a href={walrusBlobUrl(ticket.blobId)} target="_blank" rel="noreferrer"
              style={{ fontSize: 10, fontWeight: 700, color: '#0369a1', textDecoration: 'none' }}>
              Walrus blob ↗
            </a>
          )}
          {memoryLink && (
            <a href={memoryLink} target="_blank" rel="noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, color: '#059669', textDecoration: 'none' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 14, height: 14, borderRadius: '50%', background: '#059669', color: 'white', fontSize: 8, flexShrink: 0 }}>W</span>
              Walrus Memory ↗
            </a>
          )}
        </div>

        {/* Action */}
        <div style={{ padding: '20px 24px' }}>
          {isOpen && !cashedOut && (
            <button
              onClick={() => cashOut(ticket.objectId, network)}
              disabled={cashingOut}
              style={{ width: '100%', padding: '15px', background: 'var(--black)', color: 'var(--white)', border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase' }}
            >
              {cashingOut ? 'CONFIRMING IN WALLET…' : 'CASH OUT EARLY →'}
            </button>
          )}
          {cashedOut && (
            <div style={{ padding: '14px', background: '#f8f8f8', textAlign: 'center' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#888' }}>↩ CASHED OUT</span>
              {cashOutTx && <> · <a href={txUrl(cashOutTx, network)} target="_blank" rel="noreferrer" style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--black)', textDecoration: 'underline' }}>{cashOutTx.slice(0, 10)}…↗</a></>}
            </div>
          )}
          {isWon && !claimed && (
            <button
              onClick={() => claim(ticket.objectId, network)}
              disabled={claiming}
              style={{ width: '100%', padding: '16px', background: '#16a34a', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: 14, letterSpacing: '0.06em', textTransform: 'uppercase' }}
            >
              {claiming ? 'CLAIMING…' : `CLAIM ${payoutSui.toFixed(4)} SUI →`}
            </button>
          )}
          {claimed && (
            <div style={{ padding: '14px', background: '#f0fdf4', textAlign: 'center' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#16a34a' }}>✓ CLAIMED — SUI SENT TO YOUR WALLET</span>
              {claimTx && <> · <a href={txUrl(claimTx, network)} target="_blank" rel="noreferrer" style={{ fontSize: 11, fontFamily: 'monospace', color: '#16a34a', textDecoration: 'underline' }}>{claimTx.slice(0,10)}…↗</a></>}
            </div>
          )}
          {isLost && (
            <div style={{ padding: '14px', background: '#fff5f5', textAlign: 'center' }}>
              <span className="text-label" style={{ fontSize: 10, color: '#dc2626' }}>✕ PARLAY LOST — BETTER LUCK NEXT TIME</span>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ── Compact ticket card ───────────────────────────────────────────────────────

function TicketCard({ ticket, network, onOpen }: {
  ticket: TicketItem;
  network: Network;
  onOpen: () => void;
}) {
  const ticketMeta = useParlayStore(s => s.ticketMeta);
  const suiPrice   = useSuiUsdPrice();
  const meta       = ticketMeta[ticket.objectId] ?? ticketMeta[ticket.txDigest];
  const memoryId   = meta?.memoryId ?? '';
  const stakeSui   = mistToSui(ticket.stakeMist);
  const payoutSui  = mistToSui(ticket.payoutMist);
  const statusIdx  = ticket.status;
  const isWon      = statusIdx === 1;
  const isLost     = statusIdx === 2;
  const statusLabel = STATUS_LABELS[statusIdx] ?? 'OPEN';
  const statusColor = STATUS_COLORS[statusIdx] ?? '#888';

  // Fetch Walrus blob for question text on the card preview
  type WalrusLegCard = { market: string; outcome: string };
  const [walrusLegs, setWalrusLegs] = useState<WalrusLegCard[] | null>(null);
  useEffect(() => {
    if (!ticket.blobId) return;
    fetch(`https://aggregator.walrus-testnet.walrus.space/v1/blobs/${ticket.blobId}`)
      .then(r => r.ok ? r.json() : null)
      .then((data: any) => { if (Array.isArray(data?.legs)) setWalrusLegs(data.legs); })
      .catch(() => {});
  }, [ticket.blobId]);

  // On-chain legSummary parts: "Home, Away, Home" → ["Home", "Away", "Home"]
  const summaryParts = (ticket.legSummary ?? '').split(', ').filter(Boolean);

  // Build compact leg preview with outcomes — Walrus > local store > on-chain legSummary > BCS raw byte
  const legPreviews: Array<{ label: string; outcome: string }> = walrusLegs?.length
    ? walrusLegs.map(l => ({ label: l.market, outcome: l.outcome }))
    : meta?.legs?.length
      ? meta.legs.map(l => ({ label: l.question, outcome: l.outcome }))
      : (ticket.legMarketIds ?? []).map((mid, i) => {
          const label   = matchLabelFromMarketId(mid, network);
          const teams   = label.split(' vs ');
          const rawPart = summaryParts[i];
          const outcome = rawPart === 'Home'
            ? (teams[0]?.trim() ?? 'Home') + ' Win'
            : rawPart === 'Away'
              ? (teams[1]?.trim() ?? 'Away') + ' Win'
              : OUTCOME_LABEL[ticket.legOutcomes?.[i] ?? 0]
                ?? `Outcome ${ticket.legOutcomes?.[i] ?? '?'}`;
          return { label, outcome };
        });

  return (
    <div
      onClick={onOpen}
      style={{
        background: 'var(--white)', border: '1px solid var(--border)',
        cursor: 'pointer', overflow: 'hidden',
        transition: 'box-shadow 0.12s, border-color 0.12s',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 20px rgba(0,0,0,0.10)'; (e.currentTarget as HTMLDivElement).style.borderColor = '#999'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)'; }}
    >
      {/* Top bar */}
      <div style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid var(--border)', background: STATUS_BG[statusIdx] ?? 'transparent' }}>
        <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.05em', color: statusColor }}>● {statusLabel}</span>
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: 9, color: '#bbb', letterSpacing: '0.06em' }}>{ticket.legCount}-LEG</span>
        <span style={{ fontSize: 11, fontWeight: 700 }}>{stakeSui.toFixed(4)} SUI</span>
      </div>

      {/* Legs preview */}
      <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)', minHeight: 72 }}>
        {legPreviews.length > 0 ? legPreviews.map((leg, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: i < legPreviews.length - 1 ? 7 : 0 }}>
            <span style={{ fontSize: 9, fontWeight: 800, color: '#ccc', minWidth: 12, marginTop: 2 }}>{i + 1}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#333', lineHeight: 1.3 }}>{leg.label}</div>
              <div style={{ fontSize: 9, fontWeight: 700, color: '#16a34a', marginTop: 2, letterSpacing: '0.03em' }}>{leg.outcome}</div>
            </div>
          </div>
        )) : (
          <span style={{ fontSize: 11, color: '#aaa' }}>{ticket.legSummary || `${ticket.legCount} legs`}</span>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: 9, color: '#aaa', display: 'block', marginBottom: 1 }}>
            {isWon ? 'PAYOUT' : isLost ? 'LOST' : 'IF ALL WIN'}
          </span>
          <span style={{ fontSize: 14, fontWeight: 800, color: isWon ? '#16a34a' : isLost ? '#dc2626' : 'var(--black)' }}>
            {isLost ? '—' : `${payoutSui.toFixed(4)} SUI`}
          </span>
          {suiPrice > 0 && !isLost && (
            <span style={{ fontSize: 9, color: '#aaa', marginLeft: 6 }}>≈ ${(payoutSui * suiPrice).toFixed(2)}</span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {memoryId && (
            <span
              onClick={e => { e.stopPropagation(); window.open(memoryBlobUrl(memoryId), '_blank'); }}
              title="View Walrus Memory"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 9, fontWeight: 700, color: '#059669', cursor: 'pointer', padding: '2px 6px', background: '#f0fdf4', border: '1px solid #bbf7d0' }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 12, height: 12, borderRadius: '50%', background: '#059669', color: 'white', fontSize: 7, flexShrink: 0 }}>W</span>
              MEMORY
            </span>
          )}
          <span style={{ fontSize: 9, color: '#ccc', letterSpacing: '0.08em', fontWeight: 600 }}>TAP TO VIEW →</span>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TicketsPage() {
  const account     = useCurrentAccount();
  const ctx         = useSuiClientContext();
  const network     = ctx.network as Network;
  const isConnected = !!account;
  const { tickets, isLoading } = useOwnedTickets(network);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedTicket = tickets.find(t => t.objectId === selectedId) ?? null;

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

      <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16, alignItems: 'start' }}>
        {!isConnected ? (
          <div style={{ background: 'var(--white)', padding: 48, textAlign: 'center' }}>
            <span className="text-label" style={{ fontSize: 10, color: '#aaa' }}>CONNECT YOUR SUI WALLET TO SEE TICKETS.</span>
          </div>
        ) : isLoading && tickets.length === 0 ? (
          <div style={{ background: 'var(--white)', padding: 48, textAlign: 'center' }}>
            <span className="text-label" style={{ fontSize: 10, color: '#bbb' }}>LOADING TICKETS FROM SUI…</span>
          </div>
        ) : tickets.length === 0 ? (
          <div style={{ background: 'var(--white)', padding: 48, textAlign: 'center' }}>
            <span className="text-label" style={{ fontSize: 10, color: '#aaa' }}>YOU HAVE NO TICKETS ON {network.toUpperCase()}. BUY A PARLAY FIRST.</span>
          </div>
        ) : tickets.map(t => (
          <TicketCard key={t.objectId} ticket={t} network={network} onOpen={() => setSelectedId(t.objectId)} />
        ))}
      </div>

      {/* Detail modal */}
      {selectedTicket && (
        <TicketModal ticket={selectedTicket} network={network} onClose={() => setSelectedId(null)} />
      )}
    </div>
  );
}
