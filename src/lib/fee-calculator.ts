import { ethers } from "ethers";
import { priceOracle } from "./price-oracle";

interface FeeBreakdown {
  gasCostUsd: number;
  gasCostTokenUnits: bigint;
  percentageFeeUsd: number;
  percentageFeeTokenUnits: bigint;
  totalFeeUsd: number;
  totalFeeTokenUnits: bigint;
}

interface GasEstimation {
  gasLimit: bigint;
  gasPrice: bigint;
  gasCostWei: bigint;
  gasCostEth: number;
}

export class FeeCalculator {
  async calculateRequiredFee(
    tokenAddress: string,
    transferAmount: bigint,
    tokenDecimals: number = 6
  ): Promise<FeeBreakdown> {
    try {
      // Get real-time data from oracles
      const [ethPriceUsd, gasPrice, gasLimit] = await Promise.all([
        priceOracle.getEthToUsdPrice(),
        priceOracle.getGasPrice(),
        priceOracle.estimateGasLimit(tokenAddress, transferAmount),
      ]);

      // Calculate gas cost
      const gasCostWei = gasLimit * gasPrice;
      const gasCostEth = Number(gasCostWei) / 1e18;
      const gasCostUsd = gasCostEth * ethPriceUsd;

      // Convert gas cost to token units (assuming 1:1 USD to token for stablecoins)
      const gasCostTokenUnits = BigInt(Math.floor(gasCostUsd * Math.pow(10, tokenDecimals)));

      // Calculate percentage fee (1% of transfer amount)
      const percentageFeePercentage = 0.01; // 1%
      const percentageFeeTokenUnits = (transferAmount * BigInt(Math.floor(percentageFeePercentage * 100))) / BigInt(100);
      const percentageFeeUsd = Number(percentageFeeTokenUnits) / Math.pow(10, tokenDecimals);

      // Calculate total fee
      const totalFeeTokenUnits = gasCostTokenUnits + percentageFeeTokenUnits;
      const totalFeeUsd = gasCostUsd + percentageFeeUsd;

      return {
        gasCostUsd,
        gasCostTokenUnits,
        percentageFeeUsd,
        percentageFeeTokenUnits,
        totalFeeUsd,
        totalFeeTokenUnits,
      };
    } catch (error) {
      console.error("Error calculating fees:", error);
      throw new Error("Failed to calculate fees");
    }
  }

  async estimateGasCost(transferAmount: bigint): Promise<GasEstimation> {
    try {
      const [gasPrice, gasLimit] = await Promise.all([
        priceOracle.getGasPrice(),
        priceOracle.estimateGasLimit("0x0000000000000000000000000000000000000000", transferAmount),
      ]);

      const gasCostWei = gasLimit * gasPrice;
      const gasCostEth = Number(gasCostWei) / 1e18;

      return {
        gasLimit,
        gasPrice,
        gasCostWei,
        gasCostEth,
      };
    } catch (error) {
      console.error("Error estimating gas cost:", error);
      throw new Error("Failed to estimate gas cost");
    }
  }

  async validateTransferFee(
    providedFee: bigint,
    transferAmount: bigint,
    tokenDecimals: number = 6
  ): Promise<{
    isValid: boolean;
    requiredFee: bigint;
    shortfall: bigint;
    breakdown: FeeBreakdown;
  }> {
    const requiredFeeBreakdown = await this.calculateRequiredFee(
      "0x0000000000000000000000000000000000000000", // dummy address
      transferAmount,
      tokenDecimals
    );
    
    const requiredFee = requiredFeeBreakdown.totalFeeTokenUnits;
    const shortfall = providedFee < requiredFee ? requiredFee - providedFee : 0n;
    
    return {
      isValid: providedFee >= requiredFee,
      requiredFee,
      shortfall,
      breakdown: requiredFeeBreakdown,
    };
  }
}

export const feeCalculator = new FeeCalculator(); 