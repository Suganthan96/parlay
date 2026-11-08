'use client';

import { ReactNode } from 'react';
import { SuiClientProvider, WalletProvider, createNetworkConfig } from '@mysten/dapp-kit';
import { SuiJsonRpcClient, JsonRpcHTTPTransport } from '@mysten/sui/jsonRpc';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const TATUM_TESTNET_KEY = process.env.NEXT_PUBLIC_TATUM_TESTNET_KEY ?? '';
const TATUM_MAINNET_KEY = process.env.NEXT_PUBLIC_TATUM_MAINNET_KEY ?? '';

const { networkConfig } = createNetworkConfig({
  testnet: { url: 'https://sui-testnet.tatum.io', network: 'testnet' as const, variables: { apiKey: TATUM_TESTNET_KEY } },
  mainnet: { url: 'https://sui-mainnet.tatum.io', network: 'mainnet' as const, variables: { apiKey: TATUM_MAINNET_KEY } },
});

function createTatumClient(_network: string, config: { url: string; variables?: { apiKey?: string } }) {
  return new SuiJsonRpcClient({
    network: _network as 'testnet' | 'mainnet',
    transport: new JsonRpcHTTPTransport({
      url: config.url,
      rpc: { headers: { 'x-api-key': config.variables?.apiKey ?? '' } },
    }),
  });
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 10_000, retry: 2 },
  },
});

const DEFAULT_NETWORK = (process.env.NEXT_PUBLIC_NETWORK as 'testnet' | 'mainnet' | undefined) ?? 'testnet';

export function Web3Provider({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider
        networks={networkConfig}
        defaultNetwork={DEFAULT_NETWORK}
        createClient={createTatumClient}
      >
        <WalletProvider autoConnect>
          {children}
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
}
