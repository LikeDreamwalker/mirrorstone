import { RateLimitTracker } from "@/lib/rate-limit-tracker";

export const runtime = "nodejs";

export async function GET() {
  try {
    const healthStatus = {
      timestamp: new Date().toISOString(),
      services: {
        deepseek: {
          status: "unknown" as "online" | "offline",
          error: null as string | null,
        },
        brave: {
          status: "unknown" as "online" | "offline" | "disabled",
          error: null as string | null,
          usage: {
            used: 0,
            remaining: 0,
            limit: 0,
            percentage: 0,
            lastUpdated: null as string | null,
          },
        },
      },
      overall: "checking" as "healthy" | "degraded" | "down" | "checking",
      fluidCompute: {
        enabled: true,
        sharedState: true,
      },
    };

    // Check DeepSeek
    if (!process.env.DEEPSEEK_API_KEY) {
      healthStatus.services.deepseek = {
        status: "offline",
        error: "API key not configured",
      };
    } else {
      const isValidKey = process.env.DEEPSEEK_API_KEY.startsWith("sk-");
      healthStatus.services.deepseek = {
        status: isValidKey ? "online" : "offline",
        error: isValidKey ? null : "Invalid API key format",
      };
    }

    // 🌊 Check Brave using Fluid Compute shared state
    if (!process.env.BRAVE_API_KEY) {
      healthStatus.services.brave = {
        status: "offline",
        error: "API key not configured",
        usage: {
          used: 0,
          remaining: 0,
          limit: 0,
          percentage: 0,
          lastUpdated: null,
        },
      };
    } else {
      const usage = RateLimitTracker.getUsageInfo();

      let braveStatus: "online" | "offline" | "disabled" = "online";
      let braveError: string | null = null;

      // 🎯 Better status logic as you requested
      if (RateLimitTracker.isRateLimited()) {
        braveStatus = "disabled";
        braveError = `Online search disabled - quota exceeded (${usage.used}/${usage.limit} searches used this month)`;
      } else if (usage.percentage >= 90) {
        // Still online but warning
        braveError = `Search quota almost exhausted (${usage.used}/${usage.limit} used, ${usage.remaining} remaining)`;
      }

      healthStatus.services.brave = {
        status: braveStatus,
        error: braveError,
        usage: {
          used: usage.used,
          remaining: usage.remaining,
          limit: usage.limit,
          percentage: usage.percentage,
          lastUpdated: usage.lastUpdated.toISOString(),
        },
      };
    }

    // 🎯 Updated overall health logic
    if (healthStatus.services.deepseek.status === "offline") {
      healthStatus.overall = "down";
    } else if (healthStatus.services.brave.status === "disabled") {
      healthStatus.overall = "degraded"; // AI works, but no search
    } else if (
      healthStatus.services.deepseek.status === "online" &&
      healthStatus.services.brave.status === "online"
    ) {
      healthStatus.overall = "healthy";
    } else {
      healthStatus.overall = "checking";
    }

    return Response.json(healthStatus);
  } catch (error) {
    console.error("Health check error:", error);
    return Response.json(
      {
        error: "Health check failed",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
