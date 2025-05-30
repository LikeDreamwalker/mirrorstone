"use client";

import type React from "react";
import { Search, Sparkles } from "lucide-react";
import LandingInput from "@/components/landing-input";
export default function WelcomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="px-4 py-16">
        <div className="text-center">
          {/* Header */}
          <div className="mb-16">
            <div className="flex items-center justify-center mb-6">
              <Sparkles className="h-12 w-12 text-blue-600 mr-3" />
              <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                MirrorStone
              </h1>
            </div>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              Your intelligent search agent powered by advanced AI. Ask
              anything, discover everything.
            </p>
          </div>

          <LandingInput />

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="p-6 rounded-xl bg-white dark:bg-slate-800 shadow-lg">
              <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Search className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Intelligent Search</h3>
              <p className="text-slate-600 dark:text-slate-300">
                Advanced AI-powered search that understands context and intent
              </p>
            </div>
            <div className="p-6 rounded-xl bg-white dark:bg-slate-800 shadow-lg">
              <div className="h-12 w-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Sparkles className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Smart Responses</h3>
              <p className="text-slate-600 dark:text-slate-300">
                Get comprehensive answers with relevant insights and analysis
              </p>
            </div>
            <div className="p-6 rounded-xl bg-white dark:bg-slate-800 shadow-lg">
              <div className="h-12 w-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mx-auto mb-4">
                <div className="h-6 w-6 bg-green-600 rounded-full" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                Conversation History
              </h3>
              <p className="text-slate-600 dark:text-slate-300">
                Access your previous searches and continue conversations
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
