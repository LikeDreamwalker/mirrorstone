import React, { useMemo, useCallback, memo } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { BlockRenderer } from "@/components/block-renderer";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

export interface MessageItemProps {
  message: any;
  copiedMessageId: string | null;
  onCopy: (text: string, messageId: string) => void;
  status: string;
  showReasoning?: boolean; // for main chat, default true
}

export const MessageItem = memo(
  ({
    message,
    copiedMessageId,
    onCopy,
    status,
    showReasoning = true,
  }: MessageItemProps) => {
    // Don't memoize textToCopy during streaming to allow real-time updates
    const textToCopy = useMemo(() => {
      if (status === "streaming" && message.role === "assistant") {
        return (
          message.parts
            ?.filter((part: any) => part.type === "text")
            .map((part: any) => part.text)
            .join("\n") ?? ""
        );
      }
      return (
        message.parts
          ?.filter((part: any) => part.type === "text")
          .map((part: any) => part.text)
          .join("\n") ?? ""
      );
    }, [message.parts, status, message.role]);

    // Memoize class names
    const containerClasses = useMemo(
      () =>
        `flex gap-2 ${
          message.role === "user" ? "justify-end" : "justify-start"
        }`,
      [message.role]
    );

    const innerClasses = useMemo(
      () =>
        `flex gap-2 transition ${
          message.role === "user"
            ? "flex-row-reverse max-w-[95%]"
            : "flex-row max-w-[95%]"
        }`,
      [message.role]
    );

    const cardClasses = useMemo(
      () =>
        cn("p-2.5 relative group w-full overflow-hidden", {
          "bg-primary text-primary-foreground border-primary/20":
            message.role === "user",
          "bg-background": message.role !== "user",
        }),
      [message.role]
    );

    const handleCopy = useCallback(() => {
      onCopy(textToCopy, message.id);
    }, [textToCopy, message.id, onCopy]);

    return (
      <div className={containerClasses}>
        <div className={innerClasses}>
          <Card className={cardClasses}>
            {message.role === "user" ? (
              <div className="whitespace-pre-wrap break-words">
                {message.parts?.map((part: any, idx: number) =>
                  part.type === "text" ? (
                    <MarkdownRenderer key={idx} content={part.text} />
                  ) : null
                )}
              </div>
            ) : (
              <div className="prose-container">
                {message.parts?.map((part: any, idx: number) => {
                  if (part.type === "text") {
                    return (
                      <BlockRenderer key={idx} streamContent={part.text} />
                    );
                  }
                  if (showReasoning && part.type === "reasoning") {
                    return (
                      <Card key={idx} className="p-0 mb-2 bg-background/50">
                        <Accordion type="single" collapsible>
                          <AccordionItem value="reasoning">
                            <CardHeader className="px-2.5 py-0">
                              <AccordionTrigger className="text-xs font-semibold">
                                Thoughts
                              </AccordionTrigger>
                            </CardHeader>
                            <AccordionContent>
                              <CardContent className="px-2.5 py-0 text-xs text-muted-foreground break-words">
                                {part.text}
                              </CardContent>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      </Card>
                    );
                  }
                  return null;
                })}
              </div>
            )}

            {message.role === "assistant" && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity h-4 w-4 p-0 hover:bg-background/80"
                onClick={handleCopy}
              >
                {copiedMessageId === message.id ? (
                  <Check className="h-2.5 w-2.5" />
                ) : (
                  <Copy className="h-2.5 w-2.5" />
                )}
              </Button>
            )}
          </Card>
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Always re-render if status changed to/from streaming
    if (prevProps.status !== nextProps.status) {
      return false;
    }
    // Always re-render streaming assistant messages
    if (
      nextProps.status === "streaming" &&
      nextProps.message.role === "assistant"
    ) {
      return false;
    }
    // For non-streaming messages, do normal comparison
    return (
      prevProps.message.id === nextProps.message.id &&
      prevProps.message.role === nextProps.message.role &&
      JSON.stringify(prevProps.message.parts) ===
        JSON.stringify(nextProps.message.parts) &&
      prevProps.copiedMessageId === nextProps.copiedMessageId &&
      prevProps.status === nextProps.status
    );
  }
);
MessageItem.displayName = "MessageItem";
