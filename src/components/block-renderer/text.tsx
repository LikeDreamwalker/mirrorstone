import type { TextBlock } from "./types";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { BlurFade } from "@/components/magicui/blur-fade";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface TextBlockProps {
  block?: TextBlock;
  content?: string;
  status?: "init" | "running" | "finished";
  pure?: boolean;
  className?: string;
}

export function TextBlockComponent({
  block,
  content: directContent,
  status: directStatus,
  pure = false,
  className,
}: TextBlockProps) {
  const content = directContent ?? block?.content ?? "";
  const status = directStatus ?? block?.status ?? "finished";

  if ((status === "init" || status === "running") && !pure) {
    return (
      <BlurFade delay={0} duration={0.3} direction="up" blur="2px">
        <div className={cn("space-y-2", className)}>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-1/3" />
        </div>
      </BlurFade>
    );
  }
  if (status === "finished") {
    if (pure) {
      return <>{content}</>;
    } else {
      return <MarkdownRenderer content={content} />;
    }
  }
  return <></>;
}
