// Frontend-safe EIP-712 constants
// This file contains only public constants that can be safely used in the frontend

// Get environment variables with fallbacks
const getChainId = () => {
  const chainId = process.env.NEXT_PUBLIC_CHAIN_ID || "11155111";
  return parseInt(chainId);
};

const getRelayerContract = () => {
  const contract = process.env.NEXT_PUBLIC_RELAYER_CONTRACT;
  // If not set or still placeholder, use a default address for development
  if (!contract || contract.includes("your_deployed_contract_address_here")) {
    console.warn("NEXT_PUBLIC_RELAYER_CONTRACT not set, using development default");
    return "0x0000000000000000000000000000000000000000";
  }
  return contract;
};

// EIP-712 Domain (uses public environment variables)
export const EIP712_DOMAIN = {
  name: "GaslessRelayer",
  version: "1",
  chainId: getChainId(),
  verifyingContract: getRelayerContract(),
};

// EIP-712 Types
export const EIP712_TYPES = {
  MetaTransfer: [
    { name: "owner", type: "address" },
    { name: "token", type: "address" },
    { name: "recipient", type: "address" },
    { name: "amount", type: "uint256" },
    { name: "fee", type: "uint256" },
    { name: "deadline", type: "uint256" },
    { name: "nonce", type: "uint256" },
  ],
};