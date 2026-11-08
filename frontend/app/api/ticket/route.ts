/**
 * POST /api/ticket — no-op stub.
 * Ticket data is stored in zustand/localStorage on the client.
 */
import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({ ok: true, note: 'Ticket stored client-side in localStorage' });
}
