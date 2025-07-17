"use client";

import { useEffect, useRef, useState, useMemo, useCallback, memo } from "react";
import { useChat } from "@ai-sdk/react";
import type { UIMessage as Message } from "ai";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Send,
  MessageSquare,
  X,
  Minimize2,
  Brain,
  Search,
  Code,
  Sparkles,
  TrendingUp,
  Lightbulb,
  Zap,
} from "lucide-react";
import { MessageItem } from "./message-item";
import { saveChatToIndexedDB, getChatFromIndexedDB } from "@/lib/indexeddb";
import type { ChatHistory } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

interface ChatClientProps {
  chatId: string;
  hasInitialQuery?: boolean;
}

type ChatInitStatus = "default" | "needInit" | "ready" | "submitting";

// Memoized status components to prevent re-creation
const ThinkingStatus = memo(() => (
  <div className="flex gap-3 justify-start">
    <div className="flex gap-3 w-full max-w-[85%]">
      <Card className="p-3 bg-background flex-1">
        <div className="flex items-center gap-2">
          <div className="flex space-x-1">
            <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"></div>
            <div
              className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"
              style={{ animationDelay: "0.1s" }}
            ></div>
            <div
              className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"
              style={{ animationDelay: "0.2s" }}
            ></div>
          </div>
          <span className="text-xs text-muted-foreground">
            Sofia is thinking...
          </span>
        </div>
      </Card>
    </div>
  </div>
));
ThinkingStatus.displayName = "ThinkingStatus";

const ErrorStatus = memo(() => (
  <div className="flex gap-3 justify-start">
    <div className="flex gap-3 w-full max-w-[85%]">
      <Card className="p-3 bg-destructive/10 border-destructive/20 flex-1">
        <span className="text-xs text-destructive">
          Sorry, something went wrong. Please try again.
        </span>
      </Card>
    </div>
  </div>
));
ErrorStatus.displayName = "ErrorStatus";

