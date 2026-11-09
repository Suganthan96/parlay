/**
 * Sui on-chain object IDs.
 * These are populated after `npx ts-node scripts/deploy.ts` runs.
 * Testnet and mainnet IDs are separate env vars.
 */

import type { Network } from './sui-client';

// ── Package + shared objects ──────────────────────────────────────────────────

// Next.js only inlines NEXT_PUBLIC_* vars when accessed as literal keys.
// Dynamic process.env[key] returns undefined in the browser, so we map explicitly.
const ENV: Record<string, string> = {
  NEXT_PUBLIC_TESTNET_PACKAGE_ID:              process.env.NEXT_PUBLIC_TESTNET_PACKAGE_ID              ?? '',
  NEXT_PUBLIC_TESTNET_TREASURY_ID:             process.env.NEXT_PUBLIC_TESTNET_TREASURY_ID             ?? '',
  NEXT_PUBLIC_TESTNET_ADMIN_CAP_ID:            process.env.NEXT_PUBLIC_TESTNET_ADMIN_CAP_ID            ?? '',
  NEXT_PUBLIC_TESTNET_MARKET_MANCITY_ARSENAL:  process.env.NEXT_PUBLIC_TESTNET_MARKET_MANCITY_ARSENAL  ?? '',
  NEXT_PUBLIC_TESTNET_MARKET_REALMADRID_LIVERPOOL: process.env.NEXT_PUBLIC_TESTNET_MARKET_REALMADRID_LIVERPOOL ?? '',
  NEXT_PUBLIC_TESTNET_MARKET_PSG_BAYERN:       process.env.NEXT_PUBLIC_TESTNET_MARKET_PSG_BAYERN       ?? '',
  NEXT_PUBLIC_MAINNET_PACKAGE_ID:              process.env.NEXT_PUBLIC_MAINNET_PACKAGE_ID              ?? '',
  NEXT_PUBLIC_MAINNET_TREASURY_ID:             process.env.NEXT_PUBLIC_MAINNET_TREASURY_ID             ?? '',
  NEXT_PUBLIC_MAINNET_ADMIN_CAP_ID:            process.env.NEXT_PUBLIC_MAINNET_ADMIN_CAP_ID            ?? '',
  NEXT_PUBLIC_MAINNET_MARKET_MANCITY_ARSENAL:  process.env.NEXT_PUBLIC_MAINNET_MARKET_MANCITY_ARSENAL  ?? '',
  NEXT_PUBLIC_MAINNET_MARKET_REALMADRID_LIVERPOOL: process.env.NEXT_PUBLIC_MAINNET_MARKET_REALMADRID_LIVERPOOL ?? '',
  NEXT_PUBLIC_MAINNET_MARKET_PSG_BAYERN:       process.env.NEXT_PUBLIC_MAINNET_MARKET_PSG_BAYERN       ?? '',
};

function envOrEmpty(key: string): string {
  return ENV[key] ?? '';
}

export function getPackageId(network: Network = 'testnet'): string {
  return network === 'mainnet'
    ? envOrEmpty('NEXT_PUBLIC_MAINNET_PACKAGE_ID')
    : envOrEmpty('NEXT_PUBLIC_TESTNET_PACKAGE_ID');
}

export function getTreasuryId(network: Network = 'testnet'): string {
  return network === 'mainnet'
    ? envOrEmpty('NEXT_PUBLIC_MAINNET_TREASURY_ID')
    : envOrEmpty('NEXT_PUBLIC_TESTNET_TREASURY_ID');
}

export function getAdminCapId(network: Network = 'testnet'): string {
  return network === 'mainnet'
    ? envOrEmpty('NEXT_PUBLIC_MAINNET_ADMIN_CAP_ID')
    : envOrEmpty('NEXT_PUBLIC_TESTNET_ADMIN_CAP_ID');
}

// Known Sui system objects (same on all networks)
export const CLOCK_OBJECT_ID = '0x6';
export const SUI_COIN_TYPE   = '0x2::sui::SUI';

// On-chain PredictionMarket object IDs keyed by matchId
export const TESTNET_MARKET_IDS: Record<string, string> = {
  'manchester-city-arsenal':    envOrEmpty('NEXT_PUBLIC_TESTNET_MARKET_MANCITY_ARSENAL'),
  'real-madrid-liverpool':      envOrEmpty('NEXT_PUBLIC_TESTNET_MARKET_REALMADRID_LIVERPOOL'),
  'psg-bayern':                 envOrEmpty('NEXT_PUBLIC_TESTNET_MARKET_PSG_BAYERN'),
};

export const MAINNET_MARKET_IDS: Record<string, string> = {
  'manchester-city-arsenal':    envOrEmpty('NEXT_PUBLIC_MAINNET_MARKET_MANCITY_ARSENAL'),
  'real-madrid-liverpool':      envOrEmpty('NEXT_PUBLIC_MAINNET_MARKET_REALMADRID_LIVERPOOL'),
  'psg-bayern':                 envOrEmpty('NEXT_PUBLIC_MAINNET_MARKET_PSG_BAYERN'),
};

export function getMarketObjectId(matchId: string, network: Network = 'testnet'): string {
  const ids = network === 'mainnet' ? MAINNET_MARKET_IDS : TESTNET_MARKET_IDS;
  return ids[matchId] ?? '';
}

const MATCH_DISPLAY: Record<string, string> = {
  'manchester-city-arsenal':    'Man City vs Arsenal',
  'real-madrid-liverpool':      'Real Madrid vs Liverpool',
  'psg-bayern':                 'PSG vs Bayern',
};

export function matchLabelFromMarketId(marketObjectId: string, _network?: Network): string {
  const id = marketObjectId.toLowerCase();
  // Build a reverse map keyed by object ID (both networks).
  // Cannot spread by matchId — same key overwrites, losing one network's IDs.
  const reverseMap = new Map<string, string>();
  for (const [matchId, objId] of Object.entries(TESTNET_MARKET_IDS)) {
    reverseMap.set(objId.toLowerCase(), matchId);
  }
  for (const [matchId, objId] of Object.entries(MAINNET_MARKET_IDS)) {
    reverseMap.set(objId.toLowerCase(), matchId);
  }
  const matchId = reverseMap.get(id);
  return matchId ? (MATCH_DISPLAY[matchId] ?? matchId) : marketObjectId.slice(0, 10) + '…';
}

// WAD denominator — matches Move contracts
export const WAD = 1_000_000_000n;
export const MIST_PER_SUI = 1_000_000_000n;

// Max single ticket payout (100 SUI in MIST)
export const MAX_PAYOUT_MIST = 100_000_000_000n;

// ── Move type targets ─────────────────────────────────────────────────────────

export function marketType(packageId: string): string {
  return `${packageId}::prediction_market::PredictionMarket`;
}

export function ticketType(packageId: string): string {
  return `${packageId}::parlay_vault::Ticket`;
}

export function winningTicketType(packageId: string): string {
  return `${packageId}::parlay_vault::WinningTicket`;
}

// ── Sui amount helpers ────────────────────────────────────────────────────────

export function suiToMist(sui: number): bigint {
  return BigInt(Math.round(sui * 1_000_000_000));
}

export function mistToSui(mist: bigint): number {
  return Number(mist) / 1_000_000_000;
}

export function formatSui(mist: bigint, decimals = 4): string {
  return mistToSui(mist).toFixed(decimals);
}
