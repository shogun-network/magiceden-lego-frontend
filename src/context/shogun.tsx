import {
  ShogunBalancesProvider,
  ShogunLegoProvider,
} from "@shogun-sdk/money-legos-react";

export const ShogunProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    // @ts-expect-error
    <ShogunBalancesProvider  apiKey={process.env.NEXT_PUBLIC_CODEX_API!}>
      {/* @ts-expect-error */}
      <ShogunLegoProvider apiKey={process.env.NEXT_PUBLIC_LEGO_API!}>
        {/* @ts-expect-error */}
        {children}
      </ShogunLegoProvider>
    </ShogunBalancesProvider>
  );
};
