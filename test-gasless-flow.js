#!/usr/bin/env node

/**
 * Comprehensive test script for gasless transaction flow
 * Tests a $1 USDC transfer on Sepolia network
 * 
 * Usage: node test-gasless-flow.js [SENDER_PRIVATE_KEY] [RECIPIENT_ADDRESS]
 * 
 * Environment variables required:
 * - CHAIN_RPC_URL: Sepolia RPC endpoint
 * - RELAYER_CONTRACT: GaslessRelayer contract address
 * 
 * Example:
 * CHAIN_RPC_URL="https://sepolia.infura.io/v3/YOUR_KEY" \
 * RELAYER_CONTRACT="0x..." \
 * node test-gasless-flow.js 0x1234...abcd 0xrecipient...address
 */

const { ethers } = require('ethers');
const crypto = require('crypto');

// Configuration
const USDC_ADDRESS = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238"; // Sepolia USDC
const USDC_DECIMALS = 6;
const TEST_AMOUNT_USD = 1; // $1 USD
const TEST_AMOUNT = ethers.parseUnits(TEST_AMOUNT_USD.toString(), USDC_DECIMALS); // 1 USDC
const FEE_AMOUNT = ethers.parseUnits("0.01", USDC_DECIMALS); // 0.01 USDC fee
const API_BASE_URL = "http://localhost:3000/api";

// EIP-712 Configuration (will be set dynamically)
let EIP712_DOMAIN;

const EIP712_TYPES = {
  MetaTransfer: [
    { name: "owner", type: "address" },
    { name: "token", type: "address" },
    { name: "recipient", type: "address" },
    { name: "amount", type: "uint256" },
    { name: "fee", type: "uint256" },
    { name: "deadline", type: "uint256" },
    { name: "nonce", type: "uint256" }
  ]
};

// ERC-20 ABI (minimal)
const ERC20_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function nonces(address) view returns (uint256)",
  "function permit(address owner, address spender, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s)"
];

// EIP-2612 Permit Types
const PERMIT_TYPES = {
  Permit: [
    { name: "owner", type: "address" },
    { name: "spender", type: "address" },
    { name: "value", type: "uint256" },
    { name: "nonce", type: "uint256" },
    { name: "deadline", type: "uint256" }
  ]
};

class GaslessFlowTester {
  constructor(senderPrivateKey, recipientAddress) {
    // Validate environment
    this.rpcUrl = process.env.CHAIN_RPC_URL;
    this.relayerContract = process.env.RELAYER_CONTRACT;
    
    if (!this.rpcUrl || !this.relayerContract) {
      throw new Error("Missing environment variables: CHAIN_RPC_URL and RELAYER_CONTRACT are required");
    }
    
    if (!senderPrivateKey || !recipientAddress) {
      throw new Error("Usage: node test-gasless-flow.js [SENDER_PRIVATE_KEY] [RECIPIENT_ADDRESS]");
    }

    // Initialize provider and wallet
    this.provider = new ethers.JsonRpcProvider(this.rpcUrl);
    this.senderWallet = new ethers.Wallet(senderPrivateKey, this.provider);
    this.recipientAddress = recipientAddress;
    this.usdcContract = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, this.senderWallet);
    
    // Set EIP712 domain with correct relayer contract
    EIP712_DOMAIN = {
      name: "GaslessRelayer",
      version: "1",
      chainId: 11155111, // Sepolia
      verifyingContract: this.relayerContract
    };
    
