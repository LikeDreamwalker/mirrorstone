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

export default function ChatClient({ chatId }: { chatId: string }) {
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
  const [pendingAutoSubmit, setPendingAutoSubmit] = useState(false);
  const hasAutoSubmittedRef = useRef(false);

  const {
    messages,
    input,
    setInput,
    handleInputChange,
    handleSubmit,
    status,
    setMessages,
  } = useChat({
    onError: (error) => {
      console.error("Chat error:", error);
    },
    onFinish: async ({ message }) => {
      if (chatId) {
        const allMessages = [...messages, message];
        await saveChatToIndexedDB(chatId, allMessages);
      }
    },
  });

  useEffect(() => {
    if (pendingAutoSubmit && input) {
      handleSubmit?.({
        preventDefault: () => {},
      } as React.FormEvent<HTMLFormElement>);
      hasAutoSubmittedRef.current = true;
      setPendingAutoSubmit(false);
    }
    // Only run when pendingAutoSubmit or input changes
  }, [pendingAutoSubmit, input, handleSubmit]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const chat = await getChatFromIndexedDB(chatId);
      if (cancelled) return;
      let msgs = chat?.messages ?? [];
      hasAutoSubmittedRef.current = false;

      // Check if we need to auto-submit (retry) the last user message
      if (
        Array.isArray(msgs) &&
        msgs.length > 0 &&
        msgs[msgs.length - 1]?.role === "user"
      ) {
        const lastMsg = msgs[msgs.length - 1];
        const lastText =
          lastMsg?.parts?.find((part) => part.type === "text")?.text ?? "";
        // Remove the last user message before setting messages
        msgs = msgs.slice(0, -1);
        setMessages(msgs);
        setInput(lastText);
        setPendingAutoSubmit(true);
      } else {
        setMessages(msgs);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [chatId]);

  // Optional: Load chat history from IndexedDB
  const loadChatHistory = useCallback(async () => {
    try {
      const chats = await loadChatsFromIndexedDB();
      setChatHistory(chats);
    } catch (error) {
      console.error("Error loading chat history:", error);
    }
  }, []);

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
