import { useMemo } from 'react';

import { ConnectionProvider } from "@solana/wallet-adapter-react";
import { clusterApiUrl } from "@solana/web3.js";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { ClientWalletProvider as WalletProvider } from './WalletProvider'

const SOLANA_NETWORK = WalletAdapterNetwork.Devnet;
const network = SOLANA_NETWORK;

export const Wallets = ({ children }) => {
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);
  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider autoConnect>
        {children}
      </WalletProvider>
    </ConnectionProvider>
  );
};
