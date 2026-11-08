#!/usr/bin/env node
/**
 * Deploy Move package to Sui testnet (or mainnet).
 * Usage:  node scripts/deploy.js [testnet|mainnet]
 *
 * Writes NEXT_PUBLIC_*_PACKAGE_ID / TREASURY_ID / ADMIN_CAP_ID
 * to frontend/.env.local after a successful publish.
 */

const { execSync } = require('child_process');
const fs           = require('fs');
const path         = require('path');

// ── Config ────────────────────────────────────────────────────────────────────

// Use full path so it works from Node even if /opt/homebrew/bin isn't in PATH
const SUI = process.env.SUI_BIN ?? '/opt/homebrew/bin/sui';

const PRIVATE_KEY =
  process.env.SUI_PRIVATE_KEY ??
  'suiprivkey1qqvs8n2khyugu8nz7hsmcrdkxysvghas7n3m4n7kqdk5c22nj0r4uhznulp';

const TATUM_TESTNET = process.env.TATUM_TESTNET_KEY ??
  't-6a23c4927e64820132610c33-3e2ffe44a07b40bb9cda53a9';
const TATUM_MAINNET = process.env.TATUM_MAINNET_KEY ??
  't-6a18740c98b58da41d4fd2f8-6cb1a5c66d2e4e649fd72067';

const NETWORK  = process.argv[2] ?? 'testnet';
const TATUM_KEY = NETWORK === 'mainnet' ? TATUM_MAINNET : TATUM_TESTNET;
const RPC_URL   = NETWORK === 'mainnet'
  ? 'https://sui-mainnet.tatum.io'
  : 'https://sui-testnet.tatum.io';

const MOVE_DIR = path.join(__dirname, '..', 'move');
const ENV_FILE = path.join(__dirname, '..', 'frontend', '.env.local');

// ── Helpers ───────────────────────────────────────────────────────────────────

function run(cmd, cwd) {
  return execSync(cmd, { cwd: cwd ?? MOVE_DIR, encoding: 'utf8', env: { ...process.env, PATH: `/opt/homebrew/bin:/usr/local/bin:${process.env.PATH}` } });
}

function upsertEnv(key, value) {
  let content = '';
  try { content = fs.readFileSync(ENV_FILE, 'utf8'); } catch {}
  const lines = content.split('\n').filter(Boolean);
  const idx   = lines.findIndex(l => l.startsWith(`${key}=`));
  const line  = `${key}=${value}`;
  if (idx >= 0) lines[idx] = line; else lines.push(line);
  fs.writeFileSync(ENV_FILE, lines.join('\n') + '\n');
  console.log(`  ✓ ${line}`);
}

async function rpc(method, params) {
  const res = await fetch(RPC_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': TATUM_KEY },
    body:    JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  });
  const json = await res.json();
  if (json.error) throw new Error(`RPC error: ${json.error.message}`);
  return json.result;
}

// ── Main ──────────────────────────────────────────────────────────────────────

