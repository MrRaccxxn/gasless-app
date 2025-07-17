import { NextRequest, NextResponse } from "next/server";
import { contractService } from "@/lib/contract-service";
import { rateLimiter } from "@/lib/rate-limiter";
import { logger } from "@/lib/logger";

interface UserInfoResponse {
  success: boolean;
  data?: {
    nonce: string;
    usageStats: {
      requestCount: number;
      gasUsed: string;
      resetTime: number;
      gasResetTime: number;
    } | null;
    isBanned: boolean;
  };
  error?: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> },
): Promise<NextResponse<UserInfoResponse>> {
  let address = "unknown";
  try {
    const paramsResolved = await params;
    address = paramsResolved.address;

    // Validate address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return NextResponse.json(
        { success: false, error: "Invalid address format" },
        { status: 400 },
      );
    }

    // Get user's current nonce
    const nonce = await contractService.getUserNonce(address);

    // Get usage stats
    const usageStats = rateLimiter.getUsageStats(address);
    const isBanned = rateLimiter.isBanned(address);

    return NextResponse.json({
      success: true,
      data: {
        nonce: nonce.toString(),
        usageStats: usageStats ? {
          ...usageStats,
          gasUsed: usageStats.gasUsed.toString(),
        } : null,
        isBanned,
      },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : undefined;
    logger.error("User info endpoint error", {
      error: errorMessage,
      stack: errorStack,
      address: address,
    });

    return NextResponse.json(
      { success: false, error: "Failed to get user information" },
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
