import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { CardBlock } from "./types";

interface CardBlockProps {
  data: CardBlock;
}

export function CardBlockComponent({ data }: CardBlockProps) {
  return (
    <Card className={`w-full ${data.variant === "outline" ? "border-2" : ""}`}>
      {(data.title || data.description) && (
        <CardHeader>
          {data.title && <CardTitle>{data.title}</CardTitle>}
          {data.description && (
            <CardDescription>{data.description}</CardDescription>
          )}
        </CardHeader>
      )}
      {data.content && (
        <CardContent>
          <div className="prose prose-sm max-w-none">{data.content}</div>
        </CardContent>
      )}
      {data.footer && (
        <CardFooter>
          <div className="text-sm text-muted-foreground">{data.footer}</div>
        </CardFooter>
      )}
    </Card>
  );
}
