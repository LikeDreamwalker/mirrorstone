"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import {
  StreamEvent,
  ComponentState,
  TextContent,
  KPIMetric,
  ListItem,
  KPIGridBlock,
  TableBlock,
  AlertBlock,
  ProgressBlock,
  CardBlock,
  ListBlock,
  ChartBlock,
  isKPIGridBlock,
  isChartBlock,
  isTableBlock,
  isListBlock,
  isAlertBlock,
  isProgressBlock,
  isCardBlock,
} from "./types";
import { CardBlockComponent } from "./card-block";
import { KPIGridBlockComponent } from "./kpi-grid-block";
import { TableBlockComponent } from "./table-block";
import { AlertBlockComponent } from "./alert-block";
import { ProgressBlockComponent } from "./progress-block";
import { ListBlockComponent } from "./list-block";

interface StreamRendererProps {
  className?: string;
  enableDebug?: boolean;
  onComponentUpdate?: (componentId: string, state: ComponentState) => void;
  onError?: (error: Error, componentId?: string) => void;
}

export function StreamRenderer({
  className = "",
  enableDebug = false,
  onComponentUpdate,
  onError,
}: StreamRendererProps) {
  const [components, setComponents] = useState<Map<string, ComponentState>>(
    new Map()
  );
  const [textContent, setTextContent] = useState<TextContent[]>([]);

  // ✅ Helper function to ensure component has required fields
  const ensureValidComponentData = useCallback(
    (type: string, props: Record<string, unknown>) => {
      switch (type) {
        case "KPIGrid":
          return {
            metrics: [],
            ...props,
          } as KPIGridBlock;

        case "Table":
          return {
            headers: [],
            rows: [],
            ...props,
          } as TableBlock;

        case "Alert":
          return {
            description: "No description provided",
            ...props,
          } as AlertBlock;

        case "Progress":
          return {
            label: "Progress",
            value: 0,
            ...props,
          } as ProgressBlock;

        case "List":
          return {
            items: [],
            ...props,
          } as ListBlock;

        case "Card":
          return {
            ...props,
          } as CardBlock;

        case "Chart":
          return {
            type: "bar" as const,
            data: [],
            ...props,
          } as ChartBlock;

        default:
          return props;
      }
    },
    []
  );

  // ✅ Helper function with better typing
  const updateNestedProperty = useCallback(
    (
      obj: Record<string, unknown>,
      path: string,
      value: unknown
    ): Record<string, unknown> => {
      const keys = path.split(".");
      const result = { ...obj };
      let current: Record<string, unknown> = result;

      for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        if (current[key] === undefined) {
          current[key] = {};
        } else if (typeof current[key] === "object" && current[key] !== null) {
          current[key] = { ...(current[key] as Record<string, unknown>) };
        }
        current = current[key] as Record<string, unknown>;
      }

      current[keys[keys.length - 1]] = value;
      return result;
    },
    []
  );

  // ✅ Type-safe property updates
  const safelyUpdateProps = useCallback(
    (
      existingProps: Record<string, unknown>,
      operation: string,
      data: unknown,
      index?: number,
      path?: string,
      key?: string
    ): Record<string, unknown> => {
      let updatedProps = { ...existingProps };

      switch (operation) {
        case "add_metric":
          if (!Array.isArray(updatedProps.metrics)) {
            updatedProps.metrics = [];
          }
          if (typeof data === "object" && data !== null) {
            updatedProps.metrics = [
              ...(updatedProps.metrics as KPIMetric[]),
              data as KPIMetric,
            ];
          }
          break;

        case "update_metric":
          if (Array.isArray(updatedProps.metrics) && index !== undefined) {
            const metrics = updatedProps.metrics as KPIMetric[];
            if (metrics[index] && typeof data === "object" && data !== null) {
              metrics[index] = {
                ...metrics[index],
                ...(data as Partial<KPIMetric>),
              };
              updatedProps.metrics = [...metrics];
            }
          }
          break;

        case "add_row":
          if (!Array.isArray(updatedProps.rows)) {
            updatedProps.rows = [];
          }
          if (Array.isArray(data)) {
            updatedProps.rows = [
              ...(updatedProps.rows as Array<Array<string | number>>),
              data as Array<string | number>,
            ];
          }
          break;

        case "update_row":
          if (Array.isArray(updatedProps.rows) && index !== undefined) {
            const rows = updatedProps.rows as Array<Array<string | number>>;
            if (rows[index] && Array.isArray(data)) {
              rows[index] = data as Array<string | number>;
              updatedProps.rows = [...rows];
            }
          }
          break;

        case "set_property":
          if (path) {
            updatedProps = updateNestedProperty(updatedProps, path, data);
          } else if (key) {
            updatedProps[key] = data;
          }
          break;

        case "add_item":
          if (!Array.isArray(updatedProps.items)) {
            updatedProps.items = [];
          }
          if (typeof data === "object" && data !== null) {
            updatedProps.items = [
              ...(updatedProps.items as ListItem[]),
              data as ListItem,
            ];
          }
          break;

        case "remove_item":
          if (index !== undefined) {
            if (Array.isArray(updatedProps.items)) {
              const items = [...(updatedProps.items as ListItem[])];
              items.splice(index, 1);
              updatedProps.items = items;
            } else if (Array.isArray(updatedProps.metrics)) {
              const metrics = [...(updatedProps.metrics as KPIMetric[])];
              metrics.splice(index, 1);
              updatedProps.metrics = metrics;
            } else if (Array.isArray(updatedProps.rows)) {
              const rows = [
                ...(updatedProps.rows as Array<Array<string | number>>),
              ];
              rows.splice(index, 1);
              updatedProps.rows = rows;
            }
          }
          break;

        case "replace_data":
          if (typeof data === "object" && data !== null) {
            updatedProps = {
              ...updatedProps,
              ...(data as Record<string, unknown>),
            };
          }
          break;

        case "append_data":
          if (typeof data === "object" && data !== null) {
            Object.entries(data as Record<string, unknown>).forEach(
              ([dataKey, value]) => {
                if (
                  Array.isArray(value) &&
                  Array.isArray(updatedProps[dataKey])
                ) {
                  updatedProps[dataKey] = [
                    ...(updatedProps[dataKey] as unknown[]),
                    ...value,
                  ];
                } else {
                  updatedProps[dataKey] = value;
                }
              }
            );
          }
          break;

        default:
          // Generic property update (fallback)
          if (typeof data === "object" && data !== null) {
            updatedProps = {
              ...updatedProps,
              ...(data as Record<string, unknown>),
            };
          }
      }

      return updatedProps;
    },
    [updateNestedProperty]
  );

  // ✅ Enhanced event processor with better type safety
  const processStreamEvent = useCallback(
    (event: StreamEvent) => {
      const timestamp = Date.now();

      try {
        if (enableDebug) {
          console.log("📨 Processing event:", event);
        }

        switch (event.type) {
          case "text":
            const textId = `text-${timestamp}`;
            const newTextContent: TextContent = {
              id: textId,
              content: event.content,
              markdown: event.markdown ?? false,
              created_at: timestamp,
            };

            if (event.append && textContent.length > 0) {
              setTextContent((prev) => {
                const updated = [...prev];
                const lastIndex = updated.length - 1;
                updated[lastIndex] = {
                  ...updated[lastIndex],
                  content: updated[lastIndex].content + event.content,
                };
                return updated;
              });
            } else {
              setTextContent((prev) => [...prev, newTextContent]);
            }
            break;

          case "component_start":
            setComponents((prev) => {
              const newMap = new Map(prev);

              // ✅ Ensure component data has required fields
              const validatedProps = ensureValidComponentData(
                event.component,
                event.props || {}
              );

              const newComponent: ComponentState = {
                id: event.component_id,
                type: event.component,
                props: validatedProps as Record<string, unknown>,
                status: "initializing",
                estimated_props: event.estimated_props,
                created_at: timestamp,
                last_updated: timestamp,
              };

              newMap.set(event.component_id, newComponent);

              if (onComponentUpdate) {
                onComponentUpdate(event.component_id, newComponent);
              }

              return newMap;
            });
            break;

          case "component_update":
            setComponents((prev) => {
              const newMap = new Map(prev);
              const existing = newMap.get(event.component_id);

              if (!existing) {
                console.warn(
                  `Component ${event.component_id} not found for update`
                );
                return prev;
              }

              const updatedProps = safelyUpdateProps(
                existing.props,
                event.operation,
                event.data,
                event.index,
                event.path,
                event.key
              );

              const updatedComponent: ComponentState = {
                ...existing,
                props: updatedProps,
                status: "streaming",
                last_updated: timestamp,
              };

              newMap.set(event.component_id, updatedComponent);

              if (onComponentUpdate) {
                onComponentUpdate(event.component_id, updatedComponent);
              }

              return newMap;
            });
            break;

          case "component_end":
            setComponents((prev) => {
              const newMap = new Map(prev);
              const existing = newMap.get(event.component_id);

              if (existing) {
                const finalComponent: ComponentState = {
                  ...existing,
                  props: event.final_props || existing.props,
                  status: "completed",
                  last_updated: timestamp,
                };

                newMap.set(event.component_id, finalComponent);

                if (onComponentUpdate) {
                  onComponentUpdate(event.component_id, finalComponent);
                }
              }

              return newMap;
            });
            break;

          default:
            console.warn(
              "Unknown event type:",
              (event as { type: string }).type
            );
        }
      } catch (error) {
        console.error("Error processing stream event:", error);

        if (onError) {
          onError(
            error as Error,
            "component_id" in event ? event.component_id : undefined
          );
        }

        // Set component to error state if it's a component event
        if ("component_id" in event && event.component_id) {
          setComponents((prev) => {
            const newMap = new Map(prev);
            const existing = newMap.get(event.component_id);

            if (existing) {
              newMap.set(event.component_id, {
                ...existing,
                status: "error",
                error: error instanceof Error ? error.message : "Unknown error",
                last_updated: timestamp,
              });
            }

            return newMap;
          });
        }
      }
    },
    [
      safelyUpdateProps,
      ensureValidComponentData,
      enableDebug,
      onComponentUpdate,
      onError,
      textContent.length,
    ]
  );

  // ✅ Enhanced component rendering with proper type casting
  const renderComponent = useCallback(
    (component: ComponentState) => {
      const { type, props, status, error } = component;

      // Show error state
      if (status === "error") {
        return (
          <AlertBlockComponent
            data={{
              title: "Component Error",
              description: error || "Failed to render component",
              variant: "destructive",
            }}
            isStreaming={false}
            status={status}
          />
        );
      }

      // Common props for all components
      const commonProps = {
        isStreaming: status === "streaming",
        status,
      };

      try {
        switch (type) {
          case "Card":
            return (
              <CardBlockComponent {...commonProps} data={props as CardBlock} />
            );
          case "KPIGrid":
            return (
              <KPIGridBlockComponent
                {...commonProps}
                data={props as unknown as KPIGridBlock}
              />
            );
          case "Table":
            return (
              <TableBlockComponent
                {...commonProps}
                data={props as unknown as TableBlock}
              />
            );
          case "Alert":
            return (
              <AlertBlockComponent
                {...commonProps}
                data={props as unknown as AlertBlock}
              />
            );
          case "Progress":
            return (
              <ProgressBlockComponent
                {...commonProps}
                data={props as unknown as ProgressBlock}
              />
            );
          case "List":
            return (
              <ListBlockComponent
                {...commonProps}
                data={props as unknown as ListBlock}
              />
            );
          default:
            return (
              <div className="p-4 border border-dashed border-gray-300 rounded">
                <p className="text-sm text-gray-500">
                  Unknown component type: {type}
                </p>
                {enableDebug && (
                  <pre className="text-xs mt-2 bg-gray-100 p-2 rounded overflow-auto max-h-32">
                    {JSON.stringify(props, null, 2)}
                  </pre>
                )}
              </div>
            );
        }
      } catch (renderError) {
        console.error(
          `Error rendering component ${component.id}:`,
          renderError
        );
        return (
          <AlertBlockComponent
            data={{
              title: "Render Error",
              description: `Failed to render ${type} component`,
              variant: "destructive",
            }}
            isStreaming={false}
            status="error"
          />
        );
      }
    },
    [enableDebug]
  );

  // Sorted components for consistent rendering order
  const sortedComponents = useMemo(() => {
    return Array.from(components.values()).sort(
      (a, b) => a.created_at - b.created_at
    );
  }, [components]);

  // Expose the processStreamEvent function globally for SSE integration
  useEffect(() => {
    (
      window as unknown as { processStreamEvent: typeof processStreamEvent }
    ).processStreamEvent = processStreamEvent;

    if (enableDebug) {
      console.log("🔌 Block renderer ready for SSE events");
    }
  }, [processStreamEvent, enableDebug]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Render text content */}
      {textContent.map((text) => (
        <div key={text.id} className="prose prose-sm max-w-none">
          {text.markdown ? (
            <div dangerouslySetInnerHTML={{ __html: text.content }} />
          ) : (
            text.content
          )}
        </div>
      ))}

      {/* Render components with animations */}
      {sortedComponents.map((component) => (
        <div
          key={component.id}
          className="animate-in fade-in-50 duration-500"
          data-component-id={component.id}
          data-component-type={component.type}
          data-component-status={component.status}
        >
          {renderComponent(component)}
        </div>
      ))}

      {/* Debug panel */}
      {enableDebug && (
        <div className="mt-8 p-4 bg-gray-100 rounded-lg">
          <h3 className="font-bold mb-2">Debug Info</h3>
          <div className="text-xs space-y-2">
            <div>Components: {components.size}</div>
            <div>Text blocks: {textContent.length}</div>
            <details>
              <summary>Component States</summary>
              <pre className="mt-2 overflow-auto max-h-32">
                {JSON.stringify(Array.from(components.values()), null, 2)}
              </pre>
            </details>
          </div>
        </div>
      )}
    </div>
  );
}

// Export types for external use
export type { StreamEvent, ComponentState, TextContent } from "./types";