(async () => {
  console.log(`\n🚀 Deploying Parlay Markets to Sui ${NETWORK}…\n`);

  // --- Step 1: Import private key so sui CLI uses the right account -----------
  console.log('1. Setting up wallet (importing private key)…');
  try {
    // Switch to the right env first
    run(`${SUI} client switch --env ${NETWORK}`, MOVE_DIR);
  } catch (e) {
    // ignore if already set
  }

  try {
    const importOut = run(
      `${SUI} keytool import "${PRIVATE_KEY}" ed25519 --json`,
      MOVE_DIR,
    );
    const importJson = JSON.parse(importOut);
    const addr = importJson.suiAddress ?? importJson.address ?? '?';
    console.log(`   Address: ${addr}`);
    // Switch active address to the imported key
    run(`${SUI} client switch --address ${addr}`, MOVE_DIR);
  } catch (e) {
    console.log('   (key already imported or switch failed — continuing)');
    console.log('   Detail:', e.message.slice(0, 120));
  }

  // --- Step 2: Check balance ---------------------------------------------------
  console.log('\n2. Checking balance…');
  try {
    const balOut = run(`${SUI} client balance --json`, MOVE_DIR);
    const balJson = JSON.parse(balOut);
    const suiBalance = balJson[0]?.totalBalance ?? balJson?.totalBalance ?? '?';
    console.log(`   Balance: ${(BigInt(suiBalance ?? 0) / 1_000_000_000n).toString()} SUI`);
  } catch (e) {
    console.log('   Could not read balance:', e.message.slice(0, 100));
  }

  // --- Step 3: Publish --------------------------------------------------------
  console.log('\n3. Publishing Move package…');
  let publishOutput;
  try {
    publishOutput = run(
      `${SUI} client publish --gas-budget 200000000 --json`,
      MOVE_DIR,
    );
  } catch (e) {
    console.error('\n❌ Publish failed:');
    console.error(e.message.slice(0, 500));
    process.exit(1);
  }

  // --- Step 4: Parse result ---------------------------------------------------
  let result;
  try {
    result = JSON.parse(publishOutput);
  } catch {
    console.error('❌ Could not parse publish output:\n', publishOutput.slice(0, 300));
    process.exit(1);
  }

  const digest    = result.digest;
  const changes   = result.objectChanges ?? [];

  const packageId  = changes.find(c => c.type === 'published')?.packageId ?? '';
  const treasury   = changes.find(c =>
    c.type === 'created' && typeof c.objectType === 'string' &&
    c.objectType.includes('::parlay_vault::Treasury'))?.objectId ?? '';
  const adminCap   = changes.find(c =>
    c.type === 'created' && typeof c.objectType === 'string' &&
    c.objectType.includes('::parlay_vault::AdminCap'))?.objectId ?? '';
  const tokenCap   = changes.find(c =>
    c.type === 'created' && typeof c.objectType === 'string' &&
    c.objectType.includes('::parlay_token::AdminCap'))?.objectId ?? '';

  console.log(`\n   Package  : ${packageId}`);
  console.log(`   Treasury : ${treasury}`);
  console.log(`   AdminCap : ${adminCap}`);
  console.log(`   Digest   : ${digest}`);

  if (!packageId) {
    console.error('❌ Could not find packageId in output. Full output:');
    console.error(publishOutput.slice(0, 1000));
    process.exit(1);
  }

  // --- Step 5: Write to .env.local -------------------------------------------
  console.log('\n4. Writing to frontend/.env.local…');
  const prefix = NETWORK === 'mainnet' ? 'NEXT_PUBLIC_MAINNET' : 'NEXT_PUBLIC_TESTNET';
  upsertEnv(`${prefix}_PACKAGE_ID`,  packageId);
  upsertEnv(`${prefix}_TREASURY_ID`, treasury);
  upsertEnv(`${prefix}_ADMIN_CAP_ID`, adminCap);
  if (tokenCap) upsertEnv(`${prefix}_TOKEN_CAP_ID`, tokenCap);

  // Also write server-side keys (without NEXT_PUBLIC) for API routes
  upsertEnv('TATUM_TESTNET_KEY', TATUM_TESTNET);
  upsertEnv('TATUM_MAINNET_KEY', TATUM_MAINNET);
  upsertEnv('NEXT_PUBLIC_TATUM_TESTNET_KEY', TATUM_TESTNET);
  upsertEnv('NEXT_PUBLIC_TATUM_MAINNET_KEY', TATUM_MAINNET);

  console.log('\n✅ Deployment complete!');
  console.log(`   Explorer: https://suiscan.xyz/${NETWORK}/tx/${digest}\n`);

  // --- Step 6: Seed treasury hint --------------------------------------------
  if (treasury && adminCap) {
    console.log('⚡ To seed the treasury with 500 SUI, run:');
    console.log(`\n   ${SUI} client call \\`);
    console.log(`     --package ${packageId} \\`);
    console.log(`     --module parlay_vault \\`);
    console.log(`     --function seed_treasury \\`);
    console.log(`     --args ${adminCap} ${treasury} \\`);
    console.log(`     --gas-budget 1000000000\n`);
  }
})();
