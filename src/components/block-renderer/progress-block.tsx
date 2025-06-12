import { Progress } from "@/components/ui/progress";
import type { ProgressBlock } from "./types";

interface ProgressBlockProps {
  data: ProgressBlock;
  isStreaming?: boolean; // ✅ Added missing props
  status?: "initializing" | "streaming" | "completed" | "error"; // ✅ Added missing props
}

export function ProgressBlockComponent({
  data,
  isStreaming,
  status,
}: ProgressBlockProps) {
  const percentage = (data.value / (data.max || 100)) * 100;

  return (
    <div className="space-y-2">
      {data.title && <h3 className="text-lg font-semibold">{data.title}</h3>}

      <div className="flex justify-between text-sm">
        <span className="font-medium">{data.label}</span>
        <span className="text-muted-foreground">
          {data.showPercentage ? `${Math.round(percentage)}%` : data.value}
          {data.max && !data.showPercentage ? `/${data.max}` : ""}
        </span>
      </div>

      <Progress
        value={percentage}
        className={`w-full ${isStreaming ? "animate-pulse" : ""}`}
      />

      {data.description && (
        <p className="text-xs text-muted-foreground">{data.description}</p>
      )}
    </div>
  );
}
