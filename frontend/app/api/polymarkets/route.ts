import { NextResponse } from 'next/server';

export interface PolyMarket {
  id:          string;
  question:    string;
  image:       string;
  endDate:     string;
  yesPrice:    number;
  noPrice:     number;
  liquidity:   number;
  volume24hr:  number;
  slug:        string;
  clobTokenId: string; // YES outcome token ID for price history
}

export async function GET() {
  try {
    const res = await fetch(
      'https://gamma-api.polymarket.com/markets?closed=false&active=true&limit=200',
      { next: { revalidate: 300 } } // cache 5 min
    );
    if (!res.ok) throw new Error(`Polymarket API: ${res.status}`);
    const raw: any[] = await res.json();

    const markets: PolyMarket[] = raw
      .filter(m =>
        m.active &&
        !m.closed &&
        !m.archived &&
        m.outcomes === '["Yes", "No"]' &&
        m.outcomePrices &&
        m.liquidity > 1000  // only markets with real liquidity
      )
      .map(m => {
        const prices = JSON.parse(m.outcomePrices);
        // clobTokenIds is a JSON string like '["tokenA","tokenB"]'; index 0 = YES token
        let clobTokenId = '';
        try {
          const ids = JSON.parse(m.clobTokenIds ?? '[]');
          clobTokenId = ids[0] ?? '';
        } catch {}
        return {
          id:          m.id,
          question:    m.question,
          image:       m.image ?? '',
          endDate:     m.endDate,
          yesPrice:    parseFloat(prices[0]),
          noPrice:     parseFloat(prices[1]),
          liquidity:   m.liquidityNum ?? m.liquidity,
          volume24hr:  m.volume24hr ?? 0,
          slug:        m.slug,
          clobTokenId,
        };
      })
      .sort((a, b) => b.volume24hr - a.volume24hr)
      .slice(0, 60);

    return NextResponse.json(markets);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
