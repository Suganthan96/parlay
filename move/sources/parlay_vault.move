/// Parlay Vault — house treasury + parlay ticket NFT.
///
/// Treasury:
///   Shared object holding the house's SUI balance.
///   Seeded by the deployer at init. Grows from losing stakes. Pays out winners.
///
/// Ticket:
///   Owned object (real on-chain NFT) transferred to the buyer at purchase.
///   Holds the staked SUI inside the object itself — no separate escrow contract.
///   Displayed as an NFT in Slush wallet via the Sui Display standard.
///   After claiming, turns into a WinningTicket trophy NFT.
module parlay_markets::parlay_vault;

use sui::object::{Self, UID, ID};
use sui::balance::{Self, Balance};
use sui::coin::{Self, Coin};
use sui::sui::SUI;
use sui::transfer;
use sui::tx_context::TxContext;
use sui::event;
use sui::package;
use sui::display;
use std::string::{Self, String};

// ── Constants ────────────────────────────────────────────────────────────────

const WAD: u64 = 1_000_000_000;

// Status codes for Ticket
const STATUS_OPEN:      u8 = 0;
const STATUS_WON:       u8 = 1;
const STATUS_LOST:      u8 = 2;
const STATUS_CASHEDOUT: u8 = 3;

// Error codes
const EInsufficientTreasury: u64 = 0;
const ENotOwner: u64             = 1;
const EAlreadySettled: u64       = 2;
const ETicketNotWon: u64         = 3;
const ETicketNotOpen: u64        = 4;
const EStakeTooLow: u64          = 5;
const EPayoutExceedsCap: u64     = 6;
const EZeroStake: u64            = 7;

/// Max single ticket payout — prevents treasury drain from one bet
const MAX_PAYOUT_MIST: u64 = 100_000_000_000; // 100 SUI

// ── One-Time Witness (for Display setup) ─────────────────────────────────────

public struct PARLAY_VAULT has drop {}

// ── Treasury ─────────────────────────────────────────────────────────────────

/// Shared house treasury.
/// Seeded by deployer, funded by losing stakes, drained by winning payouts.
public struct Treasury has key {
    id: UID,
    balance: Balance<SUI>,
    total_staked_mist: u64,
    total_paid_out_mist: u64,
    total_tickets: u64,
}

// ── Ticket NFT ───────────────────────────────────────────────────────────────

/// A parlay ticket — owned object that lives in the buyer's wallet.
/// The staked SUI is held inside the ticket object itself.
/// Fields used in Display template: name, description, status, payout_sui_display, leg_summary.
public struct Ticket has key, store {
    id: UID,
    owner: address,
    stake_mist: u64,              // SUI staked in MIST
    payout_mist: u64,             // Payout if all legs win, in MIST
    leg_count: u8,
    legs: vector<Leg>,
    status: u8,                   // 0=open 1=won 2=lost 3=cashedout
    blob_id: vector<u8>,          // Walrus blob ID for full ticket metadata
    created_at_ms: u64,
    // Display-friendly fields (set at mint)
    leg_summary: String,          // e.g. "MCI Home, LIV Home, TOT Away"
    payout_sui_display: String,   // e.g. "49.5 SUI"
}

public struct Leg has store, copy, drop {
    market_id: ID,
    outcome: u8,          // 1=home 2=away
    price_wad: u64,       // odds at buy time (WAD)
}

/// Trophy NFT kept after a win. Proof of winning prediction.
public struct WinningTicket has key, store {
    id: UID,
    original_ticket_id: ID,
    owner: address,
    payout_mist: u64,
    leg_summary: String,
    settled_at_ms: u64,
}

// ── Events ───────────────────────────────────────────────────────────────────

public struct TreasurySeeded has copy, drop {
    treasury_id: ID,
    amount_mist: u64,
}

public struct TicketMinted has copy, drop {
    ticket_id: ID,
    owner: address,
    stake_mist: u64,
    payout_mist: u64,
    leg_count: u8,
}

public struct TicketClaimed has copy, drop {
    ticket_id: ID,
    owner: address,
    payout_mist: u64,
}

public struct TicketLost has copy, drop {
    ticket_id: ID,
    owner: address,
    stake_mist: u64,
}

public struct TicketCashedOut has copy, drop {
    ticket_id: ID,
    owner: address,
    payout_mist: u64,
}

// ── Init — Display setup ──────────────────────────────────────────────────────

