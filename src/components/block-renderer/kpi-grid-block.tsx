import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { KPIGridBlock } from "./types";

interface KPIGridBlockProps {
  data: KPIGridBlock;
  isStreaming?: boolean; // ✅ Added missing props
  status?: "initializing" | "streaming" | "completed" | "error"; // ✅ Added missing props
}

export function KPIGridBlockComponent({
  data,
  isStreaming,
  status,
}: KPIGridBlockProps) {
  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case "down":
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-400" />;
    }
  };

  const getTrendColor = (trend?: string) => {
    switch (trend) {
      case "up":
        return "text-green-600";
      case "down":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div className="space-y-4">
      {/* ✅ Show title and loading state */}
      {data.title && (
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{data.title}</h3>
          {isStreaming && (
            <div className="text-sm text-muted-foreground animate-pulse">
              Updating metrics...
            </div>
          )}
        </div>
      )}

      <div
        className={`grid gap-4 ${
          data.layout === "list"
            ? "grid-cols-1"
            : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
        }`}
      >
        {data.metrics.length === 0 ? (
          <div className="col-span-full text-center text-muted-foreground">
            {isStreaming ? "Loading metrics..." : "No metrics available"}
          </div>
        ) : (
          data.metrics.map((metric, index) => (
            <Card
              key={metric.id || index}
              className={isStreaming ? "animate-pulse" : ""}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {metric.label}
                </CardTitle>
                {getTrendIcon(metric.trend)}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metric.value}</div>
                {metric.change && (
                  <p className={`text-xs ${getTrendColor(metric.trend)}`}>
                    {metric.change}
                  </p>
                )}
                {metric.description && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {metric.description}
                  </p>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
