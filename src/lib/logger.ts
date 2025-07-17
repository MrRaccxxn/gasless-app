// Simple logging service for MVP
// In production, use Winston, Pino, or similar

export enum LogLevel {
  ERROR = "ERROR",
  WARN = "WARN",
  INFO = "INFO",
  DEBUG = "DEBUG",
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  meta?: Record<string, any>;
}

export class Logger {
  private isDevelopment = process.env.NODE_ENV === "development";

  private formatMessage(level: LogLevel, message: string, meta?: Record<string, any>): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      meta,
    };
  }

  private log(level: LogLevel, message: string, meta?: Record<string, any>): void {
    const entry = this.formatMessage(level, message, meta);

    if (this.isDevelopment) {
      // Pretty print for development
      console.log(`[${entry.timestamp}] ${entry.level}: ${entry.message}`);
      if (entry.meta) {
        console.log("Meta:", entry.meta);
      }
    } else {
      // JSON format for production
      console.log(JSON.stringify(entry));
    }
  }

  error(message: string, meta?: Record<string, any>): void {
    this.log(LogLevel.ERROR, message, meta);
  }

  warn(message: string, meta?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, meta);
  }

  info(message: string, meta?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, meta);
  }

  debug(message: string, meta?: Record<string, any>): void {
    if (this.isDevelopment) {
      this.log(LogLevel.DEBUG, message, meta);
    }
  }

  // Specific logging methods for relay operations
  relayAttempt(userAddress: string, tokenAddress: string, amount: string, meta?: Record<string, any>): void {
    this.info("Relay attempt started", {
      userAddress,
      tokenAddress,
      amount,
      ...meta,
    });
  }

  relaySuccess(txHash: string, userAddress: string, tokenAddress: string, amount: string, gasUsed?: bigint): void {
    this.info("Relay transaction successful", {
      txHash,
      userAddress,
      tokenAddress,
      amount,
      gasUsed: gasUsed?.toString(),
    });
  }

  relayFailure(userAddress: string, tokenAddress: string, amount: string, error: string, meta?: Record<string, any>): void {
    this.error("Relay transaction failed", {
      userAddress,
      tokenAddress,
      amount,
      error,
      ...meta,
    });
  }

  rateLimitHit(identifier: string, endpoint: string): void {
    this.warn("Rate limit exceeded", {
      identifier,
      endpoint,
    });
  }

  securityViolation(type: string, identifier: string, details: Record<string, any>): void {
    this.error("Security violation detected", {
      type,
      identifier,
      details,
    });
  }

  recaptchaFailure(identifier: string): void {
    this.warn("reCAPTCHA verification failed", {
      identifier,
    });
  }

  validationError(endpoint: string, errors: any, identifier?: string): void {
    this.warn("Validation error", {
      endpoint,
      errors,
      identifier,
    });
  }
}

export const logger = new Logger();
