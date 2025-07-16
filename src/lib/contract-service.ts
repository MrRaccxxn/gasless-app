import { ethers } from "ethers";
import { MetaTransfer, PermitData } from "./schemas";
import { EIP712_DOMAIN, EIP712_TYPES } from "./constants";
import gaslessABI from "../../abi/gasless.json";
import "dotenv/config";

// Environment variables (backend-only)
const PRIVATE_KEY = process.env.PRIVATE_KEY!;
const CHAIN_RPC_URL = process.env.CHAIN_RPC_URL!;
const RELAYER_CONTRACT = process.env.RELAYER_CONTRACT!;

// Check if environment variables are properly configured
const isConfigured = () => {
  return PRIVATE_KEY && 
         CHAIN_RPC_URL && 
         RELAYER_CONTRACT &&
         !PRIVATE_KEY.includes('your_relayer_wallet_private_key_here') &&
         !CHAIN_RPC_URL.includes('your_project_id') &&
         !RELAYER_CONTRACT.includes('your_deployed_contract_address_here');
};

// Initialize provider and signer only if configured
let provider: ethers.JsonRpcProvider | null = null;
let signer: ethers.Wallet | null = null;
let contract: ethers.Contract | null = null;

if (isConfigured()) {
  provider = new ethers.JsonRpcProvider(CHAIN_RPC_URL);
  signer = new ethers.Wallet(PRIVATE_KEY, provider);
  contract = new ethers.Contract(RELAYER_CONTRACT, gaslessABI, signer);
}

export class ContractService {
  // Get user's current nonce
  async getUserNonce(userAddress: string): Promise<bigint> {
    if (!contract) {
      throw new Error("Contract service not configured");
    }
    try {
      return await contract.getNonce(userAddress);
    } catch (error) {
      console.error("Error getting user nonce:", error);
      throw new Error("Failed to get user nonce");
    }
  }

  // Check if token is whitelisted
  async isTokenWhitelisted(tokenAddress: string): Promise<boolean> {
    if (!contract) {
      throw new Error("Contract service not configured");
    }
    try {
      return await contract.isTokenWhitelisted(tokenAddress);
    } catch (error) {
      console.error("Error checking token whitelist:", error);
      throw new Error("Failed to check token whitelist");
    }
  }

  // Check if recipient contract is allowed
  async isRecipientAllowed(recipientAddress: string): Promise<boolean> {
    if (!contract || !provider) {
      throw new Error("Contract service not configured");
    }
    try {
      // If it's an EOA, it's allowed
      const code = await provider.getCode(recipientAddress);
      if (code === "0x") {
        return true;
      }

      // If it's a contract, check if it's whitelisted
      return await contract.isRecipientContractAllowed(recipientAddress);
    } catch (error) {
      console.error("Error checking recipient allowance:", error);
      throw new Error("Failed to check recipient allowance");
    }
  }

  // Get max transfer and fee limits
  async getLimits(): Promise<{ maxTransfer: bigint; maxFee: bigint }> {
    if (!contract) {
      throw new Error("Contract service not configured");
    }
    try {
      const [maxTransfer, maxFee] = await Promise.all([
        contract.maxTransferAmount(),
        contract.maxFeeAmount(),
      ]);
      return { maxTransfer, maxFee };
    } catch (error) {
      console.error("Error getting limits:", error);
      throw new Error("Failed to get contract limits");
    }
  }

  // Check if contract is paused
  async isPaused(): Promise<boolean> {
    if (!contract) {
      throw new Error("Contract service not configured");
    }
    try {
      return await contract.paused();
    } catch (error) {
      console.error("Error checking pause status:", error);
      throw new Error("Failed to check contract pause status");
    }
  }

  // Get fee wallet address
  async getFeeWallet(): Promise<string> {
    if (!contract) {
      throw new Error("Contract service not configured");
    }
    try {
      return await contract.feeWallet();
    } catch (error) {
      console.error("Error getting fee wallet:", error);
      throw new Error("Failed to get fee wallet address");
    }
  }

  // Get ERC20 token balance and allowance
  async getTokenInfo(
    tokenAddress: string,
    userAddress: string
  ): Promise<{
    balance: bigint;
    allowance: bigint;
  }> {
    if (!provider) {
      throw new Error("Contract service not configured");
    }
    try {
      const tokenContract = new ethers.Contract(
        tokenAddress,
        [
          "function balanceOf(address) view returns (uint256)",
          "function allowance(address,address) view returns (uint256)",
        ],
        provider
      );

      const [balance, allowance] = await Promise.all([
        tokenContract.balanceOf(userAddress),
        tokenContract.allowance(userAddress, RELAYER_CONTRACT),
      ]);

      return { balance, allowance };
    } catch (error) {
      console.error("Error getting token info:", error);
      throw new Error("Failed to get token information");
    }
  }

  // Execute meta transfer
  async executeMetaTransfer(
    metaTransfer: MetaTransfer,
    permitData: PermitData,
    signature: string
  ): Promise<string> {
    if (!contract) {
      throw new Error("Contract service not configured");
    }
    try {
      // Convert string values to BigInt for contract call
      const metaTxStruct = {
        owner: metaTransfer.owner,
        token: metaTransfer.token,
        recipient: metaTransfer.recipient,
        amount: BigInt(metaTransfer.amount),
        fee: BigInt(metaTransfer.fee),
        deadline: BigInt(metaTransfer.deadline),
        nonce: BigInt(metaTransfer.nonce),
      };

      const permitStruct = {
        value: BigInt(permitData.value),
        deadline: BigInt(permitData.deadline),
        v: permitData.v,
        r: permitData.r,
        s: permitData.s,
      };

      // Estimate gas first
      const gasEstimate = await contract.executeMetaTransfer.estimateGas(
        metaTxStruct,
        permitStruct,
        signature
      );

      // Execute the transaction with a buffer
      const tx = await contract.executeMetaTransfer(
        metaTxStruct,
        permitStruct,
        signature,
        {
          gasLimit: gasEstimate + BigInt(50000), // Add buffer
        }
      );

      console.log("Transaction submitted:", tx.hash);
      return tx.hash;
    } catch (error: any) {
      console.error("Error executing meta transfer:", error);

      // Parse contract errors
      if (error.code === "CALL_EXCEPTION") {
        if (error.data) {
          try {
            const decodedError = contract.interface.parseError(error.data);
            throw new Error(`Contract error: ${decodedError.name}`);
          } catch {
            throw new Error("Contract execution failed");
          }
        }
      }

      throw new Error("Failed to execute meta transfer");
    }
  }

  // Verify EIP-712 signature
  verifySignature(metaTransfer: MetaTransfer, signature: string): boolean {
    try {
      const domain = EIP712_DOMAIN;
      const types = EIP712_TYPES;
      const value = {
        owner: metaTransfer.owner,
        token: metaTransfer.token,
        recipient: metaTransfer.recipient,
        amount: metaTransfer.amount,
        fee: metaTransfer.fee,
        deadline: metaTransfer.deadline,
        nonce: metaTransfer.nonce,
      };

      const recoveredAddress = ethers.verifyTypedData(
        domain,
        types,
        value,
        signature
      );
      return (
        recoveredAddress.toLowerCase() === metaTransfer.owner.toLowerCase()
      );
    } catch (error) {
      console.error("Error verifying signature:", error);
      return false;
    }
  }
}

export const contractService = new ContractService();