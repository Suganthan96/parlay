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

// On-chain PredictionMarket object IDs keyed by matchId (testnet)
export const TESTNET_MARKET_IDS: Record<string, string> = {
  'manchester-city-arsenal':    envOrEmpty('NEXT_PUBLIC_TESTNET_MARKET_MANCITY_ARSENAL'),
  'real-madrid-liverpool':      envOrEmpty('NEXT_PUBLIC_TESTNET_MARKET_REALMADRID_LIVERPOOL'),
  'psg-bayern':                 envOrEmpty('NEXT_PUBLIC_TESTNET_MARKET_PSG_BAYERN'),
};

export function getMarketObjectId(matchId: string, network: Network = 'testnet'): string {
  if (network !== 'testnet') return '';
  return TESTNET_MARKET_IDS[matchId] ?? '';
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
