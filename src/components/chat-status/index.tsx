"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WifiOff, Zap } from "lucide-react";

export function ChatStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [apiStatus, setApiStatus] = useState<"checking" | "online" | "offline">(
    "checking"
  );

  useEffect(() => {
    const checkOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    const checkApiStatus = async () => {
      try {
        const response = await fetch("/api/health");
        setApiStatus(response.ok ? "online" : "offline");
      } catch {
        setApiStatus("offline");
      }
    };

    checkOnlineStatus();
    checkApiStatus();

    window.addEventListener("online", checkOnlineStatus);
    window.addEventListener("offline", checkOnlineStatus);

    const interval = setInterval(checkApiStatus, 30000); // Check every 30 seconds

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
            You&#39;re offline
          </span>
        </div>
      </Card>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Badge
        variant={apiStatus === "online" ? "default" : "secondary"}
        className="text-xs"
      >
        <Zap className="h-3 w-3 mr-1" />
        DeepSeek V3 {apiStatus === "online" ? "Ready" : "Checking..."}
      </Badge>
    </div>
  );
}
