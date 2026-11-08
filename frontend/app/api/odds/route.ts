/**
 * GET /api/odds
 * Returns live football odds from Tatum Prediction API.
 * Also fetches SUI/USD price from Tatum Prices API.
 * Falls back to mock data if Tatum API is unavailable.
 */

import { NextResponse } from 'next/server';
import { getLiveFootballOdds, getSuiPrice } from '@/lib/tatum';

export async function GET() {
  const [odds, suiPrice] = await Promise.all([
    getLiveFootballOdds(),
    getSuiPrice(),
  ]);

  return NextResponse.json({
    ok:          true,
    updatedAt:   Date.now(),
    suiUsdPrice: suiPrice,
    markets:     odds,
  });
}
