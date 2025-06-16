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

  const getAlertClassName = () => {
    switch (variant) {
      case "destructive":
        return "border-red-200 bg-red-50 text-red-900 [&>svg]:text-red-600";
      case "warning":
        return "border-yellow-200 bg-yellow-50 text-yellow-900 [&>svg]:text-yellow-600";
      case "success":
        return "border-green-200 bg-green-50 text-green-900 [&>svg]:text-green-600";
      case "info":
        return "border-blue-200 bg-blue-50 text-blue-900 [&>svg]:text-blue-600";
      default:
        return "";
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
    <Alert className={`my-4 ${getAlertClassName()}`}>
      {getIcon()}
      {title && (
        <AlertTitle>
          <TextBlockComponent
            content={title}
            status="finished"
            className="m-0"
          />
        </AlertTitle>
      )}
      {content && (
        <AlertDescription>
          <TextBlockComponent
            content={content}
            status="finished"
            className="m-0"
          />
        </AlertDescription>
      )}
    </Alert>
  );
}
