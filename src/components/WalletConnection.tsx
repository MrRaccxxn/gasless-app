"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";
import { Button } from "@/components/ui/button";
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

  // Filter to only show MetaMask connector
  const metaMaskConnector = connectors.find((connector) =>
    connector.name.toLowerCase().includes("metamask"),
  );

  if (!mounted) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex justify-center">
          <Button
            disabled
            className="w-full max-w-sm h-14 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-xl border-2 border-orange-300 shadow-lg hover:cursor-pointer"
          >
            Loading...
          </Button>
        </div>
      </div>
    );
  }

  if (isConnected && address) {
    return (
      <div className="flex flex-col gap-6">
        <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border-2 border-green-200 dark:border-green-700 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-lg font-semibold text-green-800 dark:text-green-200">
                Connected to {chain?.name}
              </span>
              <span className="text-sm text-green-600 dark:text-green-400 font-mono mt-1">
                {address.slice(0, 6)}...{address.slice(-4)}
              </span>
            </div>
            <Button
              onClick={() => disconnect()}
              variant="outline"
              size="sm"
              className="border-2 border-red-200 hover:border-red-300 hover:bg-red-50 dark:border-red-700 dark:hover:border-red-600 dark:hover:bg-red-900/20 font-medium"
            >
              Disconnect
            </Button>
          </div>
        </div>

        {isWrongNetwork && (
          <div className="p-6 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-2 border-red-300 dark:border-red-600 rounded-xl shadow-lg">
            <p className="text-red-800 dark:text-red-200 text-lg font-bold">
              Wrong Network
            </p>
            <p className="text-red-600 dark:text-red-400 mt-2">
              Please switch to Sepolia testnet to continue
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-center">
        {metaMaskConnector && (
          <Button
            onClick={() => connect({ connector: metaMaskConnector })}
            disabled={isPending}
            className="w-full max-w-sm h-14 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold text-lg rounded-xl border-2 border-orange-300 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-3"
          >
            <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
              <span className="text-orange-500 font-bold text-sm">M</span>
            </div>
            {isPending ? "Connecting..." : "Connect MetaMask"}
          </Button>
        )}

        {!metaMaskConnector && (
          <div className="text-center p-6 bg-gray-50 dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-600">
            <p className="text-gray-600 dark:text-gray-400">
              MetaMask not detected. Please install MetaMask to continue.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
