import { NextRequest, NextResponse } from "next/server";
import { contractService } from "@/lib/contract-service";
import { logger } from "@/lib/logger";

interface TokenInfoResponse {
  success: boolean;
  data?: {
    address: string;
    isWhitelisted: boolean;
    userBalance?: string;
    userAllowance?: string;
  };
  error?: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { address: string } },
): Promise<NextResponse<TokenInfoResponse>> {
  try {
    const tokenAddress = params.address;

    // Validate address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(tokenAddress)) {
      return NextResponse.json(
        { success: false, error: "Invalid token address format" },
        { status: 400 },
      );
    }

    // Check if token is whitelisted
    const isWhitelisted = await contractService.isTokenWhitelisted(tokenAddress);

    // Get user address from query params (optional)
    const { searchParams } = new URL(request.url);
    const userAddress = searchParams.get("user");

    let userBalance: string | undefined;
    let userAllowance: string | undefined;

    if (userAddress) {
      // Validate user address format
      if (!/^0x[a-fA-F0-9]{40}$/.test(userAddress)) {
        return NextResponse.json(
          { success: false, error: "Invalid user address format" },
          { status: 400 },
        );
      }

      try {
        const tokenInfo = await contractService.getTokenInfo(tokenAddress, userAddress);
        userBalance = tokenInfo.balance.toString();
        userAllowance = tokenInfo.allowance.toString();
      } catch (error) {
        logger.warn("Failed to get token info for user", {
          tokenAddress,
          userAddress,
          error: (error as Error).message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        address: tokenAddress,
        isWhitelisted,
        userBalance,
        userAllowance,
      },
    });

  } catch (error: any) {
    logger.error("Token info endpoint error", {
      error: error.message,
      stack: error.stack,
      tokenAddress: params.address,
    });

    return NextResponse.json(
      { success: false, error: "Failed to get token information" },
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
