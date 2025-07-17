import { EIP712_DOMAIN, EIP712_TYPES } from "./constants";
import { MetaTransfer } from "./schemas";

// Helper function to create EIP-712 typed data for frontend
export function createEIP712TypedData(metaTransfer: MetaTransfer) {
  return {
    domain: EIP712_DOMAIN,
    types: EIP712_TYPES,
    primaryType: "MetaTransfer" as const,
    message: {
      owner: metaTransfer.owner,
      token: metaTransfer.token,
      recipient: metaTransfer.recipient,
      amount: metaTransfer.amount,
      fee: metaTransfer.fee,
      deadline: metaTransfer.deadline,
      nonce: metaTransfer.nonce,
    },
  };
}

// Helper function to encode typed data for manual signing
export function encodeTypedData(metaTransfer: MetaTransfer): string {
  const typedData = createEIP712TypedData(metaTransfer);
  return JSON.stringify(typedData);
}

// Helper function to create permit typed data for EIP-2612 tokens
export function createPermitTypedData(
  tokenAddress: string,
  owner: string,
  spender: string,
  value: string,
  nonce: string,
  deadline: string,
  chainId: number,
  tokenName: string,
  tokenVersion = "1",
) {
  return {
    domain: {
      name: tokenName,
      version: tokenVersion,
      chainId,
      verifyingContract: tokenAddress as `0x${string}`,
    },
    types: {
      Permit: [
        { name: "owner", type: "address" },
        { name: "spender", type: "address" },
        { name: "value", type: "uint256" },
        { name: "nonce", type: "uint256" },
        { name: "deadline", type: "uint256" },
      ],
    },
    primaryType: "Permit" as const,
    message: {
      owner,
      spender,
      value,
      nonce,
      deadline,
    },
  };
}

// Helper function to get current timestamp + buffer for deadline
export function getDeadline(bufferMinutes = 10): string {
  const now = Math.floor(Date.now() / 1000);
  const deadline = now + (bufferMinutes * 60);
  return deadline.toString();
}

// Helper function to validate deadline
export function isDeadlineValid(deadline: string): boolean {
  const now = Math.floor(Date.now() / 1000);
  const deadlineTimestamp = parseInt(deadline);
  return deadlineTimestamp > now;
}
