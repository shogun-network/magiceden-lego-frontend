"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { motion } from "motion/react";
import InfiniteScroll from "react-infinite-scroll-component";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import {
  isEVMChain,
  Token,
  isValidSolanaOrEvMaddreess,
  formatUnits,
  formatUSD,
  convertNumbThousand,
  SOLANA_CHAIN_ID
} from "@shogun-sdk/money-legos";
import {
  useShogunBalances,
  useTokenBalances,
} from "@shogun-sdk/money-legos-react";
import { useAppKitAccount, useAppKitNetwork } from "@reown/appkit/react";
import { fuzzySearch } from "@/lib/search";
import { COMBINED_TOKEN_LIST } from "@/lib/tokens";
import { useQuery } from "@tanstack/react-query";
import CoinAvatar from "../ui/CoinAvatar";

interface TokenSelectorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (token: Token) => void;
}

const PAGE_SIZE = 20;
const includeSolana = process.env.NEXT_PUBLIC_DISABLE_SOLANA === "false";

export default function TokenSelectorDialog({
  isOpen,
  onClose,
  onSelect,
}: TokenSelectorDialogProps) {
  const { address } = useAppKitAccount();
  const { chainId } = useAppKitNetwork();
  const { client } = useShogunBalances();

  // Use a ref for the search input to prevent it from being reset during re-renders
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleTokens, setVisibleTokens] = useState<Token[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // Memoize token balances query to prevent unnecessary re-fetches
  const { evmBalances, solanaBalances } = useTokenBalances({
    userEVMAddress: (isEVMChain(chainId as number)
      ? (address as string)
      : undefined) as string,
    userSolanaAddress: (!isEVMChain(chainId as number) && includeSolana
      ? address
      : undefined) as string,
  });

  const isValidAddress = useMemo(
    () => !!searchQuery && isValidSolanaOrEvMaddreess(searchQuery),
    [searchQuery]
  );

  // Debounce search token query to prevent excessive API calls
  const { data: searchedToken, isLoading: isSearching } = useQuery({
    queryKey: ["searchToken", searchQuery],
    queryFn: () => client.searchToken(searchQuery),
    enabled: isValidAddress,
    staleTime: 30000, // Keep data fresh for 30 seconds
  });

  // Create a stable balance map that doesn't change unless balances change
  const balanceMap = useMemo(() => {
    // Combine EVM and Solana balances
    const allBalances = [
      ...(evmBalances || []), 
      ...(includeSolana ? (solanaBalances || []) : [])
    ];
    const map = new Map<string, Token["balanceData"]>();

    allBalances.forEach((bal) => {
      if (!bal) return;
      const key = `${bal.tokenAddress}-${bal.network}`;
      map.set(key, {
        chainId: Number(bal.network),
        balance: bal.balance,
        usdValue: bal.usdValue,
      });
    });

    return map;
  }, [evmBalances, solanaBalances, includeSolana]);

  // Create a stable list of all tokens with balances
  const allTokensWithBalances = useMemo(() => {
    // Combine EVM and Solana balances
    const allBalances = [
      ...(evmBalances || []), 
      ...(includeSolana ? (solanaBalances || []) : [])
    ];

    // Filter COMBINED_TOKEN_LIST to remove Solana tokens if not included
    const filteredTokenList = includeSolana 
      ? COMBINED_TOKEN_LIST 
      : COMBINED_TOKEN_LIST.filter(token => token.chainId !== SOLANA_CHAIN_ID);

    // First, add balances to existing tokens in filtered token list
    const existingWithBalances = filteredTokenList.map((token) => {
      const key = `${token.address}-${token.chainId}`;
      const balanceData = balanceMap.get(key);
      return {
        ...token,
        balanceData,
        isVerified: token.isVerified ?? false,
      };
    });

    // Then add any tokens from balances that aren't in filtered token list
    const tokensWithBalances = [...existingWithBalances];

    allBalances.forEach((bal) => {
      if (!bal) return;
      // Skip Solana tokens if not included
      if (!includeSolana && Number(bal.network) === SOLANA_CHAIN_ID) return;
      
      const exists = tokensWithBalances.some(
        (t) =>
          t.address === bal.tokenAddress && t.chainId === Number(bal.network)
      );

      if (!exists) {
        tokensWithBalances.push({
          address: bal.tokenAddress,
          chainId: Number(bal.network),
          decimals: bal.decimals,
          name: bal.name,
          symbol: bal.symbol,
          image: bal.logo,
          mcap: bal.mcap,
          balanceData: {
            balance: bal.balance,
            usdValue: bal.usdValue,
            chainId: Number(bal.network),
          },
          isVerified: false,
        });
      }
    });

    // Sort by USD value (descending)
    return tokensWithBalances.sort((a, b) => {
      const aVal = a.balanceData?.usdValue ?? 0;
      const bVal = b.balanceData?.usdValue ?? 0;
      return bVal - aVal;
    });
  }, [balanceMap, evmBalances, solanaBalances, includeSolana]);

  // Filter tokens based on search query
  const filteredTokens = useMemo(() => {
    // Apply search filter if there's a query
    let filteredList = searchQuery
      ? fuzzySearch(
          allTokensWithBalances,
          ["name", "symbol", "address"],
          searchQuery
        )
      : allTokensWithBalances;

    // Add searched token if found and not already in the list
    if (
      searchedToken &&
      Array.isArray(searchedToken) &&
      searchedToken.length > 0
    ) {
      const newList = [...filteredList];

      searchedToken.forEach((token) => {
        // Skip Solana tokens if not included
        if (!includeSolana && token.chainId === SOLANA_CHAIN_ID) return;
        
        const exists = newList.some(
          (t) => t.address === token.address && t.chainId === token.chainId
        );

        if (!exists) {
          const key = `${token.address}-${token.chainId}`;
          const balanceData = balanceMap.get(key);
          newList.unshift({
            ...token,
            balanceData,
            isVerified: false,
          });
        }
      });

      return newList;
    }

    return includeSolana ? filteredList : filteredList.filter(token => token.chainId !== SOLANA_CHAIN_ID);;
  }, [searchQuery, searchedToken, allTokensWithBalances, balanceMap, includeSolana]);

  // Stable handler functions that won't change with re-renders
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value);
    },
    []
  );

  const loadMore = useCallback(() => {
    setCurrentPage((prevPage) => {
      const nextPage = prevPage + 1;
      const startIndex = nextPage * PAGE_SIZE;
      const endIndex = startIndex + PAGE_SIZE;
      const nextTokens = filteredTokens.slice(startIndex, endIndex);

      if (nextTokens.length > 0) {
        setVisibleTokens((prev) => [...prev, ...nextTokens]);
        setHasMore(endIndex < filteredTokens.length);
        return nextPage;
      } else {
        setHasMore(false);
        return prevPage;
      }
    });
  }, [filteredTokens]);

  // Update visible tokens when filtered tokens change
  useEffect(() => {
    if (isInitialized) {
      setCurrentPage(0);
      setVisibleTokens(filteredTokens.slice(0, PAGE_SIZE));
      setHasMore(filteredTokens.length > PAGE_SIZE);
    }
  }, [filteredTokens, isInitialized]);

  // Initialize component when dialog opens
  useEffect(() => {
    if (isOpen && !isInitialized) {
      setVisibleTokens(allTokensWithBalances.slice(0, PAGE_SIZE));
      setHasMore(allTokensWithBalances.length > PAGE_SIZE);
      setIsInitialized(true);
    }

    // Only reset search when dialog opens, not during every render
    if (isOpen && !isInitialized) {
      setSearchQuery("");
      setCurrentPage(0);
    }

    // Reset initialization state when dialog closes
    if (!isOpen) {
      setIsInitialized(false);
    }
  }, [isOpen, allTokensWithBalances, isInitialized]);

  // Skeleton loader component
  const TokenSkeleton = () => (
    <div className="flex items-center justify-between w-full p-3 rounded-lg animate-pulse">
      <div className="flex items-center gap-3">
        <div className="rounded-full w-8 h-8 bg-gray-200"></div>
        <div className="text-left">
          <div className="h-4 w-24 bg-gray-200 rounded"></div>
          <div className="h-3 w-16 bg-gray-200 rounded mt-1"></div>
        </div>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-xl overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-xl">Select a token</DialogTitle>
        </DialogHeader>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search tokens"
            className="pl-9 rounded-xl focus-visible:ring-0"
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>

        <div
          id="scrollableDiv"
          className="h-[300px] overflow-y-auto overflow-x-hidden no-scrollbar"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {/* @ts-expect-error */}
          <InfiniteScroll
            dataLength={visibleTokens.length}
            next={loadMore}
            hasMore={hasMore}
            loader={
              <p className="text-center text-sm text-gray-500 py-2">
                Loading...
              </p>
            }
            scrollableTarget="scrollableDiv"
            style={{ overflow: "hidden" }}
          >
            <div className="flex flex-col gap-2 w-full">
              {isSearching && isValidAddress ? (
                // Show skeleton while searching by address
                <div className="flex flex-col gap-2 w-full">
                  <TokenSkeleton />
                  <TokenSkeleton />
                  <TokenSkeleton />
                </div>
              ) : visibleTokens.length > 0 ? (
                visibleTokens.map((token, index) => (
                  <motion.button
                    key={`${token.address}-${index}-${token.chainId}`}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => onSelect(token)}
                    className="flex items-center justify-between w-full p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <CoinAvatar
                        size={32}
                        // @ts-expect-error
                        coinImageUrl={token.image?.["src"] || token.image}
                        chainImageUrl={`/svgs/${token.chainId}.svg`}
                      />

                      <div className="text-left">
                        <div className="font-medium">
                          {token.name}
                          {token.isVerified && (
                            <span className="ml-1 text-xs text-green-600">
                              ✓
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          {token.symbol}
                        </div>
                      </div>
                    </div>
                    {token.balanceData && (
                      <div className="text-right">
                        <div>
                          {convertNumbThousand(
                            Number(
                              formatUnits(
                                token.balanceData?.balance as string,
                                token.decimals
                              )
                            )
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatUSD(String(token.balanceData.usdValue ?? "0"))}
                        </div>
                      </div>
                    )}
                  </motion.button>
                ))
              ) : (
                <p className="text-center text-sm text-gray-500 py-2">
                  No tokens found
                </p>
              )}
            </div>
          </InfiniteScroll>
        </div>
      </DialogContent>
    </Dialog>
  );
}