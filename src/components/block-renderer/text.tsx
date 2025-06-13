import type { TextBlock } from "./types";
import { MarkdownRenderer } from "@/components/markdown-renderer";

interface TextBlockProps {
  block?: TextBlock;
  content?: string;
  status?: "init" | "running" | "finished";
  className?: string;
}

export function TextBlockComponent({
  block,
  content: directContent,
  status: directStatus,
  className,
}: TextBlockProps) {
  // Support both block prop and direct props for flexibility
  const content = directContent ?? block?.content ?? "";
  const status = directStatus ?? block?.status ?? "finished";

  if (status === "init") {
    return (
      <div
        className={`h-6 bg-muted animate-pulse rounded w-3/4 ${
          className || ""
        }`}
      ></div>
    );
  }

  if (status === "running") {
    return (
      <div className={`${className || ""}`}>
        <div className="flex items-center gap-2">
          <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
          <span className="text-muted-foreground text-sm">Generating...</span>
        </div>
      </div>
    );
  }

  // Use MarkdownRenderer for rich text capabilities
  return (
    <div className={` ${className || ""}`}>
      <MarkdownRenderer content={content} />
    </div>
  );
}