fun init(otw: PARLAY_VAULT, ctx: &mut TxContext) {
    // Set up Display so Slush wallet renders tickets as NFTs
    let publisher = package::claim(otw, ctx);

    let mut ticket_display = display::new<Ticket>(&publisher, ctx);
    display::add(&mut ticket_display, string::utf8(b"name"),
        string::utf8(b"Parlay Ticket"));
    display::add(&mut ticket_display, string::utf8(b"description"),
        string::utf8(b"Picks: {leg_summary} | Potential payout: {payout_sui_display}"));
    display::add(&mut ticket_display, string::utf8(b"image_url"),
        string::utf8(b"https://parlay-markets.vercel.app/api/ticket-image/{id}"));
    display::add(&mut ticket_display, string::utf8(b"project_url"),
        string::utf8(b"https://parlay-markets.vercel.app"));
    display::add(&mut ticket_display, string::utf8(b"creator"),
        string::utf8(b"Parlay Markets"));
    display::update_version(&mut ticket_display);

    let mut trophy_display = display::new<WinningTicket>(&publisher, ctx);
    display::add(&mut trophy_display, string::utf8(b"name"),
        string::utf8(b"Winning Parlay Trophy"));
    display::add(&mut trophy_display, string::utf8(b"description"),
        string::utf8(b"Verified winning parlay. Picks: {leg_summary} | Won: {payout_sui_display}"));
    display::add(&mut trophy_display, string::utf8(b"image_url"),
        string::utf8(b"https://parlay-markets.vercel.app/api/trophy-image/{id}"));
    display::add(&mut trophy_display, string::utf8(b"project_url"),
        string::utf8(b"https://parlay-markets.vercel.app"));
    display::update_version(&mut trophy_display);

    transfer::public_transfer(publisher, ctx.sender());
    transfer::public_transfer(ticket_display, ctx.sender());
    transfer::public_transfer(trophy_display, ctx.sender());
}

// ── Treasury: seed ───────────────────────────────────────────────────────────

/// Deployer seeds the treasury with SUI at launch.
/// This is the house float that covers early winning payouts before enough bets accumulate.
public entry fun seed_treasury(
    payment: Coin<SUI>,
    ctx: &mut TxContext,
) {
    let amount = coin::value(&payment);
    let treasury = Treasury {
        id: object::new(ctx),
        balance: coin::into_balance(payment),
        total_staked_mist: 0,
        total_paid_out_mist: 0,
        total_tickets: 0,
    };

    event::emit(TreasurySeeded {
        treasury_id: object::id(&treasury),
        amount_mist: amount,
    });

    transfer::share_object(treasury);
}

/// Add more SUI to the treasury (top-up by house).
public entry fun add_liquidity(
    treasury: &mut Treasury,
    payment: Coin<SUI>,
) {
    balance::join(&mut treasury.balance, coin::into_balance(payment));
}

// ── Ticket: mint (called by parlay_router) ────────────────────────────────────

/// Mint a parlay ticket. Called only by parlay_router after validating legs and price.
/// Stake SUI is taken from the buyer and held in the treasury.
/// A Ticket NFT object is transferred to the buyer.
public(package) fun mint_ticket(
    treasury: &mut Treasury,
    stake: Coin<SUI>,
    payout_mist: u64,
    legs: vector<Leg>,
    blob_id: vector<u8>,
    leg_summary: String,
    payout_sui_display: String,
    created_at_ms: u64,
    buyer: address,
    ctx: &mut TxContext,
): ID {
    let stake_mist = coin::value(&stake);
    assert!(stake_mist > 0, EZeroStake);
    assert!(payout_mist <= MAX_PAYOUT_MIST, EPayoutExceedsCap);
    assert!(balance::value(&treasury.balance) >= payout_mist, EInsufficientTreasury);

    // Stake goes into treasury
    balance::join(&mut treasury.balance, coin::into_balance(stake));

    let leg_count = (vector::length(&legs) as u8);
    let ticket = Ticket {
        id: object::new(ctx),
        owner: buyer,
        stake_mist,
        payout_mist,
        leg_count,
        legs,
        status: STATUS_OPEN,
        blob_id,
        created_at_ms,
        leg_summary,
        payout_sui_display,
    };

    let ticket_id = object::id(&ticket);

    treasury.total_staked_mist = treasury.total_staked_mist + stake_mist;
    treasury.total_tickets = treasury.total_tickets + 1;

    event::emit(TicketMinted {
        ticket_id,
        owner: buyer,
        stake_mist,
        payout_mist,
        leg_count,
    });

    transfer::transfer(ticket, buyer);
    ticket_id
}

// ── Ticket: mark won / lost (called by settlement watcher via parlay_router) ──

