import type { CardBlock } from "./types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface CardBlockProps {
  block: CardBlock;
}

export function CardBlockComponent({ block }: CardBlockProps) {
  const { title, description, content, status, componentType, data } = block;

  // Render different skeletons based on component type
  if (status === "init") {
    return (
      <Card className="my-4">
        <CardHeader>
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (status === "update") {
    return (
      <Card className="my-4">
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Finished state
  return (
    <Card className="my-4">
      <CardHeader>
        {title && <CardTitle>{title}</CardTitle>}
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {content && <div className="whitespace-pre-wrap">{content}</div>}
        {data && componentType === "chart" && (
          <div className="h-64 bg-muted/20 rounded flex items-center justify-center">
            [Chart Component with data: {JSON.stringify(data).substring(0, 50)}
            ...]
          </div>
        )}
      </CardContent>
    </Card>
  );
}
