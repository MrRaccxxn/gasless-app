import { ethers } from "ethers";

//TODO: Replace with constants
// Chainlink ETH/USD Price Feed (Sepolia)
const ETH_USD_FEED_ADDRESS = "0x694AA1769357215DE4FAC081bf1f309aDC325306";
const PRICE_FEED_ABI = [
  "function latestRoundData() external view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)"
];

const CACHE_DURATION = 30 * 1000; // 30 seconds in milliseconds

interface PriceData {
  price: number;
  timestamp: number;
}

class PriceOracle {
  private provider: ethers.JsonRpcProvider | null;
  private priceCache: Map<string, PriceData> = new Map();

  constructor() {
    const rpcUrl = process.env.CHAIN_RPC_URL;
    this.provider = rpcUrl ? new ethers.JsonRpcProvider(rpcUrl) : null;
  }

  async getEthToUsdPrice(): Promise<number> {
    const cacheKey = "ETH_USD";
    const cached = this.priceCache.get(cacheKey);
    
    // Return cached price if still valid
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.price;
    }

    try {
      // Try Chainlink first
      if (this.provider) {
        const price = await this.getChainlinkPrice();
        if (price > 0) {
          this.priceCache.set(cacheKey, { price, timestamp: Date.now() });
          return price;
        }
      }

      // Fallback to CoinGecko API
      const price = await this.getCoinGeckoPrice();
      this.priceCache.set(cacheKey, { price, timestamp: Date.now() });
      return price;
    } catch (error) {
      console.error("Failed to fetch ETH price:", error);
      
      // Return cached price if available, otherwise fallback
      if (cached) {
        return cached.price;
      }
      
      // Final fallback
      return 3000; // $3000 ETH as fallback
    }
  }

  private async getChainlinkPrice(): Promise<number> {
    if (!this.provider) return 0;

    try {
      const contract = new ethers.Contract(
        ETH_USD_FEED_ADDRESS,
        PRICE_FEED_ABI,
        this.provider
      );

      const { answer, updatedAt } = await contract.latestRoundData();
      
      // Check if price is stale (older than 1 hour)
      const currentTime = Math.floor(Date.now() / 1000);
      if (currentTime - Number(updatedAt) > 3600) {
        console.warn("Chainlink price is stale, using fallback");
        return 0;
      }

      // Convert from 8 decimals to USD
      return Number(answer) / 100000000;
    } catch (error) {
      console.error("Chainlink price fetch failed:", error);
      return 0;
    }
  }

  private async getCoinGeckoPrice(): Promise<number> {
    try {
      const response = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd",
        {
          headers: {
            "Accept": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status}`);
      }

      const data = await response.json();
      return data.ethereum.usd;
    } catch (error) {
      console.error("CoinGecko price fetch failed:", error);
      throw error;
    }
  }

  async getTokenToUsdPrice(tokenAddress: string): Promise<number> {
    // For stablecoins, assume 1:1 USD ratio
    // In production, you'd use specific price feeds for each token
    return 1.0;
  }

  async getGasPrice(): Promise<bigint> {
    if (!this.provider) {
      return 20000000000n; // 20 Gwei default
    }

    try {
      const feeData = await this.provider.getFeeData();
      return feeData.gasPrice || 20000000000n;
    } catch (error) {
      console.error("Failed to get gas price:", error);
      return 20000000000n; // 20 Gwei default
    }
  }

  async estimateGasLimit(tokenAddress: string, transferAmount: bigint): Promise<bigint> {
    // Base gas for ERC-20 transfer
    const baseGas = 65000n;
    
    // Additional gas for permit if needed
    const permitGas = 50000n;
    
    // Buffer for safety
    const buffer = 20000n;
    
    return baseGas + permitGas + buffer;
  }
}

export const priceOracle = new PriceOracle(); 