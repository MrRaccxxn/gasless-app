"use client";

import { useState, useEffect } from "react";
import { useAccount, useSwitchChain } from "wagmi";
import { Moon, Sun, Power, AlertTriangle } from "lucide-react";
import { WalletConnection } from "@/components/WalletConnection";
import { TransferForm } from "@/components/TransferForm";
import { WalletInfo } from "@/components/WalletInfo";
import { useContractData } from "@/hooks/useContractData";
import { AnimatedNetworkText } from "@/components/AnimatedNetworkText";
import { Button } from "@/components/ui/button";

export default function Home() {
  const { isConnected, chain } = useAccount();
  const { switchChain } = useSwitchChain();
  const { data: contractData, error } = useContractData();
  const [mounted, setMounted] = useState(false);
  const [_walletAddress] = useState("");
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle("dark");
  };

  const isWrongNetwork = chain?.id !== 11155111; // Sepolia

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div
        className={`min-h-screen w-full p-12 transition-all duration-500 ${
          isDark
            ? "bg-gray-900 text-gray-100 dot-pattern-dark"
            : "bg-gray-100 text-gray-900 dot-pattern-light"
        }`}
      >
        {/* Header with theme toggle */}
        <div className="flex justify-center items-center mb-12">
          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                isDark ? "bg-gray-900 text-white" : "bg-gray-200 text-gray-900"
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
        {!isConnected && (
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-8">
              <div className="w-2 h-2 bg-current rounded-full animate-pulse"></div>
              <span className="text-sm font-medium tracking-wide">
                Gasless App
              </span>
            </div>
          </div>
        )}

        {/* Wallet Info */}
        {mounted && isConnected && (
          <div
            className="m-6 text-center animate-fade-in"
            style={{ animationDelay: "1.6s" }}
          >
            <WalletInfo isDark={isDark} />
          </div>
        )}

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
                The gasless relayer is currently paused. Please try again later.
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
            Send ERC-20 tokens on <AnimatedNetworkText /> without needing ETH
            for gas.
          </p>
          <p
            className="text-lg text-gray-600 dark:text-gray-400 animate-fade-in"
            style={{ animationDelay: "0.4s" }}
          >
            Just sign the transaction and our relayer handles the rest!
          </p>
        </div>

        {/* Network Warning */}
        {mounted && isConnected && isWrongNetwork && (
          <div className="max-w-lg mx-auto mb-8 animate-fade-in">
            <div className="p-6 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-2 border-orange-300 dark:border-orange-600 rounded-xl shadow-lg">
              <div className="flex items-start gap-4">
                <AlertTriangle className="w-6 h-6 text-orange-600 dark:text-orange-400 mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-orange-800 dark:text-orange-200 mb-2">
                    Wrong Network Detected
                  </h3>
                  <p className="text-orange-700 dark:text-orange-300 text-sm mb-4">
                    You&apos;re currently connected to <strong>{chain?.name || "Unknown Network"}</strong>, but this project runs on the <strong>Sepolia testnet</strong>.
                    This is a test environment for development and testing purposes.
                  </p>
                  <div className="flex">
                    <Button
                      onClick={() => switchChain({ chainId: 11155111 })}
                      className="bg-orange-600 hover:bg-orange-700 text-white font-medium"
                    >
                      Switch to Sepolia
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Wallet Connection or Address Input */}
        {mounted && (
          <>
            {!isConnected ? (
              <div className="max-w-lg mx-auto mb-8">
                <WalletConnection />
              </div>
            ) : (
              <div className="max-w-lg mx-auto mb-8">
                {isConnected && !isWrongNetwork && !contractData?.isPaused && (
                  <TransferForm />
                )}
              </div>
            )}
          </>
        )}

        {/* Trust Indicators */}
        <div
          className="flex items-center justify-center gap-2 mb-8 animate-fade-in"
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

        {/* Footer */}
        <div className="pt-8 flex justify-center items-center gap-12 animate-fade-in" style={{ animationDelay: "1s" }}>
          <a
            href="https://github.com/MrRaccxxn/gasless-app"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors duration-200"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            <span className="text-sm font-medium">GitHub</span>
          </a>

          <a
            href="https://x.com/buildraccoon"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors duration-200"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
            <span className="text-sm font-medium">Twitter</span>
          </a>
        </div>
      </div>
    </div>
  );
}
