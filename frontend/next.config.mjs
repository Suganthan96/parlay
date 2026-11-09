/** @type {import('next').NextConfig} */
const nextConfig = {
  typedRoutes: false,
  webpack(config) {
    // @coinbase/cdp-sdk (pulled in by @base-org/account → baseAccount wagmi connector)
    // has optional x402 peer deps that aren't installed. We don't use the Base Account
    // connector at all — only injected() — so stub out the entire sdk and its deps.
    config.resolve.alias = {
      ...config.resolve.alias,
      // Coinbase / Base Account optional deps
      '@coinbase/cdp-sdk':                        false,
      '@base-org/account':                        false,
      '@x402/core/client':                        false,
      '@x402/evm/exact/client':                   false,
      '@x402/evm/upto/client':                    false,
      '@x402/svm/exact/client':                   false,
      // MetaMask SDK optional React Native dep
      '@react-native-async-storage/async-storage': false,
      // WalletConnect optional pretty logger
      'pino-pretty':                              false,
    };
    return config;
  },
};
export default nextConfig;
