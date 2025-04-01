"use client";
import { motion } from "motion/react";
import { Card, CardContent, CardFooter, CardHeader } from "../ui/card";
import { Button } from "../ui/button";
import { ArrowDown, Check, RefreshCcw, Settings } from "lucide-react";
import { ConnectWallet } from "../connect-wallet";
import { UserAccount } from "../user";
import { Fragment, useCallback, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useSwap } from "@/store";
import CoinAvatar from "../ui/CoinAvatar";
import { useFloorToken } from "@/hooks/useFloorToken";
import {
  convertNumbThousand,
  dummyAddressForQuote,
  formatUnits,
  formatUSD,
  isEVMChain,
  isNativeToken,
} from "@shogun-sdk/money-legos";
import { useBalance, useLego } from "@shogun-sdk/money-legos-react";
import { useAppKitAccount } from "@reown/appkit/react";
// import { UserSettings } from "../user/settiings";
import { sendTransaction, switchChain } from "wagmi/actions";
import { BaseError, useConfig } from "wagmi";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
const TokenSelectorDialog = dynamic(() => import("../token-select"), {
  ssr: false,
});

export const Swap = () => {
  const [open, setOpen] = useState(false);
  const {
    tokenIn,
    setTokenIn,
    nftContractAddress,
    setSwapLoading,
    isSwapLoading,
  } = useSwap();
  const { address, isConnected } = useAppKitAccount();
  const wagmiConfig = useConfig();
  const {
    data: nft,
    isLoading,
    refetch: refetchNft,
  } = useFloorToken(nftContractAddress);
  const {
    data: sweepData,
    isLoading: sweepLoading,
    refetch: refetchSweep,
  } = useLego({
    items: [
      {
        address: nft?.contract as string,
        tokenId: nft?.tokenId as string,
      },
    ],
    token: {
      address: isNativeToken(tokenIn.address)
        ? "0x0000000000000000000000000000000000000000"
        : tokenIn.address,
      decimals: tokenIn.decimals,
      chainId: tokenIn.chainId,
    },
    userAddress: address ?? dummyAddressForQuote.EVM,
  });

  const handleCloseTokenSelector = useCallback(() => {
    setOpen(false);
  }, []);

  const refresh = useCallback(async () => {
    await refetchNft();
    refetchSweep();
  }, [refetchNft, refetchSweep]);

  const balance = useBalance(
    address as string,
    tokenIn.address,
    tokenIn.chainId
  );

  const handleSweep = useCallback(
    async (chainId: number, data: typeof sweepData) => {
      try {
        setSwapLoading(true);
        if (isEVMChain(chainId)) {
          if (!data) return;
          const { steps } = data;
          await switchChain(wagmiConfig, {
            chainId: chainId,
          });
          // Execute each transaction step
          for await (const step of steps) {
            const txHash = await sendTransaction(wagmiConfig, {
              to: step.to as `0x${string}`,
              data: step.data as `0x${string}`,
              value: BigInt(step.value),
              chainId: step.chainId,
              maxFeePerGas: BigInt(step.maxFeePerGas),
              maxPriorityFeePerGas: BigInt(step.maxPriorityFeePerGas),
            });
            console.log(
              `NFT purchase successful. Transaction hash: ${"txHash"}`
            );
          }
          toast.success("You've successfully purchased the NFT!");
        }
      } catch (error) {
        if (error instanceof Error) {
          if ("details" in error) {
            toast.error(
              (error as { details: string }).details || error.message
            );
          } else {
            toast.error(error.message);
          }
        } else {
          toast.error("An unknown error occurred.");
        }
      } finally {
        setSwapLoading(false);
      }
    },
    [setSwapLoading, wagmiConfig]
  );

  const isInsufficientBalance = useMemo(() => {
    if (balance && sweepData?.details?.tokenIn?.amount) {
      const availableBalance = BigInt(balance.balance ?? "0");
      const requiredAmount = BigInt(sweepData.details.tokenIn.amount ?? "0");
      return availableBalance < requiredAmount;
    }
    return false;
  }, [balance, sweepData]);
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
              {/* <UserSettings /> */}
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
                          formatUnits(String(balance.balance), tokenIn.decimals)
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
                  {formatUSD(Number(sweepData?.details.tokenIn.amountUsd))}
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
                        Number(nft?.collection.floorAskPrice?.amount.usd)
                      )}
                    </div>
                  )}
                </>
              )}
            </motion.div>
          </CardContent>
          <div className="px-4">
            {(!isConnected || !address) && <ConnectWallet />}
            {isConnected && address && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={isLoading || !sweepData || isInsufficientBalance}
                className={cn(
                  "w-full py-3 rounded-xl text-center font-medium transition-all",
                  "bg-amber-400 hover:bg-amber-500 text-amber-900"
                )}
                onClick={() => handleSweep(tokenIn.chainId, sweepData)}
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
                    1 floor • #{nft?.tokenId} {nft?.collection.name}
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
                        nft?.collection.floorAskPrice?.amount.usd ?? "0"
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
