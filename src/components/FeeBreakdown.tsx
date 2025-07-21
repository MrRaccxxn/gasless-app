"use client";

import { useState, useEffect } from "react";
import { useFeeBreakdownDisplay } from "@/hooks/useFeeCalculation";
import { AlertCircle, Info, TrendingUp, Zap, RefreshCw, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

interface FeeBreakdownProps {
  tokenAddress: string;
  transferAmount: string;
  tokenDecimals?: number;
  tokenSymbol?: string;
  isHidden?: boolean;
}

export function FeeBreakdown({
  tokenAddress,
  transferAmount,
  tokenDecimals = 6,
  tokenSymbol = "USDC",
  isHidden = false,
}: FeeBreakdownProps) {
  const { data, isLoading, error, displayData, isFetching, dataUpdatedAt } = useFeeBreakdownDisplay(
    tokenAddress && transferAmount ? {
      tokenAddress,
      transferAmount,
      tokenDecimals,
    } : null,
  );

  // Live timer state
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Update current time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Calculate seconds since last update (updates every second)
  const secondsSinceUpdate = dataUpdatedAt ? Math.floor((currentTime - dataUpdatedAt) / 1000) : 0;
  const nextUpdateIn = Math.max(0, 30 - secondsSinceUpdate);

  if (!tokenAddress || !transferAmount) {
    return null;
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Fee Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to calculate fees: {error.message}
        </AlertDescription>
      </Alert>
    );
  }

  if (!data?.success || !displayData) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {data?.error || "Unable to calculate fees"}
        </AlertDescription>
      </Alert>
    );
  }

  const percentage = Number(process.env.NEXT_PUBLIC_RELAYER_FEE_PERCENTAGE || "1");

  return (
    <div className={`transition-all duration-500 ease-in-out transform ${
      isHidden
        ? "opacity-0 scale-95 -translate-y-4 pointer-events-none"
        : "opacity-100 scale-100 translate-y-0"
    }`}>
      <Card className="transition-all duration-300 ease-in-out">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Fee Breakdown
            </div>
            <Badge variant="outline" className="flex items-center gap-1 text-xs">
              <Clock className="h-3 w-3" />
              {isFetching ? "Updating..." : `Next: ${nextUpdateIn}s`}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Transfer Amount */}
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Transfer Amount</span>
            <div className="text-right">
              <div className="font-semibold">{displayData.transferAmount.tokens} {tokenSymbol}</div>
              <div className="text-xs text-muted-foreground">{displayData.transferAmount.usd}</div>
            </div>
          </div>

          <Separator />

          {/* Gas Cost */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium">Gas Cost</span>
            </div>
            <div className="text-right">
              <div className="font-semibold">{displayData.gasCost.tokens} {tokenSymbol}</div>
              <div className="text-xs text-muted-foreground">{displayData.gasCost.usd}</div>
            </div>
          </div>

          {/* Percentage Fee */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Service Fee ({percentage}%)</span>
            </div>
            <div className="text-right">
              <div className="font-semibold">{displayData.percentageFee.tokens} {tokenSymbol}</div>
              <div className="text-xs text-muted-foreground">{displayData.percentageFee.usd}</div>
            </div>
          </div>

          <Separator />

          {/* Total Fee */}
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Total Fees</span>
            <div className="text-right">
              <div className="font-semibold text-red-600">{displayData.totalFee.tokens} {tokenSymbol}</div>
              <div className="text-xs text-muted-foreground">{displayData.totalFee.usd}</div>
            </div>
          </div>

          {/* Net Amount */}
          <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-200">
            <span className="text-sm font-medium text-green-800">Recipient Receives</span>
            <div className="text-right">
              <div className="font-bold text-green-800">{displayData.netAmount.tokens} {tokenSymbol}</div>
            </div>
          </div>

          {/* Gas Details (Collapsible) */}
          <details className="mt-4">
            <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
              Gas Details
            </summary>
            <div className="mt-2 p-3 bg-muted rounded-lg space-y-2 text-xs">
              <div className="flex justify-between">
                <span>ETH Price:</span>
                <span>{displayData.ethPrice}</span>
              </div>
              <div className="flex justify-between">
                <span>Gas Limit:</span>
                <span>{displayData.gasInfo.gasLimit}</span>
              </div>
              <div className="flex justify-between">
                <span>Gas Price:</span>
                <span>{displayData.gasInfo.gasPrice}</span>
              </div>
              <div className="flex justify-between">
                <span>Gas Cost (ETH):</span>
                <span>{displayData.gasInfo.gasCostEth} ETH</span>
              </div>
            </div>
          </details>
        </CardContent>
      </Card>
    </div>
  );
} 