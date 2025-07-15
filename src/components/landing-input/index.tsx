"use client";

import type React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveChatToIndexedDB } from "@/lib/indexeddb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import Link from "next/link";
import { ThemeButton } from "@/components/theme-button";

export default function LandingInput() {
  const [query, setQuery] = useState("");
  const [isNavigating, setIsNavigating] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isNavigating) return;

    setIsNavigating(true);
    const chatId = `chat_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    const messageId =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `msg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

    await saveChatToIndexedDB(chatId, [
      {
        id: messageId,
        role: "user",
        parts: [{ type: "text", text: query.trim() }],
      },
    ]);

    router.push(`/app/${chatId}`);
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        {/* Search Input */}
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 sm:pl-4 pointer-events-none">
            <Search className="size-5 sm:size-6 text-muted-foreground" />
          </div>
          <Input
            type="text"
            placeholder="Start with a question"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10 sm:pl-12 pr-4 py-4 sm:py-6 text-base sm:text-lg rounded-xl sm:rounded-2xl w-full"
            disabled={isNavigating}
          />
        </div>

        {/* Mobile: Search Button (full width) */}
        <Button
          type="submit"
          disabled={!query.trim() || isNavigating}
          className="w-full sm:hidden bg-primary-blue"
        >
          {isNavigating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Starting...
            </>
          ) : (
            "Search"
          )}
        </Button>

        {/* Mobile: Icon + History buttons / Desktop: All buttons inline */}
        <div className="flex w-full justify-end items-center gap-2 sm:gap-3">
          {/* Left side: Icon buttons */}
          <div className="flex items-center gap-2">
            <ThemeButton />
            {/* Future icon buttons can be added here */}
          </div>

          {/* Middle: History button */}
          <Link href="/app" className="flex-1 sm:flex-initial">
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto px-4 py-3 sm:px-6 "
            >
              <span className="hidden sm:inline">Visit History</span>
              <span className="sm:hidden">History</span>
            </Button>
          </Link>

          {/* Right side: Search button (desktop only) */}
          <Button
            type="submit"
            disabled={!query.trim() || isNavigating}
            className="hidden sm:block bg-primary-blue"
          >
            {isNavigating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Starting Search...
              </>
            ) : (
              "Start Searching"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
