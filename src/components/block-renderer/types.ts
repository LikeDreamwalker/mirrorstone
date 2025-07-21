export type BlockStatus = "init" | "update" | "finished" | "running";

export interface BaseBlock {
  id: string;
  type: string;
  status: BlockStatus;
  content?: string; // Universal content field
}

export interface TextBlock extends BaseBlock {
  type: "text";
  content?: string;
}

export interface CardBlock extends BaseBlock {
  type: "component";
  componentType: string;
  title?: string;
  description?: string;
  content?: string;
  data?: Record<string, unknown>;
}

export interface CodeBlock extends BaseBlock {
  type: "code";
  language?: string;
  content?: string;
}

// NEW: Alert/Callout Block
export interface AlertBlock extends BaseBlock {
  type: "alert";
  variant?: "default" | "destructive" | "warning" | "success" | "info";
  title?: string;
  content?: string;
  icon?: string;
}

// NEW: Table Block
export interface TableBlock extends BaseBlock {
  type: "table";
  headers: string[];
  rows: string[][];
  caption?: string;
  content?: string; // For description
}

// NEW: Quote Block
export interface QuoteBlock extends BaseBlock {
  type: "quote";
  content?: string;
  author?: string;
  source?: string;
}

// NEW: Badge Block
export interface BadgeBlock extends BaseBlock {
  type: "badge";
  variant?: "default" | "secondary" | "destructive" | "outline";
  content?: string;
}

// NEW: Progress Block
export interface ProgressBlock extends BaseBlock {
  type: "progress";
  value: number;
  max?: number;
  content?: string; // For description
  label?: string;
}

// NEW: Separator Block
export interface SeparatorBlock extends BaseBlock {
  type: "separator";
  content?: string; // For optional label
}

// NEW: Accordion Block
export interface AccordionBlock extends BaseBlock {
  type: "accordion";
  items: Array<{
    title: string;
    content: string;
  }>;
  content?: string; // For description
}

export interface MindMapBlock extends BaseBlock {
  type: "mindmap";
  title: string;
  description: string;
  nodes: Array<{
    id: string;
    type: "root" | "branch" | "leaf";
    data: {
      label: string;
      description?: string;
      color?: string;
      icon?: string;
    };
    position: {
      x: number;
      y: number;
    };
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    type?: "default" | "smoothstep" | "step";
    animated?: boolean;
    style?: {
      stroke?: string;
      strokeWidth?: number;
    };
  }>;
  layout: "horizontal" | "vertical" | "radial";
  theme: "default" | "colorful" | "minimal" | "academic";
}

export interface MindMapStreamBlock extends BaseBlock {
  type: "mindmap-stream";
  mindmapId: string;
  action: "init" | "add-node" | "add-edge" | "complete";

  // Init action data
  topic?: string;
  description?: string;
  layout?: "horizontal" | "vertical" | "radial";
  theme?: "default" | "colorful" | "minimal" | "academic";

  // Node action data
  node?: {
    id: string;
    type: "root" | "branch" | "leaf";
    data: {
      label: string;
      description?: string;
      color?: string;
    };
    position: {
      x: number;
      y: number;
    };
  };

  // Edge action data
  edge?: {
    id: string;
    source: string;
    target: string;
    type?: "default" | "smoothstep" | "step";
  };

  // Complete action data
  finalTitle?: string;
  finalDescription?: string;
}

export type Block =
  | TextBlock
  | CardBlock
  | CodeBlock
  | AlertBlock
  | TableBlock
  | QuoteBlock
  | BadgeBlock
  | ProgressBlock
  | SeparatorBlock
  | AccordionBlock
  | MindMapBlock
  | MindMapStreamBlock;