export default function ChatClient({
  chatId,
  hasInitialQuery = false,
}: ChatClientProps) {
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
  const [chatInitStatus, setChatInitStatus] =
    useState<ChatInitStatus>("default");
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(true);

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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Track previous messages length and last message role
  const prevMessagesRef = useRef<{ length: number; lastRole: string | null }>({
    length: messages.length,
    lastRole: messages.length > 0 ? messages[messages.length - 1].role : null,
  });

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Initialize chat from IndexedDB
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

  // Auto-scroll logic
  useEffect(() => {
    const prev = prevMessagesRef.current;
    const lastMsg = messages[messages.length - 1];
    // Only scroll if a new user message is added
    if (messages.length > prev.length && lastMsg && lastMsg.role === "user") {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    prevMessagesRef.current = {
      length: messages.length,
      lastRole: lastMsg ? lastMsg.role : null,
    };
  }, [messages]);

  // Memoized copy function to prevent recreation
  const copyToClipboard = useCallback(
    async (text: string, messageId: string) => {
      try {
        await navigator.clipboard.writeText(text);
        setCopiedMessageId(messageId);
        setTimeout(() => setCopiedMessageId(null), 2000);
      } catch (error) {
        console.error("Failed to copy text:", error);
      }
    },
    []
  );

  // Memoized toggle function
  const toggleChat = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  // Memoized status rendering - but responsive to streaming changes
  const statusBlock = useMemo(() => {
    if (
      (status === "submitted" || chatInitStatus === "submitting") &&
      messages.length > 0 &&
      messages[messages.length - 1].role === "user"
    ) {
      return <ThinkingStatus />;
    }
    if (status === "error") {
      return <ErrorStatus />;
    }
    return null;
  }, [status, chatInitStatus, messages]);

  const emptyState = useMemo(
    () => (
      <div className="text-center max-w-xl mx-auto">
        {/* Logo/Icon Area */}
        <div className="relative mb-6">
          <div className="size-12 mx-auto bg-secondary rounded-2xl flex items-center justify-center">
            <Zap className="size-6 text-foreground" />
          </div>
        </div>

        {/* Main Content */}
        <h2 className="text-xl font-bold mb-4 text-foreground">
          Start with a question.
        </h2>

        <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
          {hasInitialQuery
            ? "Analyzing your business challenge..."
            : "Your strategic AI partner for business decisions, technical planning, and market insights."}
        </p>

        {/* Quick Capabilities */}
        {!hasInitialQuery && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
            <Card className="p-0">
              <CardContent className="p-4">
                <TrendingUp className="h-5 w-5 text-muted-foreground mb-2" />
                <h4 className="font-medium text-sm text-foreground mb-1">
                  Strategic Analysis
                </h4>
                <p className="text-xs text-muted-foreground">
                  Market research, competitive analysis, business planning
                </p>
              </CardContent>
            </Card>

            <Card className="p-0">
              <CardContent className="p-4">
                <Lightbulb className="h-5 w-5 text-muted-foreground mb-2" />
                <h4 className="font-medium text-sm text-foreground mb-1">
                  Problem Solving
                </h4>
                <p className="text-xs text-muted-foreground">
                  Complex decisions, trade-off analysis, recommendations
                </p>
              </CardContent>
            </Card>

            <Card className="p-0">
              <CardContent className="p-4">
                <Zap className="h-5 w-5 text-muted-foreground mb-2" />
                <h4 className="font-medium text-sm text-foreground mb-1">
                  Technical Guidance
                </h4>
                <p className="text-xs text-muted-foreground">
                  Architecture decisions, technology choices, implementation
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    ),
    [hasInitialQuery]
  );

  return (
    <div className="absolute bottom-0 left-0 z-10 h-full w-full sm:w-1/3 sm:min-w-md">
      {/* Floating Chat Button - styled like theme button and sidebar trigger */}
      {!isOpen && (
        <Button
          onClick={toggleChat}
          variant="ghost"
          size="icon"
          className="size-7 absolute bottom-2 left-2"
        >
          <MessageSquare className="h-4 w-4" />
          <span className="sr-only">Open chat</span>
          {messages.length > 0 && (
            <Badge className="h-4 min-w-4 rounded-full p-0 tabular-nums absolute -top-2 -right-2">
              {messages.length}
            </Badge>
          )}
        </Button>
      )}

      {isOpen && (
        <Card
          className="w-full rounded-xl border animate-in slide-in-from-bottom-2 duration-300 absolute bottom-0 left-0 sm:bottom-2 sm:left-2 p-2"
          style={{
            height: "calc(100% - 3rem)",
          }}
        >
          <div className="absolute top-2 right-4 z-10">
            <Button size="icon" variant="secondary" onClick={toggleChat}>
              <Minimize2 />
              <span className="sr-only">Minimize chat</span>
            </Button>
          </div>

          {/* Show loading state during initialization */}
          {chatInitStatus === "default" ? (
            <CardContent className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="flex space-x-1 justify-center mb-4">
                  <div className="w-3 h-3 bg-primary rounded-full animate-bounce"></div>
                  <div
                    className="w-3 h-3 bg-primary rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="w-3 h-3 bg-primary rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                </div>
                <p className="text-sm text-muted-foreground">Loading chat...</p>
              </div>
            </CardContent>
          ) : (
            <>
              {/* Messages - Fixed height with internal scrolling */}
              <CardContent className="flex-1 p-0 min-h-0 overflow-x-hidden overflow-y-auto">
                <div className="w-full h-12"></div>
                <div className="space-y-2">
                  {messages.length === 0 && chatInitStatus === "ready"
                    ? emptyState
                    : messages.map((message) => (
                        <MessageItem
                          key={message.id}
                          message={message}
                          copiedMessageId={copiedMessageId}
                          onCopy={copyToClipboard}
                          status={status}
                        />
                      ))}
                  {statusBlock}
                  <div ref={messagesEndRef} />
                </div>
              </CardContent>

              {/* Input Section - Fixed at bottom */}
              <form onSubmit={handleSubmit}>
                <div className="flex gap-3">
                  <Input
                    value={input}
                    onChange={handleInputChange}
                    placeholder="Ask anything..."
                    className="flex-1 rounded-lg"
                    disabled={
                      status === "streaming" ||
                      status === "submitted" ||
                      chatInitStatus === "submitting"
                    }
                  />
                  <Button
                    type="submit"
                    size="icon"
                    className="shrink-0"
                    disabled={
                      status === "streaming" ||
                      status === "submitted" ||
                      chatInitStatus === "submitting" ||
                      !input.trim()
                    }
                  >
                    <Send />
                  </Button>
                </div>
              </form>
            </>
          )}
        </Card>
      )}
    </div>
  );
}
