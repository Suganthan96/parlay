/**
 * Deploy Move package to Sui testnet (or mainnet).
 * Usage:
 *   npx ts-node scripts/deploy.ts [testnet|mainnet]
 *
 * Writes the resulting package ID, treasury ID, admin cap ID to
 * frontend/.env.local so the Next.js app picks them up automatically.
 *
 * Requirements:
 *   npm install -g @mysten/sui ts-node typescript
 *   OR: cd scripts && npm install
 */

import { execSync }     from 'child_process';
import * as fs          from 'fs';
import * as path        from 'path';

// ── Config ────────────────────────────────────────────────────────────────────

const PRIVATE_KEY = process.env.SUI_PRIVATE_KEY;
if (!PRIVATE_KEY) { console.error('Set SUI_PRIVATE_KEY env var'); process.exit(1); }

const TATUM_TESTNET = process.env.TATUM_TESTNET_KEY ?? '';
const TATUM_MAINNET = process.env.TATUM_MAINNET_KEY ?? '';

const NETWORK = (process.argv[2] ?? 'testnet') as 'testnet' | 'mainnet';
const RPC_URL =
  NETWORK === 'mainnet'
    ? 'https://sui-mainnet.tatum.io'
    : 'https://sui-testnet.tatum.io';
const TATUM_KEY = NETWORK === 'mainnet' ? TATUM_MAINNET : TATUM_TESTNET;

const MOVE_DIR   = path.join(__dirname, '..', 'move');
const ENV_FILE   = path.join(__dirname, '..', 'frontend', '.env.local');

// ── Helpers ───────────────────────────────────────────────────────────────────

async function rpc<T>(method: string, params: unknown[]): Promise<T> {
  const res = await fetch(RPC_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': TATUM_KEY },
    body:    JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  });
  const json = await res.json() as { result: T; error?: { message: string } };
  if (json.error) throw new Error(`RPC error: ${json.error.message}`);
  return json.result;
}

function upsertEnv(key: string, value: string) {
  let content = '';
  try { content = fs.readFileSync(ENV_FILE, 'utf8'); } catch { /* new file */ }
  const lines = content.split('\n').filter(Boolean);
  const idx   = lines.findIndex(l => l.startsWith(`${key}=`));
  const line  = `${key}=${value}`;
  if (idx >= 0) lines[idx] = line; else lines.push(line);
  fs.writeFileSync(ENV_FILE, lines.join('\n') + '\n');
  console.log(`  ✓ ${line}`);
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n🚀 Deploying Parlay Markets to Sui ${NETWORK}…\n`);

  // --- Step 1: sui client publish via CLI -----------------------------------
  console.log('1. Building & publishing Move package via Sui CLI…');
  let publishOutput: string;
  try {
    publishOutput = execSync(
      `sui client publish --gas-budget 200000000 --json 2>&1`,
      { cwd: MOVE_DIR, encoding: 'utf8' },
    );
  } catch (e: any) {
    // Sui CLI might not be installed — give guidance
    console.error('\n❌ sui CLI not found or publish failed.');
    console.error('   Install: https://docs.sui.io/guides/developer/getting-started/sui-install');
    console.error('   Then run: sui client switch --env testnet');
    console.error('   Then run: sui client publish --gas-budget 200000000 --json');
    console.error('\n   The raw error was:', e.message);
    process.exit(1);
  }

  // --- Step 2: Parse publish result -----------------------------------------
  let digest: string;
  let packageId: string;
  try {
    const result  = JSON.parse(publishOutput);
    digest        = result.digest as string;
    packageId     = (result.objectChanges as any[]).find(
      c => c.type === 'published',
    )?.packageId as string;
    if (!packageId) throw new Error('packageId not found in publish output');
  } catch (e) {
    console.error('❌ Failed to parse publish output:\n', publishOutput);
    process.exit(1);
  }

  console.log(`   Package ID : ${packageId}`);
  console.log(`   Tx digest  : ${digest}`);

  // --- Step 3: Find Treasury & AdminCap -------------------------------------
  console.log('\n2. Looking up Treasury and AdminCap objects…');

  const changes: any[] = JSON.parse(publishOutput).objectChanges ?? [];

  const treasuryObj = changes.find((c: any) =>
    c.type === 'created' && typeof c.objectType === 'string' &&
    c.objectType.includes('::parlay_vault::Treasury'),
  );
  const adminCapObj = changes.find((c: any) =>
    c.type === 'created' && typeof c.objectType === 'string' &&
    c.objectType.includes('::parlay_vault::AdminCap'),
  );
  const tokenCapObj = changes.find((c: any) =>
    c.type === 'created' && typeof c.objectType === 'string' &&
    c.objectType.includes('::parlay_token::AdminCap'),
  );

  const treasuryId = treasuryObj?.objectId ?? '';
  const adminCapId = adminCapObj?.objectId ?? '';
  const tokenCapId = tokenCapObj?.objectId ?? '';

  console.log(`   Treasury   : ${treasuryId}`);
  console.log(`   AdminCap   : ${adminCapId}`);
  console.log(`   TokenCap   : ${tokenCapId}`);

  // --- Step 4: Write to .env.local ------------------------------------------
  console.log('\n3. Writing to frontend/.env.local…');
  const prefix = NETWORK === 'mainnet' ? 'NEXT_PUBLIC_MAINNET' : 'NEXT_PUBLIC_TESTNET';
  upsertEnv(`${prefix}_PACKAGE_ID`, packageId);
  upsertEnv(`${prefix}_TREASURY_ID`, treasuryId);
  upsertEnv(`${prefix}_ADMIN_CAP_ID`, adminCapId);
  upsertEnv(`${prefix}_TOKEN_CAP_ID`, tokenCapId);

  // --- Step 5: Seed treasury ------------------------------------------------
  if (treasuryId && adminCapId) {
    console.log('\n4. Seeding treasury with 500 SUI…');
    console.log('   Run the following Sui CLI command to seed the treasury:');
    console.log(`\n   sui client call \\
     --package ${packageId} \\
     --module parlay_vault \\
     --function seed_treasury \\
     --args ${adminCapId} ${treasuryId} \\
     --gas-budget 1000000000\n`);
    console.log('   (Or split out the coins manually — requires 500 SUI in wallet)');
  }

  console.log('\n✅ Deployment complete!');
  console.log(`   Network  : ${NETWORK}`);
  console.log(`   Package  : ${packageId}`);
  console.log(`   Explorer : https://suiscan.xyz/${NETWORK}/tx/${digest}\n`);
}

main().catch(e => { console.error(e); process.exit(1); });
