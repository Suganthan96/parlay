/**
 * Walrus Memory (MemWal) integration via the official SDK.
 * Server-side only — the delegate key never reaches the browser.
 */
import { MemWal } from '@mysten-incubation/memwal';

let client: MemWal | null = null;

function memwal(): MemWal {
  if (!client) {
    const key       = process.env.MEMWAL_PRIVATE_KEY;
    const accountId = process.env.MEMWAL_ACCOUNT_ID;
    if (!key || !accountId) throw new Error('MEMWAL_PRIVATE_KEY / MEMWAL_ACCOUNT_ID not configured');
    client = MemWal.create({
      key,
      accountId,
      serverUrl: process.env.MEMWAL_SERVER_URL || 'https://relayer.memory.walrus.xyz',
      namespace: 'parlay',
    });
  }
  return client;
}

// Returns the Walrus blob ID of the stored (encrypted) memory.
export async function remember(namespace: string, text: string): Promise<string> {
  const res = await memwal().rememberAndWait(text, namespace);
  return res.blob_id;
}

export async function rememberBulk(namespace: string, items: string[]): Promise<string[]> {
  return Promise.all(items.map(text => remember(namespace, text)));
}

export async function recall(namespace: string, query: string): Promise<string> {
  try {
    const res = await memwal().recall(query, 5, namespace);
    return res.results.map(r => r.text).join('\n');
  } catch {
    return '';
  }
}

export async function analyze(namespace: string, text: string): Promise<string> {
  try {
    const res = await memwal().analyze(text, namespace);
    return res.facts.map(f => (f as any).text ?? String(f)).join('\n');
  } catch {
    return '';
  }
}

// ── Domain helpers ────────────────────────────────────────────────────────────

export async function recordPick(
  userAddress: string,
  legs: Array<{ market: string; outcome: string; odds: number }>,
  txDigest: string,
): Promise<string> {
  const summary = legs.map(l => `${l.market} → ${l.outcome} @ ${l.odds.toFixed(2)}x`).join(', ');
  return remember('picks', `User ${userAddress} placed parlay: [${summary}] tx=${txDigest} at ${new Date().toISOString()}`);
}

export async function recordOutcome(
  marketId: string,
  homeTeam: string,
  awayTeam: string,
  result: 'home' | 'away' | 'draw',
): Promise<string> {
  return remember('outcomes', `Market ${marketId} (${homeTeam} vs ${awayTeam}) settled: ${result} won at ${new Date().toISOString()}`);
}

export async function updateCredibility(userAddress: string, won: boolean, legs: number): Promise<void> {
  const event = won ? `WON ${legs}-leg parlay` : `LOST ${legs}-leg parlay`;
  await remember('credibility', `User ${userAddress}: ${event} at ${new Date().toISOString()}`);
}

export async function getCredibility(userAddress: string): Promise<string> {
  return recall('credibility', `What is the parlay win rate and history for user ${userAddress}?`);
}
