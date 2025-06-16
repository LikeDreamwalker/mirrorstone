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
  content?: string; // CHANGED: from 'code' to 'content'
}

export interface SubstepsBlock extends BaseBlock {
  type: "substeps";
  steps: string[];
  currentStep?: number;
  completedSteps?: number[];
  content?: string; // Added for consistency
}

export type Block = TextBlock | CardBlock | CodeBlock | SubstepsBlock;
