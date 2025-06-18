import type { TextBlock } from "./types";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { BlurFade } from "@/components/magicui/blur-fade";

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
  const content = directContent ?? block?.content ?? "";
  const status = directStatus ?? block?.status ?? "finished";

  if (status === "init") {
    return (
      <BlurFade delay={0} duration={0.3} direction="up" blur="2px">
        <div
          className={`h-6 bg-muted animate-pulse rounded w-3/4 ${
            className || ""
          }`}
        ></div>
      </BlurFade>
    );
  }

  if (status === "running") {
    return (
      <BlurFade delay={0} duration={0.4} direction="left" blur="3px">
        <div className={`${className || ""}`}>
          <div className="flex items-center gap-2">
            <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
            <span className="text-muted-foreground text-sm">Generating...</span>
          </div>
        </div>
      </BlurFade>
    );
  }

  // For finished content, add subtle blur animation to the rendered content
  return (
    <div className={className}>
      <MarkdownRenderer content={content} />
    </div>
  );
}
