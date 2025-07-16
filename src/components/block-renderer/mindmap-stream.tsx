import React, { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, Brain, CheckCircle, Plus, Network } from "lucide-react";
import { useSofiaContext } from "@/contexts";
import type { MindMapStreamBlock } from "./types";

export function MindMapStreamBlockComponent({
  block,
}: {
  block: MindMapStreamBlock;
}) {
  const { updateStreamingMindMap, setCurrentMindmap, getStreamingMindMap } =
    useSofiaContext();

  useEffect(() => {
    if (block.status === "finished") {
      const { mindmapId, action } = block;

      switch (action) {
        case "init":
          updateStreamingMindMap(mindmapId, "init", {
            topic: block.topic,
            description: block.description,
            layout: block.layout,
            theme: block.theme,
          });
          // Set this as the current mindmap to display in the real component
          setCurrentMindmap(mindmapId);
          break;

        case "add-node":
          updateStreamingMindMap(mindmapId, "add-node", {
            node: block.node,
          });
          break;

        case "add-edge":
          updateStreamingMindMap(mindmapId, "add-edge", {
            edge: block.edge,
          });
          break;

        case "complete":
          updateStreamingMindMap(mindmapId, "complete", {
            finalTitle: block.finalTitle,
            finalDescription: block.finalDescription,
          });
          break;
      }
    }
  }, [block, updateStreamingMindMap, setCurrentMindmap]);

  // Only render UI for STATUS actions, not DATA actions
  const renderContent = () => {
    const { action, status } = block;

    switch (action) {
      case "init":
        // Get current mindmap data to show progress
        const currentMindmap = getStreamingMindMap(block.mindmapId);
        const isBuilding =
          currentMindmap && currentMindmap.status === "building";
        const nodeCount = currentMindmap?.nodes.length || 0;
        const edgeCount = currentMindmap?.edges.length || 0;

        return (
          <Card className="my-4">
            <CardHeader>
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Brain className="w-5 h-5 " />
                {status === "running" ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    正在初始化思维导图...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 text-primary" />
                    思维导图: {block.topic}
                  </>
                )}
              </CardTitle>
              {status === "finished" && (
                <p className="text-sm text-muted-foreground">
                  {block.description}
                </p>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">布局: {block.layout}</Badge>
                  <Badge variant="secondary">主题: {block.theme}</Badge>
                </div>

                {/* Progress indicator when building */}
                {isBuilding && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Network className="w-4 h-4 animate-pulse" />
                      <span>正在构建思维导图...</span>
                      <div className="flex items-center gap-1 ml-auto">
                        <Plus className="w-3 h-3" />
                        <span className="text-xs">{nodeCount} 节点</span>
                        <span className="text-xs text-muted-foreground">·</span>
                        <span className="text-xs">{edgeCount} 连接</span>
                      </div>
                    </div>
                    <div className="relative">
                      <Progress
                        value={Math.min((nodeCount + edgeCount) * 8, 85)}
                        className="h-2"
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );

      case "complete":
        return (
          <Card className="my-4 border-primary">
            <CardHeader>
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-primary" />
                思维导图构建完成！
              </CardTitle>
              {status === "finished" && (
                <p className="text-sm text-muted-foreground">
                  {block.finalDescription}
                </p>
              )}
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-primary">
                  ✓ 构建完成
                </Badge>
                <Badge variant="secondary">
                  {getStreamingMindMap(block.mindmapId)?.nodes.length || 0}{" "}
                  个概念节点
                </Badge>
              </div>
            </CardContent>
          </Card>
        );

      // DATA actions (add-node, add-edge) - NO UI, just silent updates
      case "add-node":
      case "add-edge":
        return null; // Don't render anything, just update context silently

      default:
        return null;
    }
  };

  return renderContent();
}
