"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
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
  const [initialMessages, setInitialMessages] = useState<Message[]>([]);
  const hasAutoSubmittedRef = useRef(false);

  const {
    messages,
    input,
    setInput,
    handleInputChange,
    handleSubmit,
    status,
    setMessages,
    append,
    error,
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

  // Load initial messages from IndexedDB only on mount or when chatId changes
  useEffect(() => {
    let cancelled = false;
    getChatFromIndexedDB(chatId).then((chat) => {
      if (!cancelled) {
        const msgs = chat?.messages ?? [];
        setInitialMessages(msgs);
        setMessages(msgs);
        hasAutoSubmittedRef.current = false; // Reset auto-submit for new chat
      }
    });
    return () => {
      cancelled = true;
    };
  }, [chatId]);

  // Determine if we need to auto-submit (last message is user)
  const needsAutoSubmit = useMemo(() => {
    return (
      Array.isArray(initialMessages) &&
      initialMessages.length > 0 &&
      initialMessages[initialMessages.length - 1]?.role === "user"
    );
  }, [initialMessages]);

  const shouldAutoSubmit = useMemo(() => {
    return (
      needsAutoSubmit && status === "ready" && !hasAutoSubmittedRef.current
    );
  }, [needsAutoSubmit, status]);

  // Auto-submit the last user message if needed, but do NOT remove it from messages
  useEffect(() => {
    if (shouldAutoSubmit) {
      const lastMsg = initialMessages[initialMessages.length - 1];
      const lastText =
        lastMsg?.parts?.find((part) => part.type === "text")?.text ?? "";
      setInput(lastText);
      setTimeout(() => {
        handleSubmit?.({
          preventDefault: () => {},
        } as React.FormEvent<HTMLFormElement>);
        hasAutoSubmittedRef.current = true;
      }, 0);
    }
  }, [shouldAutoSubmit, setInput, handleSubmit, initialMessages]);

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
