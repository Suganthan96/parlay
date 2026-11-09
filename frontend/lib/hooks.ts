'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  useCurrentAccount,
  useSuiClientQuery,
  useSignAndExecuteTransaction,
  useSuiClientContext,
} from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import {
  getPackageId, getTreasuryId, CLOCK_OBJECT_ID,
  suiToMist, mistToSui, WAD, formatSui,
} from './contracts';
import { storeTicketMeta } from './walrus';
import { getLiveFootballOdds, getSuiPrice, type BookmakerOdds } from './tatum';
import type { Network } from './sui-client';

// ── Network hook ──────────────────────────────────────────────────────────────

export function useNetwork(): { network: Network; selectNetwork: (n: Network) => void } {
  const ctx = useSuiClientContext();
  return {
    network:       ctx.network as Network,
    selectNetwork: (n: Network) => ctx.selectNetwork(n),
  };
}

// ── SUI balance ───────────────────────────────────────────────────────────────

export function useSuiBalance() {
  const account = useCurrentAccount();
  const { data, isLoading, refetch } = useSuiClientQuery(
    'getBalance',
    { owner: account?.address ?? '', coinType: '0x2::sui::SUI' },
    { enabled: !!account?.address, refetchInterval: 15_000 },
  );
  const totalMist = data?.totalBalance ? BigInt(data.totalBalance) : 0n;
  return {
    mist:      totalMist,
    sui:       mistToSui(totalMist),
    formatted: mistToSui(totalMist).toFixed(4),
    isLoading,
    refetch,
  };
}

// ── Football odds from Tatum ──────────────────────────────────────────────────

export function useFootballOdds() {
  const [odds, setOdds]     = useState<BookmakerOdds[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLiveFootballOdds().then(data => {
      setOdds(data);
      setLoading(false);
    });
    const id = setInterval(() => {
      getLiveFootballOdds().then(setOdds);
    }, 60_000);
    return () => clearInterval(id);
  }, []);

  return { odds, loading };
}

// ── SUI/USD price from Tatum ─────────────────────────────────────────────────

export function useSuiUsdPrice() {
  const [price, setPrice] = useState(0);
  useEffect(() => {
    getSuiPrice().then(setPrice);
    const id = setInterval(() => getSuiPrice().then(setPrice), 60_000);
    return () => clearInterval(id);
  }, []);
  return price;
}

// ── Parlay quote (client-side math, no on-chain call needed) ─────────────────

export function useQuoteParlay(
  legs: Array<{ price: number }>,
  stakeSui: number,
) {
  if (!legs.length || stakeSui <= 0) {
    return { combinedPrice: 0, payoutSui: 0, payoutMist: 0n, isValid: false };
  }
  // Combined decimal odds (product of all legs)
  const combined = legs.reduce((acc, l) => acc * l.price, 1);
  // Contract: margin_prob = combined_prob / 1.1, payout = stake * product(odds) * 1.1
  // (MARGIN_DEN/MARGIN_NUM = 100/110 reduces implied probability → larger payout)
  const payout = stakeSui * combined * (100 / 110);
  return {
    combinedPrice: combined,
    payoutSui:     payout,
    payoutMist:    suiToMist(payout),
    isValid:       payout > stakeSui,
  };
}

// ── Buy parlay ────────────────────────────────────────────────────────────────

interface BuyParlayParams {
  marketObjectIds: string[];
  oddsWad:         bigint[]; // WAD-scaled decimal odds (e.g. 2.0 → 2_000_000_000n)
  outcomes:        number[]; // 1=Home, 2=Away
  stakeSui:        number;
  minPayoutSui?:   number;
  legs:            Array<{ market: string; outcome: string; odds: number }>;
  network:         Network;
  onSuccess?:      (digest: string) => void;
  onError?:        (err: string) => void;
}

export function useBuyParlay() {
  const account = useCurrentAccount();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const [isPending,    setIsPending]    = useState(false);
  const [isSuccess,    setIsSuccess]    = useState(false);
  const [txDigest,     setTxDigest]     = useState('');
  const [errorMsg,     setErrorMsg]     = useState('');

  const buyParlay = useCallback(async (params: BuyParlayParams) => {
    const { marketObjectIds, oddsWad, outcomes, stakeSui, minPayoutSui = 0, legs, network } = params;
    if (!account?.address) { params.onError?.('Wallet not connected'); return; }

    setIsPending(true);
    setIsSuccess(false);
    setErrorMsg('');

    try {
      const packageId  = getPackageId(network);
      const treasuryId = getTreasuryId(network);
      if (!packageId || !treasuryId) throw new Error('Contract not deployed — run scripts/deploy.js first');

      const stakeMist     = suiToMist(stakeSui);
      const minPayoutMist = suiToMist(minPayoutSui);

      // 1. Store ticket metadata on Walrus (non-fatal — PTB proceeds with empty blob if unreachable)
      let blobIdBytes: number[] = [];
      try {
        const walrusResult = await storeTicketMeta({
          legs,
          stakeSui,
          payoutSui: minPayoutSui,
          buyerAddress: account.address,
          purchasedAt:  new Date().toISOString(),
        });
        blobIdBytes = walrusResult.blobIdBytes;
      } catch (walrusErr) {
        console.warn('Walrus store unavailable, continuing without blob:', walrusErr);
      }

      // 2. Build PTB matching new router signature:
      //    buy_parlay(market_ids: vector<address>, odds_wad: vector<u64>,
      //               outcomes: vector<u8>, stake: Coin<SUI>,
      //               min_payout_mist: u64, treasury: &mut Treasury,
      //               blob_id: vector<u8>, clock: &Clock)
      const tx = new Transaction();
      const [stakeCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(stakeMist)]);

      tx.moveCall({
        target:    `${packageId}::parlay_router::buy_parlay`,
        arguments: [
          tx.pure.vector('address', marketObjectIds),
          tx.pure.vector('u64', oddsWad.map(Number)),
          tx.pure.vector('u8', outcomes),
          stakeCoin,
          tx.pure.u64(minPayoutMist),
          tx.object(treasuryId),
          tx.pure.vector('u8', blobIdBytes),
          tx.object(CLOCK_OBJECT_ID),
        ],
      });

      const result = await signAndExecute({ transaction: tx });
      setTxDigest(result.digest);
      setIsSuccess(true);
      params.onSuccess?.(result.digest);
    } catch (e: any) {
      const msg = e?.message ?? 'Transaction failed';
      setErrorMsg(msg);
      params.onError?.(msg);
    } finally {
      setIsPending(false);
    }
  }, [account, signAndExecute]);

  return { buyParlay, isPending, isSuccess, txDigest, errorMsg };
}

