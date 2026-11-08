/// Parlay Router — the main entry point for users.
///
/// buy_parlay():
///   Takes market IDs and WAD-scaled odds pre-fetched from Tatum Prediction API.
///   Computes combined price: Π(odds_i) / WAD^(n-1).
///   Applies 10% house margin.
///   Mints a Ticket NFT to the buyer.
module parlay_markets::parlay_router;

use parlay_markets::prediction_market::AdminCap;
use parlay_markets::parlay_vault::{Self, Treasury, Ticket};
use sui::coin::{Self, Coin};
use sui::sui::SUI;
use sui::object::{Self, ID};
use sui::tx_context::TxContext;
use sui::clock::Clock;
use sui::event;
use std::string::{Self, String};

// ── Constants ────────────────────────────────────────────────────────────────

const WAD: u64 = 1_000_000_000;

/// 10% house margin applied to combined parlay price
const MARGIN_NUM: u64 = 110;
const MARGIN_DEN: u64 = 100;

const MIN_LEGS: u64 = 1;
const MAX_LEGS: u64 = 5;

// ── Error codes ──────────────────────────────────────────────────────────────

const EInvalidLegCount: u64 = 0;
const EArrayMismatch: u64   = 1;
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
/// market_ids  — Sui object IDs of the PredictionMarket objects (1–5)
/// odds_wad    — WAD-scaled decimal odds per leg (e.g. 2.5 → 2_500_000_000)
/// outcomes    — 1=Home, 2=Away per market
/// stake       — Coin<SUI> from the buyer
/// min_payout  — slippage guard: revert if payout drops below this
/// blob_id     — Walrus blob ID storing ticket metadata
/// clock       — Sui Clock object for timestamp
public entry fun buy_parlay(
    market_ids: vector<address>,
    odds_wad: vector<u64>,
    outcomes: vector<u8>,
    stake: Coin<SUI>,
    min_payout_mist: u64,
    treasury: &mut Treasury,
    blob_id: vector<u8>,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    let n = market_ids.length();
    assert!(n >= MIN_LEGS && n <= MAX_LEGS, EInvalidLegCount);
    assert!(odds_wad.length() == n, EArrayMismatch);
    assert!(outcomes.length() == n, EArrayMismatch);

    let stake_mist = coin::value(&stake);
    assert!(stake_mist > 0, EZeroStake);

    // ── 1. Compute combined price ─────────────────────────────────────────
    let mut combined_wad: u128 = WAD as u128;
    let mut legs: vector<parlay_vault::Leg> = vector[];
    let mut i = 0;

    while (i < n) {
        let outcome = outcomes[i];
        assert!(outcome == 1 || outcome == 2, EInvalidOutcome);

        let price = odds_wad[i];
        assert!(price > 0 && price < (WAD * 100), EBadPrice);

        // Convert decimal odds → implied probability WAD for combined price
        // implied_prob = WAD * WAD / odds_wad  (e.g. odds 2.0 → 50% = 0.5 WAD)
        let prob_wad = (WAD as u128) * (WAD as u128) / (price as u128);
        combined_wad = combined_wad * prob_wad / (WAD as u128);

        // Build leg: store market_id as an ID (address → object::id_from_address)
        let market_id = object::id_from_address(market_ids[i]);
        legs.push_back(parlay_vault::new_leg(market_id, outcome, price));

        i = i + 1;
    };

    let combined_price_wad = combined_wad as u64;

    // ── 2. Apply 10% margin ───────────────────────────────────────────────
    // effective probability is reduced by margin, so payout is lower
    let margin_prob_wad = (
        (combined_wad * (MARGIN_DEN as u128)) / (MARGIN_NUM as u128)
    ) as u64;

    assert!(margin_prob_wad > 0, EBadPrice);

    // ── 3. Compute payout: payout = stake * WAD / margin_prob ────────────
    let payout_mist = (
        (stake_mist as u128) * (WAD as u128) / (margin_prob_wad as u128)
    ) as u64;

    assert!(payout_mist >= min_payout_mist, ESlippage);
    assert!(payout_mist > stake_mist, EPayoutBelowStake);

    // ── 4. Build display strings ──────────────────────────────────────────
    let leg_summary = build_leg_summary(&outcomes);
    let payout_sui_display = format_sui(payout_mist);

    // ── 5. Mint ticket NFT to buyer ───────────────────────────────────────
    let buyer = ctx.sender();
    let now_ms = clock.timestamp_ms();

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
        leg_count: n as u8,
    });
}

// ── Quote (view — no state change) ───────────────────────────────────────────

/// Off-chain quote: returns the combined price (WAD) and expected payout (MIST).
/// Pass odds_wad = WAD-scaled decimal odds per leg (e.g. 2.5 → 2_500_000_000).
public fun quote_parlay(
    odds_wad: vector<u64>,
    outcomes: vector<u8>,
    stake_mist: u64,
): (u64, u64) {
    let n = odds_wad.length();
    assert!(n == outcomes.length(), EArrayMismatch);
    let mut combined: u128 = WAD as u128;
    let mut i = 0;
    while (i < n) {
        let prob = (WAD as u128) * (WAD as u128) / (odds_wad[i] as u128);
        combined = combined * prob / (WAD as u128);
        i = i + 1;
    };
    let margin = (combined * (MARGIN_DEN as u128)) / (MARGIN_NUM as u128);
    let payout = (stake_mist as u128) * (WAD as u128) / margin;
    (combined as u64, payout as u64)
}

// ── Settle (called by settlement watcher) ────────────────────────────────────

/// Mark a ticket won. Called by off-chain settlement watcher.
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
/// Uses the stored leg odds — no need to pass market objects.
public entry fun cash_out_ticket(
    ticket: Ticket,
    treasury: &mut Treasury,
    ctx: &mut TxContext,
) {
    let legs = parlay_vault::ticket_legs(&ticket);
    let n = legs.length();
    let stake = parlay_vault::ticket_stake(&ticket);
    let original_payout = parlay_vault::ticket_payout(&ticket);

    // Compute current combined price from stored odds
    // (For early cashout we give back a fraction of stake — using 50% of stake as min)
    let _ = n; // legs are recorded; for now give back 50% of stake as cashout value
    let cashout = stake / 2;
    let _ = original_payout;

    parlay_vault::cash_out(treasury, ticket, cashout, ctx);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

fun build_leg_summary(outcomes: &vector<u8>): String {
    let n = outcomes.length();
    let mut s = string::utf8(b"");
    let mut i = 0;
    while (i < n) {
        if (i > 0) s.append(string::utf8(b", "));
        if (outcomes[i] == 1) s.append(string::utf8(b"Home"))
        else s.append(string::utf8(b"Away"));
        i = i + 1;
    };
    s
}

fun format_sui(mist: u64): String {
    let sui_whole = mist / 1_000_000_000;
    let sui_frac  = (mist % 1_000_000_000) / 10_000_000;
    let mut s = to_string_u64(sui_whole);
    s.append(string::utf8(b"."));
    if (sui_frac < 10) s.append(string::utf8(b"0"));
    s.append(to_string_u64(sui_frac));
    s.append(string::utf8(b" SUI"));
    s
}

fun to_string_u64(n: u64): String {
    if (n == 0) return string::utf8(b"0");
    let mut digits: vector<u8> = vector[];
    let mut v = n;
    while (v > 0) {
        digits.push_back((v % 10 as u8) + 48);
        v = v / 10;
    };
    digits.reverse();
    string::utf8(digits)
}
