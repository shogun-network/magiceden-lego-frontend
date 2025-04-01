"use client";

import {
  wagmiAdapter,
  solanaWeb3JsAdapter,
  projectId,
  networks,
} from "@/config";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createAppKit } from "@reown/appkit/react";
import React, { type ReactNode } from "react";
import { cookieToInitialState, WagmiProvider, type Config } from "wagmi";
import { ShogunProvider } from "./shogun";
import {Toaster} from "react-hot-toast"
// Set up queryClient
const queryClient = new QueryClient();

// Set up metadata
const metadata = {
  name: "next-reown-appkit",
  description: "next-reown-appkit",
  url: "https://github.com/0xonerb/next-reown-appkit-ssr", // origin must match your domain & subdomain
  icons: ["https://avatars.githubusercontent.com/u/179229932"],
};

// Create the modal
export const modal = createAppKit({
  adapters: [wagmiAdapter, solanaWeb3JsAdapter],
  projectId,
  networks,
  metadata,
  themeMode: "light",
  features: {
    analytics: false,
    swaps: false,
    send: false,
    email: false,
    socials: false,
  },
  themeVariables: {
    "--w3m-accent": "#000000",
  },
});

function ConnectionProvider({
  children,
  cookies,
}: {
  children: ReactNode;
  cookies: string | null;
}) {
  const initialState = cookieToInitialState(
    wagmiAdapter.wagmiConfig as Config,
    cookies
  );

  const codexApiKey = process.env.NEXT_PUBLIC_CODEX_API;
  if (!codexApiKey) {
    console.error(
      "NEXT_PUBLIC_CODEX_API is not defined in the environment variables."
    );
    return null; // Optionally, you can render a fallback UI here
  }

  return (
    <WagmiProvider
      config={wagmiAdapter.wagmiConfig as Config}
      initialState={initialState}
    >
      <QueryClientProvider client={queryClient}>
        <ShogunProvider>{children}</ShogunProvider>
        <Toaster />
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default ConnectionProvider;
