import { SOLANA_CHAIN_ID , NATIVE_TOKEN, SOL_NATIVE} from '@shogun-sdk/money-legos';
import { mainnet, base, arbitrum, bsc, berachain, sonic } from '@reown/appkit/networks';
import { bera, bnb, eth, s, sol, wbera, wS } from '../assets/svgs';
export const NATIVE_TOKENS = {
  [mainnet.id]: [
    {
      name: 'Wrapped Ether',
      symbol: 'WETH',
      decimals: 18,
      address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
      chainId: 1,
      image: eth,
    },
    {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
      address: NATIVE_TOKEN.ETH,
      chainId: 1,
      image: eth,
    },
  ],
  [base.id]: [
    {
      name: 'Wrapped Ether',
      symbol: 'WETH',
      decimals: 18,
      address: '0x4200000000000000000000000000000000000006',
      chainId: 8453,
      image: eth,
    },
    {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
      address: NATIVE_TOKEN.ETH,
      chainId: 8453,
      image: eth,
    },
  ],
  [arbitrum.id]: [
    {
      name: 'Wrapped Ether',
      symbol: 'WETH',
      decimals: 18,
      address: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
      chainId: 42161,
      image: eth,
    },
    {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
      address: NATIVE_TOKEN.ETH,
      chainId: 42161,
      image: eth,
    },
  ],
  [bsc.id]: [
    {
      name: 'Wrapped BNB',
      symbol: 'WBNB',
      decimals: 18,
      address: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
      chainId: 56,
      image: bnb,
    },
    {
      name: 'Binance Coin',
      symbol: 'BNB',
      decimals: 18,
      address: NATIVE_TOKEN.ETH,
      chainId: 56,
      image: bnb,
    },
  ],
  [SOLANA_CHAIN_ID]: [
    {
      name: 'Solana',
      symbol: 'SOL',
      decimals: 9,
      address:SOL_NATIVE,
      chainId: 7565164,
      image: sol,
    },
    {
      name: 'Wrapped Solana',
      symbol: 'WSOL',
      decimals: 9,
      address: 'So11111111111111111111111111111111111111112',
      chainId: 7565164,
      image: sol,
    },
  ],
  [berachain.id]: [
    {
      name: 'BERA Token',
      symbol: 'BERA',
      decimals: 18,
      address: NATIVE_TOKEN.ETH,
      chainId: 80094,
      image: bera,
    },
    {
      name: 'Wrapped Bera',
      symbol: 'WBERA',
      decimals: 18,
      address: '0x6969696969696969696969696969696969696969',
      chainId: 80094,
      image: wbera,
    },
  ],
  [sonic.id]: [
    {
      name: 'Sonic',
      symbol: 'S',
      decimals: 18,
      address: NATIVE_TOKEN.ETH,
      chainId: 146,
      image: s,
    },
    {
      name: 'Wrapped Sonic',
      symbol: 'wS',
      decimals: 18,
      address: '0x039e2fB66102314Ce7b64Ce5Ce3E5183bc94aD38',
      chainId: 146,
      image: wS,
    },
  ],
};