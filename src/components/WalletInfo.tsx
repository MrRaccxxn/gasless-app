"use client";

import { useAccount, useDisconnect } from "wagmi";
import { LogOut, Copy, Check } from "lucide-react";
import { useState } from "react";

interface WalletInfoProps {
  isDark?: boolean;
}

export function WalletInfo({ isDark = true }: WalletInfoProps) {
  const { address, connector } = useAccount();
  const { disconnect } = useDisconnect();
  const [copied, setCopied] = useState(false);

  if (!address) return null;

  const handleCopy = async () => {
    if (!address) return;

    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy address:", err);
    }
  };

  const handleDisconnect = () => {
    disconnect();
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div className="flex items-center justify-center gap-3 animate-fade-in">
      {/* Wallet Address Display */}
      <div
        className={`group flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 hover:scale-105 cursor-pointer ${
          isDark
            ? "bg-gray-800 hover:bg-gray-700 text-gray-100"
            : "bg-gray-100 hover:bg-gray-200 text-gray-900"
        }`}
        onClick={handleCopy}
      >
        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
        <span className="font-mono text-sm font-medium">
          {formatAddress(address)}
        </span>
        <button className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {copied ? (
            <Check className="w-4 h-4 text-green-400" />
          ) : (
            <Copy className="w-4 h-4 text-gray-400 hover:text-gray-300" />
          )}
        </button>
      </div>

      <LogOut
        onClick={handleDisconnect}
        className="cursor-pointer w-3 h-3 group-hover:rotate-12 transition-transform duration-200"
      />
    </div>
  );
}
