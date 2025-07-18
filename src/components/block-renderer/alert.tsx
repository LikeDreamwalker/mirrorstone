import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertCircle,
  CheckCircle,
  XCircle,
  Info,
  AlertTriangle,
} from "lucide-react";
import type { AlertBlock } from "./types";
import { TextBlockComponent } from "./text";
import { cn } from "@/lib/utils";

interface AlertBlockProps {
  block: AlertBlock;
}

export function AlertBlockComponent({ block }: AlertBlockProps) {
  const { variant = "default", title, content, status } = block;

  const getIcon = () => {
    switch (variant) {
      case "destructive":
        return <XCircle className="h-4 w-4" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4" />;
      case "success":
        return <CheckCircle className="h-4 w-4" />;
      case "info":
        return <Info className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getAlertVariantClasses = () => {
    switch (variant) {
      case "destructive":
        // Use shadcn's built-in destructive variant
        return "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive";
      case "warning":
        return "border-yellow-500/50 text-yellow-600 dark:border-yellow-500 dark:text-yellow-400 [&>svg]:text-yellow-500 dark:[&>svg]:text-yellow-400";
      case "success":
        return "border-green-500/50 text-green-600 dark:border-green-500 dark:text-green-400 [&>svg]:text-green-500 dark:[&>svg]:text-green-400";
      case "info":
        return "border-blue-500/50 text-blue-600 dark:border-blue-500 dark:text-blue-400 [&>svg]:text-blue-500 dark:[&>svg]:text-blue-400";
      default:
        return "border-border text-foreground [&>svg]:text-muted-foreground";
    }
  };

  if (status === "init") {
    return (
      <Alert className="my-4">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 bg-muted rounded animate-pulse" />
          <div className="h-4 w-24 bg-muted rounded animate-pulse" />
        </div>
        <div className="mt-2 h-8 bg-muted rounded animate-pulse" />
      </Alert>
    );
  }

  return (
    <Alert
      className={cn("my-4 border", getAlertVariantClasses())}
      variant={variant === "destructive" ? "destructive" : "default"}
    >
      {getIcon()}
      {title && (
        <AlertTitle className="font-semibold">
          <TextBlockComponent minimal content={title} status="finished" />
        </AlertTitle>
      )}
      {content && (
        <AlertDescription>
          <TextBlockComponent minimal content={content} status="finished" />
        </AlertDescription>
      )}
    </Alert>
  );
}
