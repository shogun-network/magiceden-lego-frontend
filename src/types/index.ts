
export interface Currency {
    contract: string;
    name: string;
    symbol: string;
    decimals: number;
  }
  
  export interface Amount {
    raw: string;
    decimal: number;
    usd: number;
    native: number;
  }
  
  export interface FloorAskPrice {
    currency: Currency;
    amount: Amount;
  }
  
  export interface Collection {
    id: string;
    name: string;
    image: string;
    slug: string;
    symbol: string;
    creator: string;
    tokenCount: number;
    metadataDisabled: boolean;
    floorAskPrice: FloorAskPrice | null;
  }
  
  export interface Metadata {
    imageOriginal: string;
    imageMimeType: string;
    tokenURI: string;
  }
  
  export interface Token {
    chainId: number;
    contract: string;
    tokenId: string;
    name: string;
    description: string;
    image: string;
    imageSmall: string;
    imageLarge: string;
    metadata: Metadata;
    media: null;
    kind: string;
    isFlagged: boolean;
    isSpam: boolean;
    isNsfw: boolean;
    metadataDisabled: boolean;
    lastFlagUpdate: string;
    lastFlagChange: string | null;
    supply: string;
    remainingSupply: string;
    rarity: number;
    rarityRank: number;
    collection: Collection;
    owner: string;
    mintedAt: string;
    createdAt: string;
    decimals: number | null;
    mintStages: any[];
  }
  
  export interface ApiResponse {
    tokens: {
      token: Token;
    }[];
    continuation: string;
  }