import { NextRequest, NextResponse } from 'next/server';
import { recordPick } from '@/lib/memwal';

export async function POST(req: NextRequest) {
  try {
    const { userAddress, legs, txDigest } = await req.json() as {
      userAddress: string;
      legs: Array<{ market: string; outcome: string; odds: number }>;
      txDigest: string;
    };

    if (!userAddress || !txDigest) {
      return NextResponse.json({ memoryId: '' });
    }

    const memoryId = await recordPick(userAddress, legs ?? [], txDigest);
    console.log('[memwal] recorded pick, memoryId:', memoryId);
    return NextResponse.json({ memoryId });
  } catch (err: any) {
    console.error('[memwal] recordPick failed:', err?.message ?? err);
    return NextResponse.json({ memoryId: '' });
  }
}
