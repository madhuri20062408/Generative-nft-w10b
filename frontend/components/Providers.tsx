'use client';

import React from 'react';
import {
    RainbowKitProvider,
    getDefaultConfig,
    Chain,
} from '@rainbow-me/rainbowkit';
import { WagmiProvider, http } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@rainbow-me/rainbowkit/styles.css';

const hardhat: Chain = {
    id: 1337,
    name: 'Hardhat',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: {
        default: { http: ['http://localhost:8545'] },
        public: { http: ['http://localhost:8545'] },
    },
};

const config = getDefaultConfig({
    appName: 'Generative NFT Launchpad',
    projectId: 'YOUR_PROJECT_ID', // Placeholder
    chains: [hardhat],
    transports: {
        [hardhat.id]: http(),
    },
    ssr: true,
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                <RainbowKitProvider>
                    {children}
                </RainbowKitProvider>
            </QueryClientProvider>
        </WagmiProvider>
    );
}
