import type { Market, Ticket, Slip, LpStats } from './types';

const NOW = Date.now();
const H = 3600_000;

export const MOCK_MARKETS: Market[] = [
  {
    id: 'm1',
    league: 'EPL 2026',
    homeTeam: 'Man City',
    awayTeam: 'Arsenal',
    kickoff: NOW + 2 * H,
    homePrice: 0.60,
    awayPrice: 0.40,
    status: 'open',
  },
  {
    id: 'm2',
    league: 'EPL 2026',
    homeTeam: 'Liverpool',
    awayTeam: 'Chelsea',
    kickoff: NOW + 5 * H,
    homePrice: 0.50,
    awayPrice: 0.35,
    drawPrice: 0.15,
    status: 'open',
  },
  {
    id: 'm3',
    league: 'NBA 2026',
    homeTeam: 'Lakers',
    awayTeam: 'Celtics',
    kickoff: NOW + 8 * H,
    homePrice: 0.45,
    awayPrice: 0.55,
    status: 'open',
  },
  {
    id: 'm4',
    league: 'NBA 2026',
    homeTeam: 'Warriors',
    awayTeam: 'Heat',
    kickoff: NOW + 24 * H,
    homePrice: 0.55,
    awayPrice: 0.45,
    status: 'open',
  },
  {
    id: 'm5',
    league: 'EPL 2026',
    homeTeam: 'Man Utd',
    awayTeam: 'Tottenham',
    kickoff: NOW - 6 * H,
    homePrice: 1.0,
    awayPrice: 0.0,
    status: 'resolved',
    winner: 'Man Utd',
    txHash: '0xfe7dfc6876c7daf3e46b7adc87182ebba0374430c009e02fc52df34fc030d22a',
  },
];

export const MOCK_TICKETS: Ticket[] = [
  {
    id: 't1',
    legs: [
      { marketId: 'm1', marketLabel: 'CSK beats MI',  outcome: 'CSK', price: 0.60, status: 'live' },
      { marketId: 'm2', marketLabel: 'RCB beats KKR', outcome: 'RCB', price: 0.50, status: 'live' },
    ],
    stakeSui: 1.0,
    payoutSui: 4.33,
    cashOutValue: 0.7,
    status: 'open',
    boughtAt: NOW - 1 * H,
  },
  {
    id: 't2',
    legs: [
      { marketId: 'm5', marketLabel: 'Man Utd beats Tottenham', outcome: 'Man Utd', price: 0.65, status: 'won' },
      { marketId: 'm3', marketLabel: 'Lakers beat Celtics',     outcome: 'Lakers',  price: 0.45, status: 'live' },
    ],
    stakeSui: 0.5,
    payoutSui: 1.95,
    cashOutValue: 0.45,
    status: 'open',
    boughtAt: NOW - 7 * H,
  },
  {
    id: 't3',
    legs: [
      { marketId: 'm5', marketLabel: 'Man Utd beats Tottenham', outcome: 'Man Utd', price: 0.65, status: 'won' },
      { marketId: 'm2', marketLabel: 'Liverpool beats Chelsea',  outcome: 'Liverpool', price: 0.50, status: 'won' },
    ],
    stakeSui: 2.0,
    payoutSui: 11.7,
    cashOutValue: 11.7,
    status: 'won',
    boughtAt: NOW - 12 * H,
  },
];

export const MOCK_SLIPS: Slip[] = [
  {
    id: 's1',
    creator: '0xDEAD...BEEF',
    legs: [
      { marketId: 'm1', marketLabel: 'CSK beats MI',  outcome: 'CSK', price: 0.60 },
      { marketId: 'm2', marketLabel: 'RCB beats KKR', outcome: 'RCB', price: 0.50 },
      { marketId: 'm3', marketLabel: 'GT beats RR',   outcome: 'GT',  price: 0.70 },
    ],
    quotedPrice: 0.231,
    copies: 142,
    kickoff: NOW + 2 * H,
    expiresAt: NOW + 3 * H,
  },
  {
    id: 's2',
    creator: '0xCAFE...BABE',
    legs: [
      { marketId: 'm1', marketLabel: 'CSK beats MI',   outcome: 'CSK',  price: 0.60 },
      { marketId: 'm4', marketLabel: 'LSG beats PBKS', outcome: 'LSG',  price: 0.55 },
    ],
    quotedPrice: 0.363,
    copies: 87,
    kickoff: NOW + 2 * H,
    expiresAt: NOW + 3 * H,
  },
  {
    id: 's3',
    creator: '0x1337...C0DE',
    legs: [
      { marketId: 'm2', marketLabel: 'KKR beats RCB', outcome: 'KKR', price: 0.50 },
      { marketId: 'm3', marketLabel: 'RR beats GT',   outcome: 'RR',  price: 0.30 },
    ],
    quotedPrice: 0.165,
    copies: 23,
    kickoff: NOW + 5 * H,
    expiresAt: NOW + 6 * H,
  },
];

export const MOCK_LP_STATS: LpStats = {
  walletSui: 500,
  parlayCapUsed: 42,
  parlayCapTotal: 500,
  maxLoss: 100,
  pnl: 8.7,
};