/// Mark a ticket as won. Called after all leg markets resolve with the correct outcome.
public(package) fun mark_won(ticket: &mut Ticket) {
    assert!(ticket.status == STATUS_OPEN, EAlreadySettled);
    ticket.status = STATUS_WON;
}

/// Mark a ticket as lost. Called after any leg market resolves against the pick.
public(package) fun mark_lost(ticket: &mut Ticket) {
    assert!(ticket.status == STATUS_OPEN, EAlreadySettled);
    ticket.status = STATUS_LOST;

    event::emit(TicketLost {
        ticket_id: object::id(ticket),
        owner: ticket.owner,
        stake_mist: ticket.stake_mist,
    });
}

// ── Ticket: claim payout ──────────────────────────────────────────────────────

/// Claim the full payout on a winning ticket.
/// Burns the ticket and mints a WinningTicket trophy NFT to the owner.
public entry fun claim(
    treasury: &mut Treasury,
    ticket: Ticket,
    settled_at_ms: u64,
    ctx: &mut TxContext,
) {
    assert!(ticket.status == STATUS_WON, ETicketNotWon);
    assert!(balance::value(&treasury.balance) >= ticket.payout_mist, EInsufficientTreasury);

    let owner    = ticket.owner;
    let payout   = ticket.payout_mist;
    let ticket_id = object::id(&ticket);
    let leg_summary = ticket.leg_summary;
    let payout_display = ticket.payout_sui_display;

    // Pay out from treasury
    let payout_coin = coin::from_balance(
        balance::split(&mut treasury.balance, payout),
        ctx
    );

    treasury.total_paid_out_mist = treasury.total_paid_out_mist + payout;

    event::emit(TicketClaimed { ticket_id, owner, payout_mist: payout });

    // Burn the open ticket
    let Ticket { id, owner: _, stake_mist: _, payout_mist: _, leg_count: _, legs: _, status: _, blob_id: _, created_at_ms: _, leg_summary: _, payout_sui_display: _ } = ticket;
    object::delete(id);

    // Mint a trophy NFT — permanent proof of the winning prediction
    let trophy = WinningTicket {
        id: object::new(ctx),
        original_ticket_id: ticket_id,
        owner,
        payout_mist: payout,
        leg_summary,
        settled_at_ms,
    };

    transfer::public_transfer(payout_coin, owner);
    transfer::transfer(trophy, owner);
}

// ── Ticket: cash out early ────────────────────────────────────────────────────

/// Cash out before resolution at a discounted price.
/// The cashout value is provided by the router (based on current market prices).
public(package) fun cash_out(
    treasury: &mut Treasury,
    ticket: Ticket,
    cashout_mist: u64,
    ctx: &mut TxContext,
) {
    assert!(ticket.status == STATUS_OPEN, ETicketNotOpen);
    assert!(balance::value(&treasury.balance) >= cashout_mist, EInsufficientTreasury);

    let owner = ticket.owner;
    let ticket_id = object::id(&ticket);

    event::emit(TicketCashedOut { ticket_id, owner, payout_mist: cashout_mist });

    let Ticket { id, owner: _, stake_mist: _, payout_mist: _, leg_count: _, legs: _, status: _, blob_id: _, created_at_ms: _, leg_summary: _, payout_sui_display: _ } = ticket;
    object::delete(id);

    let cashout_coin = coin::from_balance(
        balance::split(&mut treasury.balance, cashout_mist),
        ctx
    );
    transfer::public_transfer(cashout_coin, owner);
}

// ── Views ─────────────────────────────────────────────────────────────────────

public fun treasury_balance(t: &Treasury): u64 {
    balance::value(&t.balance)
}

public fun ticket_status(t: &Ticket): u8    { t.status }
public fun ticket_payout(t: &Ticket): u64   { t.payout_mist }
public fun ticket_stake(t: &Ticket): u64    { t.stake_mist }
public fun ticket_owner(t: &Ticket): address { t.owner }
public fun ticket_legs(t: &Ticket): &vector<Leg> { &t.legs }

public fun leg_market_id(l: &Leg): ID  { l.market_id }
public fun leg_outcome(l: &Leg): u8    { l.outcome }
public fun leg_price(l: &Leg): u64     { l.price_wad }

public fun new_leg(market_id: ID, outcome: u8, price_wad: u64): Leg {
    Leg { market_id, outcome, price_wad }
}

public fun max_payout(): u64 { MAX_PAYOUT_MIST }
public fun status_won(): u8  { STATUS_WON }
public fun status_lost(): u8 { STATUS_LOST }
public fun status_open(): u8 { STATUS_OPEN }
