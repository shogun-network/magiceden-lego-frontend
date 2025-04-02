import { cookieStorage, createStorage } from "wagmi";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { SolanaAdapter } from "@reown/appkit-adapter-solana/react";
import {
  mainnet,
  arbitrum,
  bsc,
  base,
  sonic,
  avalanche,
  solana,
} from "@reown/appkit/networks";

import type { AppKitNetwork } from "@reown/appkit/networks";

// Get projectId from https://cloud.reown.com
export const projectId =
  process.env.NEXT_PUBLIC_PROJECT_ID || "4b9077425c694732e9a14b02baad1be8"; // this is a public projectId only to use on localhost

if (!projectId) {
  throw new Error("Project ID is not defined");
}

const includeSolana = process.env.NEXT_PUBLIC_DISABLE_SOLANA === "false";

export const networks = [
  mainnet,
  arbitrum,
  bsc,
  base,
  sonic,
  avalanche,
  ...(includeSolana ? [solana] : []),
] as [AppKitNetwork, ...AppKitNetwork[]];

// Set up the Wagmi Adapter (Config)
export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: cookieStorage,
  }),
  ssr: true,
  projectId,
  networks,
});

export const solanaWeb3JsAdapter = new SolanaAdapter();

export const config = wagmiAdapter.wagmiConfig;
