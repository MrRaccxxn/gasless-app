"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { Moon, Sun, Power } from "lucide-react";
import { WalletConnection } from "@/components/WalletConnection";
import { TransferForm } from "@/components/TransferForm";
import { useContractData } from "@/hooks/useContractData";
import { AnimatedNetworkText } from "@/components/AnimatedNetworkText";

export default function Home() {
  const { isConnected, chain, address } = useAccount();
  const { data: contractData, error } = useContractData();
  const [mounted, setMounted] = useState(false);
  const [_walletAddress] = useState("");
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle("dark");
  };

  const isWrongNetwork = chain?.id !== 11155111; // Sepolia

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        isDark ? "bg-black" : "bg-white"
      }`}
    >
      {/* Main Container */}
      <div className="flex items-center justify-center min-h-screen">
        <div
          className={`min-h-screen w-full p-12 transition-all duration-500 ${
            isDark ? "bg-gray-100 text-gray-900" : "bg-gray-900 text-gray-100"
          }`}
        >
          {/* Header with theme toggle */}
          <div className="flex justify-center items-center mb-12">
            <div className="flex items-center gap-4">
              <button
                onClick={toggleTheme}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isDark
                    ? "bg-gray-900 text-white"
                    : "bg-gray-200 text-gray-900"
                }`}
              >
                <Power className="w-5 h-5" />
              </button>

              <button
                onClick={toggleTheme}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                  !isDark
                    ? "bg-gray-200 text-gray-900"
                    : "bg-gray-300 text-gray-600"
                }`}
              >
                {isDark ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Brand */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-8">
              <div className="w-2 h-2 bg-current rounded-full animate-pulse"></div>
              <span className="text-sm font-medium tracking-wide">
                Gasless Protocol
              </span>
            </div>
          </div>

          {error && (
            <div className="mb-8 flex justify-center">
              <div className="p-4 bg-red-100 dark:bg-red-900 rounded-lg max-w-md">
                <p className="text-red-800 dark:text-red-200 text-sm font-medium">
                  Failed to load contract data
                </p>
                <p className="text-red-600 dark:text-red-400 text-sm">
                  {error.message}
                </p>
              </div>
            </div>
          )}

          {contractData?.isPaused && (
            <div className="mb-8 flex justify-center">
              <div className="p-4 bg-yellow-100 dark:bg-yellow-900 rounded-lg max-w-md">
                <p className="text-yellow-800 dark:text-yellow-200 text-sm font-medium">
                  Service Temporarily Unavailable
                </p>
                <p className="text-yellow-600 dark:text-yellow-400 text-sm">
                  The gasless relayer is currently paused. Please try again
                  later.
                </p>
              </div>
            </div>
          )}

          {/* Main Heading */}
          <div className="text-center mb-8">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 animate-fade-in">
              Gasless Token
              <br />
              <span className="relative inline-block overflow-hidden group cursor-default">
                <span className="relative z-10 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent group-hover:from-purple-500 group-hover:via-pink-500 group-hover:to-purple-500 transition-all duration-300">
                  Transfers
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/70 dark:via-white/50 to-transparent animate-shimmer group-hover:via-white/90 dark:group-hover:via-white/70 transition-all duration-300"></div>
              </span>
            </h1>

            <p
              className="text-lg text-gray-600 dark:text-gray-400 mb-2 animate-fade-in"
              style={{ animationDelay: "0.2s" }}
            >
              Send ERC-20 tokens on <AnimatedNetworkText /> without needing ETH for gas.
            </p>
            <p
              className="text-lg text-gray-600 dark:text-gray-400 animate-fade-in"
              style={{ animationDelay: "0.4s" }}
            >
              Just sign the transaction and our relayer handles the rest!
            </p>
          </div>

          {/* Wallet Connection or Address Input */}
          {mounted && (
            <>
              {!isConnected ? (
                <div className="max-w-lg mx-auto mb-8">
                  <WalletConnection />
                </div>
              ) : (
                <div className="max-w-lg mx-auto mb-8">
                  {isConnected &&
                    !isWrongNetwork &&
                    !contractData?.isPaused && (
                    <TransferForm />
                  )}
                </div>
              )}
            </>
          )}

          {/* Trust Indicators */}
          <div
            className="flex items-center justify-center gap-2 mb-16 animate-fade-in"
            style={{ animationDelay: "0.8s" }}
          >
            <div className="flex -space-x-2">
              <div className="w-8 h-8 rounded-full bg-blue-400 border-2 border-white"></div>
              <div className="w-8 h-8 rounded-full bg-green-400 border-2 border-white"></div>
              <div className="w-8 h-8 rounded-full bg-purple-400 border-2 border-white"></div>
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
              Trusted by 500+ users across multiple networks
            </span>
          </div>

          {/* Contract Info */}
          {contractData && (
            <div
              className="mt-12 text-center animate-fade-in"
              style={{ animationDelay: "1.6s" }}
            >
              <div
                className={`inline-block px-6 py-3 rounded-full text-sm ${
                  isDark
                    ? "bg-gray-900 text-gray-100"
                    : "bg-gray-800 text-gray-100"
                }`}
              >
                <span className="font-mono">
                  {contractData.contractAddress.slice(0, 8)}...
                  {contractData.contractAddress.slice(-6)}
                </span>
                <span className="ml-2">•</span>
                <span
                  className={`ml-2 ${
                    contractData.isPaused ? "text-red-400" : "text-green-400"
                  }`}
                >
                  {contractData.isPaused ? "Paused" : "Active"}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
