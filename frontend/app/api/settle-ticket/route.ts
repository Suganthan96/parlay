/**
 * POST /api/settle-ticket
 * Server-side auto-settlement — signs with deployer key so bettor never sees an admin step.
 * Requires SUI_DEPLOYER_KEY in .env.local (the suiprivkey1… bech32 private key).
 */
import { NextRequest, NextResponse } from 'next/server';
import { recordOutcome } from '@/lib/memwal';

export async function POST(req: NextRequest) {
  try {
    const { ticketId, won = true, network = 'testnet', marketLabel = '' } = await req.json() as {
      ticketId: string;
      won?: boolean;
      network?: 'testnet' | 'mainnet';
      marketLabel?: string;
    };

    if (!ticketId) {
      return NextResponse.json({ error: 'ticketId required' }, { status: 400 });
    }

    const deployerKey = process.env.SUI_DEPLOYER_KEY;
    if (!deployerKey) {
      return NextResponse.json({ error: 'SUI_DEPLOYER_KEY not configured' }, { status: 500 });
    }

    const packageId  = network === 'mainnet'
      ? (process.env.NEXT_PUBLIC_MAINNET_PACKAGE_ID  ?? '')
      : (process.env.NEXT_PUBLIC_TESTNET_PACKAGE_ID  ?? '');
    const adminCapId = network === 'mainnet'
      ? (process.env.NEXT_PUBLIC_MAINNET_ADMIN_CAP_ID ?? '')
      : (process.env.NEXT_PUBLIC_TESTNET_ADMIN_CAP_ID ?? '');

    if (!packageId || !adminCapId) {
      return NextResponse.json({ error: 'Contract not configured for this network' }, { status: 500 });
    }

    const { Ed25519Keypair }      = await import('@mysten/sui/keypairs/ed25519');
    const { decodeSuiPrivateKey } = await import('@mysten/sui/cryptography');
    const { SuiGrpcClient }       = await import('@mysten/sui/grpc');
    const { Transaction }         = await import('@mysten/sui/transactions');

    const { secretKey } = decodeSuiPrivateKey(deployerKey);
    const keypair = Ed25519Keypair.fromSecretKey(secretKey);
    const sender  = keypair.getPublicKey().toSuiAddress();

    const grpc = new SuiGrpcClient({
      network,
      baseUrl: `https://fullnode.${network}.sui.io`,
    }) as any;

    // Fetch current objectId/version/digest for both owned objects.
    // Using objectRef() avoids the multiGetObjects adapter entirely.
    const [capRes, ticketRes] = await Promise.all([
      grpc.getObject({ objectId: adminCapId, include: {} }),
      grpc.getObject({ objectId: ticketId,   include: {} }),
    ]);

    console.log('[settle-ticket] capRes:', JSON.stringify(capRes?.object ?? capRes).slice(0, 200));
    console.log('[settle-ticket] ticketRes:', JSON.stringify(ticketRes?.object ?? ticketRes).slice(0, 200));

    const capObj    = capRes?.object    ?? capRes;
    const ticketObj = ticketRes?.object ?? ticketRes;

    if (!capObj || !ticketObj) {
      return NextResponse.json({ error: 'Could not fetch object refs from chain' }, { status: 500 });
    }

    const capRef = {
      objectId: adminCapId,
      version:  String(capObj.version    ?? capObj.sequenceNumber ?? '1'),
      digest:   String(capObj.digest     ?? capObj.objectDigest   ?? ''),
    };
    const ticketRef = {
      objectId: ticketId,
      version:  String(ticketObj.version  ?? ticketObj.sequenceNumber ?? '1'),
      digest:   String(ticketObj.digest   ?? ticketObj.objectDigest   ?? ''),
    };

    const tx = new Transaction();
    tx.setSender(sender);
    tx.setGasBudget(50_000_000); // 0.05 SUI
    tx.setGasPrice(1000n);

    tx.moveCall({
      target:    `${packageId}::parlay_router::${won ? 'settle_won' : 'settle_lost'}`,
      arguments: [
        tx.objectRef(capRef),
        tx.objectRef(ticketRef),
      ],
    });

    // Build without multiGetObjects (refs already resolved above)
    const txBytes = await tx.build({
      client: { getReferenceGasPrice: async () => 1000n } as any,
    });

    const { signature } = await keypair.signTransaction(txBytes);

    const result = await grpc.executeTransaction({
      transaction: txBytes,
      signatures:  [signature],
    });

    const digest = result?.digest ?? result?.transaction?.digest ?? '';
    console.log('[settle-ticket] success digest:', digest);

    // Record settlement outcome in Walrus Memory (non-fatal)
    let memoryId = '';
    try {
      const label  = marketLabel || ticketId.slice(0, 10);
      const parts  = label.split(' vs ');
      const home   = parts[0]?.trim() || label;
      const away   = parts[1]?.trim() || '';
      memoryId = await recordOutcome(ticketId, home, away, won ? 'home' : 'away');
      console.log('[settle-ticket] walrus memory recorded, memoryId:', memoryId);
    } catch (e: any) {
      console.warn('[settle-ticket] walrus memory non-fatal error:', e?.message);
    }

    return NextResponse.json({ ok: true, digest, memoryId });
  } catch (err: any) {
    console.error('[settle-ticket] error:', err?.message ?? err);
    return NextResponse.json({ error: err?.message ?? 'Unknown error' }, { status: 500 });
  }
}
