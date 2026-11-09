'use client';

import { ReactNode, useEffect, useState } from 'react';
import { SuiClientProvider, WalletProvider } from '@mysten/dapp-kit';
import { SuiGrpcClient } from '@mysten/sui/grpc';
import { SuiJsonRpcClient } from '@mysten/sui/jsonRpc';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// fullnode.testnet.sui.io supports gRPC-web on port 443
// (public JSON-RPC was deprecated in Sui node v1.80+)
const GRPC_URLS = {
  testnet: 'https://fullnode.testnet.sui.io',
  mainnet: 'https://fullnode.mainnet.sui.io',
};

// dapp-kit's internal code calls `executeTransactionBlock` (JSON-RPC naming).
// SuiGrpcClient uses `executeTransaction` with slightly different param names.
// We shim the method so the wallet hook works without touching every call site.
function createGrpcClient(_network: string) {
  const network = _network as 'testnet' | 'mainnet';
  const grpc = new SuiGrpcClient({ network, baseUrl: GRPC_URLS[network] });
  (grpc as any).executeTransactionBlock = async ({ transactionBlock, signature, options }: {
    transactionBlock: string | Uint8Array;
    signature: string | string[];
    options?: Record<string, boolean>;
  }) => {
    // dapp-kit passes transactionBlock as a base64 string; gRPC needs raw Uint8Array
    const txBytes = typeof transactionBlock === 'string'
      ? Uint8Array.from(atob(transactionBlock), c => c.charCodeAt(0))
      : transactionBlock;
    return grpc.executeTransaction({
      transaction: txBytes,
      signatures:  Array.isArray(signature) ? signature : [signature],
      include:     options as any,
    });
  };
  return grpc as unknown as SuiJsonRpcClient;
}

const networkConfig = {
  testnet: { url: GRPC_URLS.testnet, network: 'testnet' as const },
  mainnet: { url: GRPC_URLS.mainnet, network: 'mainnet' as const },
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 10_000, retry: 2 },
  },
});

type NetworkName = 'testnet' | 'mainnet';
const DEFAULT_NETWORK = (process.env.NEXT_PUBLIC_NETWORK as NetworkName | undefined) ?? 'testnet';
const NETWORK_KEY = 'parlay-network';

export function Web3Provider({ children }: { children: ReactNode }) {
  const [network, setNetwork] = useState<NetworkName>(DEFAULT_NETWORK);

  // Restore after mount (not in the initializer) so SSR and first client render match.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(NETWORK_KEY);
      if (saved === 'testnet' || saved === 'mainnet') setNetwork(saved);
    } catch {}
  }, []);

  const changeNetwork = (n: NetworkName) => {
    setNetwork(n);
    try { localStorage.setItem(NETWORK_KEY, n); } catch {}
  };

  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider
        networks={networkConfig}
        network={network}
        onNetworkChange={changeNetwork}
        createClient={createGrpcClient}
      >
        <WalletProvider autoConnect>
          {children}
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
}
