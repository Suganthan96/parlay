/**
 * Walrus blob storage integration.
 * Used for: ticket metadata, market configs, scorecard images.
 * Stores JSON blobs on Walrus and returns a blobId that is anchored in the Sui Ticket object.
 */

// Mainnet Walrus requires WAL tokens to store — always use testnet publisher (free).
// All metadata blobs live on testnet Walrus regardless of Sui network.
const PUBLISHER  = 'https://publisher.walrus-testnet.walrus.space';
const AGGREGATOR = 'https://aggregator.walrus-testnet.walrus.space';

export function walrusAggregatorUrl(_network?: string): string {
  return AGGREGATOR;
}

export function walrusBlobUrl(blobId: string): string {
  return `${AGGREGATOR}/v1/blobs/${blobId}`;
}

// Walrus Memory blobs are SEAL-encrypted and live on Walrus mainnet (production relayer)
export function memoryBlobUrl(blobId: string): string {
  return `https://walruscan.com/mainnet/blob/${blobId}`;
}

// ── Store ────────────────────────────────────────────────────────────────────

export async function storeBlob(data: object): Promise<string> {
  const body = JSON.stringify(data);
  const res  = await fetch(`${PUBLISHER}/v1/blobs`, {
    method:  'PUT',
    headers: { 'Content-Type': 'application/json' },
    body,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Walrus store failed ${res.status}: ${text.slice(0, 200)}`);
  }
  const json = await res.json();
  const blobId: string =
    json?.newlyCreated?.blobObject?.blobId ??
    json?.alreadyCertified?.blobId ??
    json?.blobId ??
    '';
  if (!blobId) throw new Error('Walrus: no blobId in response: ' + JSON.stringify(json).slice(0, 300));
  return blobId;
}

// ── Read ─────────────────────────────────────────────────────────────────────

export async function readBlob(blobId: string): Promise<object> {
  const res = await fetch(`${AGGREGATOR}/v1/blobs/${blobId}`);
  if (!res.ok) throw new Error(`Walrus read failed ${res.status}`);
  return res.json();
}

// ── Helpers ───────────────────────────────────────────────────────────────────

// Encode blobId string to bytes for passing to Sui Move (UTF-8 bytes)
export function blobIdToBytes(blobId: string): number[] {
  return Array.from(new TextEncoder().encode(blobId));
}

// Store a ticket's metadata and return the blobId as bytes ready for the PTB
export async function storeTicketMeta(meta: {
  legs:          Array<{ market: string; outcome: string; odds: number }>;
  stakeSui:      number;
  payoutSui:     number;
  buyerAddress:  string;
  purchasedAt:   string;
  network?:      string;
  txHash?:       string;
}): Promise<{ blobId: string; blobIdBytes: number[] }> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { network: _net, ...data } = meta;
  const blobId    = await storeBlob(data);
  const blobIdBytes = blobIdToBytes(blobId);
  return { blobId, blobIdBytes };
}
