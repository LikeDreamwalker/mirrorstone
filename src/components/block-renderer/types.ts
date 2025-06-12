// Core streaming protocol types
export interface BaseStreamEvent {
  type: string;
  component_id: string;
  timestamp?: number;
}

export interface ComponentStartEvent extends BaseStreamEvent {
  type: "component_start";
  component: string;
  props: Record<string, unknown>;
  estimated_props?: Record<string, unknown>;
}

export interface ComponentUpdateEvent extends BaseStreamEvent {
  type: "component_update";
  operation:
    | "add_metric"
    | "update_metric"
    | "add_row"
    | "update_row"
    | "set_property"
    | "add_item"
    | "replace_data"
    | "append_data"
    | "remove_item";
  data?: unknown;
  index?: number;
  path?: string;
  key?: string;
}

export interface ComponentEndEvent extends BaseStreamEvent {
  type: "component_end";
  final_props?: Record<string, unknown>;
}

export interface TextStreamEvent {
  type: "text";
  content: string;
  markdown?: boolean;
  append?: boolean;
}

export type StreamEvent =
  | ComponentStartEvent
  | ComponentUpdateEvent
  | ComponentEndEvent
  | TextStreamEvent;

// Enhanced component state management
export interface ComponentState {
  id: string;
  type: string;
  props: Record<string, unknown>;
  status: "initializing" | "streaming" | "completed" | "error";
  estimated_props?: Record<string, unknown>;
  created_at: number;
  last_updated: number;
  error?: string;
}

// Text content state
export interface TextContent {
  id: string;
  content: string;
  markdown: boolean;
  created_at: number;
}

// ✅ Enhanced metric type for better type safety
export interface KPIMetric {
  id?: string;
  label: string;
  value: string | number;
  trend?: "up" | "down" | "neutral";
  change?: string | number;
  description?: string;
  format?: "currency" | "percentage" | "number" | "text";
  icon?: string;
}

// ✅ Enhanced chart data point type
export interface ChartDataPoint {
  [key: string]: string | number | boolean | null;
}

// ✅ Enhanced list item type
export interface ListItem {
  id?: string;
  title: string;
  description?: string;
  icon?: string;
  action?: string;
  status?: "active" | "inactive" | "pending";
}

// ✅ Enhanced pagination type
export interface PaginationConfig {
  page: number;
  pageSize: number;
  total: number;
}

// ✅ Fixed block type definitions with proper required fields
export interface CardBlock {
  title?: string;
  description?: string;
  content?: string;
  footer?: string;
  variant?: "default" | "destructive" | "outline" | "secondary";
  className?: string;
}

export interface KPIGridBlock {
  title?: string;
  metrics: KPIMetric[]; // ✅ Required field
  layout?: "grid" | "list";
  columns?: number;
}

export interface ChartBlock {
  type: "bar" | "line" | "pie" | "area" | "scatter";
  title?: string;
  description?: string;
  data: ChartDataPoint[];
  xKey?: string;
  yKey?: string;
  config?: Record<string, unknown>;
  loading?: boolean;
}

export interface TableBlock {
  title?: string;
  headers: string[]; // ✅ Required field
  rows: Array<Array<string | number>>; // ✅ Required field
  caption?: string;
  searchable?: boolean;
  sortable?: boolean;
  pagination?: PaginationConfig;
}

export interface ListBlock {
  title?: string;
  items: ListItem[]; // ✅ Required field
  ordered?: boolean;
  variant?: "simple" | "detailed";
}

export interface AlertBlock {
  title?: string;
  description: string; // ✅ Required field
  variant?: "default" | "destructive"; // ✅ Fixed: Match shadcn/ui Alert variants
  icon?: string;
  closable?: boolean;
}

export interface ProgressBlock {
  title?: string;
  label: string; // ✅ Required field
  value: number; // ✅ Required field
  max?: number;
  description?: string;
  showPercentage?: boolean;
  variant?: "default" | "secondary"; // ✅ Fixed: Match shadcn/ui Progress variants
}

// ✅ Enhanced utility types for better type safety
export type BlockData =
  | CardBlock
  | KPIGridBlock
  | ChartBlock
  | TableBlock
  | ListBlock
  | AlertBlock
  | ProgressBlock;

export type ComponentType =
  | "Card"
  | "KPIGrid"
  | "Chart"
  | "Table"
  | "List"
  | "Alert"
  | "Progress";

// ✅ Enhanced type guards with better validation
export function isKPIGridBlock(data: unknown): data is KPIGridBlock {
  return (
    typeof data === "object" &&
    data !== null &&
    "metrics" in data &&
    Array.isArray((data as KPIGridBlock).metrics)
  );
}

export function isChartBlock(data: unknown): data is ChartBlock {
  return (
    typeof data === "object" &&
    data !== null &&
    "type" in data &&
    "data" in data &&
    Array.isArray((data as ChartBlock).data)
  );
}

export function isTableBlock(data: unknown): data is TableBlock {
  return (
    typeof data === "object" &&
    data !== null &&
    "headers" in data &&
    "rows" in data &&
    Array.isArray((data as TableBlock).headers) &&
    Array.isArray((data as TableBlock).rows)
  );
}

export function isCardBlock(data: unknown): data is CardBlock {
  return typeof data === "object" && data !== null;
}

export function isListBlock(data: unknown): data is ListBlock {
  return (
    typeof data === "object" &&
    data !== null &&
    "items" in data &&
    Array.isArray((data as ListBlock).items)
  );
}

export function isAlertBlock(data: unknown): data is AlertBlock {
  return (
    typeof data === "object" &&
    data !== null &&
    "description" in data &&
    typeof (data as AlertBlock).description === "string"
  );
}

export function isProgressBlock(data: unknown): data is ProgressBlock {
  return (
    typeof data === "object" &&
    data !== null &&
    "label" in data &&
    "value" in data &&
    typeof (data as ProgressBlock).label === "string" &&
    typeof (data as ProgressBlock).value === "number"
  );
}

// ✅ Helper type for component props with better typing
export interface ComponentProps<T extends BlockData = BlockData> {
  data: T;
  isStreaming?: boolean;
  status?: ComponentState["status"];
}

// ✅ Enhanced default data generators for missing required fields
export function createDefaultKPIGridBlock(): KPIGridBlock {
  return {
    metrics: [],
  };
}

export function createDefaultTableBlock(): TableBlock {
  return {
    headers: [],
    rows: [],
  };
}

export function createDefaultListBlock(): ListBlock {
  return {
    items: [],
  };
}

export function createDefaultAlertBlock(): AlertBlock {
  return {
    description: "No description provided",
  };
}

export function createDefaultProgressBlock(): ProgressBlock {
  return {
    label: "Progress",
    value: 0,
  };
}

export function createDefaultCardBlock(): CardBlock {
  return {};
}

export function createDefaultChartBlock(): ChartBlock {
  return {
    type: "bar",
    data: [],
  };
}
