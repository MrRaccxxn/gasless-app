"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatAmount } from "@/lib/utils";

interface Token {
  address: string
  symbol: string
  decimals: number
  name: string
}

interface TokenSelectorProps {
  selectedToken: Token | null
  onTokenSelect: (token: Token) => void
  userAddress?: string
}

// Mock token list - in a real app, you'd fetch this from the API
const MOCK_TOKENS: Token[] = [
  {
    address: "0x779877A7B0D9E8603169DdbD7836e478b4624789",
    symbol: "LINK",
    decimals: 18,
    name: "Chainlink Token",
  },
  {
    address: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
    symbol: "UNI",
    decimals: 18,
    name: "Uniswap",
  },
  {
    address: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
    symbol: "WBTC",
    decimals: 8,
    name: "Wrapped BTC",
  },
];

export function TokenSelector({ selectedToken, onTokenSelect, userAddress }: TokenSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [tokenBalances, setTokenBalances] = useState<Record<string, string>>({});

  const filteredTokens = MOCK_TOKENS.filter(token =>
    token.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
    token.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Fetch token balances
  useEffect(() => {
    if (!userAddress) return;

    const fetchBalances = async () => {
      const balances: Record<string, string> = {};

      for (const token of MOCK_TOKENS) {
        try {
          const response = await fetch(`/api/token/${token.address}?user=${userAddress}`);
          const data = await response.json();

          if (data.success && data.data.userBalance) {
            balances[token.address] = data.data.userBalance;
          }
        } catch (error) {
          console.error("Error fetching token balance:", error);
        }
      }

      setTokenBalances(balances);
    };

    fetchBalances();
  }, [userAddress]);

  const handleTokenSelect = (token: Token) => {
    onTokenSelect(token);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <label className="text-sm font-medium text-gray-700 mb-1 block">
        Token
      </label>

      <Button
        type="button"
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full justify-between"
      >
        {selectedToken ? (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-xs font-medium">{selectedToken.symbol[0]}</span>
            </div>
            <span>{selectedToken.symbol}</span>
          </div>
        ) : (
          <span>Select a token</span>
        )}

        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </Button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto">
          <div className="p-2 border-b border-gray-200">
            <Input
              placeholder="Search tokens..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>

          <div className="py-1">
            {filteredTokens.map((token) => {
              const balance = tokenBalances[token.address];
              const formattedBalance = balance ? formatAmount(balance, token.decimals) : "0";

              return (
                <button
                  key={token.address}
                  onClick={() => handleTokenSelect(token)}
                  className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium">{token.symbol[0]}</span>
                    </div>
                    <div>
                      <div className="font-medium">{token.symbol}</div>
                      <div className="text-xs text-gray-500">{token.name}</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-medium">{formattedBalance}</div>
                    <div className="text-xs text-gray-500">Balance</div>
                  </div>
                </button>
              );
            })}

            {filteredTokens.length === 0 && (
              <div className="px-3 py-2 text-center text-gray-500">
                No tokens found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
