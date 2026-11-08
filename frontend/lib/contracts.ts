/**
 * Sui on-chain object IDs.
 * These are populated after `npx ts-node scripts/deploy.ts` runs.
 * Testnet and mainnet IDs are separate env vars.
 */

import type { Network } from './sui-client';

// ── Package + shared objects ──────────────────────────────────────────────────

function envOrEmpty(key: string): string {
  return (typeof process !== 'undefined' && process.env[key]) ? process.env[key]! : '';
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
