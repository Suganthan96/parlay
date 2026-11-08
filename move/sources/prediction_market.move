/// One binary prediction market per sports event.
/// Odds are set by the admin (fed from Tatum Prediction API off-chain).
/// Admin resolves the market after kickoff by calling resolve_market().
/// Used by parlay_router to read prices and validate open markets.
module parlay_markets::prediction_market;

use sui::event;
use sui::object::{Self, UID, ID};
use sui::tx_context::TxContext;
use sui::transfer;
use std::string::String;

// ── Constants ───────────────────────────────────────────────────────────────

/// 1e9 — fixed-point denominator (matches SUI's MIST precision)
const WAD: u64 = 1_000_000_000;

// ── Outcome codes ───────────────────────────────────────────────────────────
const OUTCOME_HOME: u8 = 1;
const OUTCOME_AWAY: u8 = 2;
const OUTCOME_DRAW: u8 = 3;

// ── Error codes ─────────────────────────────────────────────────────────────
const EAlreadyResolved: u64    = 0;
const EInvalidResult: u64      = 1;
const EInvalidOdds: u64        = 2;
const EInvalidOutcome: u64     = 3;
const EMarketResolved: u64     = 4;

// ── Structs ─────────────────────────────────────────────────────────────────

/// Admin capability — issued once at publish, held by deployer.
/// Required to create markets, update odds, and resolve outcomes.
public struct AdminCap has key, store {
    id: UID,
}

/// One shared object per sports event.
/// home_odds_wad and away_odds_wad are WAD-scaled probabilities (sum ≤ 1.0 before margin).
/// Odds are set from Tatum Prediction API data and updated until kickoff.
public struct PredictionMarket has key {
    id: UID,
    match_id: vector<u8>,   // external ID from sports API
    home_team: String,
    away_team: String,
    kickoff_ms: u64,         // Unix timestamp in milliseconds
    home_odds_wad: u64,      // e.g. 520_000_000 = 0.52 probability
    away_odds_wad: u64,      // e.g. 480_000_000 = 0.48 probability
    result: u8,              // 0=unresolved 1=home 2=away 3=draw
    blob_id: vector<u8>,     // Walrus blob ID for full market config
}

// ── Events ───────────────────────────────────────────────────────────────────

public struct MarketCreated has copy, drop {
    market_id: ID,
    match_id: vector<u8>,
    home_team: String,
    away_team: String,
    kickoff_ms: u64,
    home_odds_wad: u64,
    away_odds_wad: u64,
}

public struct OddsUpdated has copy, drop {
    market_id: ID,
    home_odds_wad: u64,
    away_odds_wad: u64,
}

public struct MarketResolved has copy, drop {
    market_id: ID,
    match_id: vector<u8>,
    result: u8,
}

// ── Init ─────────────────────────────────────────────────────────────────────

fun init(ctx: &mut TxContext) {
    transfer::transfer(
        AdminCap { id: object::new(ctx) },
        ctx.sender()
    );
}

// ── Admin: create market ─────────────────────────────────────────────────────

/// Create a new prediction market for an upcoming event.
/// Odds come from Tatum Prediction API and represent true market probability.
public entry fun create_market(
    _cap: &AdminCap,
    match_id: vector<u8>,
    home_team: String,
    away_team: String,
    kickoff_ms: u64,
    home_odds_wad: u64,
    away_odds_wad: u64,
    blob_id: vector<u8>,
    ctx: &mut TxContext,
) {
    assert!(home_odds_wad > 0 && home_odds_wad < WAD, EInvalidOdds);
    assert!(away_odds_wad > 0 && away_odds_wad < WAD, EInvalidOdds);

    let market = PredictionMarket {
        id: object::new(ctx),
        match_id,
        home_team,
        away_team,
        kickoff_ms,
        home_odds_wad,
        away_odds_wad,
        result: 0,
        blob_id,
    };

    event::emit(MarketCreated {
        market_id: object::id(&market),
        match_id: market.match_id,
        home_team: market.home_team,
        away_team: market.away_team,
        kickoff_ms: market.kickoff_ms,
        home_odds_wad: market.home_odds_wad,
        away_odds_wad: market.away_odds_wad,
    });

    transfer::share_object(market);
}

// ── Admin: update odds before kickoff ────────────────────────────────────────

/// Update live odds from Tatum Prediction API before the event starts.
/// Called by the settlement watcher whenever the market moves.
public entry fun update_odds(
    _cap: &AdminCap,
    market: &mut PredictionMarket,
    home_odds_wad: u64,
    away_odds_wad: u64,
) {
    assert!(market.result == 0, EAlreadyResolved);
    assert!(home_odds_wad > 0 && home_odds_wad < WAD, EInvalidOdds);
    assert!(away_odds_wad > 0 && away_odds_wad < WAD, EInvalidOdds);

    market.home_odds_wad = home_odds_wad;
    market.away_odds_wad = away_odds_wad;

    event::emit(OddsUpdated {
        market_id: object::id(market),
        home_odds_wad,
        away_odds_wad,
    });
}

// ── Admin: resolve market after the event ends ───────────────────────────────

/// Resolve the market. Called by the settlement watcher after reading the
/// result from sports APIs via Tatum RPC event stream.
public entry fun resolve_market(
    _cap: &AdminCap,
    market: &mut PredictionMarket,
    result: u8,
) {
    assert!(market.result == 0, EAlreadyResolved);
    assert!(result >= OUTCOME_HOME && result <= OUTCOME_DRAW, EInvalidResult);

    market.result = result;

    event::emit(MarketResolved {
        market_id: object::id(market),
        match_id: market.match_id,
        result,
    });
}

// ── Public reads ─────────────────────────────────────────────────────────────

public fun price_of(market: &PredictionMarket, outcome: u8): u64 {
    assert!(outcome == OUTCOME_HOME || outcome == OUTCOME_AWAY, EInvalidOutcome);
    if (outcome == OUTCOME_HOME) market.home_odds_wad
    else market.away_odds_wad
}

public fun result(market: &PredictionMarket): u8 { market.result }

public fun is_resolved(market: &PredictionMarket): bool { market.result != 0 }

public fun is_unresolved(market: &PredictionMarket): bool { market.result == 0 }

public fun kickoff_ms(market: &PredictionMarket): u64 { market.kickoff_ms }

public fun home_team(market: &PredictionMarket): &String { &market.home_team }

public fun away_team(market: &PredictionMarket): &String { &market.away_team }

public fun wad(): u64 { WAD }

public fun outcome_home(): u8 { OUTCOME_HOME }

public fun outcome_away(): u8 { OUTCOME_AWAY }
