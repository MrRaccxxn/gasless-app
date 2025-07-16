// In-memory rate limiting for MVP
// In production, use Redis or similar

interface RateLimitEntry {
  count: number;
  resetTime: number;
  gasUsed: bigint;
  lastReset: number;
}

interface RateLimiterOptions {
  maxRequestsPerMinute: number;
  maxGasPerHour: bigint;
  windowMs: number;
  gasWindowMs: number;
}

export class RateLimiter {
  private storage: Map<string, RateLimitEntry> = new Map();
  private bannedWallets: Map<string, number> = new Map(); // wallet -> unban timestamp
  private options: RateLimiterOptions;

  constructor(options?: Partial<RateLimiterOptions>) {
    this.options = {
      maxRequestsPerMinute: parseInt(process.env.MAX_REQUESTS_PER_MINUTE || '10'),
      maxGasPerHour: BigInt(process.env.MAX_GAS_PER_HOUR || '1000000'),
      windowMs: 60 * 1000, // 1 minute
      gasWindowMs: 60 * 60 * 1000, // 1 hour
      ...options,
    };

    // Clean up old entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  // Check if request is allowed
  checkLimit(identifier: string): { allowed: boolean; retryAfter?: number } {
    const now = Date.now();
    
    // Check if wallet is banned
    const banUntil = this.bannedWallets.get(identifier);
    if (banUntil && now < banUntil) {
      return { allowed: false, retryAfter: Math.ceil((banUntil - now) / 1000) };
    }

    // Clean up expired ban
    if (banUntil && now >= banUntil) {
      this.bannedWallets.delete(identifier);
    }

    let entry = this.storage.get(identifier);
    
    if (!entry) {
      entry = {
        count: 0,
        resetTime: now + this.options.windowMs,
        gasUsed: BigInt(0),
        lastReset: now,
      };
      this.storage.set(identifier, entry);
    }

    // Reset count if window expired
    if (now >= entry.resetTime) {
      entry.count = 0;
      entry.resetTime = now + this.options.windowMs;
    }

    // Reset gas usage if hour expired
    if (now >= entry.lastReset + this.options.gasWindowMs) {
      entry.gasUsed = BigInt(0);
      entry.lastReset = now;
    }

    // Check rate limit
    if (entry.count >= this.options.maxRequestsPerMinute) {
      return {
        allowed: false,
        retryAfter: Math.ceil((entry.resetTime - now) / 1000),
      };
    }

    return { allowed: true };
  }

  // Increment request count
  incrementCount(identifier: string): void {
    const entry = this.storage.get(identifier);
    if (entry) {
      entry.count++;
    }
  }

  // Add gas usage
  addGasUsage(identifier: string, gasUsed: bigint): boolean {
    const entry = this.storage.get(identifier);
    if (!entry) return false;

    const newGasUsed = entry.gasUsed + gasUsed;
    if (newGasUsed > this.options.maxGasPerHour) {
      // Temporary ban for 1 hour
      this.bannedWallets.set(identifier, Date.now() + this.options.gasWindowMs);
      return false;
    }

    entry.gasUsed = newGasUsed;
    return true;
  }

  // Manual ban (for abuse detection)
  banWallet(identifier: string, durationMs: number): void {
    this.bannedWallets.set(identifier, Date.now() + durationMs);
  }

  // Check if wallet is banned
  isBanned(identifier: string): boolean {
    const banUntil = this.bannedWallets.get(identifier);
    return banUntil ? Date.now() < banUntil : false;
  }

  // Get current usage stats
  getUsageStats(identifier: string): {
    requestCount: number;
    gasUsed: bigint;
    resetTime: number;
    gasResetTime: number;
  } | null {
    const entry = this.storage.get(identifier);
    if (!entry) return null;

    return {
      requestCount: entry.count,
      gasUsed: entry.gasUsed,
      resetTime: entry.resetTime,
      gasResetTime: entry.lastReset + this.options.gasWindowMs,
    };
  }

  // Cleanup expired entries
  private cleanup(): void {
    const now = Date.now();
    
    // Clean up rate limit entries
    for (const [key, entry] of this.storage.entries()) {
      if (now >= entry.resetTime && now >= entry.lastReset + this.options.gasWindowMs) {
        this.storage.delete(key);
      }
    }

    // Clean up expired bans
    for (const [key, banUntil] of this.bannedWallets.entries()) {
      if (now >= banUntil) {
        this.bannedWallets.delete(key);
      }
    }
  }
}

export const rateLimiter = new RateLimiter();