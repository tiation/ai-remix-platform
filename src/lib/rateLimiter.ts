interface RateLimitInfo {
  count: number;
  resetTime: number;
}

export class RateLimiter {
  private cache: Map<string, RateLimitInfo>;
  private readonly maxRequests: number;
  private readonly timeWindow: number;

  constructor() {
    this.cache = new Map();
    this.maxRequests = parseInt(process.env.RATE_LIMIT_REQUESTS || '100', 10);
    this.timeWindow = parseInt(process.env.RATE_LIMIT_DURATION || '60', 10) * 1000; // Convert to milliseconds
  }

  async isAllowed(key: string): Promise<boolean> {
    const now = Date.now();
    const info = this.cache.get(key);

    if (!info) {
      this.cache.set(key, {
        count: 1,
        resetTime: now + this.timeWindow,
      });
      return true;
    }

    if (now > info.resetTime) {
      this.cache.set(key, {
        count: 1,
        resetTime: now + this.timeWindow,
      });
      return true;
    }

    if (info.count >= this.maxRequests) {
      return false;
    }

    info.count += 1;
    this.cache.set(key, info);
    return true;
  }

  // Clean up expired entries periodically
  cleanup(): void {
    const now = Date.now();
    for (const [key, info] of this.cache.entries()) {
      if (now > info.resetTime) {
        this.cache.delete(key);
      }
    }
  }
}
