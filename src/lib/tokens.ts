import { HARDCODED_TOKENS } from "@/constants /hardcoded-tokens";
import { Token, VerifiedList } from "@shogun-sdk/money-legos";

export const combineTokenLists = () => {
    // Make a copy of verified tokens and add isVerified=true
    const verifiedTokensWithFlag = VerifiedList.verifiedTokens.map(token => ({
      ...token,
      isVerified: true
    }));
    
    // Convert to an object to allow faster lookups by ID
    const tokenMap = new Map();
    
    // Add all verified tokens to the map
    verifiedTokensWithFlag.forEach(token => {
      const key = `${token.address}-${token.chainId}`;
      tokenMap.set(key, token);
    });
    
    // Process hardcoded tokens
    Object.entries(HARDCODED_TOKENS).forEach(([chainId, tokens]) => {
      (tokens as Token[]).forEach((token) => {
        const key = `${token.address}-${chainId}`;
        // Only add if not already in the list (prioritize verified tokens)
        if (!tokenMap.has(key)) {
          tokenMap.set(key, {
            ...token,
            isVerified: true,
            chainId: Number(chainId)
          });
        }
      });
    });
    
    // Convert back to array
    return Array.from(tokenMap.values());
  };
  
  // Create the combined token list
  export const COMBINED_TOKEN_LIST = combineTokenLists();