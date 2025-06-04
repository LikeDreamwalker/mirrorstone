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

export default function ChatClient({
  chatId,
  initialMessages = [],
}: {
  chatId: string;
  initialMessages?: Message[];
}) {
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
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
    onFinish: async (message) => {
      if (chatId) {
        const allMessages = [...messages, message].map((msg: any) =>
          msg && typeof msg === "object" && "message" in msg ? msg.message : msg
        );
        await saveChatToIndexedDB(chatId, allMessages);
        // Optionally reload chat history here if needed
      }
    },
  });

  // Set initial messages after hook is initialized (AI SDK 5+)
  useEffect(() => {
    if (initialMessages && initialMessages.length > 0) {
      setMessages(initialMessages);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setMessages, initialMessages]);

  // Memoized: Determine if we need to auto-submit (last message is user)
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

  // Auto-submit the last user message if needed
  useEffect(() => {
    if (shouldAutoSubmit) {
      // Get the last user message's text part
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

  // Optionally load chat history on mount
  // useEffect(() => {
  //   loadChatHistory();
  // }, [loadChatHistory]);

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
