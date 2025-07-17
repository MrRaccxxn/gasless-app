import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";
import { logger } from "@/lib/logger";

interface TransactionResponse {
  success: boolean;
  data?: {
    hash: string;
    status: "pending" | "confirmed" | "failed";
    blockNumber?: number;
    gasUsed?: string;
    confirmations?: number;
    receipt?: any;
  };
  error?: string;
}

const provider = new ethers.JsonRpcProvider(process.env.CHAIN_RPC_URL!);

export async function GET(
  request: NextRequest,
  { params }: { params: { hash: string } },
): Promise<NextResponse<TransactionResponse>> {
  try {
    const txHash = params.hash;

    // Validate transaction hash format
    if (!/^0x[a-fA-F0-9]{64}$/.test(txHash)) {
      return NextResponse.json(
        { success: false, error: "Invalid transaction hash format" },
        { status: 400 },
      );
    }

    // Get transaction details
    const [tx, receipt] = await Promise.all([
      provider.getTransaction(txHash),
      provider.getTransactionReceipt(txHash),
    ]);

    if (!tx) {
      return NextResponse.json(
        { success: false, error: "Transaction not found" },
        { status: 404 },
      );
    }

    let status: "pending" | "confirmed" | "failed";
    let blockNumber: number | undefined;
    let gasUsed: string | undefined;
    let confirmations: number | undefined;

    if (receipt) {
      status = receipt.status === 1 ? "confirmed" : "failed";
      blockNumber = receipt.blockNumber;
      gasUsed = receipt.gasUsed.toString();
      confirmations = await provider.getBlockNumber() - receipt.blockNumber + 1;
    } else {
      status = "pending";
    }

    return NextResponse.json({
      success: true,
      data: {
        hash: txHash,
        status,
        blockNumber,
        gasUsed,
        confirmations,
        receipt: receipt ? {
          blockHash: receipt.blockHash,
          blockNumber: receipt.blockNumber,
          contractAddress: receipt.contractAddress,
          cumulativeGasUsed: receipt.cumulativeGasUsed.toString(),
          from: receipt.from,
          gasUsed: receipt.gasUsed.toString(),
          logs: receipt.logs,
          logsBloom: receipt.logsBloom,
          status: receipt.status,
          to: receipt.to,
          transactionHash: receipt.hash,
          transactionIndex: receipt.index,
          type: receipt.type,
        } : null,
      },
    });

  } catch (error: any) {
    logger.error("Transaction status endpoint error", {
      error: error.message,
      stack: error.stack,
      txHash: params.hash,
    });

    return NextResponse.json(
      { success: false, error: "Failed to get transaction status" },
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
