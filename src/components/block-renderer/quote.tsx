import { Quote } from "lucide-react";
import type { QuoteBlock } from "./types";
import { TextBlockComponent } from "./text";

interface QuoteBlockProps {
  block: QuoteBlock;
}

export function QuoteBlockComponent({ block }: QuoteBlockProps) {
  const { content, author, source, status } = block;

  if (status === "init") {
    return (
      <div className="my-4 border-l-4 border-muted pl-4">
        <div className="space-y-2">
          <div className="h-4 w-full bg-muted rounded animate-pulse" />
          <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
          <div className="h-3 w-1/3 bg-muted rounded animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <blockquote className="my-4 border-l-4 border-primary pl-4 italic">
      <div className="flex items-start gap-2">
        <Quote className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
        <div className="flex-1">
          {content && (
            <div className="text-lg">
              <TextBlockComponent
                content={content}
                status="finished"
                className="m-0"
              />
            </div>
          )}
          {(author || source) && (
            <footer className="mt-2 text-sm text-muted-foreground not-italic">
              {author && <span>— {author}</span>}
              {source && (
                <span>
                  {author ? ", " : "— "}
                  <cite>{source}</cite>
                </span>
              )}
            </footer>
          )}
        </div>
      </div>
    </blockquote>
  );
}
