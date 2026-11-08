/**
 * Walrus Memory (MemWal) integration.
 * Used for: credibility scores, pick history, market memories, outcome records.
 * All calls are server-side only (private key stays on server).
 */

const MEMWAL_SERVER   = 'https://relayer.memory.walrus.xyz';
const MEMWAL_AGENT_ID = process.env.MEMWAL_AGENT_ID    ?? '';
const MEMWAL_ACCOUNT  = process.env.MEMWAL_ACCOUNT_ID  ?? '';
const MEMWAL_KEY      = process.env.MEMWAL_PRIVATE_KEY ?? '';

function headers() {
  return {
    'Content-Type':  'application/json',
    'Authorization': `Bearer ${MEMWAL_KEY}`,
  };
}

// ── remember ─────────────────────────────────────────────────────────────────

export async function remember(namespace: string, text: string): Promise<string> {
  const res = await fetch(`${MEMWAL_SERVER}/api/v1/remember`, {
    method:  'POST',
    headers: headers(),
    body: JSON.stringify({
      agentId:   MEMWAL_AGENT_ID,
      accountId: MEMWAL_ACCOUNT,
      namespace,
      text,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`MemWal remember failed: ${err}`);
  }
  const json = await res.json();
  return json.id ?? json.blobId ?? 'ok';
}

// ── rememberBulk ──────────────────────────────────────────────────────────────

export async function rememberBulk(
  namespace: string,
  items: string[],
): Promise<string[]> {
  return Promise.all(items.map(text => remember(namespace, text)));
}

// ── recall ───────────────────────────────────────────────────────────────────

export async function recall(namespace: string, query: string): Promise<string> {
  const res = await fetch(`${MEMWAL_SERVER}/api/v1/recall`, {
    method:  'POST',
    headers: headers(),
    body: JSON.stringify({
      agentId:   MEMWAL_AGENT_ID,
      accountId: MEMWAL_ACCOUNT,
      namespace,
      query,
    }),
  });
  if (!res.ok) return '';
  const json = await res.json();
  return json.text ?? json.result ?? '';
}

// ── analyze ───────────────────────────────────────────────────────────────────

export async function analyze(namespace: string, query: string): Promise<string> {
  const res = await fetch(`${MEMWAL_SERVER}/api/v1/analyze`, {
    method:  'POST',
    headers: headers(),
    body: JSON.stringify({
      agentId:   MEMWAL_AGENT_ID,
      accountId: MEMWAL_ACCOUNT,
      namespace,
      query,
    }),
  });
  if (!res.ok) return '';
  const json = await res.json();
  return json.analysis ?? json.text ?? '';
}

// ── Domain helpers ────────────────────────────────────────────────────────────

// Record a user's pick — called when they buy a parlay
export async function recordPick(
  userAddress: string,
  legs: Array<{ market: string; outcome: string; odds: number }>,
  txDigest: string,
): Promise<void> {
  const summary = legs.map(l => `${l.market} → ${l.outcome} @ ${l.odds.toFixed(2)}x`).join(', ');
  await remember('picks', `User ${userAddress} placed parlay: [${summary}] tx=${txDigest} at ${new Date().toISOString()}`);
}

// Record a settlement outcome — called by the settlement watcher
export async function recordOutcome(
  marketId: string,
  homeTeam: string,
  awayTeam: string,
  result: 'home' | 'away' | 'draw',
): Promise<void> {
  await remember('outcomes', `Market ${marketId} (${homeTeam} vs ${awayTeam}) settled: ${result} won at ${new Date().toISOString()}`);
}

// Update a user's credibility score based on win/loss history
export async function updateCredibility(
  userAddress: string,
  won: boolean,
  legs: number,
): Promise<void> {
  const event = won ? `WON ${legs}-leg parlay` : `LOST ${legs}-leg parlay`;
  await remember('credibility', `User ${userAddress}: ${event} at ${new Date().toISOString()}`);
}

// Get a user's credibility summary
export async function getCredibility(userAddress: string): Promise<string> {
  return recall('credibility', `What is the parlay win rate and history for user ${userAddress}?`);
}
