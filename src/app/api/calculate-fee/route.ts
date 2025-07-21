import { NextRequest, NextResponse } from "next/server";
import { feeCalculator } from "@/lib/fee-calculator";

interface CalculateFeeRequest {
  tokenAddress: string;
  transferAmount: string;
  tokenDecimals: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: CalculateFeeRequest = await request.json();
    const { tokenAddress, transferAmount, tokenDecimals } = body;

    if (!tokenAddress || !transferAmount || tokenDecimals === undefined) {
      return NextResponse.json(
        { success: false, error: "Missing required parameters" },
        { status: 400 },
      );
    }

    // Validate input
    if (BigInt(transferAmount) <= 0n) {
      return NextResponse.json(
        { success: false, error: "Transfer amount must be greater than 0" },
        { status: 400 },
      );
    }

    const feeBreakdown = await feeCalculator.calculateRequiredFee(
      tokenAddress,
      BigInt(transferAmount),
      tokenDecimals,
    );

    // Convert BigInt values to strings for JSON serialization
    const serializedFeeBreakdown = {
      gasCostUsd: feeBreakdown.gasCostUsd,
      gasCostTokenUnits: feeBreakdown.gasCostTokenUnits.toString(),
      percentageFeeUsd: feeBreakdown.percentageFeeUsd,
      percentageFeeTokenUnits: feeBreakdown.percentageFeeTokenUnits.toString(),
      totalFeeUsd: feeBreakdown.totalFeeUsd,
      totalFeeTokenUnits: feeBreakdown.totalFeeTokenUnits.toString(),
    };

    return NextResponse.json({
      success: true,
      feeBreakdown: serializedFeeBreakdown,
    });
  } catch (error) {
    console.error("Error calculating fees:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to calculate fees";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 },
    );
  }
}

// Handle unsupported methods
export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405 },
  );
}
