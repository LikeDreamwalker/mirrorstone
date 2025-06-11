"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WifiOff, Zap, Search, AlertTriangle, X } from "lucide-react";

interface HealthStatus {
  services: {
    deepseek: { status: "online" | "offline"; error: string | null };
    brave: {
      status: "online" | "offline" | "disabled"; // Changed from "rate_limited"
      error: string | null;
      usage: {
        used: number;
        remaining: number;
        limit: number;
        percentage: number;
        lastUpdated: string | null;
      };
    };
  };
  overall: "healthy" | "degraded" | "down" | "checking";
  fluidCompute?: {
    enabled: boolean;
    sharedState: boolean;
  };
}

export function ChatStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);

  useEffect(() => {
    const checkOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    const checkHealthStatus = async () => {
      try {
        const response = await fetch("/api/health");
        if (response.ok) {
          const health = await response.json();
          setHealthStatus(health);
        }
      } catch (error) {
        console.error("Health check failed:", error);
        setHealthStatus(null);
      }
    };

    checkOnlineStatus();
    checkHealthStatus();

    window.addEventListener("online", checkOnlineStatus);
    window.addEventListener("offline", checkOnlineStatus);

    const interval = setInterval(checkHealthStatus, 30000);

    return () => {
      window.removeEventListener("online", checkOnlineStatus);
      window.removeEventListener("offline", checkOnlineStatus);
      clearInterval(interval);
    };
  }, []);

  if (!isOnline) {
    return (
      <Card className="p-3 bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800">
        <div className="flex items-center gap-2">
          <WifiOff className="h-4 w-4 text-red-600" />
          <span className="text-sm text-red-700 dark:text-red-300">
            You&apos;re offline
          </span>
        </div>
      </Card>
    );
  }

  const getUsageColor = (percentage: number, status: string) => {
    if (status === "disabled") return "destructive";
    if (percentage >= 90) return "secondary"; // Warning but still working
    if (percentage >= 70) return "outline";
    return "default";
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* DeepSeek Status */}
      <Badge
        variant={
          healthStatus?.services.deepseek.status === "online"
            ? "default"
            : "secondary"
        }
        className="text-xs"
      >
        <Zap className="h-3 w-3 mr-1" />
        DeepSeek{" "}
        {healthStatus?.services.deepseek.status === "online"
          ? "Ready"
          : "Checking..."}
      </Badge>

      {/* Brave Search Status with Better Labels */}
      {healthStatus?.services.brave && (
        <Badge
          variant={getUsageColor(
            healthStatus.services.brave.usage.percentage,
            healthStatus.services.brave.status
          )}
          className="text-xs"
        >
          {healthStatus.services.brave.status === "disabled" ? (
            <X className="h-3 w-3 mr-1" />
          ) : (
            <Search className="h-3 w-3 mr-1" />
          )}
          Online Search{" "}
          {healthStatus.services.brave.status === "disabled"
            ? "Disabled"
            : healthStatus.services.brave.status === "offline"
            ? "Offline"
            : "Ready"}
        </Badge>
      )}

      {/* Fluid Compute Indicator */}
      {healthStatus?.fluidCompute?.enabled && (
        <Badge variant="outline" className="text-xs">
          🌊 Fluid
        </Badge>
      )}

      {/* Overall Status with Better Messages */}
      {healthStatus?.overall === "degraded" && (
        <Badge variant="secondary" className="text-xs">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Search Disabled
        </Badge>
      )}

      {healthStatus?.overall === "down" && (
        <Badge variant="destructive" className="text-xs">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Service Down
        </Badge>
      )}
    </div>
  );
}
