"use client";

import { useState, useEffect } from "react";
import { useAccount, useSignTypedData } from "wagmi";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Wallet, Send, ArrowDown } from "lucide-react";
import { RecaptchaWrapper } from "./RecaptchaWrapper";
import { TransactionStatus } from "./TransactionStatus";
import { createEIP712TypedData, getDeadline } from "@/lib/eip712-utils";
import { formatAmount, parseAmount } from "@/lib/utils";
import { useContractData, useUserData } from "@/hooks/useContractData";
import { useRelayTransaction } from "@/hooks/useRelayTransaction";
import { MetaTransfer } from "@/lib/schemas";

interface TransferFormProps {
  onSuccess?: (txHash: string) => void;
}

export function TransferForm({ onSuccess }: TransferFormProps) {
  const { address } = useAccount();
  const { signTypedDataAsync } = useSignTypedData();

  // Available networks and coins (this will be fetched from contract later)
  const networks = [{ value: "sepolia", label: "Sepolia" }];

  const coins = [
    {
      value: "0x1234567890123456789012345678901234567890",
      label: "USDT",
      symbol: "USDT",
      name: "Tether USD",
      decimals: 6,
    },
  ];

  const [walletAddress, setWalletAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [network, setNetwork] = useState("");
  const [coin] = useState(coins[0].value); // Auto-select first coin
  const [isValidAddress, setIsValidAddress] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [txHash, setTxHash] = useState<string>("");
  const [error, setError] = useState<string>("");

  const { data: contractData } = useContractData();
  const { data: userData } = useUserData(address);
  const { relayTransaction } = useRelayTransaction();

  const selectedCoin = coins.find((c) => c.value === coin) || coins[0];
  const fee = "0.001";

  // Simple ETH address validation (starts with 0x and is 42 characters long)
  const validateEthAddress = (address: string) => {
    const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
    return ethAddressRegex.test(address);
  };

  useEffect(() => {
    const isValid = validateEthAddress(walletAddress);
    setIsValidAddress(isValid);

    if (isValid && !isExpanded) {
      setTimeout(() => setIsExpanded(true), 300);
    } else if (!isValid && isExpanded) {
      setIsExpanded(false);
    }
  }, [walletAddress, isExpanded]);

  const handleSend = async () => {
    if (!address || !selectedCoin || !recaptchaToken) return;

    setIsSubmitting(true);
    setError("");

    try {
      const metaTransfer: MetaTransfer = {
        owner: address,
        token: selectedCoin.value,
        recipient: walletAddress,
        amount: parseAmount(amount, selectedCoin.decimals),
        fee: parseAmount(fee, selectedCoin.decimals),
        deadline: getDeadline(10),
        nonce: userData?.nonce || "0",
      };

      const typedData = createEIP712TypedData(metaTransfer);

      const signature = await signTypedDataAsync({
        domain: typedData.domain,
        types: typedData.types,
        primaryType: typedData.primaryType,
        message: typedData.message,
      });

      const permitData = {
        value: (
          BigInt(metaTransfer.amount) + BigInt(metaTransfer.fee)
        ).toString(),
        deadline: metaTransfer.deadline,
        v: 27,
        r: "0x" + "0".repeat(64),
        s: "0x" + "0".repeat(64),
      };

      const result = await relayTransaction({
        metaTransfer,
        permitData,
        signature,
        recaptchaToken,
      });

      if (result.success && result.txHash) {
        setTxHash(result.txHash);
        onSuccess?.(result.txHash);
        setWalletAddress("");
        setAmount("");
        setNetwork("");
        setRecaptchaToken("");
        setIsValidAddress(false);
        setIsExpanded(false);
      } else {
        setError(result.error || "Transaction failed");
      }
    } catch (err: any) {
      setError(err.message || "Failed to submit transaction");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (txHash) {
    return <TransactionStatus txHash={txHash} onReset={() => setTxHash("")} />;
  }

  // Get isDark from document class or default to true
  const isDark =
    typeof window !== "undefined"
      ? document.documentElement.classList.contains("dark")
      : true;

  const addressInputClass = `px-6 py-6 rounded-full border-0 text-base transition-all duration-300 ${
    isDark
      ? "bg-gray-800 text-white placeholder:text-gray-400"
      : "bg-gray-100 text-gray-900 placeholder:text-gray-500"
  }`;

  const inputBaseClass = `px-4 py-3 rounded-full border-0 text-base transition-all duration-300 ${
    isDark
      ? "bg-gray-800 text-white placeholder:text-gray-400"
      : "bg-gray-100 text-gray-900 placeholder:text-gray-500"
  }`;

  const selectBaseClass = `rounded-full border-0 ${
    isDark ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-900"
  }`;

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Main wallet address input */}
      <div className="relative mb-4">
        <div className="absolute left-6 top-1/2 transform -translate-y-1/2 z-10">
          <Wallet className="w-5 h-5 text-gray-500" />
        </div>
        <Input
          type="text"
          placeholder="Enter wallet address (0x...)"
          value={walletAddress}
          onChange={(e) => setWalletAddress(e.target.value)}
          className={`${addressInputClass} pl-14 ${
            isValidAddress ? "ring-2 ring-green-400" : ""
          }`}
        />
        {isValidAddress && (
          <div className="absolute right-6 top-1/2 transform -translate-y-1/2">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
          </div>
        )}
      </div>

      {/* Expanded form fields */}
      <div
        className={`transition-all duration-500 ease-in-out overflow-hidden ${
          isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        {isExpanded && (
          <div className="space-y-3 animate-fade-in">
            {/* Network and Amount Row */}
            <div className="flex gap-3">
              <div className="flex-1">
                <select
                  value={network}
                  onChange={(e) => setNetwork(e.target.value)}
                  className={`${selectBaseClass} h-10 w-full px-4 appearance-none text-sm`}
                >
                  <option value="" disabled>
                    Network
                  </option>
                  {networks.map((net) => (
                    <option key={net.value} value={net.value}>
                      {net.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1 relative">
                <Input
                  type="number"
                  placeholder="Amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className={`${inputBaseClass} pr-16 text-sm font-medium h-10`}
                  step="0.000001"
                  min="0"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1.5">
                  <div className="w-4 h-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">
                      {selectedCoin.symbol.charAt(0)}
                    </span>
                  </div>
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                    {selectedCoin.symbol}
                  </span>
                </div>
              </div>
            </div>

            {/* reCAPTCHA */}
            {/* <RecaptchaWrapper
              onVerify={setRecaptchaToken}
              onError={() => setRecaptchaToken("")}
            /> */}

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-800 rounded-2xl">
                <p className="text-red-800 dark:text-red-200 text-sm">
                  {error}
                </p>
              </div>
            )}

            {/* Send Button */}
            <Button
              onClick={handleSend}
              disabled={
                !walletAddress ||
                !amount ||
                !network ||
                !recaptchaToken ||
                isSubmitting
              }
              className={`w-full py-3 rounded-full font-medium text-base transition-all duration-300 hover:scale-105 disabled:scale-100 disabled:opacity-50 ${
                isDark
                  ? "bg-gray-900 text-white hover:bg-gray-800 disabled:bg-gray-700"
                  : "bg-gray-100 text-gray-900 hover:bg-white disabled:bg-gray-300"
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Transaction
                </>
              )}
            </Button>

            {/* Transaction details preview */}
            {amount && network && (
              <div
                className={`mt-4 p-4 rounded-2xl text-sm transition-all duration-300 ${
                  isDark
                    ? "bg-gray-800 text-gray-300"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                <div className="flex justify-between items-center mb-2">
                  <span>Network:</span>
                  <span className="font-medium capitalize">
                    {networks.find((n) => n.value === network)?.label}
                  </span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span>Asset:</span>
                  <span className="font-medium uppercase">
                    {selectedCoin.symbol}
                  </span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span>Amount:</span>
                  <span className="font-medium">
                    {amount} {selectedCoin.symbol}
                  </span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span>Network Fee:</span>
                  <span className="font-medium">
                    {fee} {selectedCoin.symbol}
                  </span>
                </div>
                <div className="border-t border-gray-200 dark:border-gray-700 pt-2">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Total:</span>
                    <span className="font-semibold">
                      {(parseFloat(amount) + parseFloat(fee)).toFixed(6)}{" "}
                      {selectedCoin.symbol}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Visual indicator for expansion */}
      {isValidAddress && (
        <div className="flex justify-center mt-4">
          <ArrowDown
            className={`w-4 h-4 transition-transform duration-300 ${
              isExpanded ? "rotate-180" : ""
            } ${isDark ? "text-gray-400" : "text-gray-600"}`}
          />
        </div>
      )}
    </div>
  );
}
