import { NextRequest, NextResponse } from "next/server";
import { RelayRequestSchema, RelayResponse } from "@/lib/schemas";
import { contractService } from "@/lib/contract-service";
import { recaptchaService } from "@/lib/recaptcha"; // Modified to always return true
import { rateLimiter } from "@/lib/rate-limiter";
import { logger } from "@/lib/logger";

// Get client IP address
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const real = request.headers.get("x-real-ip");

  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  if (real) {
    return real;
  }

  return "unknown";
}

export async function POST(request: NextRequest): Promise<NextResponse<RelayResponse>> {
  const clientIP = getClientIP(request);

  try {
    // Parse request body
    const body = await request.json();

    // Validate input schema
    const validationResult = RelayRequestSchema.safeParse(body);
    if (!validationResult.success) {
      logger.validationError("/api/relay", validationResult.error.errors, clientIP);
      return NextResponse.json(
        { success: false, error: "Invalid request format" },
        { status: 400 },
      );
    }

    const { metaTransfer, permitData, signature, recaptchaToken } = validationResult.data;
    const userAddress = metaTransfer.owner;

    // Log relay attempt
    logger.relayAttempt(userAddress, metaTransfer.token, metaTransfer.amount, {
      clientIP,
      recipient: metaTransfer.recipient,
      fee: metaTransfer.fee,
    });

    // Check rate limiting by user address
    const rateLimitResult = rateLimiter.checkLimit(userAddress);
    if (!rateLimitResult.allowed) {
      logger.rateLimitHit(userAddress, "/api/relay");
      return NextResponse.json(
        {
          success: false,
          error: "Rate limit exceeded",
        },
        {
          status: 429,
          headers: rateLimitResult.retryAfter ? {
            "Retry-After": rateLimitResult.retryAfter.toString(),
          } : undefined,
        },
      );
    }

    // Verify reCAPTCHA - DISABLED (always returns true)
    const recaptchaValid = await recaptchaService.verifyToken(recaptchaToken, clientIP);
    if (!recaptchaValid) {
      logger.recaptchaFailure(userAddress);
      return NextResponse.json(
        { success: false, error: "reCAPTCHA verification failed" },
        { status: 400 },
      );
    }

    // Increment rate limit count
    rateLimiter.incrementCount(userAddress);

    // Validate deadline
    const deadline = BigInt(metaTransfer.deadline);
    const now = BigInt(Math.floor(Date.now() / 1000));
    if (deadline <= now) {
      logger.relayFailure(userAddress, metaTransfer.token, metaTransfer.amount, "Deadline expired");
      return NextResponse.json(
        { success: false, error: "Transaction deadline expired" },
        { status: 400 },
      );
    }

    // Check if contract is paused
    const isPaused = await contractService.isPaused();
    if (isPaused) {
      logger.relayFailure(userAddress, metaTransfer.token, metaTransfer.amount, "Contract paused");
      return NextResponse.json(
        { success: false, error: "Contract is currently paused" },
        { status: 503 },
      );
    }

    // Verify EIP-712 signature
    const isSignatureValid = contractService.verifySignature(metaTransfer, signature);
    if (!isSignatureValid) {
      logger.securityViolation("invalid_signature", userAddress, { metaTransfer, signature });
      return NextResponse.json(
        { success: false, error: "Invalid signature" },
        { status: 400 },
      );
    }

    // Check if token is whitelisted
    const isTokenWhitelisted = await contractService.isTokenWhitelisted(metaTransfer.token);
    if (!isTokenWhitelisted) {
      logger.relayFailure(userAddress, metaTransfer.token, metaTransfer.amount, "Token not whitelisted");
      return NextResponse.json(
        { success: false, error: "Token not whitelisted" },
        { status: 400 },
      );
    }

    // Check if recipient is allowed
    const isRecipientAllowed = await contractService.isRecipientAllowed(metaTransfer.recipient);
    if (!isRecipientAllowed) {
      logger.relayFailure(userAddress, metaTransfer.token, metaTransfer.amount, "Recipient not allowed");
      return NextResponse.json(
        { success: false, error: "Recipient contract not allowed" },
        { status: 400 },
      );
    }

    // Get contract limits
    const { maxTransfer, maxFee } = await contractService.getLimits();
    const amount = BigInt(metaTransfer.amount);
    const fee = BigInt(metaTransfer.fee);

    if (amount > maxTransfer) {
      logger.relayFailure(userAddress, metaTransfer.token, metaTransfer.amount, "Amount exceeds maximum");
      return NextResponse.json(
        { success: false, error: "Amount exceeds maximum allowed" },
        { status: 400 },
      );
    }

    if (fee > maxFee) {
      logger.relayFailure(userAddress, metaTransfer.token, metaTransfer.amount, "Fee exceeds maximum");
      return NextResponse.json(
        { success: false, error: "Fee exceeds maximum allowed" },
        { status: 400 },
      );
    }

    // Check user's current nonce
    const currentNonce = await contractService.getUserNonce(userAddress);
    const providedNonce = BigInt(metaTransfer.nonce);
    if (providedNonce !== currentNonce) {
      logger.relayFailure(userAddress, metaTransfer.token, metaTransfer.amount, "Invalid nonce", {
        expectedNonce: currentNonce.toString(),
        providedNonce: providedNonce.toString(),
      });
      return NextResponse.json(
        { success: false, error: "Invalid nonce" },
        { status: 400 },
      );
    }

    // Check token balance and allowance
    const { balance, allowance } = await contractService.getTokenInfo(metaTransfer.token, userAddress);
    const totalNeeded = amount + fee;

    if (balance < totalNeeded) {
      logger.relayFailure(userAddress, metaTransfer.token, metaTransfer.amount, "Insufficient balance");
      return NextResponse.json(
        { success: false, error: "Insufficient token balance" },
        { status: 400 },
      );
    }

    if (allowance < totalNeeded) {
      logger.relayFailure(userAddress, metaTransfer.token, metaTransfer.amount, "Insufficient allowance");
      return NextResponse.json(
        { success: false, error: "Insufficient token allowance" },
        { status: 400 },
      );
    }

    // Execute the meta transfer
    const txHash = await contractService.executeMetaTransfer(
      metaTransfer,
      permitData,
      signature,
    );

    // Log successful relay
    logger.relaySuccess(txHash, userAddress, metaTransfer.token, metaTransfer.amount);

    return NextResponse.json({
      success: true,
      txHash,
    });

  } catch (error: any) {
    logger.error("Relay endpoint error", {
      error: error.message,
      stack: error.stack,
      clientIP,
    });

    return NextResponse.json(
      { success: false, error: "Internal server error" },
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
