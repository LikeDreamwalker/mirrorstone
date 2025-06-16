import { Progress } from "@/components/ui/progress";
import type { ProgressBlock } from "./types";
import { TextBlockComponent } from "./text";

interface ProgressBlockProps {
  block: ProgressBlock;
}

export function ProgressBlockComponent({ block }: ProgressBlockProps) {
  const { value, max = 100, content, label, status } = block;

  if (status === "init") {
    return (
      <div className="my-4 space-y-2">
        <div className="h-3 w-16 bg-muted rounded animate-pulse" />
        <div className="h-2 w-full bg-muted rounded animate-pulse" />
      </div>
    );
  }

  const percentage = Math.round((value / max) * 100);

  return (
    <div className="my-4 space-y-2">
      {content && <TextBlockComponent content={content} status="finished" />}
      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{label || "Progress"}</span>
          <span className="font-mono text-xs">
            {percentage}% ({value}/{max})
          </span>
        </div>
        <Progress value={percentage} className="h-2" />
      </div>
    </div>
  );
}
