'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  useCurrentAccount,
  useSuiClientQuery,
  useSignAndExecuteTransaction,
  useSuiClientContext,
  useSuiClient,
} from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import {
  getPackageId, getTreasuryId, getAdminCapId, CLOCK_OBJECT_ID,
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
  const client  = useSuiClient();
  const [mist,      setMist]      = useState(0n);
  const [isLoading, setIsLoading] = useState(false);

  const load = useCallback(async () => {
    if (!account?.address) return;
    setIsLoading(true);
    try {
      // gRPC client uses { owner, coinType } — same as JSON-RPC, should work
      const data = await (client as any).getBalance({
        owner: account.address,
        coinType: '0x2::sui::SUI',
      });
      // gRPC returns { balance: { balance: "...", addressBalance: "..." } }
      // JSON-RPC returns { totalBalance: "..." }
      const val = data?.totalBalance
        ?? data?.balance?.addressBalance
        ?? data?.balance?.balance
        ?? '0';
      setMist(BigInt(val));
    } catch (e) { console.warn('Balance fetch failed:', e); }
    finally { setIsLoading(false); }
  }, [account?.address, client]);

  useEffect(() => {
    load();
    const id = setInterval(load, 15_000);
    return () => clearInterval(id);
  }, [load]);

  return {
    mist,
    sui:       mistToSui(mist),
    formatted: mistToSui(mist).toFixed(4),
    isLoading,
    refetch:   load,
  };
}

// ── House treasury balance (caps the max payout the contract will accept) ──────

