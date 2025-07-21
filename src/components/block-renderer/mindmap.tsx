// import React, { useCallback, useMemo, useEffect } from "react";
// import ReactFlow, {
//   Node,
//   Edge,
//   addEdge,
//   Connection,
//   useNodesState,
//   useEdgesState,
//   Controls,
//   MiniMap,
//   Background,
//   BackgroundVariant,
// } from "reactflow";
// import "reactflow/dist/style.css";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import type { MindMapBlock } from "./types";

// interface MindMapBlockProps {
//   block: MindMapBlock;
// }

// // Custom node component for mind map nodes
// const MindMapNode = ({ data, selected }: { data: any; selected: boolean }) => {
//   const getNodeStyle = (type: string, color?: string) => {
//     const baseStyle = {
//       padding: "12px 16px",
//       borderRadius: "8px",
//       border: "2px solid",
//       background: "white",
//       fontSize: "14px",
//       fontWeight: "500",
//       textAlign: "center" as const,
//       minWidth: "120px",
//       maxWidth: "200px",
//       wordWrap: "break-word" as const,
//       boxShadow: selected ? "0 0 0 2px #3b82f6" : "0 2px 4px rgba(0,0,0,0.1)",
//     };

//     const colors = {
//       root: { bg: "#3b82f6", border: "#2563eb", text: "white" },
//       branch: { bg: "#10b981", border: "#059669", text: "white" },
//       leaf: { bg: "#f59e0b", border: "#d97706", text: "white" },
//     };

//     const nodeColors = colors[type as keyof typeof colors] || colors.leaf;

//     return {
//       ...baseStyle,
//       backgroundColor: color || nodeColors.bg,
//       borderColor: nodeColors.border,
//       color: nodeColors.text,
//     };
//   };

//   return (
//     <div style={getNodeStyle(data.type, data.color)}>
//       <div className="font-medium">{data.label}</div>
//       {data.description && (
//         <div className="text-xs mt-1 opacity-90">{data.description}</div>
//       )}
//     </div>
//   );
// };

// const nodeTypes = {
//   mindMapNode: MindMapNode,
// };

// export function MindMapBlockComponent({ block }: MindMapBlockProps) {
//   const { title, description, nodes, edges, status } = block;

//   // Convert our node format to React Flow format
//   const initialNodes: Node[] = useMemo(
//     () =>
//       nodes.map((node) => ({
//         id: node.id,
//         type: "mindMapNode",
//         position: node.position,
//         data: { ...node.data, type: node.type },
//         draggable: true,
//       })),
//     [nodes]
//   );

//   const initialEdges: Edge[] = useMemo(
//     () =>
//       edges.map((edge) => ({
//         id: edge.id,
//         source: edge.source,
//         target: edge.target,
//         type: edge.type || "smoothstep",
//         animated: edge.animated || false,
//         style: {
//           stroke: edge.style?.stroke || "#64748b",
//           strokeWidth: edge.style?.strokeWidth || 2,
//           ...edge.style,
//         },
//       })),
//     [edges]
//   );

//   const [nodesState, setNodes, onNodesChange] = useNodesState(initialNodes);
//   const [edgesState, setEdges, onEdgesChange] = useEdgesState(initialEdges);

//   // Update nodes and edges when block data changes
//   useEffect(() => {
//     setNodes(initialNodes);
//   }, [initialNodes, setNodes]);

//   useEffect(() => {
//     setEdges(initialEdges);
//   }, [initialEdges, setEdges]);

//   const onConnect = useCallback(
//     (params: Connection) => setEdges((eds) => addEdge(params, eds)),
//     [setEdges]
//   );

//   if (status === "running") {
//     return (
//       <Card className="my-4">
//         <CardHeader>
//           <CardTitle className="text-base font-medium flex items-center gap-2">
//             🗺️ <div className="h-5 w-32 bg-muted rounded animate-pulse" />
//           </CardTitle>
//           <div className="h-4 w-48 bg-muted rounded animate-pulse" />
//         </CardHeader>
//         <CardContent>
//           <div className="h-96 bg-muted rounded animate-pulse flex items-center justify-center">
//             <div className="text-muted-foreground text-sm">
//               Generating mind map...
//             </div>
//           </div>
//         </CardContent>
//       </Card>
//     );
//   }

//   return (
//     <Card className="my-4">
//       <CardHeader>
//         <CardTitle className="text-base font-medium flex items-center gap-2">
//           🗺️ {title}
//         </CardTitle>
//         {description && (
//           <p className="text-sm text-muted-foreground">{description}</p>
//         )}
//       </CardHeader>
//       <CardContent className="p-0">
//         <div style={{ width: "100%", height: "500px" }}>
//           <ReactFlow
//             nodes={nodesState}
//             edges={edgesState}
//             onNodesChange={onNodesChange}
//             onEdgesChange={onEdgesChange}
//             onConnect={onConnect}
//             nodeTypes={nodeTypes}
//             fitView
//             fitViewOptions={{
//               padding: 0.2,
//               includeHiddenNodes: false,
//               minZoom: 0.5,
//               maxZoom: 1.5,
//             }}
//             attributionPosition="bottom-left"
//             proOptions={{ hideAttribution: true }}
//           >
//             <Controls />
//             <MiniMap
//               nodeColor={(node) => {
//                 const colors = {
//                   root: "#3b82f6",
//                   branch: "#10b981",
//                   leaf: "#f59e0b",
//                 };
//                 return (
//                   colors[node.data?.type as keyof typeof colors] || "#6b7280"
//                 );
//               }}
//               nodeStrokeWidth={3}
//               zoomable
//               pannable
//             />
//             <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
//           </ReactFlow>
//         </div>
//       </CardContent>
//     </Card>
//   );
// }
