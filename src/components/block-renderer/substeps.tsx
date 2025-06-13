"use client";

import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  ListOrdered,
  Clock,
  CheckCircle,
  Loader2,
  AlertCircle,
  PlayCircle,
} from "lucide-react";
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
        return <CheckCircle className="size-4 !text-green-600" />;
      case "current":
        return <Loader2 className="size-4 !text-blue-600 animate-spin" />;
      default:
        return <Clock className="size-4 !text-muted-foreground" />;
    }
  };

  const getStepAlertClassName = (stepIndex: number) => {
    const stepStatus = getStepStatus(stepIndex);

    switch (stepStatus) {
      case "completed":
        return "border-green-200 bg-green-50/60 animate-in slide-in-from-left-1 duration-500";
      case "current":
        return "border-blue-200 bg-blue-50/60 ring-2 ring-blue-200/50 animate-pulse";
      default:
        return "border-gray-200 bg-gray-50/30";
    }
  };

  const getStepDescriptionClassName = (stepIndex: number) => {
    const stepStatus = getStepStatus(stepIndex);

    switch (stepStatus) {
      case "completed":
        return "text-green-800 font-medium";
      case "current":
        return "text-blue-800 font-semibold";
      default:
        return "text-muted-foreground";
    }
  };

  const getProgressPercentage = () => {
    if (status === "finished") return 100;
    if (status === "init") return 0;
    return Math.round((completedSteps.length / steps.length) * 100);
  };

  const getProgressColor = () => {
    switch (status) {
      case "running":
        return "[&>div]:bg-gradient-to-r [&>div]:from-blue-500 [&>div]:to-blue-600";
      case "finished":
        return "[&>div]:bg-gradient-to-r [&>div]:from-green-500 [&>div]:to-green-600";
      default:
        return "[&>div]:bg-gray-400";
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case "init":
        return (
          <Badge variant="secondary" className="gap-1">
            <AlertCircle className="size-3" />
            Planning
          </Badge>
        );
      case "running":
        return (
          <Badge variant="default" className="gap-1 bg-blue-600">
            <Loader2 className="size-3 animate-spin" />
            Running
          </Badge>
        );
      case "finished":
        return (
          <Badge variant="default" className="gap-1 bg-green-600">
            <CheckCircle className="size-3" />
            Completed
          </Badge>
        );
      default:
        return null;
    }
  };

  if (status === "init") {
    return (
      <Alert className="border-blue-200 bg-blue-50/60 animate-in fade-in duration-500">
        <ListOrdered className="size-4 text-blue-600" />
        <AlertDescription>
          <div className="flex items-center justify-between mb-3">
            <span className="font-semibold text-blue-700">
              Planning execution steps...
            </span>
            <Loader2 className="size-4 text-blue-600 animate-spin" />
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center gap-3 animate-pulse"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="h-3 w-3 bg-muted rounded-full" />
                <div className="h-3 bg-muted rounded flex-1" />
              </div>
            ))}
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="border-blue-200 bg-blue-50/30 animate-in fade-in duration-500">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ListOrdered className="size-4 text-blue-600" />
            <span className="font-semibold text-blue-700">Execution Steps</span>
            <Badge variant="outline" className="text-xs">
              {Math.min((currentStep ?? 0) + 1, steps.length)}/{steps.length}
            </Badge>
          </div>
          {getStatusBadge()}
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <Progress
            value={getProgressPercentage()}
            className={cn("h-2", getProgressColor())}
            style={{
              backgroundColor: status === "finished" ? "#dcfce7" : "#dbeafe",
              filter:
                status === "running"
                  ? "drop-shadow(0 0 4px rgba(59, 130, 246, 0.4))"
                  : "none",
            }}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>
              {status === "running" && "Executing..."}
              {status === "finished" && "All steps completed"}
            </span>
            <span className="font-mono">{getProgressPercentage()}%</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-3">
          {steps.map((step, idx) => (
            <Alert
              key={idx}
              className={cn(
                "transition-all duration-500 ease-in-out",
                getStepAlertClassName(idx)
              )}
              style={{
                animationDelay: `${idx * 150}ms`,
                transform:
                  getStepStatus(idx) === "current"
                    ? "scale(1.005)"
                    : "scale(1)",
              }}
            >
              {getStepIcon(idx)}
              <AlertTitle className={getStepDescriptionClassName(idx)}>
                <div className="flex items-center justify-between">
                  <span className="leading-relaxed">{step}</span>

                  {/* Step indicators */}
                  <div className="flex-shrink-0 ml-3">
                    {getStepStatus(idx) === "completed" && (
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-in zoom-in duration-300" />
                    )}
                    {getStepStatus(idx) === "current" && (
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
                    )}
                  </div>
                </div>
              </AlertTitle>
            </Alert>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
