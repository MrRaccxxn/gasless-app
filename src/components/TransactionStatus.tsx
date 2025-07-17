"use client";

import { useState, useEffect } from "react";
import { Button } from "./ui/button";

interface TransactionStatusProps {
  txHash: string;
  onReset: () => void;
}

interface TransactionData {
  hash: string;
  status: "pending" | "confirmed" | "failed";
  blockNumber?: number;
  gasUsed?: string;
  confirmations?: number;
}

export function TransactionStatus({ txHash, onReset }: TransactionStatusProps) {
  const [txData, setTxData] = useState<TransactionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const fetchTransactionStatus = async () => {
      try {
        const response = await fetch(`/api/tx/${txHash}`);
        const data = await response.json();

        if (data.success && data.data) {
          setTxData(data.data);
        } else {
          setError(data.error || "Failed to fetch transaction status");
        }
      } catch (_err) {
        console.log(_err);
        setError(`Failed to fetch transaction status`);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactionStatus();

    // Poll for updates if transaction is pending
    const interval = setInterval(() => {
      if (txData?.status === "pending") {
        fetchTransactionStatus();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [txHash, txData?.status]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "text-green-600 bg-green-50";
      case "failed":
        return "text-red-600 bg-red-50";
      default:
        return "text-yellow-600 bg-yellow-50";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "confirmed":
        return "Confirmed";
      case "failed":
        return "Failed";
      default:
        return "Pending";
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading transaction status...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-4">{error}</div>
        <Button onClick={onReset} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  if (!txData) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-600 mb-4">No transaction data found</div>
        <Button onClick={onReset} variant="outline">
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div
          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
            txData.status,
          )}`}
        >
          {txData.status === "pending" && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
          )}
          {getStatusText(txData.status)}
        </div>

        <h3 className="text-lg font-semibold mt-4 mb-2">
          {txData.status === "confirmed"
            ? "Transaction Confirmed!"
            : txData.status === "failed"
              ? "Transaction Failed"
              : "Transaction Submitted"}
        </h3>

        <p className="text-gray-600 text-sm">
          {txData.status === "confirmed"
            ? "Your gasless transfer has been completed successfully."
            : txData.status === "failed"
              ? "Your transaction failed. Please try again."
              : "Your transaction is being processed on the blockchain."}
        </p>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">
            Transaction Hash
          </span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-mono text-gray-600">
              {txData.hash.slice(0, 10)}...{txData.hash.slice(-8)}
            </span>
            <button
              onClick={() => navigator.clipboard.writeText(txData.hash)}
              className="text-blue-600 hover:text-blue-800"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </button>
          </div>
        </div>

        {txData.blockNumber && (
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">
              Block Number
            </span>
            <span className="text-sm text-gray-600">{txData.blockNumber}</span>
          </div>
        )}

        {txData.confirmations && (
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">
              Confirmations
            </span>
            <span className="text-sm text-gray-600">
              {txData.confirmations}
            </span>
          </div>
        )}

        {txData.gasUsed && (
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Gas Used</span>
            <span className="text-sm text-gray-600">
              {parseInt(txData.gasUsed).toLocaleString()}
            </span>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <Button onClick={onReset} variant="outline" className="flex-1">
          Send Another
        </Button>

        <Button
          onClick={() =>
            window.open(
              `https://sepolia.etherscan.io/tx/${txData.hash}`,
              "_blank",
            )
          }
          className="flex-1"
        >
          View on Etherscan
        </Button>
      </div>
    </div>
  );
}
