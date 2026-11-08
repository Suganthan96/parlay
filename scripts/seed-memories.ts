/**
 * Seed Walrus Memory with 10+ domain memories required by the hackathon.
 * Usage:  npx ts-node scripts/seed-memories.ts
 *
 * Walrus Memory docs: https://docs.memory.walrus.xyz/
 */

const MEMWAL_SERVER   = 'https://relayer.memory.walrus.xyz';
const MEMWAL_API_KEY  = process.env.MEMWAL_PRIVATE_KEY ?? '';
const AGENT_ID        = process.env.MEMWAL_AGENT_ID ?? '';

async function remember(namespace: string, text: string): Promise<string> {
  const res = await fetch(`${MEMWAL_SERVER}/api/v1/remember`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${MEMWAL_API_KEY}` },
    body:    JSON.stringify({ agentId: AGENT_ID, namespace, text }),
  });
  const json = await res.json() as { blobId?: string; id?: string; error?: string };
  if (!res.ok) throw new Error(`MemWal error: ${json.error ?? res.statusText}`);
  const id = json.blobId ?? json.id ?? '(ok)';
  console.log(`  ✓ [${namespace}] → ${id}`);
  return id;
}

const MEMORIES: { ns: string; text: string }[] = [
  // ── Protocol knowledge ──────────────────────────────────────────────────────
  {
    ns:   'protocol:rules',
    text: 'Parlay Markets is an on-chain sports parlay prediction market built on Sui. ' +
          'Users combine 2–5 prediction legs into a single bet. ' +
          'The combined payout multiplier is the product of each leg\'s decimal odds. ' +
          'The house applies a 10% margin, so payout = stake × product_odds × 0.9. ' +
          'Maximum payout per ticket is 100 SUI to protect the treasury.',
  },
  {
    ns:   'protocol:treasury',
    text: 'The house treasury is seeded with 500 SUI by the deployer as initial float. ' +
          'Losing stakes are automatically retained in the treasury. ' +
          'Winning stakes trigger payouts from the treasury up to MAX_PAYOUT_MIST = 100 SUI. ' +
          'The treasury is a shared Sui object (parlay_vault::Treasury).',
  },
  {
    ns:   'protocol:pricing',
    text: 'Odds are expressed as WAD-scaled fixed-point integers (1 WAD = 1e9). ' +
          'A decimal odds of 2.5 is stored as 2_500_000_000. ' +
          'Combined parlay price = product of all leg WAD prices / WAD^(n-1). ' +
          'Payout in MIST = stake_mist × combined_price_wad × 9 / (WAD × 10).',
  },
  {
    ns:   'protocol:nfts',
    text: 'Each parlay ticket is an owned NFT Sui object (parlay_vault::Ticket). ' +
          'On a win, the ticket is burned and a WinningTicket trophy NFT is minted. ' +
          'Ticket metadata (legs, odds, teams) is stored as a Walrus blob — the blob_id is recorded on-chain in the Ticket object. ' +
          'The Display standard makes tickets visible in Slush wallet.',
  },
  // ── Live odds ───────────────────────────────────────────────────────────────
  {
    ns:   'odds:source',
    text: 'Live bookmaker odds are fetched from the Tatum Prediction API: GET /v4/data/predictions?sportType=soccer. ' +
          'The endpoint returns JSON with home/away/draw probability and decimal odds for upcoming football fixtures. ' +
          'Fallback mock data covers 6 Premier League and Champions League matches.',
  },
  {
    ns:   'odds:football',
    text: 'Supported football markets: English Premier League (EPL) and UEFA Champions League. ' +
          'Each market has three outcomes: home win (outcome 1), away win (outcome 2), draw (outcome 3). ' +
          'Only home and away outcomes are supported in the initial smart contract version.',
  },
  // ── Tatum integration ───────────────────────────────────────────────────────
  {
    ns:   'tatum:rpc',
    text: 'Sui RPC calls are routed through Tatum\'s JSON-RPC proxy at https://sui-testnet.tatum.io (testnet) and https://sui-mainnet.tatum.io (mainnet). ' +
          'The Tatum API key is injected via the x-api-key HTTP header server-side. ' +
          'The Next.js /api/rpc proxy route keeps the API key off the client.',
  },
  {
    ns:   'tatum:sui-price',
    text: 'Real-time SUI/USD price is fetched from Tatum Rates API: GET https://api.tatum.io/v3/tatum/rate/SUI. ' +
          'This is used to display stake and payout amounts in USD alongside SUI.',
  },
  // ── Walrus ──────────────────────────────────────────────────────────────────
  {
    ns:   'walrus:blobs',
    text: 'Ticket metadata is stored on Walrus decentralized storage at https://publisher.walrus-testnet.walrus.space/v1/blobs. ' +
          'The blob ID is recorded on-chain in the Ticket object\'s blob_id field. ' +
          'Anyone can retrieve ticket details from https://aggregator.walrus-testnet.walrus.space/v1/blobs/<blobId>.',
  },
  {
    ns:   'walrus:memory',
    text: 'Walrus Memory (MemWal) is used to record every parlay pick and outcome. ' +
          'Server-side calls go to https://relayer.memory.walrus.xyz/api/v1/. ' +
          'The remember() function stores picks; recall() and analyze() retrieve credibility scores. ' +
          'Namespaces: picks:<address>, outcomes:<marketId>, credibility:<address>.',
  },
  // ── Trust & credibility ─────────────────────────────────────────────────────
  {
    ns:   'trust:credibility',
    text: 'Each wallet earns a credibility score based on historical parlay accuracy. ' +
          'A win on a 3-leg parlay adds +3 credibility points. A loss subtracts 1 point. ' +
          'High credibility wallets are featured as "sharp bettors" in the UI. ' +
          'Credibility data is stored in Walrus Memory and cannot be altered retroactively.',
  },
  // ── Hackathon tracks ────────────────────────────────────────────────────────
  {
    ns:   'hackathon:tracks',
    text: 'Parlay Markets submits to two Tatum × Walrus Total Recall Hackathon tracks: ' +
          '(1) Markets Track — prediction market with live odds, NFT tickets, house treasury on Sui. ' +
          '(2) Finance Track — house treasury as a permissioned liquidity pool, WAD-based fixed-point pricing, Tatum RPC for all on-chain reads. ' +
          'Walrus Memory satisfies the Walrus + MemWal integration requirement.',
  },
  // ── Unique differentiators ──────────────────────────────────────────────────
  {
    ns:   'product:differentiators',
    text: 'What makes Parlay Markets unique vs. Polymarket: ' +
          '(1) Multi-leg parlays compound odds for high leverage — Polymarket only supports single-question bets. ' +
          '(2) Real bookmaker odds from Tatum feed directly on-chain — no AMM, no LMSR complexity. ' +
          '(3) Walrus Memory trust scores reward accurate pickers over time. ' +
          '(4) Ticket NFTs with Walrus blob metadata are viewable in any Sui wallet.',
  },
];

async function main() {
  console.log(`\n🧠 Seeding ${MEMORIES.length} memories to Walrus Memory…\n`);
  let ok = 0;
  for (const m of MEMORIES) {
    try {
      await remember(m.ns, m.text);
      ok++;
      await new Promise(r => setTimeout(r, 300)); // gentle rate limit
    } catch (e: any) {
      console.error(`  ✗ [${m.ns}] failed: ${e.message}`);
    }
  }
  console.log(`\n✅ Done. ${ok}/${MEMORIES.length} memories written.\n`);
}

main().catch(e => { console.error(e); process.exit(1); });
