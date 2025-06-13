import type { TextBlock } from "./types";
import { MarkdownRenderer } from "@/components/markdown-renderer";

interface TextBlockProps {
  block: TextBlock;
}

export function TextBlockComponent({ block }: TextBlockProps) {
  const { content, status } = block;

  if (status === "init") {
    return (
      <div className="my-2 h-6 bg-muted animate-pulse rounded w-3/4"></div>
    );
  }

  // Use MarkdownRenderer for rich text capabilities
  return (
    <div className="my-2">
      <MarkdownRenderer content={content || ""} />
    </div>
  );
}