export function useTreasuryBalance(network: Network) {
  const client = useSuiClient();
  const [sui, setSui] = useState<number | null>(null);

  useEffect(() => {
    const treasuryId = getTreasuryId(network);
    if (!treasuryId) return;
    let cancelled = false;
    const load = async () => {
      try {
        const res: any = await (client as any).getObject({ objectId: treasuryId, include: { content: true } });
        const bytes = new Uint8Array(res?.object?.content ?? []);
        if (bytes.length < 40) return;
        // Treasury BCS: id(32) + balance: Balance<SUI>(u64)
        const mist = new DataView(bytes.buffer, bytes.byteOffset).getBigUint64(32, true);
        if (!cancelled) setSui(mistToSui(mist));
      } catch (e) { console.warn('Treasury fetch failed:', e); }
    };
    load();
    const id = setInterval(load, 30_000);
    return () => { cancelled = true; clearInterval(id); };
  }, [client, network]);

  return sui;
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
  // l.price is implied probability (e.g. 0.32 for a 32% / 3.11× leg)
  // combined = joint probability of all legs winning
  const combined = legs.reduce((acc, l) => acc * l.price, 1);
  // payout = stake / joint_prob / 1.1  (house takes 10% margin)
  // matches Move: payout = stake * WAD / (combined_prob_wad * 110/100)
  const payout = stakeSui / combined / 1.1;
  // combinedPrice shown as decimal odds: 1 / joint_prob
  const combinedOdds = combined > 0 ? 1 / combined : 0;
  return {
    combinedPrice: combinedOdds,
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
  onSuccess?:      (digest: string, ticketObjectId: string) => void;
  onError?:        (err: string) => void;
}

export function useBuyParlay() {
  const account = useCurrentAccount();
  const client  = useSuiClient();
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
          network,
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
      const digest = result.digest;
      setTxDigest(digest);
      setIsSuccess(true);

      let ticketObjectId = '';
      try {
        const res = await (client as any).waitForTransaction({
          digest,
          include: { effects: true, objectTypes: true },
        });
        const txn   = res?.Transaction ?? res?.FailedTransaction ?? res;
        const types: Record<string, string> = txn?.objectTypes ?? {};
        ticketObjectId = (txn?.effects?.changedObjects ?? []).find((c: any) =>
          c.idOperation === 'Created' && (types[c.objectId] ?? '').includes('::parlay_vault::Ticket')
        )?.objectId ?? '';
      } catch (e) { console.warn('Could not resolve ticket objectId:', e); }

      params.onSuccess?.(digest, ticketObjectId);
    } catch (e: any) {
      const raw = e?.message ?? 'Transaction failed';
      const msg = /abort code: 0, in '[^']*::parlay_vault::mint_ticket'/.test(raw)
        ? 'The House Treasury cannot cover this payout. Lower your stake or remove a leg.'
        : raw;
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

// ── Settle ticket (admin) ─────────────────────────────────────────────────────

export function useSettleTicket() {
  const account = useCurrentAccount();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const [isPending, setIsPending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [txDigest,  setTxDigest]  = useState('');
  const [errorMsg,  setErrorMsg]  = useState('');

  const settle = useCallback(async (
    ticketObjectId: string,
    won: boolean,
    network: Network,
  ) => {
    if (!account?.address) return;
    setIsPending(true);
    setIsSuccess(false);
    setErrorMsg('');
    try {
      const packageId   = getPackageId(network);
      const adminCapId  = getAdminCapId(network);
      if (!packageId || !adminCapId) throw new Error('No AdminCap configured for this network');
      const tx = new Transaction();
      tx.moveCall({
        target: `${packageId}::parlay_router::${won ? 'settle_won' : 'settle_lost'}`,
        arguments: [
          tx.object(adminCapId),
          tx.object(ticketObjectId),
        ],
      });
      const result = await signAndExecute({ transaction: tx });
      setTxDigest(result.digest);
      setIsSuccess(true);
    } catch (e: any) {
      setErrorMsg(e?.message ?? 'Settle failed');
      setTimeout(() => setErrorMsg(''), 4000);
    } finally {
      setIsPending(false);
    }
  }, [account, signAndExecute]);

  return { settle, isPending, isSuccess, txDigest, errorMsg };
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

// Decode Ticket BCS bytes:
// id(32) + owner(32) + stake_mist(8) + payout_mist(8) + leg_count(1) +
// legs(vec: len + each(market_id:32 + outcome:1 + price_wad:8)) +
// status(1) + blob_id(vec<u8>) + created_at_ms(8) + leg_summary(str) + payout_sui_display(str)
function decodeTicketBcs(bytes: Uint8Array) {
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let off = 64; // skip id(32) + owner(32)
  const stakeMist  = dv.getBigUint64(off, true); off += 8;
  const payoutMist = dv.getBigUint64(off, true); off += 8;
  const legCount   = bytes[off++];
  const legsLen    = bytes[off++]; // ULEB128 vector length (1 byte for ≤127)

  // Decode each leg to extract market object IDs for reverse-mapping to match names
  const legMarketIds: string[] = [];
  const legOutcomes:  number[] = [];
  for (let i = 0; i < legsLen; i++) {
    const hex = Array.from(bytes.slice(off, off + 32))
      .map(b => b.toString(16).padStart(2, '0')).join('');
    legMarketIds.push('0x' + hex);
    legOutcomes.push(bytes[off + 32]);
    off += 41; // market_id(32) + outcome(1) + price_wad(8)
  }

  const status     = bytes[off++];
  const blobLen    = bytes[off++]; // ULEB128 1 byte for typical blobIds (< 128 chars)
  const blobId     = new TextDecoder().decode(bytes.slice(off, off + blobLen)); off += blobLen;
  const createdAt  = Number(dv.getBigUint64(off, true)); off += 8;
  const summaryLen = bytes[off++];
  const legSummary = new TextDecoder().decode(bytes.slice(off, off + summaryLen)); off += summaryLen;
  const displayLen = bytes[off++];
  const payoutDisplay = new TextDecoder().decode(bytes.slice(off, off + displayLen));
  return { stakeMist, payoutMist, legCount, status, blobId, createdAt, legSummary, payoutDisplay, legMarketIds, legOutcomes };
}

export function useOwnedTickets(network: Network = 'testnet') {
  const account    = useCurrentAccount();
  const client     = useSuiClient();
  const packageId  = getPackageId(network);
  const ticketType = packageId ? `${packageId}::parlay_vault::Ticket` : '';

  type TicketItem = ReturnType<typeof decodeTicketBcs> & { objectId: string; txDigest: string };
  const [tickets,   setTickets]   = useState<TicketItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refetch = useCallback(async () => {
    if (!account?.address || !ticketType) return;
    setIsLoading(true);
    try {
      const objs: any[] = [];
      let cursor: string | null = null;
      do {
        const page: any = await (client as any).listOwnedObjects({
          owner:   account.address,
          type:    ticketType,
          include: { content: true, previousTransaction: true },
          cursor,
        });
        objs.push(...(page?.objects ?? []));
        cursor = page?.hasNextPage ? page.cursor : null;
      } while (cursor);

      const decoded: TicketItem[] = objs.map(obj => ({
        objectId: obj.objectId ?? '',
        txDigest: obj.previousTransaction ?? '',
        ...decodeTicketBcs(new Uint8Array(obj.content)),
      }));
      decoded.sort((a, b) => b.createdAt - a.createdAt);
      setTickets(decoded);
    } catch (e) { console.warn('Tickets fetch failed:', e); }
    finally { setIsLoading(false); }
  }, [account?.address, client, ticketType]);

  useEffect(() => {
    refetch();
    const id = setInterval(refetch, 15_000);
    return () => clearInterval(id);
  }, [refetch]);

  return { tickets, isLoading, refetch };
}

// ── Server-side settle (called explicitly — not auto-timed) ───────────────────

export async function serverSettleTicket(
  ticketId: string,
  won: boolean,
  network: Network,
): Promise<{ ok: boolean; digest?: string; error?: string }> {
  try {
    const res = await fetch('/api/settle-ticket', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ ticketId, won, network }),
    });
    return await res.json();
  } catch (e: any) {
    return { ok: false, error: e?.message ?? 'Network error' };
  }
}

// Legacy export aliases for compatibility
export { suiToMist as parseUnits, mistToSui as formatUnits, formatSui };
