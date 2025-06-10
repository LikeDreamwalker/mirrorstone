"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useChat } from "@ai-sdk/react";
import {
  saveChatToIndexedDB,
  loadChatsFromIndexedDB,
  getChatFromIndexedDB,
} from "@/lib/indexeddb";
import type { ChatHistory, Message } from "@/lib/types";
import { ChatInterface } from "@/components/chat-interface";

type ChatInitStatus = "default" | "needInit" | "ready" | "submitting";

export default function ChatClient({ chatId }: { chatId: string }) {
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
  const [chatInitStatus, setChatInitStatus] =
    useState<ChatInitStatus>("default");

  const {
    messages,
    input,
    setInput,
    handleInputChange,
    handleSubmit,
    status,
    setMessages,
    reload,
  } = useChat({
    onError: (error) => {
      console.error("Chat error:", error);
    },
    onFinish: async () => {
      if (chatId) {
        await saveChatToIndexedDB(chatId, messagesRef.current);
        console.log(messagesRef.current, "Chat saved to IndexedDB");
      }
    },
  });

  const messagesRef = useRef<Message[]>([]);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (chatInitStatus === "default") {
        const chat = await getChatFromIndexedDB(chatId);
        if (cancelled) return;
        const msgs = chat?.messages ?? [];

        if (
          Array.isArray(msgs) &&
          msgs.length > 0 &&
          msgs[msgs.length - 1]?.role === "user" &&
          status === "ready"
        ) {
          setMessages(msgs);
          setChatInitStatus("needInit");
          // Immediately trigger reload and update status
          setChatInitStatus("submitting");
          await reload();
          setChatInitStatus("ready");
        } else {
          setMessages(msgs);
          setChatInitStatus("ready");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [chatId, setMessages, chatInitStatus, status, reload]);

  return (
    <div className="flex flex-col h-full">
      <ChatInterface
        messages={messages}
        input={input}
        handleInputChange={handleInputChange}
        handleSubmit={handleSubmit}
        status={status}
        hasInitialQuery={false}
      />
    </div>
  );
}
