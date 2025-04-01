import { NATIVE_TOKENS } from "./native-tokens";
import { STABLECOINS, SOLANA_CHAIN_ID } from "@shogun-sdk/money-legos";
import {
  arbitrum,
  base,
  berachain,
  bsc,
  mainnet,
  sonic,
} from "@reown/appkit/networks";

export const HARDCODED_TOKENS = {
  [mainnet.id]: [
    ...NATIVE_TOKENS[mainnet.id],
    ...Object.values(STABLECOINS[mainnet.id]),
  ],
  [base.id]: [
    ...NATIVE_TOKENS[base.id],
    ...Object.values(STABLECOINS[base.id]),
  ],
  [arbitrum.id]: [
    ...NATIVE_TOKENS[arbitrum.id],

    ...Object.values(STABLECOINS[arbitrum.id]),
  ],
  [bsc.id]: [...NATIVE_TOKENS[bsc.id], ...Object.values(STABLECOINS[bsc.id])],
  [SOLANA_CHAIN_ID]: [
    ...NATIVE_TOKENS[SOLANA_CHAIN_ID],

    ...Object.values(STABLECOINS[SOLANA_CHAIN_ID]),
  ],
  [berachain.id]: [
    ...NATIVE_TOKENS[berachain.id],
    ...Object.values(STABLECOINS[berachain.id]),
  ],
  [sonic.id]: [
    ...NATIVE_TOKENS[sonic.id],
    ...Object.values(STABLECOINS[sonic.id]),
  ],
  
};
