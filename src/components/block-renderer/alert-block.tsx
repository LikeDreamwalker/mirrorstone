import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Info } from "lucide-react";
import type { AlertBlock } from "./types";

interface AlertBlockProps {
  data: AlertBlock;
  isStreaming?: boolean; // ✅ Added missing props
  status?: "initializing" | "streaming" | "completed" | "error"; // ✅ Added missing props
}

export function AlertBlockComponent({
  data,
  isStreaming,
  status,
}: AlertBlockProps) {
  const getIcon = () => {
    if (data.icon === "info") return <Info className="h-4 w-4" />;
    return <AlertCircle className="h-4 w-4" />;
  };

  return (
    <Alert variant={data.variant || "default"}>
      {" "}
      {/* ✅ Fixed: removed unsupported variants */}
      {getIcon()}
      {data.title && <AlertTitle>{data.title}</AlertTitle>}
      <AlertDescription>{data.description}</AlertDescription>
    </Alert>
  );
}
