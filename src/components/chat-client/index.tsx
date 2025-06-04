"use client";

import { useEffect, useState, useCallback } from "react";
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
  } = useChat({
    onError: (error) => {
      console.error("Chat error:", error);
    },
    onFinish: async ({ message }) => {
      if (chatId) {
        console.log(messages, message, "?>?>?>");
        const allMessages = [...messages, message];
        await saveChatToIndexedDB(chatId, allMessages);
      }
    },
  });

  // 1. On mount/chatId change, load messages and set status
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (chatInitStatus === "default") {
        const chat = await getChatFromIndexedDB(chatId);
        if (cancelled) return;
        let msgs = chat?.messages ?? [];

        if (
          Array.isArray(msgs) &&
          msgs.length > 0 &&
          msgs[msgs.length - 1]?.role === "user" &&
          status === "ready"
        ) {
          console.log(1);
          // Last message is user: need to auto-submit
          const lastMsg = msgs[msgs.length - 1];
          const lastText =
            lastMsg?.parts?.find((part) => part.type === "text")?.text ?? "";
          setMessages(msgs.slice(0, -1));
          setInput(lastText);
          setChatInitStatus("needInit");
        } else {
          console.log(2);
          setMessages(msgs);
          setChatInitStatus("ready");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [chatId, setMessages, setInput]);

  // 2. When status is needInit, auto-submit the input, then set to ready
  useEffect(() => {
    if (chatInitStatus === "needInit" && input) {
      setChatInitStatus("submitting");
      handleSubmit?.({
        preventDefault: () => {},
      } as React.FormEvent<HTMLFormElement>);
      setChatInitStatus("ready");
    }
  }, [chatInitStatus, input, handleSubmit]);

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
