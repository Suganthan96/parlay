/**
 * Seed Walrus Memory using the official @mysten-incubation/memwal SDK.
 * Run: node scripts/seed-memories-sdk.mjs
 *
 * Requires node_modules in /tmp/memwal-seed or locally installed.
 */

import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { resolve, dirname } from 'path';

// Point to the installed SDK
const require = createRequire(import.meta.url);

// Load the SDK from /tmp/memwal-seed where we npm-installed it
const sdkPath = '/tmp/memwal-seed/node_modules/@mysten-incubation/memwal';
let MemWal;
try {
  const sdk = await import(sdkPath + '/dist/memwal.js');
  MemWal = sdk.MemWal;
} catch (e) {
  console.error('Could not load SDK from', sdkPath, ':', e.message);
  process.exit(1);
}

const MEMWAL_PRIVATE_KEY = process.env.MEMWAL_PRIVATE_KEY ?? '';
const MEMWAL_ACCOUNT_ID  = process.env.MEMWAL_ACCOUNT_ID  ?? '';
if (!MEMWAL_PRIVATE_KEY) { console.error('Set MEMWAL_PRIVATE_KEY env var'); process.exit(1); }

const MEMORIES = [
  { ns: 'protocol:rules',
    text: 'Parlay Markets is an on-chain sports parlay prediction market built on Sui. Users combine 2-5 prediction legs into a single bet. The combined payout multiplier is the product of each leg decimal odds. The house applies a 10% margin, so payout = stake x product_odds x 0.9. Maximum payout per ticket is 100 SUI to protect the treasury.' },
  { ns: 'protocol:treasury',
    text: 'The house treasury is seeded with 500 SUI by the deployer as initial float. Losing stakes are retained in the treasury automatically. Winning stakes trigger payouts from the treasury up to MAX_PAYOUT_MIST = 100 SUI. The treasury is a shared Sui object (parlay_vault::Treasury).' },
  { ns: 'protocol:pricing',
    text: 'Odds are WAD-scaled fixed-point integers (1 WAD = 1e9). Decimal odds of 2.5 is stored as 2_500_000_000. Combined parlay price = product of all leg WAD prices divided by WAD to the power of n-1. Payout in MIST = stake_mist times combined_price_wad times 9 divided by WAD times 10.' },
  { ns: 'protocol:nfts',
    text: 'Each parlay ticket is an owned NFT Sui object (parlay_vault::Ticket). On a win, the ticket is burned and a WinningTicket trophy NFT is minted. Ticket metadata (legs, odds, teams) is stored as a Walrus blob. The blob_id is recorded on-chain in the Ticket object. The Display standard makes tickets visible in Slush wallet.' },
  { ns: 'odds:source',
    text: 'Live bookmaker odds are fetched from the Tatum Prediction API: GET /v4/data/predictions?sportType=soccer. The endpoint returns JSON with home/away/draw probability and decimal odds for upcoming football fixtures. Fallback mock data covers 6 Premier League and Champions League matches.' },
  { ns: 'odds:football',
    text: 'Supported football markets: English Premier League (EPL) and UEFA Champions League. Each market has three outcomes: home win (outcome 1), away win (outcome 2), draw (outcome 3). Only home and away outcomes are supported in the initial smart contract version.' },
  { ns: 'tatum:rpc',
    text: 'Sui RPC calls are routed through Tatum JSON-RPC proxy at https://sui-testnet.tatum.io (testnet) and https://sui-mainnet.tatum.io (mainnet). The Tatum API key is injected via the x-api-key HTTP header server-side. The Next.js /api/rpc proxy route keeps the API key off the client.' },
  { ns: 'tatum:sui-price',
    text: 'Real-time SUI/USD price is fetched from Tatum Rates API: GET https://api.tatum.io/v3/tatum/rate/SUI. This is used to display stake and payout amounts in USD alongside SUI.' },
  { ns: 'walrus:blobs',
    text: 'Ticket metadata is stored on Walrus decentralized storage at https://publisher.walrus-testnet.walrus.space/v1/blobs. The blob ID is recorded on-chain in the Ticket object blob_id field. Anyone can retrieve ticket details from the Walrus aggregator by blob ID.' },
  { ns: 'walrus:memory',
    text: 'Walrus Memory (MemWal) is used to record every parlay pick and outcome. Server-side calls go to https://relayer.memory.walrus.xyz. The remember() function stores picks; recall() and analyze() retrieve credibility scores. Namespaces: picks:<address>, outcomes:<marketId>, credibility:<address>.' },
  { ns: 'trust:credibility',
    text: 'Each wallet earns a credibility score based on historical parlay accuracy. A win on a 3-leg parlay adds 3 credibility points. A loss subtracts 1 point. High credibility wallets are featured as sharp bettors in the UI. Credibility data is stored in Walrus Memory and cannot be altered retroactively.' },
  { ns: 'hackathon:tracks',
    text: 'Parlay Markets submits to two Tatum x Walrus Total Recall Hackathon tracks: (1) Markets Track — prediction market with live odds, NFT tickets, house treasury on Sui. (2) Finance Track — house treasury as a permissioned liquidity pool, WAD-based fixed-point pricing, Tatum RPC for all on-chain reads. Walrus Memory satisfies the Walrus + MemWal integration requirement.' },
  { ns: 'product:differentiators',
    text: 'What makes Parlay Markets unique vs. Polymarket: (1) Multi-leg parlays compound odds for high leverage — Polymarket only supports single-question bets. (2) Real bookmaker odds from Tatum feed directly on-chain — no AMM or LMSR complexity. (3) Walrus Memory trust scores reward accurate pickers over time. (4) Ticket NFTs with Walrus blob metadata are viewable in any Sui wallet.' },
];

async function main() {
  console.log('\n🧠 Creating MemWal client…');

  let client;
  try {
    client = new MemWal({
      key:       MEMWAL_PRIVATE_KEY,
      accountId: MEMWAL_ACCOUNT_ID,
    });
  } catch (e) {
    console.error('Failed to create MemWal client:', e.message);
    process.exit(1);
  }

  console.log(`Seeding ${MEMORIES.length} memories…\n`);
  let ok = 0;

  for (const { ns, text } of MEMORIES) {
    try {
      await client.remember(text, ns);
      console.log(`  ✓ [${ns}]`);
      ok++;
    } catch (e) {
      console.error(`  ✗ [${ns}] failed: ${e.message?.slice(0, 120)}`);
    }
    await new Promise(r => setTimeout(r, 500));
  }

  console.log(`\n✅ Done. ${ok}/${MEMORIES.length} memories written.\n`);
  client.destroy?.();
}

main().catch(e => { console.error(e); process.exit(1); });
