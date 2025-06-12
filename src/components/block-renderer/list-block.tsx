import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import type { ListBlock } from "./types";

interface ListBlockProps {
  data: ListBlock;
}

export function ListBlockComponent({ data }: ListBlockProps) {
  const ListWrapper = data.ordered ? "ol" : "ul";

  return (
    <div className="space-y-2">
      <ListWrapper
        className={
          data.ordered ? "list-decimal list-inside space-y-2" : "space-y-2"
        }
      >
        {data.items.map((item, index) => (
          <li key={index} className={data.ordered ? "" : "list-none"}>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium">{item.title}</h4>
                    {item.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {item.description}
                      </p>
                    )}
                  </div>
                  {item.action && (
                    <Button variant="ghost" size="sm">
                      {item.action}
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </li>
        ))}
      </ListWrapper>
    </div>
  );
}
