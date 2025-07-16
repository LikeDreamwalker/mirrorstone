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
// import { MindMapBlockComponent } from "./mindmap";
// import { MindMapStreamBlockComponent } from "./mindmap-stream";

interface BlockRendererProps {
  streamContent: string;
}

// Animation configurations for different block types
const getAnimationConfig = (blockType: string, index: number) => {
  const baseDelay = index * 0.05; // Stagger blocks
  const baseDuration = 0.25; // Base duration for faster animations

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
    if (!streamContent) return {};

    const blocks: Record<string, Block> = {};
    let content = streamContent;

    while (content.length > 0) {
      const openBraceIndex = content.indexOf("{");
      if (openBraceIndex === -1) break;

      if (openBraceIndex > 0) {
        content = content.substring(openBraceIndex);
      }

      let braceCount = 0;
      let inString = false;
      let escapeNext = false;
      let closeBraceIndex = -1;

      for (let i = 0; i < content.length; i++) {
        const char = content[i];

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
        const blockJson = content.substring(0, closeBraceIndex + 1);

        try {
          const block = JSON.parse(blockJson) as Block;

          if (block?.id && block?.type && block?.status) {
            blocks[block.id] = block;
          }
        } catch (error) {
          console.error("❌ Parse error:", error);
        }

        content = content.substring(closeBraceIndex + 1);
      } else {
        console.log("⏳ Incomplete block remaining");
        break;
      }
    }

    return blocks;
  }, [streamContent]);

  const renderBlock = (block: Block, index: number) => {
    const animationConfig = getAnimationConfig(block.type, index);

    // Get the base component without BlurFade wrapper
    let baseComponent;

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
      // case "mindmap":
      //   return <MindMapBlockComponent key={block.id} block={block} />;
      // case "mindmap-stream":
      //   baseComponent = <MindMapStreamBlockComponent block={block as any} />;
      //   break;
      default:
        baseComponent = (
          <div className="text-red-500">
            Unknown block type: {(block as any).type}
          </div>
        );
    }

    // Wrap everything in BlurFade for smooth entrance animations
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
