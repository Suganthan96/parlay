/**
 * Sui RPC proxy — routes JSON-RPC calls to Tatum with the server-side API key.
 * Used by the frontend SuiClient so the API key is never exposed client-side.
 */

import { NextRequest, NextResponse } from 'next/server';

const TATUM_TESTNET_KEY = process.env.TATUM_TESTNET_KEY ?? '';
const TATUM_MAINNET_KEY = process.env.TATUM_MAINNET_KEY ?? '';

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-network',
};

export async function POST(req: NextRequest) {
  const network = req.headers.get('x-network') ?? 'testnet';
  const apiKey  = network === 'mainnet' ? TATUM_MAINNET_KEY : TATUM_TESTNET_KEY;
  const rpcUrl  = network === 'mainnet'
    ? 'https://sui-mainnet.tatum.io'
    : 'https://sui-testnet.tatum.io';

  const body = await req.text();

  try {
    const res = await fetch(rpcUrl, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
      body,
      signal:  AbortSignal.timeout(10_000),
    });
    const data = await res.json();
    return NextResponse.json(data, { headers: CORS });
  } catch (e: any) {
    return NextResponse.json(
      { jsonrpc: '2.0', error: { code: -32603, message: e?.message ?? 'RPC proxy failed' } },
      { headers: CORS },
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: CORS });
}