    console.log("🚀 Gasless Flow Tester Initialized");
    console.log("📝 Sender:", this.senderWallet.address);
    console.log("📤 Recipient:", this.recipientAddress);
    console.log("💰 Amount:", `${TEST_AMOUNT_USD} USDC (${TEST_AMOUNT.toString()} wei)`);
    console.log("💸 Fee:", `0.01 USDC (${FEE_AMOUNT.toString()} wei)`);
    console.log();
  }

  async step1_CheckPrerequisites() {
    console.log("📋 Step 1: Checking Prerequisites");
    console.log("─".repeat(50));

    try {
      // Check network
      const network = await this.provider.getNetwork();
      console.log("✅ Network:", network.name, `(chainId: ${network.chainId})`);
      
      if (network.chainId !== 11155111n) {
        throw new Error(`Expected Sepolia (11155111), got ${network.chainId}`);
      }

      // Check sender balance
      const balance = await this.usdcContract.balanceOf(this.senderWallet.address);
      const balanceFormatted = ethers.formatUnits(balance, USDC_DECIMALS);
      console.log("💰 Sender USDC Balance:", `${balanceFormatted} USDC`);

      const totalNeeded = TEST_AMOUNT + FEE_AMOUNT;
      if (balance < totalNeeded) {
        throw new Error(`Insufficient balance. Need ${ethers.formatUnits(totalNeeded, USDC_DECIMALS)} USDC, have ${balanceFormatted} USDC`);
      }

      // Check allowance
      const allowance = await this.usdcContract.allowance(this.senderWallet.address, this.relayerContract);
      const allowanceFormatted = ethers.formatUnits(allowance, USDC_DECIMALS);
      console.log("🔓 Current Allowance:", `${allowanceFormatted} USDC`);

      if (allowance < totalNeeded) {
        console.log("⚠️  Insufficient allowance for gasless transfer");
        console.log("💡 We'll use EIP-2612 permit instead of pre-approval");
      } else {
        console.log("✅ Sufficient allowance for gasless transfer");
      }

      // Check recipient address
      const recipientCode = await this.provider.getCode(this.recipientAddress);
      const isContract = recipientCode !== "0x";
      console.log("📍 Recipient Type:", isContract ? "Contract" : "EOA");

      console.log("✅ All prerequisites checked\n");
      return { balance, allowance, isContract };
      
    } catch (error) {
      console.error("❌ Prerequisites check failed:", error.message);
      throw error;
    }
  }

  async step2_GetContractInfo() {
    console.log("🔍 Step 2: Getting Contract Information");
    console.log("─".repeat(50));

    try {
      // Get contract status
      const statusResponse = await fetch(`${API_BASE_URL}/status`);
      if (!statusResponse.ok) {
        throw new Error(`Status API failed: ${statusResponse.status}`);
      }
      const statusData = await statusResponse.json();
      console.log("📊 Contract Status:", JSON.stringify(statusData, null, 2));

      // Get user nonce
      const userResponse = await fetch(`${API_BASE_URL}/user/${this.senderWallet.address}`);
      if (!userResponse.ok) {
        throw new Error(`User API failed: ${userResponse.status}`);
      }
      const userData = await userResponse.json();
      console.log("👤 User Data:", JSON.stringify(userData, null, 2));

      // Get token info
      const tokenResponse = await fetch(`${API_BASE_URL}/token/${USDC_ADDRESS}`);
      if (!tokenResponse.ok) {
        throw new Error(`Token API failed: ${tokenResponse.status}`);
      }
      const tokenData = await tokenResponse.json();
      console.log("🪙 Token Data:", JSON.stringify(tokenData, null, 2));

      console.log("✅ Contract information retrieved\n");
      return { statusData, userData, tokenData };
      
    } catch (error) {
      console.error("❌ Contract info retrieval failed:", error.message);
      throw error;
    }
  }

  async step3_CreatePermitSignature() {
    console.log("✍️  Step 3: Creating EIP-2612 Permit Signature");
    console.log("─".repeat(50));

    try {
      // Get permit nonce from token contract
      const permitNonce = await this.usdcContract.nonces(this.senderWallet.address);
      console.log("📋 Permit Nonce:", permitNonce.toString());

      // Set deadline (1 hour from now)
      const deadline = Math.floor(Date.now() / 1000) + 3600;
      console.log("⏰ Permit Deadline:", new Date(deadline * 1000).toISOString());

      // Create permit domain (for USDC token)
      const permitDomain = {
        name: "USDC", // This must match the token's actual name
        version: "2", // USDC uses version "2"
        chainId: 11155111,
        verifyingContract: USDC_ADDRESS
      };

      // Permit value (amount + fee)
      const permitValue = TEST_AMOUNT + FEE_AMOUNT;

      // Create permit message
      const permitMessage = {
        owner: this.senderWallet.address,
        spender: this.relayerContract,
        value: permitValue.toString(),
        nonce: permitNonce.toString(),
        deadline: deadline.toString()
      };

      console.log("📝 Permit Message:", JSON.stringify(permitMessage, null, 2));

      // Sign permit
      const permitSignature = await this.senderWallet.signTypedData(
        permitDomain,
        PERMIT_TYPES,
        permitMessage
      );

      // Split signature
      const sig = ethers.Signature.from(permitSignature);
      const permitData = {
        value: permitValue.toString(),
        deadline: deadline.toString(),
        v: sig.v,
        r: sig.r,
        s: sig.s
      };

      console.log("✅ Permit signature created");
      console.log("🔏 Permit Data:", JSON.stringify(permitData, null, 2));
      console.log();

      return permitData;
      
    } catch (error) {
      console.error("❌ Permit signature creation failed:", error.message);
      throw error;
    }
  }

  async step4_CreateMetaTransferSignature(userData) {
    console.log("✍️  Step 4: Creating Meta Transfer Signature");
    console.log("─".repeat(50));

    try {
      // Create deadline (30 minutes from now)
      const deadline = Math.floor(Date.now() / 1000) + 1800;
      console.log("⏰ Meta Transfer Deadline:", new Date(deadline * 1000).toISOString());

      // Create meta transfer message
      const metaTransfer = {
        owner: this.senderWallet.address,
        token: USDC_ADDRESS,
        recipient: this.recipientAddress,
        amount: TEST_AMOUNT.toString(),
        fee: FEE_AMOUNT.toString(),
        deadline: deadline.toString(),
        nonce: userData.nonce.toString()
      };

      console.log("📝 Meta Transfer Message:", JSON.stringify(metaTransfer, null, 2));

      // Sign meta transfer
      const signature = await this.senderWallet.signTypedData(
        EIP712_DOMAIN,
        EIP712_TYPES,
        metaTransfer
      );

      console.log("✅ Meta transfer signature created");
      console.log("🔏 Signature:", signature);
      console.log();

      return { metaTransfer, signature };
      
    } catch (error) {
      console.error("❌ Meta transfer signature creation failed:", error.message);
      throw error;
    }
  }

  async step5_SubmitTransaction(metaTransfer, permitData, signature) {
    console.log("📤 Step 5: Submitting Gasless Transaction");
    console.log("─".repeat(50));

    try {
      const requestBody = {
        metaTransfer,
        permitData,
        signature
      };

      console.log("📦 Request Body:", JSON.stringify(requestBody, null, 2));

      const response = await fetch(`${API_BASE_URL}/relay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      const responseData = await response.json();
      
      if (!response.ok) {
        console.error("❌ Transaction submission failed");
        console.error("📄 Response:", JSON.stringify(responseData, null, 2));
        throw new Error(`API request failed: ${response.status} - ${responseData.error}`);
      }

      console.log("✅ Transaction submitted successfully!");
      console.log("🔗 Transaction Hash:", responseData.txHash);
      console.log();

      return responseData.txHash;
      
    } catch (error) {
      console.error("❌ Transaction submission failed:", error.message);
      throw error;
    }
  }

  async step6_MonitorTransaction(txHash) {
    console.log("👀 Step 6: Monitoring Transaction");
    console.log("─".repeat(50));

    try {
      console.log("⏳ Waiting for transaction confirmation...");
      
      // Wait for transaction receipt
      const receipt = await this.provider.waitForTransaction(txHash, 1, 300000); // 5 minute timeout
      
      if (!receipt) {
        throw new Error("Transaction not found or timed out");
      }

      console.log("✅ Transaction confirmed!");
      console.log("📋 Receipt:");
      console.log("  - Block Number:", receipt.blockNumber);
      console.log("  - Gas Used:", receipt.gasUsed.toString());
      console.log("  - Status:", receipt.status === 1 ? "Success" : "Failed");
      
      if (receipt.status !== 1) {
        throw new Error("Transaction failed on-chain");
      }

      // Check transaction via API
      const txResponse = await fetch(`${API_BASE_URL}/tx/${txHash}`);
      if (txResponse.ok) {
        const txData = await txResponse.json();
        console.log("🔍 API Transaction Data:", JSON.stringify(txData, null, 2));
      }

      console.log();
      return receipt;
      
    } catch (error) {
      console.error("❌ Transaction monitoring failed:", error.message);
      throw error;
    }
  }

  async step7_VerifyBalances() {
    console.log("🔍 Step 7: Verifying Final Balances");
    console.log("─".repeat(50));

    try {
      // Check sender balance
      const senderBalance = await this.usdcContract.balanceOf(this.senderWallet.address);
      const senderBalanceFormatted = ethers.formatUnits(senderBalance, USDC_DECIMALS);
      console.log("💰 Sender Final Balance:", `${senderBalanceFormatted} USDC`);

      // Check recipient balance
      const recipientBalance = await this.usdcContract.balanceOf(this.recipientAddress);
      const recipientBalanceFormatted = ethers.formatUnits(recipientBalance, USDC_DECIMALS);
      console.log("💰 Recipient Final Balance:", `${recipientBalanceFormatted} USDC`);

      console.log("✅ Balance verification complete\n");
      
    } catch (error) {
      console.error("❌ Balance verification failed:", error.message);
      throw error;
    }
  }

  async runFullTest() {
    console.log("🧪 Starting Comprehensive Gasless Transaction Test");
    console.log("=".repeat(60));
    console.log();

    try {
      // Step 1: Check prerequisites
      const prerequisites = await this.step1_CheckPrerequisites();

      // Step 2: Get contract information
      const contractInfo = await this.step2_GetContractInfo();

      // Step 3: Create permit signature
      const permitData = await this.step3_CreatePermitSignature();

      // Step 4: Create meta transfer signature
      const { metaTransfer, signature } = await this.step4_CreateMetaTransferSignature(contractInfo.userData.data);

      // Step 5: Submit transaction
      const txHash = await this.step5_SubmitTransaction(metaTransfer, permitData, signature);

      // Step 6: Monitor transaction
      const receipt = await this.step6_MonitorTransaction(txHash);

      // Step 7: Verify balances
      await this.step7_VerifyBalances();

      console.log("🎉 TEST COMPLETED SUCCESSFULLY!");
      console.log("=".repeat(60));
      console.log("✅ $1 USDC gasless transfer executed successfully");
      console.log("🔗 Transaction Hash:", txHash);
      console.log("⛽ Gas Used:", receipt.gasUsed.toString());
      console.log("💰 Total Cost: 0.01 USDC fee (no gas required)");
      
    } catch (error) {
      console.log("❌ TEST FAILED!");
      console.log("=".repeat(60));
      console.error("Error:", error.message);
      console.log("\n🔧 Debugging Tips:");
      console.log("1. Ensure CHAIN_RPC_URL and RELAYER_CONTRACT are set");
      console.log("2. Check sender has sufficient USDC balance");
      console.log("3. Verify contract is not paused");
      console.log("4. Check token is whitelisted");
      console.log("5. Ensure recipient address is valid");
      process.exit(1);
    }
  }
}

// CLI execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log("Usage: node test-gasless-flow.js [SENDER_PRIVATE_KEY] [RECIPIENT_ADDRESS]");
    console.log("");
    console.log("Environment variables required:");
    console.log("  CHAIN_RPC_URL - Sepolia RPC endpoint");
    console.log("  RELAYER_CONTRACT - GaslessRelayer contract address");
    console.log("");
    console.log("Example:");
    console.log("  CHAIN_RPC_URL='https://sepolia.infura.io/v3/YOUR_KEY' \\");
    console.log("  RELAYER_CONTRACT='0x...' \\");
    console.log("  node test-gasless-flow.js 0x1234...abcd 0xrecipient...address");
    process.exit(1);
  }

  const [senderPrivateKey, recipientAddress] = args;

  try {
    const tester = new GaslessFlowTester(senderPrivateKey, recipientAddress);
    await tester.runFullTest();
  } catch (error) {
    console.error("Fatal error:", error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { GaslessFlowTester };