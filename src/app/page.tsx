"use client";

import type React from "react";
import { Sparkles } from "lucide-react";
import LandingInput from "@/components/landing-input";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function WelcomePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex w-full items-end justify-between mb-2 gap-2 p-1">
          <h1 className="text-4xl">MirrorStone</h1>
          <Button variant="ghost">
            <Link href="https://ldwid.com">By LikeDreamwalker</Link>
          </Button>
        </div>

        {/* Input */}
        <LandingInput />
      </div>
    </div>
  );
}
