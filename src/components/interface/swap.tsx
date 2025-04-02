"use client";
import { AnimatePresence, motion } from "motion/react";
import { Card, CardContent, CardFooter, CardHeader } from "../ui/card";
import { Button } from "../ui/button";
import { ArrowDown, RefreshCcw, User, X } from "lucide-react";
import { ConnectWallet } from "../connect-wallet";
import { UserAccount } from "../user";
import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useSwap } from "@/store";
import CoinAvatar from "../ui/CoinAvatar";
import { useFloorToken } from "@/hooks/useFloorToken";
import {
  confirmTransaction,
  convertNumbThousand,
  dummyAddressForQuote,
  formatUnits,
  formatUSD,
  isEVMChain,
  isMatchingDummyAddress,
  isSolanaChain,
  SOLANA_CHAIN_ID,
} from "@shogun-sdk/money-legos";
import { useBalance, useLego } from "@shogun-sdk/money-legos-react";
import {
  useDisconnect,
  useAppKitAccount,
  useAppKitNetwork,
  useAppKitProvider,
  useAppKitEvents,
} from "@reown/appkit/react";
import type { Provider } from "@reown/appkit-adapter-solana";
import { sendTransaction, switchChain } from "wagmi/actions";
import { useConfig } from "wagmi";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import {
  Transaction,
  VersionedMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import { sendJITOTransaction } from "@/lib/solana";
import { Input } from "../ui/input";
import { isAddress } from "viem";
import { AppKitNetwork, solana } from "@reown/appkit/networks";
import { networks } from "@/config";
import { NATIVE_TOKENS } from "@/constants /native-tokens";

const TokenSelectorDialog = dynamic(() => import("../token-select"), {
  ssr: false,
});

export const Swap = () => {
  const [open, setOpen] = useState(false);
  const [showRecipient, setShowRecipient] = useState(false);
  const { address, isConnected } = useAppKitAccount();
  const { switchNetwork, chainId } = useAppKitNetwork();
  const { walletProvider } = useAppKitProvider<Provider>("solana");
  const wagmiConfig = useConfig();
  const { disconnect } = useDisconnect();
  const event = useAppKitEvents();

  const {
    tokenIn,
    setTokenIn,
    nftContractAddress,
    setSwapLoading,
    isSwapLoading,
    recipientAddress,
    setRecipientAddress,
  } = useSwap();

  // Handle chain changes and set native token
  useEffect(() => {
    if (event.data.event === "CONNECT_SUCCESS") {
      const normalizedSolanaChainId =
        chainId === solana.id ? SOLANA_CHAIN_ID : Number(chainId);
      if (normalizedSolanaChainId && !isEVMChain(normalizedSolanaChainId)) {
        const nativeTokens = NATIVE_TOKENS[normalizedSolanaChainId as keyof typeof NATIVE_TOKENS];
        if (nativeTokens && nativeTokens.length > 0) {
          setTokenIn(nativeTokens[0]);
        }
      }
    }
  }, [event, chainId, setTokenIn]);

  const {
    data: nft,
    isLoading,
    refetch: refetchNft,
  } = useFloorToken(nftContractAddress);

  // Determine user address for quote
  const userAddress = useMemo(() => {
    if (address) return address;
    return isSolanaChain(tokenIn.chainId)
      ? dummyAddressForQuote.SOL
      : dummyAddressForQuote.EVM;
  }, [address, tokenIn.chainId]);

  
  const recipientAddr = useMemo(() => {
    // If recipient is explicitly set, use it
    if (isSolanaChain(tokenIn.chainId) && recipientAddress && isAddress(recipientAddress)) {
      return recipientAddress;
    }
    
    // Otherwise use connected wallet or appropriate dummy address
    if (!isSolanaChain(tokenIn.chainId) && address) {
      return address;
    }
    
    // Fallback to dummy address based on chain
    return isSolanaChain(tokenIn.chainId)
      ? dummyAddressForQuote.EVM
      : dummyAddressForQuote.EVM;
  }, [recipientAddress, address, tokenIn.chainId]);

  const {
    data: sweepData,
    isLoading: sweepLoading,
    refetch: refetchSweep,
  } = useLego({
    items: [
      { address: nft?.contract as string, tokenId: nft?.tokenId as string },
    ],
    token: {
      address: tokenIn.address,
      decimals: tokenIn.decimals,
      chainId: tokenIn.chainId,
    },
    userAddress: userAddress,
    recipientAddress: recipientAddr,
  });

  const balance = useBalance(
    address as string,
    tokenIn.address,
    tokenIn.chainId
  );

  const handleCloseTokenSelector = useCallback(() => setOpen(false), []);

  // Improved refresh function that awaits both refetches
  const refresh = useCallback(async () => {
    try {
      await refetchNft();
      await refetchSweep();
    } catch (error) {
      console.error("Failed to refresh data:", error);
      toast.error("Failed to refresh. Please try again.");
    }
  }, [refetchNft, refetchSweep]);

  const handleSweep = useCallback(
    async (chainId: number, data: typeof sweepData) => {
      try {
        setSwapLoading(true);

        if (!data) throw new Error("Sweep data unavailable");
        if (!data.details) throw new Error("Sweep details unavailable");
        
        const recipient = data.details.recipient;
        const sender = data.details.sender;

        // Validate addresses
        if (!recipient || !sender) {
          throw new Error("Recipient or sender address is missing");
        }

        if (
          isMatchingDummyAddress(recipient as string) ||
          isMatchingDummyAddress(sender as string)
        ) {
          throw new Error("Recipient or sender address is invalid");
        }

        if (isEVMChain(chainId)) {
          // Handle EVM chain transaction
          const targetNetwork = networks.find((c) => c.id === chainId);
          if (!targetNetwork) {
            throw new Error("Network configuration not found");
          }
          
          switchNetwork(targetNetwork as AppKitNetwork);
          await switchChain(wagmiConfig, { chainId });

          const { steps } = data;
          if (!steps || steps.length === 0) {
            throw new Error("No transaction steps found");
          }

          for await (const step of steps) {
            await sendTransaction(wagmiConfig, {
              to: step.to as `0x${string}`,
              data: step.data as `0x${string}`,
              value: BigInt(step.value),
              chainId: step.chainId,
              maxFeePerGas: BigInt(step.maxFeePerGas),
              maxPriorityFeePerGas: BigInt(step.maxPriorityFeePerGas),
            });
          }

          toast.success("You've successfully purchased the NFT!");
        } else {
          // Handle Solana chain transaction
          switchNetwork(solana);

          // Validate recipient address for Solana
          if (!isAddress(recipient as string)) {
            throw new Error("Recipient address is invalid");
          }

          // Check if walletProvider exists
          if (!walletProvider) {
            throw new Error("Solana wallet provider not available");
          }

          const txBuffer = Buffer.from(String(data.steps), "base64");
          let versionedTx;

          try {
            const message = VersionedMessage.deserialize(txBuffer);
            versionedTx = new VersionedTransaction(message);
          } catch (error) {
            console.error("Failed to create versioned transaction:", error);
            versionedTx = Transaction.from(txBuffer);
          }

          const signedTx = await walletProvider.signTransaction(versionedTx);
          const serializedTx = signedTx.serialize();
          const base64Message = Buffer.from(serializedTx).toString("base64");

          const result = await sendJITOTransaction(base64Message);
          if (!result || !result.result) {
            throw new Error("Failed to send transaction");
          }
          
          const tx = await confirmTransaction(result.result, {
            maxRetries: 30,
            commitment: "confirmed",
            checkInterval: 2000,
          });

          if (tx.success) {
            toast.success("You've successfully purchased the NFT!");
          } else {
            throw new Error(tx.error || "Transaction failed");
          }
        }
      } catch (error) {
        console.error("Sweep error:", error);
        const message =
          error instanceof Error ? error.message : "An unknown error occurred.";
        toast.error(message);
      } finally {
        setSwapLoading(false);
      }
    },
    [setSwapLoading, wagmiConfig, walletProvider, switchNetwork]
  );

  // Improved balance check
  const isInsufficientBalance = useMemo(() => {
    if (!balance || !sweepData?.details?.tokenIn?.amount) {
      return false;
    }
    
    const available = BigInt(balance.balance ?? "0");
    const required = BigInt(sweepData.details.tokenIn.amount ?? "0");
    return available < required;
  }, [balance, sweepData]);

  // Determine if recipient field should be shown
  const displayRecipient = useMemo(() => {
    return isConnected && address && isSolanaChain(tokenIn.chainId);
  }, [isConnected, address, tokenIn.chainId]);

  // Refetch when dependencies change
  useEffect(() => {
    if (nft) {
      void refetchSweep();
    }
  }, [tokenIn.address, tokenIn.chainId, recipientAddress, address, nft, refetchSweep]);

  // Handle chain mismatch and disconnection
  useEffect(() => {
    const normalizedSolanaChainId =
      chainId === solana.id ? SOLANA_CHAIN_ID : Number(chainId);
    
    const isMismatchEVM =
      isEVMChain(tokenIn.chainId) && !isEVMChain(normalizedSolanaChainId);
    const isMismatchSolana =
      isSolanaChain(tokenIn.chainId) && !isSolanaChain(normalizedSolanaChainId);

    if (isMismatchEVM || isMismatchSolana) {
      disconnect();
    }
  }, [chainId, tokenIn.chainId]);

  return (
    <Fragment>
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        <Card className="border-gray-200 shadow-lg rounded-3xl overflow-hidden w-full">
          <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
            <h2 className="text-sm md:text-lg font-semibold">
              Sweep the floor of Steady Teddies
            </h2>
            <div className="flex items-center gap-1">
              <Button
                onClick={refresh}
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full cursor-pointer"
              >
                <RefreshCcw className="h-4 w-4 " />
              </Button>
              <UserAccount />
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {/* Sell Section */}
            <motion.div
              layout
              className="bg-white rounded-xl border border-gray-200 p-4"
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-500 text-sm">Sell</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setOpen(true);
                    }}
                    className="flex items-center space-x-2 bg-[#F1C73080] hover:bg-[#F1C730]/80 text-white font-bold py-2 px-4 rounded-full"
                  >
                    <div className="rounded-full flex items-center justify-start">
                      <CoinAvatar
                        size={28}
                        // @ts-expect-error
                        coinImageUrl={tokenIn.image?.["src"] || tokenIn.image}
                        chainImageUrl={`/svgs/${tokenIn.chainId}.svg`}
                      />
                    </div>
                    <div className="text-black max-w-[55px] truncate">
                      {tokenIn.symbol}
                    </div>
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-end">
                {sweepLoading || !sweepData?.details?.tokenIn ? (
                  <div className="h-10 bg-gray-200 animate-pulse rounded-md w-2/3 mb-2"></div>
                ) : (
                  <input
                    type="text"
                    value={formatUnits(
                      sweepData?.details.tokenIn.amount ?? "0",
                      sweepData?.details.tokenIn.decimals
                    )}
                    readOnly
                    className="text-4xl font-medium bg-transparent outline-none w-1/2 truncate"
                    placeholder="0"
                  />
                )}

                <div className="text-right">
                  {address && (
                    <div className="text-gray-500 text-sm">
                      {convertNumbThousand(
                        Number(
                          formatUnits(String(balance.balance || "0"), tokenIn.decimals)
                        )
                      )}{" "}
                      {tokenIn.symbol}
                    </div>
                  )}
                </div>
              </div>

              {sweepLoading || !sweepData?.details?.tokenIn ? (
                <div className="h-4 bg-gray-200 animate-pulse rounded-md w-1/3"></div>
              ) : (
                <div className="text-gray-500 text-sm mt-1">
                  {formatUSD(Number(sweepData?.details.tokenIn.amountUsd || 0))}
                </div>
              )}
            </motion.div>

            {/* Arrow */}
            <div className="flex justify-center z-10">
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="bg-white rounded-full p-1 border border-gray-200 shadow-sm"
              >
                <ArrowDown className="h-4 w-4 text-gray-500" />
              </motion.div>
            </div>

            {/* Buy Section */}
            <motion.div
              layout
              className="bg-white rounded-xl border border-gray-200 p-4"
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-500 text-sm">Buy</span>
                <div className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-full">
                  Steady Teddy
                </div>
              </div>

              {isLoading ? (
                <>
                  {/* Skeleton for price */}
                  <div className="h-10 bg-gray-200 animate-pulse rounded-md w-2/3 mb-2"></div>
                  {/* Skeleton for USD value */}
                  <div className="h-4 bg-gray-200 animate-pulse rounded-md w-1/3"></div>
                </>
              ) : (
                <>
                  {nft?.collection && (
                    <div className="text-4xl font-medium">
                      {nft?.collection.floorAskPrice?.amount.native}{" "}
                      {nft?.collection.floorAskPrice?.currency.symbol}
                    </div>
                  )}

                  {nft?.collection && (
                    <div className="text-gray-500 text-sm mt-1">
                      {formatUSD(
                        Number(nft?.collection.floorAskPrice?.amount.usd || 0)
                      )}
                    </div>
                  )}
                </>
              )}
            </motion.div>
            {displayRecipient && (
              <motion.div layout className="mb-4">
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "w-full flex justify-between items-center text-left font-normal",
                    showRecipient && "mb-2"
                  )}
                  onClick={() => setShowRecipient(!showRecipient)}
                >
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>{showRecipient ? "Recipient" : "Add recipient"}</span>
                  </div>
                  {showRecipient && <X className="h-4 w-4 text-gray-400" />}
                </Button>

                <AnimatePresence>
                  {showRecipient && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <Input
                        placeholder="Wallet address"
                        value={recipientAddress || ""}
                        onChange={(e) => setRecipientAddress(e.target.value)}
                        className="w-full focus-visible:ring-0"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </CardContent>
          <div className="px-4">
            {(!isConnected || !address) && <ConnectWallet />}
            {isConnected && address && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={isLoading || !sweepData || isInsufficientBalance || sweepLoading}
                className={cn(
                  "w-full py-3 rounded-xl text-center font-medium transition-all",
                  "bg-amber-400 hover:bg-amber-500 text-amber-900",
                  (isLoading || !sweepData || isInsufficientBalance || sweepLoading) && 
                  "opacity-50 cursor-not-allowed"
                )}
                onClick={() => sweepData && handleSweep(tokenIn.chainId, sweepData)}
              >
                {isInsufficientBalance
                  ? "Insufficient Balance"
                  : isSwapLoading
                  ? "Sweeping..."
                  : "Sweep"}
              </motion.button>
            )}
          </div>
          <CardFooter className="flex flex-col p-4 pt-3 gap-2">
            <div className="w-full flex justify-between items-center text-sm">
              <div className="flex items-center gap-1">
                {isLoading ? (
                  <div className="h-4 bg-gray-200 animate-pulse rounded-md w-32"></div>
                ) : (
                  <span>
                    1 floor • #{nft?.tokenId} {nft?.collection?.name || ""}
                  </span>
                )}
              </div>
              <div className="text-right">
                {isLoading ? (
                  <>
                    <div className="h-4 bg-gray-200 animate-pulse rounded-md w-16 mb-1"></div>
                    <div className="h-3 bg-gray-200 animate-pulse rounded-md w-8"></div>
                  </>
                ) : (
                  <>
                    <div>
                      {formatUSD(
                        Number(nft?.collection?.floorAskPrice?.amount.usd || "0")
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </CardFooter>
        </Card>
      </motion.div>
      <TokenSelectorDialog
        isOpen={open}
        onClose={handleCloseTokenSelector}
        onSelect={(e) => {
          setTokenIn(e);
          handleCloseTokenSelector();
        }}
      />
    </Fragment>
  );
};