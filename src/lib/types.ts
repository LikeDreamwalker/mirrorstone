import type { Message as AIMessage } from "ai";

export interface ChatHistory {
  id: string;
  messages: Message[];
  timestamp: number;
}

export type Message = AIMessage;
