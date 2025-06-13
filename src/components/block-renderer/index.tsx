"use client";

import { useMemo } from "react";
import type { Block } from "./types";
import { TextBlockComponent } from "./text";
import { CardBlockComponent } from "./card";
import { CodeBlockComponent } from "./code";
import { SubstepsBlockComponent } from "./substeps";

interface BlockRendererProps {
  streamContent: string;
}

export function BlockRenderer({ streamContent }: BlockRendererProps) {
  const extractedBlocks = useMemo(() => {
    if (!streamContent) return {};

    console.log(
      "🔄 Re-computing blocks from content:",
      streamContent.length,
      "chars"
    );

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

        console.log("🎯 Found JSON block:", blockJson);

        try {
          const block = JSON.parse(blockJson) as Block;

          console.log("📦 Parsed block:", {
            id: block.id,
            type: block.type,
            status: block.status,
            existing: !!blocks[block.id],
          });

          if (block?.id && block?.type && block?.status) {
            // KEY FIX: Always use the latest version of the block
            // This ensures updates overwrite previous versions
            console.log(
              blocks[block.id]
                ? "🔄 Updating existing block:"
                : "✅ Adding new block:",
              block.id
            );
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

    console.log("📊 Final blocks:", Object.keys(blocks).length);
    console.log("📋 Block IDs:", Object.keys(blocks));
    return blocks;
  }, [streamContent]);

  const renderBlock = (block: Block) => {
    console.log(
      "🎨 Rendering block:",
      block.id,
      "type:",
      block.type,
      "status:",
      block.status
    );

    switch (block.type) {
      case "text":
        return <TextBlockComponent key={block.id} block={block} />;
      case "component":
        return <CardBlockComponent key={block.id} block={block} />;
      case "code":
        return <CodeBlockComponent key={block.id} block={block} />;
      case "substeps":
        return <SubstepsBlockComponent key={block.id} block={block} />;
      default:
        return (
          <div key={(block as any).id} className="text-red-500">
            Unknown block type: {(block as any).type}
          </div>
        );
    }
  };

  const blockArray = useMemo(
    () => Object.values(extractedBlocks),
    [extractedBlocks]
  );

  return (
    <div className="block-renderer space-y-4">
      {blockArray.map(renderBlock)}

      <div className="text-xs text-gray-400 mt-4 font-mono">
        Blocks: {blockArray.length} | Content: {streamContent.length} chars
      </div>
    </div>
  );
}
