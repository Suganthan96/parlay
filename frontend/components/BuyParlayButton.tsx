'use client';

import { useState } from 'react';
import { useCurrentAccount, useConnectWallet, useWallets } from '@mysten/dapp-kit';
import { useBuyParlay } from '@/lib/hooks';
import { useParlayStore } from '@/lib/store';
import type { Network } from '@/lib/sui-client';
import { txUrl } from '@/lib/sui-client';

interface Props {
  marketObjectIds:  string[];
  outcomeIdxs:      number[];  // 1=Home, 2=Away
  oddsWad:          bigint[];  // WAD-scaled decimal odds per leg
  stakeSui:         number;
  hasOnChain:       boolean;
  minPayoutSui?:    number;
  stakeLabel?:      string;
  network:          Network;
  legsMeta?:        Array<{ market: string; outcome: string; odds: number }>;
  onSuccess?:       () => void;
}

export default function BuyParlayButton({
  marketObjectIds, outcomeIdxs, oddsWad, stakeSui, hasOnChain,
  minPayoutSui = 0,
  stakeLabel, network,
  legsMeta = [],
  onSuccess,
}: Props) {
  const account             = useCurrentAccount();
  const wallets             = useWallets();
  const { mutate: connect } = useConnectWallet();
  const isConnected         = !!account;
  const { legs, saveTicketMeta } = useParlayStore();

  const { buyParlay, isPending, isSuccess, txDigest, errorMsg } = useBuyParlay();

  const disabled = !isConnected || !hasOnChain || marketObjectIds.length === 0 || stakeSui <= 0;

  async function handleClick() {
    if (!isConnected) {
      if (wallets.length > 0) connect({ wallet: wallets[0] });
      return;
    }
    if (disabled) return;

    await buyParlay({
      marketObjectIds,
      oddsWad,
      outcomes:    outcomeIdxs,
      stakeSui,
      minPayoutSui,
      legs:        legsMeta.length ? legsMeta : legs.map(l => ({ market: l.marketLabel, outcome: l.outcome, odds: 1 / l.price })),
      network,
      onSuccess: (digest) => {
        // Save ticket metadata locally so tickets page can display market names
        saveTicketMeta(digest, {
          txHash:    digest,
          stake:     stakeSui,
          timestamp: Date.now(),
          legs:      legs.map(l => ({ question: l.marketLabel, outcome: l.outcome, price: l.price })),
        });
        onSuccess?.();
      },
    });
  }

  let label = stakeLabel ? stakeLabel.toUpperCase() + ' →' : 'BUY PARLAY →';
  if (!isConnected)       label = 'CONNECT WALLET →';
  else if (stakeSui <= 0) label = 'ENTER STAKE AMOUNT';
  else if (isPending)     label = 'CONFIRM IN WALLET…';
  else if (isSuccess)     label = '✓ TICKET MINTED!';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <button
        onClick={handleClick}
        disabled={isPending || (isConnected && disabled)}
        style={{
          width: '100%',
          padding: '18px 24px',
          background: isSuccess ? 'var(--mint)' : errorMsg ? '#fee' : disabled && isConnected ? '#f0f0f0' : 'var(--black)',
          color:      isSuccess ? 'var(--black)' : errorMsg ? '#c00' : disabled && isConnected ? '#aaa' : 'var(--white)',
          border:     errorMsg ? '1px solid #c00' : '2px solid transparent',
          cursor:     isPending ? 'not-allowed' : 'pointer',
          fontWeight: 800, fontSize: 15, letterSpacing: '0.04em', textTransform: 'uppercase',
          transition: 'background 0.15s',
          borderRadius: 2,
        }}
      >
        {label}
      </button>

      {errorMsg && (
        <div style={{ fontSize: 12, color: '#c00', padding: '10px 14px', background: '#fff5f5', border: '1px solid #fcc', lineHeight: 1.5, borderRadius: 2 }}>
          ✕ {errorMsg.slice(0, 200)}
        </div>
      )}

      {(txDigest || isSuccess) && (
        <div style={{ padding: '12px 14px', background: isSuccess ? 'var(--mint)' : '#f8f8f8', border: `1px solid ${isSuccess ? 'var(--mint)' : 'var(--border)'}`, borderRadius: 2 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: txDigest ? 6 : 0 }}>
            <span style={{ fontWeight: 800, fontSize: 13 }}>
              {isSuccess ? '■ Ticket minted on Sui' : '■ Tx submitted'}
            </span>
            {isSuccess && (
              <a href="/tickets" style={{ fontWeight: 700, color: 'var(--black)', textDecoration: 'none', fontSize: 11, letterSpacing: '0.04em' }}>
                VIEW TICKET →
              </a>
            )}
          </div>
          {txDigest && (
            <a
              href={txUrl(txDigest, network)}
              target="_blank"
              rel="noreferrer"
              style={{ fontFamily: 'monospace', color: 'var(--black)', textDecoration: 'underline', fontSize: 11 }}
            >
              {txDigest.slice(0, 14)}…{txDigest.slice(-6)} ↗
            </a>
          )}
        </div>
      )}
    </div>
  );
}
