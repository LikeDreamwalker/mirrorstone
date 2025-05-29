import type { Message } from "ai";

export interface ChatHistory {
  id: string;
  messages: Message[];
  timestamp: number;
}
