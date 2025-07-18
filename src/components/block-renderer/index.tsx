"use client";

import { useMemo } from "react";
import type { Block } from "./types";
import { TextBlockComponent } from "./text";
import { CardBlockComponent } from "./card";
import { CodeBlockComponent } from "./code";
import { AlertBlockComponent } from "./alert";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { AccordionBlockComponent } from "./accordion";
import { ProgressBlockComponent } from "./progress";
import { QuoteBlockComponent } from "./quote";
import { TableBlockComponent } from "./table";
import { BlurFade } from "@/components/magicui/blur-fade";

interface BlockRendererProps {
  streamContent: string;
}

// Function to clean JSON string by removing/escaping control characters
const cleanJsonString = (jsonStr: string): string => {
  return (
    jsonStr
      // Replace problematic control characters with spaces
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, " ")
      // Normalize multiple spaces
      .replace(/\s+/g, " ")
      .trim()
  );
};

// More robust JSON extraction with better error handling
const extractJsonBlocks = (content: string): Record<string, Block> => {
  const blocks: Record<string, Block> = {};
  let remainingContent = content;

  while (remainingContent.length > 0) {
    const openBraceIndex = remainingContent.indexOf("{");
    if (openBraceIndex === -1) break;

    if (openBraceIndex > 0) {
      remainingContent = remainingContent.substring(openBraceIndex);
    }

    let braceCount = 0;
    let inString = false;
    let escapeNext = false;
    let closeBraceIndex = -1;

    for (let i = 0; i < remainingContent.length; i++) {
      const char = remainingContent[i];

      if (escapeNext) {
        escapeNext = false;
        continue;
      }

      if (char === "\\") {
        escapeNext = true;
        continue;
      }

      if (char === '"') {
        inString = !inString;
        continue;
      }

      if (!inString) {
        if (char === "{") {
          braceCount++;
        } else if (char === "}") {
          braceCount--;
          if (braceCount === 0) {
            closeBraceIndex = i;
            break;
          }
        }
      }
    }

    if (closeBraceIndex !== -1) {
      const blockJson = remainingContent.substring(0, closeBraceIndex + 1);

      // Skip if the JSON is too short or obviously invalid
      if (blockJson.length < 10 || !blockJson.includes('"id"')) {
        remainingContent = remainingContent.substring(closeBraceIndex + 1);
        continue;
      }

      try {
        // Clean the JSON string before parsing
        const cleanedJson = cleanJsonString(blockJson);
        const block = JSON.parse(cleanedJson) as Block;

        if (block?.id && block?.type && block?.status) {
          blocks[block.id] = block;
        }
      } catch (error) {
        // Only log meaningful errors, not empty objects or incomplete JSON
        if (blockJson.length > 20 && blockJson.includes('"type"')) {
          console.warn(
            "⚠️ Failed to parse block:",
            blockJson.substring(0, 100)
          );
        }

        // Try alternative parsing approach for potentially valid blocks
        if (blockJson.includes('"id"') && blockJson.includes('"type"')) {
          try {
            const sanitizedJson = blockJson
              .replace(/[\x00-\x1F\x7F]/g, " ") // Remove control characters
              .replace(/\s+/g, " ") // Normalize whitespace
              .trim();

            const block = JSON.parse(sanitizedJson) as Block;
            if (block?.id && block?.type && block?.status) {
              blocks[block.id] = block;
            }
          } catch (secondError) {
            // Silently skip blocks that can't be parsed
          }
        }
      }

      remainingContent = remainingContent.substring(closeBraceIndex + 1);
    } else {
      // Only log if there's substantial content remaining
      if (remainingContent.trim().length > 50) {
        console.log("⏳ Incomplete block remaining");
      }
      break;
    }
  }

  return blocks;
};

