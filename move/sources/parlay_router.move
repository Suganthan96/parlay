/// Parlay Router — the main entry point for users.
///
/// buy_parlay():
///   1. Reads current odds from each PredictionMarket (set via Tatum Prediction API).
///   2. Computes combined price: Π(leg prices) / WAD^(n-1).
///   3. Applies 10% house margin.
///   4. Computes payout: stake * WAD / margin_price.
///   5. Checks solvency: treasury balance ≥ payout.
///   6. Mints a Ticket NFT to the buyer.
///
/// settle_ticket():
///   Called by the settlement watcher after every leg resolves.
///   Marks ticket won or lost, emits event for Walrus Memory to pick up.
///
/// cash_out_ticket():
///   User exits early. Payout = stake * (current combined price / purchase price).
///
/// All arithmetic uses u128 for intermediate products to prevent overflow.
module parlay_markets::parlay_router;

use parlay_markets::prediction_market::{Self, PredictionMarket, AdminCap};
use parlay_markets::parlay_vault::{Self, Treasury, Ticket};
use sui::coin::{Self, Coin};
use sui::sui::SUI;
use sui::object::{Self, ID};
use sui::tx_context::TxContext;
use sui::clock::Clock;
use sui::event;
use std::string::{Self, String};
use std::vector;

// ── Constants ────────────────────────────────────────────────────────────────

const WAD: u64 = 1_000_000_000;

/// 10% house margin applied to combined parlay price
const MARGIN_NUM: u64 = 110;
const MARGIN_DEN: u64 = 100;

/// Min 1 leg, max 5 legs
const MIN_LEGS: u64 = 1;
const MAX_LEGS: u64 = 5;

// ── Error codes ──────────────────────────────────────────────────────────────

const EInvalidLegCount: u64 = 0;
const EArrayMismatch: u64   = 1;
const EMarketResolved: u64  = 2;
const EInvalidOutcome: u64  = 3;
const ESlippage: u64        = 4;
const EZeroStake: u64       = 5;
const EBadPrice: u64        = 6;
const EPayoutBelowStake: u64 = 7;

// ── Events ───────────────────────────────────────────────────────────────────

public struct ParlayBought has copy, drop {
    ticket_id: ID,
    buyer: address,
    stake_mist: u64,
    payout_mist: u64,
    combined_price_wad: u64,
    leg_count: u8,
}

public struct TicketSettled has copy, drop {
    ticket_id: ID,
    owner: address,
    won: bool,
    payout_mist: u64,
}

// ── Buy parlay ────────────────────────────────────────────────────────────────

