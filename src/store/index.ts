import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Token } from "@shogun-sdk/money-legos";
import { NATIVE_TOKENS } from "@/constants /native-tokens";

const DEFAULT_SLIPPAGE = 1;
const DEFAULT_NFT_CONTRACT_ADDRESS = "0x88888888A9361f15AAdBAca355A6B2938C6A674e";

interface SwapState {
  tokenIn: Token;
  inputAmount: string;
  isSwapLoading: boolean;
  slippage: number;
  recipientAddress: string;
  nftContractAddress: string;
  setNftContractAddress: (address: string) => void;
  setTokenIn: (token: Token) => void;
  setInputAmount: (amount: string) => void;
  setRecipientAddress: (recipientAddress: string) => void;
  setSwapLoading: (value: boolean) => void;
  setSlippage: (amount: number) => void;
}

export const useSwap = create<SwapState>()(
  persist(
    (set) => ({
      isAutoSlippage: true,
      tokenIn: NATIVE_TOKENS["1"][1],
      inputAmount: "",
      isSwapLoading: false,
      isMultiSwapLoading: false,
      latestSuggestedAutoSlippageValue: 0,
      slippage: DEFAULT_SLIPPAGE,
      recipientAddress: "",
      nftContractAddress: DEFAULT_NFT_CONTRACT_ADDRESS,
      setNftContractAddress: (address) => set({ nftContractAddress: address }),
      setTokenIn: (token) => set({ tokenIn: token }),
      setInputAmount: (amount) => set({ inputAmount: amount }),
      setRecipientAddress: (recipientAddress) => set({ recipientAddress }),
      setSwapLoading: (value) => set({ isSwapLoading: value }),
      setSlippage: (value) => {
        return set({ slippage: value });
      },
    }),
    {
      name: "legos-storage",
      partialize: (state) => ({
        tokenIn: state.tokenIn,
        slippage: state.slippage,
        nftContractAddress: state.nftContractAddress,
      }),
    }
  )
);

export const swapStore = useSwap;