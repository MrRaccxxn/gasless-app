"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";
import { Button } from "./ui/button";
import { useEffect, useState } from "react";

export function WalletConnection() {
  const { address, isConnected, chain } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isWrongNetwork = chain?.id !== 11155111; // Sepolia

  if (!mounted) {
    return (
      <div className="flex flex-col gap-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Connect Your Wallet</h3>
          <p className="text-gray-600 text-sm">
            Connect your wallet to send tokens without gas fees
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <Button disabled variant="outline" className="justify-start">
            Loading...
          </Button>
        </div>
      </div>
    );
  }

  if (isConnected && address) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex flex-col">
            <span className="text-sm font-medium">Connected to {chain?.name}</span>
            <span className="text-xs text-gray-500 font-mono">
              {address.slice(0, 6)}...{address.slice(-4)}
            </span>
          </div>
          <Button
            onClick={() => disconnect()}
            variant="outline"
            size="sm"
          >
            Disconnect
          </Button>
        </div>

        {isWrongNetwork && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm font-medium">
              Wrong Network
            </p>
            <p className="text-red-600 text-sm">
              Please switch to Sepolia testnet to continue
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Connect Your Wallet</h3>
        <p className="text-gray-600 text-sm">
          Connect your wallet to send tokens without gas fees
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {connectors.map((connector) => (
          <Button
            key={connector.uid}
            onClick={() => connect({ connector })}
            disabled={isPending}
            variant="outline"
            className="justify-start"
          >
            {isPending ? "Connecting..." : `Connect ${connector.name}`}
          </Button>
        ))}
      </div>
    </div>
  );
}
