import { SuiGrpcClient } from '@mysten/sui/grpc';

export type Network = 'testnet' | 'mainnet';

// Public fullnodes support gRPC-web on port 443 (JSON-RPC deprecated in v1.80+)
const GRPC_URLS: Record<Network, string> = {
  testnet: 'https://fullnode.testnet.sui.io',
  mainnet: 'https://fullnode.mainnet.sui.io',
};

export function makeSuiClient(network: Network = 'testnet'): SuiGrpcClient {
  return new SuiGrpcClient({ network, baseUrl: GRPC_URLS[network] });
}

let _testnetClient: SuiGrpcClient | null = null;
let _mainnetClient: SuiGrpcClient | null = null;

export function getClient(network: Network = 'testnet'): SuiGrpcClient {
  if (network === 'mainnet') {
    if (!_mainnetClient) _mainnetClient = makeSuiClient('mainnet');
    return _mainnetClient;
  }
  if (!_testnetClient) _testnetClient = makeSuiClient('testnet');
  return _testnetClient;
}

export const EXPLORER: Record<Network, string> = {
  testnet: 'https://testnet.suivision.xyz',
  mainnet: 'https://suivision.xyz',
};

export function txUrl(digest: string, network: Network = 'testnet'): string {
  return `${EXPLORER[network]}/txblock/${digest}`;
}

export function objectUrl(objectId: string, network: Network = 'testnet'): string {
  return `${EXPLORER[network]}/object/${objectId}`;
}