// ── Claim winning ticket ──────────────────────────────────────────────────────

export function useClaim() {
  const account = useCurrentAccount();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const [isPending, setIsPending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [txDigest,  setTxDigest]  = useState('');
  const [errorMsg,  setErrorMsg]  = useState('');

  const claim = useCallback(async (ticketObjectId: string, network: Network) => {
    if (!account?.address) return;
    setIsPending(true);
    try {
      const packageId  = getPackageId(network);
      const treasuryId = getTreasuryId(network);
      const tx = new Transaction();
      tx.moveCall({
        target:    `${packageId}::parlay_vault::claim`,
        arguments: [
          tx.object(treasuryId),
          tx.object(ticketObjectId),
          tx.pure.u64(Date.now()),
        ],
      });
      const result = await signAndExecute({ transaction: tx });
      setTxDigest(result.digest);
      setIsSuccess(true);
    } catch (e: any) {
      setErrorMsg(e?.message ?? 'Claim failed');
    } finally {
      setIsPending(false);
    }
  }, [account, signAndExecute]);

  return { claim, isPending, isSuccess, txDigest, errorMsg };
}

// ── Cash out (early exit) ─────────────────────────────────────────────────────

export function useCashOut() {
  const account = useCurrentAccount();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const [isPending, setIsPending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [txDigest,  setTxDigest]  = useState('');
  const [errorMsg,  setErrorMsg]  = useState('');

  const cashOut = useCallback(async (
    ticketObjectId: string,
    network: Network,
  ) => {
    if (!account?.address) return;
    setIsPending(true);
    try {
      const packageId  = getPackageId(network);
      const treasuryId = getTreasuryId(network);
      const tx = new Transaction();
      // cash_out_ticket(ticket: Ticket, treasury: &mut Treasury)
      tx.moveCall({
        target:    `${packageId}::parlay_router::cash_out_ticket`,
        arguments: [
          tx.object(ticketObjectId),
          tx.object(treasuryId),
        ],
      });
      const result = await signAndExecute({ transaction: tx });
      setTxDigest(result.digest);
      setIsSuccess(true);
    } catch (e: any) {
      setErrorMsg(e?.message ?? 'Cash out failed');
    } finally {
      setIsPending(false);
    }
  }, [account, signAndExecute]);

  return { cashOut, isPending, isSuccess, txDigest, errorMsg };
}

// ── Owned tickets ─────────────────────────────────────────────────────────────

export function useOwnedTickets(network: Network = 'testnet') {
  const account   = useCurrentAccount();
  const packageId = getPackageId(network);
  const ticketType = packageId ? `${packageId}::parlay_vault::Ticket` : '';

  const { data, isLoading, refetch } = useSuiClientQuery(
    'getOwnedObjects',
    {
      owner:   account?.address ?? '',
      filter:  ticketType ? { StructType: ticketType } : undefined,
      options: { showContent: true, showType: true },
    },
    { enabled: !!account?.address && !!ticketType, refetchInterval: 15_000 },
  );

  const tickets = (data?.data ?? []).map((obj: any) => {
    const content  = obj.data?.content;
    const fields   = content?.fields ?? {};
    return {
      objectId:    obj.data?.objectId ?? '',
      stakeMist:   BigInt(fields.stake_mist ?? 0),
      payoutMist:  BigInt(fields.payout_mist ?? 0),
      status:      Number(fields.status ?? 0),
      legCount:    Number(fields.leg_count ?? 0),
      blobId:      fields.blob_id ? String.fromCharCode(...(fields.blob_id ?? [])) : '',
      legSummary:  fields.leg_summary ?? '',
      payoutDisplay: fields.payout_sui_display ?? '',
      createdAt:   Number(fields.created_at_ms ?? 0),
    };
  });

  return { tickets, isLoading, refetch };
}

// Legacy export aliases for compatibility
export { suiToMist as parseUnits, mistToSui as formatUnits, formatSui };
