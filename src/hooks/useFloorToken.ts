
import { useQuery } from '@tanstack/react-query';
import { Token, ApiResponse } from '../types';

const fetchToken = async (
  collectionAddress: string,
): Promise<Token | null> => {
  const url = `https://api-mainnet.magiceden.dev/v3/rtp/berachain/tokens/v6?collection=${collectionAddress}&sortBy=floorAskPrice&limit=1&includeTopBid=false&excludeEOA=false&includeAttributes=false&includeQuantity=false&includeDynamicPricing=false&includeLastSale=false&normalizeRoyalties=false`;

  const response = await fetch(url, {
    headers: {
      accept: '*/*',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch token');
  }

  const data: ApiResponse = await response.json();
  return data.tokens[0]?.token ?? null;
};

export const useFloorToken = (collectionAddress: string) => {
  return useQuery({
    queryKey: ['token', collectionAddress],
    queryFn: () => fetchToken(collectionAddress),
    enabled: !!collectionAddress, // Only fetch if both are provided
    staleTime: 1 * 60 * 1000, // 1 minutes cache
    refetchInterval: 35000
  });
};