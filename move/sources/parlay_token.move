/// PARLAY — the platform reward token.
/// Minted to the winner of every parlay ticket (1 token per win).
/// Acts as a verifiable on-chain credential: each token proves a winning prediction.
/// Walrus Memory cross-references the token with the credibility score.
///
/// Real token using the Sui coin_registry OTW pattern.
/// Symbol: PARLAY  Decimals: 0  (each token = one win, not divisible)
module parlay_markets::parlay_token;

use sui::coin::{Self, TreasuryCap};
use sui::tx_context::TxContext;
use sui::transfer;

// ── One-Time Witness ─────────────────────────────────────────────────────────
// Must be named after the module in ALL CAPS, have no fields, only `drop`.

public struct PARLAY_TOKEN has drop {}

// ── Init ─────────────────────────────────────────────────────────────────────

fun init(witness: PARLAY_TOKEN, ctx: &mut TxContext) {
    let (currency, treasury_cap) = sui::coin_registry::new_currency_with_otw(
        witness,
        0,                                             // decimals — 0: each token = 1 win
        b"PARLAY".to_string(),                         // symbol
        b"Parlay Win Token".to_string(),               // name
        b"Proof of a winning parlay prediction. Each token represents one verified win on Parlay Markets.".to_string(),
        b"https://parlay-markets.vercel.app/parlay-token.png".to_string(),
        ctx,
    );

    let metadata_cap = currency.finalize(ctx);

    // TreasuryCap goes to deployer (minting controlled by parlay_vault)
    // In production, transfer TreasuryCap to parlay_vault package address
    transfer::public_transfer(treasury_cap, ctx.sender());
    transfer::public_transfer(metadata_cap, ctx.sender());
}

// ── Mint (called by parlay_vault when a ticket is claimed) ───────────────────

/// Mint 1 PARLAY token to the winner of a parlay.
/// Only the TreasuryCap holder (deployer / vault admin) can call this.
public entry fun mint_to_winner(
    cap: &mut TreasuryCap<PARLAY_TOKEN>,
    winner: address,
    ctx: &mut TxContext,
) {
    let token = coin::mint(cap, 1, ctx);
    transfer::public_transfer(token, winner);
}

/// Mint a batch of PARLAY tokens (for seeding or testing).
public entry fun mint_batch(
    cap: &mut TreasuryCap<PARLAY_TOKEN>,
    amount: u64,
    recipient: address,
    ctx: &mut TxContext,
) {
    let token = coin::mint(cap, amount, ctx);
    transfer::public_transfer(token, recipient);
}
