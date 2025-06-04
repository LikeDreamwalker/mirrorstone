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

function ChatClientInner({
  chatId,
  initialMessages,
}: {
  chatId: string;
  initialMessages: Message[];
}) {
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
  const hasAutoSubmittedRef = useRef(false);

  // Detect if we need to auto-submit (last message is user)
  const needsAutoSubmit =
    initialMessages.length > 0 &&
    initialMessages[initialMessages.length - 1].role === "user";

  // Remove last user message if we need to auto-submit
  const processedInitialMessages = needsAutoSubmit
    ? initialMessages.slice(0, -1)
    : initialMessages;

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
    id: chatId,
    api: "/api/chat",
    initialMessages: processedInitialMessages,
    onError: (error) => {
      console.error("Chat error:", error);
    },
    onFinish: async (message) => {
      if (chatId) {
        const allMessages = [...messages, message];
        await saveChatToIndexedDB(chatId, allMessages);
        await loadChatHistory();
      }
    },
  });

  const loadChatHistory = useCallback(async () => {
    try {
      const chats = await loadChatsFromIndexedDB();
      setChatHistory(chats);
    } catch (error) {
      console.error("Error loading chat history:", error);
    }
  }, []);

  // Memoized condition: last message is user & status is ready
  const shouldAutoSubmit = useMemo(() => {
    return (
      needsAutoSubmit && status === "ready" && !hasAutoSubmittedRef.current
    );
  }, [needsAutoSubmit, status]);

  useEffect(() => {
    if (shouldAutoSubmit) {
      setInput(initialMessages[initialMessages.length - 1].content);
      setTimeout(() => {
        handleSubmit?.({
          preventDefault: () => {},
        } as React.FormEvent<HTMLFormElement>);
        hasAutoSubmittedRef.current = true;
      }, 0);
    }
  }, [shouldAutoSubmit, setInput, handleSubmit, initialMessages]);

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

export default function ChatClient({ chatId }: { chatId: string }) {
  const [initialMessages, setInitialMessages] = useState<Message[] | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const chat = await getChatFromIndexedDB(chatId);
      if (!cancelled) {
        setInitialMessages(chat?.messages ?? []);
        setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [chatId]);

  if (loading || initialMessages === null) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading chat...</p>
        </div>
      </div>
    );
  }

  return <ChatClientInner chatId={chatId} initialMessages={initialMessages} />;
}
