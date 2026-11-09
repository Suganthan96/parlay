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

const FALLBACK_MARKETS: PolyMarket[] = [
  { id:'p1', question:'Will Donald Trump win the 2028 Republican primary?', image:'https://polymarket-upload.s3.us-east-2.amazonaws.com/trump.png', endDate:'2028-07-01', yesPrice:0.72, noPrice:0.28, liquidity:1200000, volume24hr:85000, slug:'trump-2028-primary', clobTokenId:'' },
  { id:'p2', question:'Will the Fed cut rates in December 2026?', image:'https://polymarket-upload.s3.us-east-2.amazonaws.com/fed.png', endDate:'2026-12-31', yesPrice:0.61, noPrice:0.39, liquidity:980000, volume24hr:62000, slug:'fed-cut-dec-2026', clobTokenId:'' },
  { id:'p3', question:'Will Elon Musk still own X (Twitter) by end of 2027?', image:'https://polymarket-upload.s3.us-east-2.amazonaws.com/x.png', endDate:'2027-12-31', yesPrice:0.83, noPrice:0.17, liquidity:750000, volume24hr:41000, slug:'musk-owns-x-2027', clobTokenId:'' },
  { id:'p4', question:'Will Bitcoin reach $200k before 2028?', image:'https://polymarket-upload.s3.us-east-2.amazonaws.com/btc.png', endDate:'2027-12-31', yesPrice:0.44, noPrice:0.56, liquidity:2100000, volume24hr:130000, slug:'btc-200k-2028', clobTokenId:'' },
  { id:'p5', question:'Will Kamala Harris run for president in 2028?', image:'https://polymarket-upload.s3.us-east-2.amazonaws.com/harris.png', endDate:'2028-06-01', yesPrice:0.35, noPrice:0.65, liquidity:620000, volume24hr:28000, slug:'harris-2028-run', clobTokenId:'' },
  { id:'p6', question:'Will OpenAI release GPT-6 before July 2027?', image:'https://polymarket-upload.s3.us-east-2.amazonaws.com/openai.png', endDate:'2027-07-01', yesPrice:0.52, noPrice:0.48, liquidity:890000, volume24hr:55000, slug:'gpt6-before-2027', clobTokenId:'' },
  { id:'p7', question:'Will Ethereum ETF inflows exceed $5B in 2026?', image:'https://polymarket-upload.s3.us-east-2.amazonaws.com/eth.png', endDate:'2026-12-31', yesPrice:0.67, noPrice:0.33, liquidity:1050000, volume24hr:72000, slug:'eth-etf-5b-2026', clobTokenId:'' },
  { id:'p8', question:'Will Argentina win the 2026 FIFA World Cup?', image:'https://polymarket-upload.s3.us-east-2.amazonaws.com/arg.png', endDate:'2026-07-20', yesPrice:0.19, noPrice:0.81, liquidity:1800000, volume24hr:95000, slug:'argentina-wc-2026', clobTokenId:'' },
  { id:'p9', question:'Will SpaceX land humans on Mars before 2030?', image:'https://polymarket-upload.s3.us-east-2.amazonaws.com/spacex.png', endDate:'2029-12-31', yesPrice:0.12, noPrice:0.88, liquidity:430000, volume24hr:19000, slug:'spacex-mars-2030', clobTokenId:'' },
  { id:'p10', question:'Will a US recession be declared in 2026?', image:'https://polymarket-upload.s3.us-east-2.amazonaws.com/recession.png', endDate:'2026-12-31', yesPrice:0.29, noPrice:0.71, liquidity:760000, volume24hr:48000, slug:'us-recession-2026', clobTokenId:'' },
];

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
    // Network unreachable — serve fallback markets so the UI still works
    console.warn('Polymarket API unavailable, using fallback data:', e.message);
    return NextResponse.json(FALLBACK_MARKETS);
  }
}
