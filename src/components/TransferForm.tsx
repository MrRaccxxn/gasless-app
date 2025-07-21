"use client";

import { useState, useEffect } from "react";
import { useAccount, useSignTypedData, useReadContract, useChainId } from "wagmi";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Wallet, Send, ArrowDown, Check } from "lucide-react";
import { TransactionStatus } from "./TransactionStatus";
import { FeeBreakdown } from "./FeeBreakdown";
import { createEIP712TypedData, createPermitTypedData, getDeadline } from "@/lib/eip712-utils";
import { parseAmount } from "@/lib/utils";
import { useContractData, useUserData } from "@/hooks/useContractData";
import { useRelayTransaction } from "@/hooks/useRelayTransaction";
import { MetaTransfer } from "@/lib/schemas";
import { alertUtils } from "@/lib/alert-store";
import { coins } from "@/lib/coins";

interface TransferFormProps {
  onSuccess?: (txHash: string) => void;
}

export function TransferForm({ onSuccess }: TransferFormProps) {
  const { address } = useAccount();
  const { signTypedDataAsync } = useSignTypedData();

  // Available networks and coins (this will be fetched from contract later)
  const networks = [{ value: "sepolia", label: "Sepolia" }];

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

  const { data: _contractData } = useContractData();
  const { data: userData } = useUserData(address);
  const { relayTransactionAsync } = useRelayTransaction();
  const chainId = useChainId();

  const selectedCoin = coins.find((c) => c.value === coin) || coins[0];

  // Read permit nonce from USDC contract
  const { data: permitNonce } = useReadContract({
    address: selectedCoin.value as `0x${string}`,
    abi: [
      {
        name: 'nonces',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'owner', type: 'address' }],
        outputs: [{ name: '', type: 'uint256' }],
      },
    ],
    functionName: 'nonces',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  const fee = "0.001";

  // Simple ETH address validation (starts with 0x and is 42 characters long)
  const validateEthAddress = (addr: string) => {
    const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
    return ethAddressRegex.test(addr);
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
    if (!address || !selectedCoin) return;

    // Submit gasless transaction with EIP-2612 permit signatures
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

      console.log(
        "metaTransfer value",
        BigInt(metaTransfer.amount) + BigInt(metaTransfer.fee),
      );

      // Generate real EIP-2612 permit signature
      console.log("Generating EIP-2612 permit signature for gasless transaction");

      // Get current permit nonce for this user
      const currentPermitNonce = permitNonce?.toString() || "0";
      const permitValue = (BigInt(metaTransfer.amount) + BigInt(metaTransfer.fee)).toString();
      const permitDeadline = getDeadline(60); // 1 hour deadline for permit
      
      // Create permit typed data
      const permitTypedData = createPermitTypedData(
        selectedCoin.value, // token address
        address, // owner
        process.env.NEXT_PUBLIC_RELAYER_CONTRACT || "", // spender (relayer contract)
        permitValue, // permit amount (transfer + fee)
        currentPermitNonce, // permit nonce
        permitDeadline, // permit deadline
        chainId, // chain ID
        selectedCoin.name, // token name ("USDC")
        "2" // token version
      );

      // Sign the permit
      const permitSignature = await signTypedDataAsync({
        domain: permitTypedData.domain,
        types: permitTypedData.types,
        primaryType: permitTypedData.primaryType,
        message: permitTypedData.message,
      });

      // Split permit signature
      const permitSig = permitSignature.slice(2); // Remove 0x
      const r = "0x" + permitSig.slice(0, 64);
      const s = "0x" + permitSig.slice(64, 128);
      const v = parseInt(permitSig.slice(128, 130), 16);

      const permitData = {
        value: permitValue,
        deadline: permitDeadline,
        v,
        r,
        s,
      };

      console.log("Permit data:", permitData);
      console.log("MetaTransfer being sent:", metaTransfer);
      console.log("Permit nonce used:", currentPermitNonce);
      console.log("Permit value (amount + fee):", permitValue);
      console.log("Transaction uses gasless permit signatures - no pre-approval needed!");

      const result = await relayTransactionAsync({
        metaTransfer,
        permitData,
        signature,
        // recaptchaToken,
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
        const errorMessage = result.error || "Transaction failed";
        // Add helpful guidance for common errors
        if (errorMessage.includes("PermitFailed")) {
          setError("Permit signature failed. This may be due to an invalid signature or expired deadline. Please try again.");
        } else if (errorMessage.includes("Insufficient")) {
          setError("Insufficient token balance. Please ensure you have enough USDC tokens to cover the transfer amount and fee.");
        } else if (errorMessage.includes("deadline")) {
          setError("Transaction deadline expired. Please try again with a new transaction.");
        } else {
          setError(errorMessage);
        }
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage || "Failed to submit transaction");
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
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
            <Check className="ml-2 w-4 h-4 text-green-400" />
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
                <Select value={network} onValueChange={setNetwork}>
                  <SelectTrigger
                    className={`${selectBaseClass} h-10 w-full px-4 text-sm rounded-full border-0 shadow-none`}
                  >
                    <SelectValue placeholder="Network" />
                  </SelectTrigger>
                  <SelectContent>
                    {networks.map((net) => (
                      <SelectItem key={net.value} value={net.value}>
                        {net.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                // !recaptchaToken ||
                isSubmitting
              }
              className={`w-full py-3 rounded-full font-medium text-base transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-50 hover:cursor-pointer border ${
                isDark
                  ? "bg-gray-900 text-white hover:bg-gray-800 border-gray-700 hover:border-gray-600 hover:shadow-gray-900/30 disabled:bg-gray-700 disabled:border-gray-600"
                  : "bg-gray-100 text-gray-900 hover:bg-gray-50 border-gray-200 hover:border-gray-300 hover:shadow-gray-200/40 disabled:bg-gray-300 disabled:border-gray-300"
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

            {/* Fee Breakdown */}
            {amount && network && (
              <FeeBreakdown
                tokenAddress={selectedCoin.value}
                transferAmount={parseAmount(amount, selectedCoin.decimals).toString()}
                tokenDecimals={selectedCoin.decimals}
                tokenSymbol={selectedCoin.symbol}
                isHidden={!isExpanded}
              />
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
