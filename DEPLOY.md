# Deploy Parlay Markets to Sui Testnet

The Sui CLI binary is already downloaded to `/tmp/sui-install/sui`.
Run these commands in your terminal (paste each block into the Claude Code chat with `!` prefix):

---

## Step 1 — Verify Sui CLI

```bash
export PATH="/tmp/sui-install:$PATH"
sui --version
```

Expected: `sui 1.83.x`

---

## Step 2 — Import your wallet

```bash
export PATH="/tmp/sui-install:$PATH"
sui keytool import <YOUR_PRIVATE_KEY> ed25519
sui client active-address
```
> **Your private key** is the `suiprivkey1...` Bech32 key you have. Keep it out of git.

---

## Step 3 — Set up Testnet environment

```bash
export PATH="/tmp/sui-install:$PATH"
sui client new-env --alias testnet --rpc https://fullnode.testnet.sui.io:443
sui client switch --env testnet
```

---

## Step 4 — Get testnet SUI from faucet

```bash
export PATH="/tmp/sui-install:$PATH"
sui client faucet
# Or visit: https://faucet.testnet.sui.io
```

---

## Step 5 — Build & Deploy contracts

```bash
export PATH="/tmp/sui-install:$PATH"
cd /Users/suganthan/projects/parlay-markets/move
sui client publish --gas-budget 200000000 --json > /tmp/deploy-out.json 2>&1
cat /tmp/deploy-out.json | python3 -c "
import sys, json
data = json.load(sys.stdin)
pkg = next((c for c in data.get('objectChanges',[]) if c.get('type')=='published'), {})
treasury = next((c for c in data.get('objectChanges',[]) if '::parlay_vault::Treasury' in c.get('objectType','')), {})
admin = next((c for c in data.get('objectChanges',[]) if '::prediction_market::AdminCap' in c.get('objectType','')), {})
print('NEXT_PUBLIC_TESTNET_PACKAGE_ID=' + pkg.get('packageId',''))
print('NEXT_PUBLIC_TESTNET_TREASURY_ID=' + treasury.get('objectId',''))
print('NEXT_PUBLIC_TESTNET_ADMIN_CAP_ID=' + admin.get('objectId',''))
"
```

Copy the output lines into `frontend/.env.local`.

---

## Step 6 — Seed the House Treasury (10 SUI)

```bash
export PATH="/tmp/sui-install:$PATH"
# Replace <PACKAGE_ID> and <TREASURY_ID> with values from above
sui client call \
  --package <PACKAGE_ID> \
  --module parlay_vault \
  --function seed_treasury \
  --args <10000000000> \
  --gas-budget 10000000000
```

Pass a Coin<SUI> split of 10_000_000_000 MIST (10 SUI).

---

## Step 7 — Restart the Next.js dev server

```bash
cd /Users/suganthan/projects/parlay-markets/frontend
npm run dev
```

Then open http://localhost:3000, connect your Slush wallet — toggle says **TESTNET** (purple).

---

## Step 8 — Seed Walrus memories (hackathon requirement: 10+ memories)

```bash
cd /Users/suganthan/projects/parlay-markets
node scripts/seed-memories.js
```

---

## Step 9 — Deploy to Mainnet (after testnet works)

```bash
export PATH="/tmp/sui-install:$PATH"
sui client new-env --alias mainnet --rpc https://fullnode.mainnet.sui.io:443
sui client switch --env mainnet
cd /Users/suganthan/projects/parlay-markets/move
sui client publish --gas-budget 200000000 --json > /tmp/deploy-mainnet.json 2>&1
```

Then update `NEXT_PUBLIC_MAINNET_PACKAGE_ID`, `NEXT_PUBLIC_MAINNET_TREASURY_ID` in `.env.local`.
