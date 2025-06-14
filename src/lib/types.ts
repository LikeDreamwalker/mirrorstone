import type { UIMessage as AIMessage } from "ai";

export interface ChatHistory {
  id: string;
  messages: Message[];
  timestamp: number;
}

export type Message = AIMessage;