// Animation configurations for different block types
const getAnimationConfig = (blockType: string, index: number) => {
  const baseDelay = index * 0.05;
  const baseDuration = 0.25;

  switch (blockType) {
    case "text":
      return {
        delay: baseDelay,
        duration: baseDuration,
        direction: "up" as const,
        blur: "4px",
      };
    case "component":
      return {
        delay: baseDelay + 0.1,
        duration: baseDuration + 0.15,
        direction: "up" as const,
        blur: "6px",
      };
    case "table":
      return {
        delay: baseDelay + 0.15,
        duration: baseDuration + 0.2,
        direction: "up" as const,
        blur: "8px",
      };
    case "code":
      return {
        delay: baseDelay + 0.05,
        duration: baseDuration + 0.1,
        direction: "left" as const,
        blur: "5px",
      };
    case "alert":
      return {
        delay: baseDelay + 0.1,
        duration: baseDuration + 0.1,
        direction: "down" as const,
        blur: "6px",
      };
    case "quote":
      return {
        delay: baseDelay + 0.2,
        duration: baseDuration + 0.15,
        direction: "right" as const,
        blur: "7px",
      };
    case "accordion":
      return {
        delay: baseDelay + 0.15,
        duration: baseDuration + 0.15,
        direction: "up" as const,
        blur: "6px",
      };
    case "progress":
      return {
        delay: baseDelay + 0.1,
        duration: baseDuration + 0.1,
        direction: "up" as const,
        blur: "5px",
      };
    case "mindmap-stream":
      return {
        delay: baseDelay + 0.05,
        duration: baseDuration + 0.05,
        direction: "up" as const,
        blur: "3px",
      };
    case "substeps":
      return {
        delay: baseDelay + 0.2,
        duration: baseDuration + 0.2,
        direction: "up" as const,
        blur: "7px",
      };
    default:
      return {
        delay: baseDelay,
        duration: baseDuration + 0.1,
        direction: "up" as const,
        blur: "4px",
      };
  }
};

export function BlockRenderer({ streamContent }: BlockRendererProps) {
  const extractedBlocks = useMemo(() => {
    if (!streamContent || streamContent.trim().length === 0) return {};

    try {
      return extractJsonBlocks(streamContent);
    } catch (error) {
      // Only log critical errors, not parsing issues
      if (process.env.NODE_ENV === "development") {
        console.warn("Block extraction error:", error);
      }
      return {};
    }
  }, [streamContent]);

  const renderBlock = (block: Block, index: number) => {
    const animationConfig = getAnimationConfig(block.type, index);

    let baseComponent;

    try {
      switch (block.type) {
        case "text":
          baseComponent = <TextBlockComponent block={block} />;
          break;
        case "component":
          baseComponent = <CardBlockComponent block={block} />;
          break;
        case "code":
          baseComponent = <CodeBlockComponent block={block} />;
          break;
        case "alert":
          baseComponent = <AlertBlockComponent block={block} />;
          break;
        case "table":
          baseComponent = <TableBlockComponent block={block} />;
          break;
        case "quote":
          baseComponent = <QuoteBlockComponent block={block} />;
          break;
        case "progress":
          baseComponent = <ProgressBlockComponent block={block} />;
          break;
        case "accordion":
          baseComponent = <AccordionBlockComponent block={block} />;
          break;
        case "badge":
          const badgeBlock = block as any;
          baseComponent = (
            <div className="my-2">
              <Badge variant={badgeBlock.variant || "default"}>
                {badgeBlock.content}
              </Badge>
            </div>
          );
          break;
        case "separator":
          baseComponent = (
            <div className="my-4">
              <Separator />
              {block.content && (
                <div className="text-center text-sm text-muted-foreground mt-2">
                  {block.content}
                </div>
              )}
            </div>
          );
          break;
        default:
          baseComponent = (
            <div className="text-red-500">
              Unknown block type: {(block as any).type}
            </div>
          );
      }
    } catch (error) {
      console.error(`❌ Error rendering block ${block.id}:`, error);
      baseComponent = (
        <div className="text-red-500 p-4 border border-red-200 rounded">
          Error rendering block: {block.type}
        </div>
      );
    }

    return (
      <BlurFade
        key={block.id}
        delay={animationConfig.delay}
        duration={animationConfig.duration}
        direction={animationConfig.direction}
        blur={animationConfig.blur}
        inView={true}
        inViewMargin="-20px"
      >
        {baseComponent}
      </BlurFade>
    );
  };

  const blockArray = useMemo(
    () => Object.values(extractedBlocks),
    [extractedBlocks]
  );

  return (
    <div className="block-renderer space-y-4">
      {blockArray.map((block, index) => renderBlock(block, index))}
      <BlurFade
        delay={blockArray.length * 0.1 + 0.5}
        duration={0.4}
        direction="up"
        blur="3px"
      >
        <div className="text-xs text-gray-400 mt-4 font-mono">
          Blocks: {blockArray.length} | Content: {streamContent.length} chars
        </div>
      </BlurFade>
    </div>
  );
}
