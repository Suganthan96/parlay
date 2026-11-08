import { SuiJsonRpcClient as SuiClient, JsonRpcHTTPTransport as SuiHTTPTransport } from '@mysten/sui/jsonRpc';

export type Network = 'testnet' | 'mainnet';

const TATUM_TESTNET_KEY = process.env.NEXT_PUBLIC_TATUM_TESTNET_KEY ?? '';
const TATUM_MAINNET_KEY = process.env.NEXT_PUBLIC_TATUM_MAINNET_KEY ?? '';

const NETWORK_CONFIG: Record<Network, { url: string; apiKey: string }> = {
  testnet: {
    url:    'https://sui-testnet.tatum.io',
    apiKey: TATUM_TESTNET_KEY,
  },
  mainnet: {
    url:    'https://sui-mainnet.tatum.io',
    apiKey: TATUM_MAINNET_KEY,
  },
};

export function makeSuiClient(network: Network = 'testnet'): SuiClient {
  const { url, apiKey } = NETWORK_CONFIG[network];
  return new SuiClient({
    network,
    transport: new SuiHTTPTransport({
      url,
      rpc: { headers: { 'x-api-key': apiKey } },
    }),
  });
}

// Singleton clients (re-created on network switch via context)
let _testnetClient: SuiClient | null = null;
let _mainnetClient: SuiClient | null = null;

export function getClient(network: Network = 'testnet'): SuiClient {
  if (network === 'mainnet') {
    if (!_mainnetClient) _mainnetClient = makeSuiClient('mainnet');
    return _mainnetClient;
  }
  if (!_testnetClient) _testnetClient = makeSuiClient('testnet');
  return _testnetClient;
}

export const EXPLORER: Record<Network, string> = {
  testnet: 'https://suiscan.xyz/testnet',
  mainnet: 'https://suiscan.xyz/mainnet',
};

export function txUrl(digest: string, network: Network = 'testnet'): string {
  return `${EXPLORER[network]}/tx/${digest}`;
}

export function objectUrl(objectId: string, network: Network = 'testnet'): string {
  return `${EXPLORER[network]}/object/${objectId}`;
}