/// Buy a parlay ticket.
///
/// markets   — vector of PredictionMarket shared objects (1–5)
/// outcomes  — 1=Home, 2=Away per market
/// stake     — Coin<SUI> from the buyer (real SUI, no mock token)
/// min_payout — slippage guard: revert if payout drops below this
/// blob_id   — Walrus blob ID written by the frontend before this call
/// clock     — Sui Clock object for timestamp
public entry fun buy_parlay(
    markets: vector<&PredictionMarket>,
    outcomes: vector<u8>,
    stake: Coin<SUI>,
    min_payout_mist: u64,
    treasury: &mut Treasury,
    blob_id: vector<u8>,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    let n = vector::length(&markets);
    assert!(n >= MIN_LEGS && n <= MAX_LEGS, EInvalidLegCount);
    assert!(vector::length(&outcomes) == n, EArrayMismatch);

    let stake_mist = coin::value(&stake);
    assert!(stake_mist > 0, EZeroStake);

    // ── 1. Compute combined price ─────────────────────────────────────────
    // combined = Π(price_i) / WAD^(n-1) — maintained in WAD scale throughout
    let mut combined_wad: u128 = (WAD as u128);
    let mut prices: vector<u64> = vector::empty();
    let mut i = 0;

    while (i < n) {
        let market = *vector::borrow(&markets, i);
        let outcome = *vector::borrow(&outcomes, i);

        assert!(prediction_market::is_unresolved(market), EMarketResolved);
        assert!(outcome == prediction_market::outcome_home() || outcome == prediction_market::outcome_away(), EInvalidOutcome);

        let price = prediction_market::price_of(market, outcome);
        assert!(price > 0 && price < WAD, EBadPrice);

        vector::push_back(&mut prices, price);
        // combined = combined * price / WAD  (keeps WAD scale)
        combined_wad = combined_wad * (price as u128) / (WAD as u128);

        i = i + 1;
    };

    let combined_price_wad = (combined_wad as u64);

    // ── 2. Apply 10% margin: price_with_margin = combined * 110 / 100 ────
    let margin_price_wad = (
        (combined_wad * (MARGIN_NUM as u128)) / (MARGIN_DEN as u128)
    ) as u64;

    assert!(margin_price_wad > 0 && margin_price_wad < WAD, EBadPrice);

    // ── 3. Compute payout: payout = stake * WAD / margin_price ───────────
    // u128 to prevent overflow: stake_mist (u64) * WAD (u64) could exceed u64
    let payout_mist = (
        (stake_mist as u128) * (WAD as u128) / (margin_price_wad as u128)
    ) as u64;

    assert!(payout_mist >= min_payout_mist, ESlippage);
    assert!(payout_mist > stake_mist, EPayoutBelowStake);

    // ── 4. Build legs vector ──────────────────────────────────────────────
    let mut legs: vector<parlay_vault::Leg> = vector::empty();
    let mut j = 0;
    while (j < n) {
        let market = *vector::borrow(&markets, j);
        vector::push_back(&mut legs, parlay_vault::new_leg(
            object::id(market),
            *vector::borrow(&outcomes, j),
            *vector::borrow(&prices, j),
        ));
        j = j + 1;
    };

    // ── 5. Build display strings ──────────────────────────────────────────
    let leg_summary = build_leg_summary(&markets, &outcomes);
    let payout_sui_display = format_sui(payout_mist);

    // ── 6. Mint ticket NFT to buyer ───────────────────────────────────────
    let buyer = ctx.sender();
    let now_ms = sui::clock::timestamp_ms(clock);

    let ticket_id = parlay_vault::mint_ticket(
        treasury,
        stake,
        payout_mist,
        legs,
        blob_id,
        leg_summary,
        payout_sui_display,
        now_ms,
        buyer,
        ctx,
    );

    event::emit(ParlayBought {
        ticket_id,
        buyer,
        stake_mist,
        payout_mist,
        combined_price_wad,
        leg_count: (n as u8),
    });
}

// ── Quote (view — no state change) ───────────────────────────────────────────

/// Off-chain quote: returns the combined price and expected payout.
/// Frontend calls this before showing the user their potential winnings.
public fun quote_parlay(
    markets: vector<&PredictionMarket>,
    outcomes: vector<u8>,
    stake_mist: u64,
): (u64, u64) {
    let n = vector::length(&markets);
    let mut combined: u128 = (WAD as u128);
    let mut i = 0;
    while (i < n) {
        let price = prediction_market::price_of(
            *vector::borrow(&markets, i),
            *vector::borrow(&outcomes, i),
        );
        combined = combined * (price as u128) / (WAD as u128);
        i = i + 1;
    };
    let margin = (combined * (MARGIN_NUM as u128)) / (MARGIN_DEN as u128);
    let payout = (stake_mist as u128) * (WAD as u128) / margin;
    ((combined as u64), (payout as u64))
}

// ── Settle (called by settlement watcher) ────────────────────────────────────

/// Mark a ticket won after verifying all leg markets resolved correctly.
/// Called by the off-chain settlement watcher once all markets are resolved.
public entry fun settle_won(
    _cap: &AdminCap,
    ticket: &mut Ticket,
) {
    parlay_vault::mark_won(ticket);
    event::emit(TicketSettled {
        ticket_id: object::id(ticket),
        owner: parlay_vault::ticket_owner(ticket),
        won: true,
        payout_mist: parlay_vault::ticket_payout(ticket),
    });
}

