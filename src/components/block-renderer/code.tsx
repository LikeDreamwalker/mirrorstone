import type { CodeBlock } from "./types";

interface CodeBlockProps {
  block: CodeBlock;
}

export function CodeBlockComponent({ block }: CodeBlockProps) {
  const { content, language, status } = block;

  console.log("🔍 CodeBlock debug:", {
    id: block.id,
    hasContent: !!content,
    contentLength: content?.length || 0,
    language,
    status,
  });

  if (status === "init") {
    return (
      <div className="my-4 rounded-md bg-muted p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-4 w-16 bg-muted-foreground/20 rounded animate-pulse"></div>
        </div>
        <div className="space-y-2">
          <div className="h-4 w-full bg-muted-foreground/20 rounded animate-pulse"></div>
          <div className="h-4 w-5/6 bg-muted-foreground/20 rounded animate-pulse"></div>
          <div className="h-4 w-4/6 bg-muted-foreground/20 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (status === "running") {
    return (
      <div className="my-4 rounded-md bg-muted p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="text-xs text-muted-foreground">
            {language || "code"}
          </div>
          <div className="animate-spin h-3 w-3 border border-primary border-t-transparent rounded-full"></div>
        </div>
        <div className="text-sm text-muted-foreground">Generating code...</div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="my-4 rounded-md bg-yellow-50 border border-yellow-200 p-4">
        <div className="text-sm text-yellow-700">
          No code content found in block: {block.id}
        </div>
      </div>
    );
  }

  return (
    <div className="my-4 rounded-md bg-muted p-4 overflow-x-auto">
      <div className="flex items-center gap-2 mb-2">
        <div className="text-xs text-muted-foreground">
          {language || "code"}
        </div>
        <div className="text-xs text-muted-foreground/60">
          {content.length} chars
        </div>
      </div>
      <pre className="text-sm font-mono">
        <code className="whitespace-pre-wrap break-words">{content}</code>
      </pre>
    </div>
  );
}
