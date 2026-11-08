/**
 * Tatum API integration.
 * Uses Tatum for:
 *  1. Sui RPC (sui_getObject, suix_getOwnedObjects, etc.)
 *  2. Prediction API — bookmaker odds for soccer matches
 *  3. Prices API — live SUI/USD rate
 */

import type { Network } from './sui-client';

const TATUM_TESTNET_KEY = process.env.TATUM_TESTNET_KEY ?? process.env.NEXT_PUBLIC_TATUM_TESTNET_KEY ?? '';
const TATUM_MAINNET_KEY = process.env.TATUM_MAINNET_KEY ?? process.env.NEXT_PUBLIC_TATUM_MAINNET_KEY ?? '';

function suiRpcUrl(network: Network): string {
  return network === 'mainnet'
    ? 'https://sui-mainnet.tatum.io'
    : 'https://sui-testnet.tatum.io';
}

function apiKey(network: Network): string {
  return network === 'mainnet' ? TATUM_MAINNET_KEY : TATUM_TESTNET_KEY;
}

// ── Sui RPC helpers ───────────────────────────────────────────────────────────

export async function suiRpc<T = unknown>(
  method: string,
  params: unknown[],
  network: Network = 'testnet',
): Promise<T> {
  const res = await fetch(suiRpcUrl(network), {
    method:  'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key':    apiKey(network),
    },
    body: JSON.stringify({ jsonrpc: '2.0', id: Date.now(), method, params }),
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error.message ?? JSON.stringify(json.error));
  return json.result as T;
}

export async function getSuiObject(
  objectId: string,
  network: Network = 'testnet',
) {
  return suiRpc('sui_getObject', [
    objectId,
    { showContent: true, showType: true, showOwner: true },
  ], network);
}

export async function getOwnedObjects(
  address: string,
  filter?: { StructType?: string },
  network: Network = 'testnet',
) {
  return suiRpc('suix_getOwnedObjects', [
    address,
    { filter, options: { showContent: true, showType: true } },
    null,
    50,
  ], network);
}

export async function queryEvents(
  eventType: string,
  network: Network = 'testnet',
) {
  return suiRpc('suix_queryEvents', [
    { MoveEventType: eventType },
    null,
    50,
    true,
  ], network);
}

// ── Prices API ────────────────────────────────────────────────────────────────

export async function getSuiPrice(): Promise<number> {
  try {
    const res = await fetch('https://api.tatum.io/v3/tatum/rate/SUI', {
      headers: { 'x-api-key': TATUM_TESTNET_KEY },
    });
    const json = await res.json();
    // Response: { id: "SUI", basePair: "USD", value: "1.23", ... }
    return parseFloat(json.value ?? '0');
  } catch {
    return 0;
  }
}

export function suiToUsd(sui: number, suiPrice: number): string {
  return (sui * suiPrice).toFixed(2);
}

// ── Prediction API (bookmaker odds for soccer) ────────────────────────────────

export interface BookmakerOdds {
  matchId:   string;
  homeTeam:  string;
  awayTeam:  string;
  homeOdds:  number; // decimal odds e.g. 2.10
  drawOdds?: number;
  awayOdds:  number;
  kickoff:   number; // unix timestamp (seconds)
}

export async function getLiveFootballOdds(): Promise<BookmakerOdds[]> {
  try {
    // Tatum Prediction API — real bookmaker odds
    const res = await fetch(
      'https://api.tatum.io/v4/data/predictions?sportType=soccer&pageSize=20',
      { headers: { 'x-api-key': TATUM_TESTNET_KEY } },
    );
    if (!res.ok) return getMockFootballOdds();
    const json = await res.json();
    const data = Array.isArray(json) ? json : json.data ?? json.results ?? [];
    if (!data.length) return getMockFootballOdds();
    return data.map((m: any) => ({
      matchId:  m.id ?? m.matchId ?? String(Math.random()),
      homeTeam: m.homeTeam ?? m.home_team ?? 'Home',
      awayTeam: m.awayTeam ?? m.away_team ?? 'Away',
      homeOdds: parseFloat(m.homeOdds ?? m.home_odds ?? '1.9'),
      drawOdds: m.drawOdds ? parseFloat(m.drawOdds) : undefined,
      awayOdds: parseFloat(m.awayOdds ?? m.away_odds ?? '2.1'),
      kickoff:  m.startTime ? Math.floor(new Date(m.startTime).getTime() / 1000) : Math.floor(Date.now() / 1000) + 86400,
    }));
  } catch {
    return getMockFootballOdds();
  }
}

// Fallback: realistic Premier League-style fixtures
function getMockFootballOdds(): BookmakerOdds[] {
  const base = Math.floor(Date.now() / 1000);
  return [
    { matchId: 'man-city-liverpool',    homeTeam: 'Man City',  awayTeam: 'Liverpool',   homeOdds: 1.95, drawOdds: 3.50, awayOdds: 3.80, kickoff: base + 86400     },
    { matchId: 'arsenal-chelsea',       homeTeam: 'Arsenal',   awayTeam: 'Chelsea',     homeOdds: 1.75, drawOdds: 3.80, awayOdds: 4.50, kickoff: base + 86400 * 2  },
    { matchId: 'barca-real-madrid',     homeTeam: 'Barcelona', awayTeam: 'Real Madrid', homeOdds: 2.60, drawOdds: 3.20, awayOdds: 2.65, kickoff: base + 86400 * 3  },
    { matchId: 'psg-man-united',        homeTeam: 'PSG',       awayTeam: 'Man Utd',     homeOdds: 1.60, drawOdds: 4.00, awayOdds: 5.50, kickoff: base + 86400 * 4  },
    { matchId: 'juventus-inter-milan',  homeTeam: 'Juventus',  awayTeam: 'Inter Milan', homeOdds: 2.80, drawOdds: 3.10, awayOdds: 2.50, kickoff: base + 86400 * 5  },
    { matchId: 'tottenham-newcastle',   homeTeam: 'Tottenham', awayTeam: 'Newcastle',   homeOdds: 2.10, drawOdds: 3.40, awayOdds: 3.30, kickoff: base + 86400 * 6  },
  ];
}

// Convert bookmaker decimal odds → probability (WAD = 1e9)
export function oddsToWad(decimalOdds: number): bigint {
  // prob = 1 / decimalOdds
  const prob = 1 / Math.max(1.01, decimalOdds);
  return BigInt(Math.round(prob * 1_000_000_000));
}

// Convert WAD probability → implied decimal odds
export function wadToOdds(wad: bigint): number {
  const prob = Number(wad) / 1_000_000_000;
  return prob > 0 ? 1 / prob : 0;
}