/// Mark a ticket lost after any leg resolves against the pick.
public entry fun settle_lost(
    _cap: &AdminCap,
    ticket: &mut Ticket,
) {
    parlay_vault::mark_lost(ticket);
    event::emit(TicketSettled {
        ticket_id: object::id(ticket),
        owner: parlay_vault::ticket_owner(ticket),
        won: false,
        payout_mist: 0,
    });
}

// ── Cash out (early exit) ─────────────────────────────────────────────────────

/// Cash out a parlay ticket before all markets resolve.
/// Cashout value = stake * (current combined price / purchase price) — capped at payout.
public entry fun cash_out_ticket(
    markets: vector<&PredictionMarket>,
    ticket: Ticket,
    treasury: &mut Treasury,
    ctx: &mut TxContext,
) {
    let legs = parlay_vault::ticket_legs(&ticket);
    let n = vector::length(legs);
    let stake = parlay_vault::ticket_stake(&ticket);
    let original_payout = parlay_vault::ticket_payout(&ticket);

    // Compute current combined price
    let mut current: u128 = (WAD as u128);
    let mut purchase: u128 = (WAD as u128);
    let mut i = 0;

    while (i < n) {
        let leg = vector::borrow(legs, i);
        let market = *vector::borrow(&markets, i);
        let current_price = prediction_market::price_of(market, parlay_vault::leg_outcome(leg));
        current = current * (current_price as u128) / (WAD as u128);
        purchase = purchase * (parlay_vault::leg_price(leg) as u128) / (WAD as u128);
        i = i + 1;
    };

    // cashout = stake * (current / purchase), capped at max payout
    let cashout = if (purchase == 0) { 0u64 }
    else {
        let raw = (stake as u128) * current / purchase;
        let capped = if (raw > (original_payout as u128)) original_payout as u128 else raw;
        (capped as u64)
    };

    parlay_vault::cash_out(treasury, ticket, cashout, ctx);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

fun build_leg_summary(
    markets: &vector<&PredictionMarket>,
    outcomes: &vector<u8>,
): String {
    // Returns e.g. "MCI Home, LIV Home, TOT Away"
    // Simplified: just show outcome count for now
    let n = vector::length(markets);
    let mut s = string::utf8(b"");
    let mut i = 0;
    while (i < n) {
        if (i > 0) string::append(&mut s, string::utf8(b", "));
        let outcome = *vector::borrow(outcomes, i);
        if (outcome == 1) string::append(&mut s, string::utf8(b"Home"))
        else string::append(&mut s, string::utf8(b"Away"));
        i = i + 1;
    };
    s
}

fun format_sui(mist: u64): String {
    // Convert MIST to SUI with 2 decimal places display
    // 1 SUI = 1_000_000_000 MIST
    let sui_whole = mist / 1_000_000_000;
    let sui_frac  = (mist % 1_000_000_000) / 10_000_000; // 2 decimals
    let mut s = string::utf8(b"");
    // Simple integer concatenation — good enough for display
    string::append(&mut s, to_string_u64(sui_whole));
    string::append(&mut s, string::utf8(b"."));
    if (sui_frac < 10) string::append(&mut s, string::utf8(b"0"));
    string::append(&mut s, to_string_u64(sui_frac));
    string::append(&mut s, string::utf8(b" SUI"));
    s
}

fun to_string_u64(n: u64): String {
    if (n == 0) return string::utf8(b"0");
    let mut digits: vector<u8> = vector::empty();
    let mut v = n;
    while (v > 0) {
        vector::push_back(&mut digits, ((v % 10) as u8) + 48);
        v = v / 10;
    };
    vector::reverse(&mut digits);
    string::utf8(digits)
}
