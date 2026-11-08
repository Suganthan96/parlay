export interface Market {
  id: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  kickoff: number; // unix timestamp
  homePrice: number; // 0-1
  awayPrice: number;
  drawPrice?: number;
  status: 'open' | 'live' | 'resolved';
  winner?: string;
  txHash?: string;
}

export interface ParlayLeg {
  marketId: string;
  marketLabel: string;
  outcome: string;
  price: number;
  // Sui on-chain fields
  marketObjectId?: string; // Sui object ID of the PredictionMarket
  outcomeIdx?: number;     // 1=Home, 2=Away
}

export interface Ticket {
  id: string;
  legs: Array<{
    marketId: string;
    marketLabel: string;
    outcome: string;
    price: number;
    status: 'live' | 'won' | 'lost';
  }>;
  stakeSui: number;
  payoutSui: number;
  cashOutValue: number;
  status: 'open' | 'won' | 'lost' | 'cashed_out';
  boughtAt: number;
  // Sui-specific
  objectId?: string;
  blobId?: string;
}

export interface Slip {
  id: string;
  creator: string;
  legs: ParlayLeg[];
  quotedPrice: number;
  copies: number;
  kickoff: number;
  expiresAt: number;
}

export interface LpStats {
  walletSui: number;
  parlayCapUsed: number;
  parlayCapTotal: number;
  maxLoss: number;
  pnl: number;
}
