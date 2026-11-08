import { NextResponse } from 'next/server';

// Proxy for Polymarket CLOB price history — avoids browser CORS issues.
// GET /api/pricehistory?tokenId=<CLOB_YES_TOKEN_ID>
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tokenId = searchParams.get('tokenId');
  if (!tokenId) return NextResponse.json({ error: 'missing tokenId' }, { status: 400 });

  const endTs   = Math.floor(Date.now() / 1000);
  const startTs = endTs - 30 * 24 * 60 * 60; // 30 days ago

  try {
    const url = `https://clob.polymarket.com/prices-history?market=${tokenId}&startTs=${startTs}&endTs=${endTs}&fidelity=60`;
    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) throw new Error(`CLOB ${res.status}`);
    const data = await res.json();
    // data.history = [{ t: unix_timestamp, p: price }, ...]
    return NextResponse.json(data.history ?? []);
  } catch (e: any) {
    return NextResponse.json([], { status: 200 }); // fall back to empty — chart will use fake
  }
}
