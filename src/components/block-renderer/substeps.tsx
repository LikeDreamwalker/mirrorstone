"use client";

import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ListOrdered, Clock, CheckCircle, Play, Loader2 } from "lucide-react";
import type { SubstepsBlock } from "./types";

interface SubstepsBlockProps {
  block: SubstepsBlock;
}

export function SubstepsBlockComponent({ block }: SubstepsBlockProps) {
  const { steps, status, currentStep, completedSteps = [] } = block;

  const getStepStatus = (stepIndex: number) => {
    if (completedSteps.includes(stepIndex)) return "completed";
    if (currentStep === stepIndex) return "current";
    return "pending";
  };

  const getStepIcon = (stepIndex: number) => {
    const stepStatus = getStepStatus(stepIndex);
    switch (stepStatus) {
      case "completed":
        return (
          <CheckCircle className="size-4 text-green-600 animate-in fade-in duration-300" />
        );
      case "current":
        return (
          <div className="relative">
            <Loader2 className="size-4 text-blue-600 animate-spin" />
            <div className="absolute inset-0 size-4 bg-blue-100 rounded-full animate-ping opacity-75" />
          </div>
        );
      default:
        return <Clock className="size-4 text-gray-400" />;
    }
  };

  const getStepClassName = (stepIndex: number) => {
    const stepStatus = getStepStatus(stepIndex);
    const baseClasses =
      "flex items-start gap-3 p-3 rounded-lg text-sm transition-all duration-500 ease-in-out";

    switch (stepStatus) {
      case "completed":
        return cn(
          baseClasses,
          "text-green-800 bg-green-50 border border-green-200 shadow-sm animate-in slide-in-from-left-1 duration-300"
        );
      case "current":
        return cn(
          baseClasses,
          "text-blue-800 bg-blue-50 border border-blue-200 shadow-md font-medium animate-pulse ring-2 ring-blue-200 ring-opacity-50"
        );
      default:
        return cn(
          baseClasses,
          "text-gray-600 bg-gray-50/50 border border-transparent hover:bg-gray-50 hover:border-gray-200"
        );
    }
  };

  const getProgressPercentage = () => {
    if (status === "finished") return 100;
    if (status === "init") return 0;
    return Math.round((completedSteps.length / steps.length) * 100);
  };

  if (status === "init") {
    return (
      <Card className="border-blue-200 bg-blue-50/60 animate-in fade-in duration-500">
        <CardHeader className="flex flex-row justify-start items-center gap-2 py-3 px-4">
          <ListOrdered className="text-blue-600 size-4 mb-0" />
          <span className="font-semibold text-blue-700 text-sm">
            Planning Steps
          </span>
          <div className="ml-auto">
            <Loader2 className="size-4 text-blue-600 animate-spin" />
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4 pt-1">
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center gap-3 animate-pulse"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="h-4 w-4 bg-gray-200 rounded-full animate-pulse" />
                <div className="h-4 bg-gray-200 rounded-lg animate-pulse flex-1" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-blue-200 bg-blue-50/60 animate-in fade-in duration-500">
      <CardHeader className="flex flex-row justify-start items-center gap-2 py-3 px-4">
        <ListOrdered className="text-blue-600 size-4 mb-0" />
        <div className="flex flex-col flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-blue-700 text-sm">
              Execution Steps
            </span>
            {currentStep !== undefined && (
              <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full font-medium animate-in slide-in-from-right-1 duration-300">
                {Math.min(currentStep + 1, steps.length)}/{steps.length}
              </span>
            )}
            {status === "running" && (
              <Loader2 className="size-3 text-blue-600 animate-spin ml-auto" />
            )}
            {status === "finished" && (
              <CheckCircle className="size-3 text-green-600 ml-auto animate-in zoom-in duration-300" />
            )}
          </div>

          {/* Progress Bar */}
          <div className="mt-2 w-full bg-blue-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-500 to-blue-600 h-1.5 rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${getProgressPercentage()}%`,
                boxShadow:
                  status === "running"
                    ? "0 0 8px rgba(59, 130, 246, 0.5)"
                    : "none",
              }}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-4 pt-1">
        <ol className="space-y-2">
          {steps.map((step, idx) => (
            <li
              key={idx}
              className={getStepClassName(idx)}
              style={{
                animationDelay: `${idx * 150}ms`,
                transform:
                  getStepStatus(idx) === "current" ? "scale(1.02)" : "scale(1)",
              }}
            >
              {getStepIcon(idx)}
              <span className="flex-1 leading-relaxed">{step}</span>
              {getStepStatus(idx) === "completed" && (
                <div className="ml-auto">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-in zoom-in duration-300" />
                </div>
              )}
              {getStepStatus(idx) === "current" && (
                <div className="ml-auto">
                  <div className="flex space-x-1">
                    <div
                      className="w-1 h-1 bg-blue-500 rounded-full animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    />
                    <div
                      className="w-1 h-1 bg-blue-500 rounded-full animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    />
                    <div
                      className="w-1 h-1 bg-blue-500 rounded-full animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    />
                  </div>
                </div>
              )}
            </li>
          ))}
        </ol>

        {/* Status Footer */}
        <div className="mt-4 pt-3 border-t border-blue-200">
          <div className="flex items-center justify-between text-xs text-blue-600">
            <span>
              {status === "running" && "Executing..."}
              {status === "finished" && "All steps completed"}
              {/* Why init is not matched with status? */}
              {/* {status === "init" && "Preparing execution plan"} */}
            </span>
            <span className="font-mono">{getProgressPercentage()}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
