import { NextRequest, NextResponse } from "next/server";
import { contractService } from "@/lib/contract-service";
import { logger } from "@/lib/logger";

interface StatusResponse {
  success: boolean;
  data?: {
    contractAddress: string;
    chainId: number;
    isPaused: boolean;
    maxTransferAmount: string;
    maxFeeAmount: string;
    feeWallet: string;
  };
  error?: string;
}

export async function GET(_request: NextRequest): Promise<NextResponse<StatusResponse>> {
  try {
    console.log("Status endpoint hit");

    const contractAddress = process.env.RELAYER_CONTRACT;
    const chainId = parseInt(process.env.CHAIN_ID || "11155111");

    console.log("Contract address", contractAddress);
    console.log("Chain ID", chainId);

    if (!contractAddress) {
      return NextResponse.json(
        { success: false, error: "Contract not configured. Please set RELAYER_CONTRACT environment variable." },
        { status: 503 },
      );
    }

    // Get contract status
    const [isPaused, limits, feeWallet] = await Promise.all([
      contractService.isPaused(),
      contractService.getLimits(),
      contractService.getFeeWallet(),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        contractAddress,
        chainId,
        isPaused,
        maxTransferAmount: limits.maxTransfer.toString(),
        maxFeeAmount: limits.maxFee.toString(),
        feeWallet,
      },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : undefined;

    logger.error("Status endpoint error", {
      error: errorMessage,
      stack: errorStack,
    });

    return NextResponse.json(
      { success: false, error: "Failed to get contract status" },
      { status: 500 },
    );
  }
}

export async function POST(): Promise<NextResponse> {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405 },
  );
}
