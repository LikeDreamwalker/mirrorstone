// 🎯 Configuration - Change this number to set your limit
const MONTHLY_SEARCH_LIMIT = 1000; // Your budget limit

interface RateLimitState {
  monthly: {
    limit: number;
    remaining: number;
    used: number;
    resetTime: Date | null;
  };
  lastUpdated: Date;
  status: "healthy" | "rate_limited" | "unknown";
}

// 🌊 Global state - shared across all requests in Fluid Compute
let globalRateLimitState: RateLimitState = {
  monthly: {
    limit: MONTHLY_SEARCH_LIMIT, // Use the constant
    remaining: MONTHLY_SEARCH_LIMIT,
    used: 0,
    resetTime: null,
  },
  lastUpdated: new Date(),
  status: "unknown",
};

export class RateLimitTracker {
  static updateFromBraveResponse(response: Response): void {
    const limit = response.headers.get("X-RateLimit-Limit");
    const remaining = response.headers.get("X-RateLimit-Remaining");
    const reset = response.headers.get("X-RateLimit-Reset");

    console.log("📊 Brave headers received:", { limit, remaining, reset });

    if (remaining) {
      // Parse "1, 1000" format (per-second, per-month)
      const parts = remaining.split(",");
      if (parts.length >= 2) {
        const monthlyRemaining = parseInt(parts[1].trim());

        // Use our configured limit, not what Brave tells us
        const ourLimit = MONTHLY_SEARCH_LIMIT;
        const ourUsed = ourLimit - monthlyRemaining;

        // Update global state
        globalRateLimitState = {
          monthly: {
            limit: ourLimit,
            remaining: monthlyRemaining,
            used: Math.max(ourUsed, globalRateLimitState.monthly.used), // Take the max to avoid going backwards
            resetTime: reset
              ? new Date(
                  Date.now() +
                    parseInt(reset.split(",")[1]?.trim() || "0") * 1000
                )
              : null,
          },
          lastUpdated: new Date(),
          status: response.status === 429 ? "rate_limited" : "healthy",
        };

        console.log(
          `🌊 Global state updated: ${globalRateLimitState.monthly.used}/${ourLimit} searches used`
        );
      }
    } else {
      // If no headers, increment our local counter
      globalRateLimitState.monthly.used += 1;
      globalRateLimitState.monthly.remaining = Math.max(
        0,
        MONTHLY_SEARCH_LIMIT - globalRateLimitState.monthly.used
      );
      globalRateLimitState.lastUpdated = new Date();

      console.log(
        `📈 Local counter: ${globalRateLimitState.monthly.used}/${MONTHLY_SEARCH_LIMIT} searches used`
      );
    }
  }

  static getCurrentState(): RateLimitState {
    return { ...globalRateLimitState };
  }

  static isRateLimited(): boolean {
    return (
      globalRateLimitState.monthly.used >= MONTHLY_SEARCH_LIMIT ||
      globalRateLimitState.status === "rate_limited"
    );
  }

  static getUsageInfo() {
    const state = globalRateLimitState;
    const percentage =
      state.monthly.limit > 0
        ? Math.round((state.monthly.used / state.monthly.limit) * 100)
        : 0;

    return {
      used: state.monthly.used,
      remaining: state.monthly.remaining,
      limit: state.monthly.limit,
      percentage,
      status: state.status,
      lastUpdated: state.lastUpdated,
      resetTime: state.monthly.resetTime,
    };
  }

  static resetUsage(): void {
    globalRateLimitState = {
      monthly: {
        limit: MONTHLY_SEARCH_LIMIT,
        remaining: MONTHLY_SEARCH_LIMIT,
        used: 0,
        resetTime: null,
      },
      lastUpdated: new Date(),
      status: "healthy",
    };
    console.log("🔄 Usage counter reset");
  }
}
