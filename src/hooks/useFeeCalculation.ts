import { useState, useEffect } from "react";

interface FeeCalculationParams {
  tokenAddress: string;
  transferAmount: string;
  tokenDecimals: number;
}

interface FeeBreakdown {
  gasCostUsd: number;
  gasCostTokenUnits: string;
  percentageFeeUsd: number;
  percentageFeeTokenUnits: string;
  totalFeeUsd: number;
  totalFeeTokenUnits: string;
}

interface FeeCalculationResponse {
  success: boolean;
  error?: string;
  feeBreakdown?: FeeBreakdown;
}

interface DisplayData {
  transferAmount: {
    tokens: string;
    usd: string;
  };
  gasCost: {
    tokens: string;
    usd: string;
  };
  percentageFee: {
    tokens: string;
    usd: string;
  };
  totalFee: {
    tokens: string;
    usd: string;
  };
  netAmount: {
    tokens: string;
    usd: string;
  };
  ethPrice: string;
  gasInfo: {
    gasLimit: string;
    gasPrice: string;
    gasCostEth: string;
  };
}

export function useFeeBreakdownDisplay(params: FeeCalculationParams | null) {
  const [data, setData] = useState<FeeCalculationResponse | null>(null);
  const [displayData, setDisplayData] = useState<DisplayData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [dataUpdatedAt, setDataUpdatedAt] = useState<number | null>(null);

  const fetchFeeCalculation = async () => {
    if (!params) return;

    setIsFetching(true);
    try {
      const response = await fetch("/api/calculate-fee", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
      });

      const result: FeeCalculationResponse = await response.json();

      if (result.success && result.feeBreakdown) {
        setData(result);
        
        // Calculate display data
        const transferAmount = BigInt(params.transferAmount);
        const totalFee = BigInt(result.feeBreakdown.totalFeeTokenUnits);
        const netAmount = transferAmount - totalFee;

        const display: DisplayData = {
          transferAmount: {
            tokens: formatTokenAmount(params.transferAmount, params.tokenDecimals),
            usd: formatUSD(result.feeBreakdown.gasCostUsd + (Number(params.transferAmount) / Math.pow(10, params.tokenDecimals))),
          },
          gasCost: {
            tokens: formatTokenAmount(result.feeBreakdown.gasCostTokenUnits, params.tokenDecimals),
            usd: formatUSD(result.feeBreakdown.gasCostUsd),
          },
          percentageFee: {
            tokens: formatTokenAmount(result.feeBreakdown.percentageFeeTokenUnits, params.tokenDecimals),
            usd: formatUSD(result.feeBreakdown.percentageFeeUsd),
          },
          totalFee: {
            tokens: formatTokenAmount(result.feeBreakdown.totalFeeTokenUnits, params.tokenDecimals),
            usd: formatUSD(result.feeBreakdown.totalFeeUsd),
          },
          netAmount: {
            tokens: formatTokenAmount(netAmount.toString(), params.tokenDecimals),
            usd: formatUSD(result.feeBreakdown.gasCostUsd + (Number(netAmount) / Math.pow(10, params.tokenDecimals))),
          },
          ethPrice: formatUSD(3000), // Placeholder - should come from API
          gasInfo: {
            gasLimit: "150000",
            gasPrice: "20 Gwei",
            gasCostEth: "0.003 ETH",
          },
        };

        setDisplayData(display);
        setDataUpdatedAt(Date.now());
      } else {
        setError(new Error(result.error || "Failed to calculate fees"));
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to calculate fees"));
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    if (params) {
      setIsLoading(true);
      fetchFeeCalculation().finally(() => setIsLoading(false));
    }
  }, [params?.tokenAddress, params?.transferAmount, params?.tokenDecimals]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!params) return;

    const interval = setInterval(() => {
      fetchFeeCalculation();
    }, 30000);

    return () => clearInterval(interval);
  }, [params]);

  return {
    data,
    displayData,
    isLoading,
    error,
    isFetching,
    dataUpdatedAt,
    refetch: fetchFeeCalculation,
  };
}

function formatTokenAmount(amount: string, decimals: number): string {
  const num = Number(amount) / Math.pow(10, decimals);
  return num.toFixed(6);
}

function formatUSD(amount: number): string {
  return `$${amount.toFixed(2)}`;
} 