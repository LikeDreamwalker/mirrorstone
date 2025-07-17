import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AccordionBlock } from "./types";
import { TextBlockComponent } from "./text";

interface AccordionBlockProps {
  block: AccordionBlock;
}

export function AccordionBlockComponent({ block }: AccordionBlockProps) {
  // Ensure items is always an array
  const { items = [], content, status } = block;

  if (status === "init") {
    return (
      <Card className="my-4">
        <CardHeader>
          <div className="h-5 w-1/2 bg-muted rounded animate-pulse" />
        </CardHeader>
        <CardContent className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border rounded-md p-4">
              <div className="h-4 w-1/3 bg-muted rounded animate-pulse mb-2" />
              <div className="h-3 w-full bg-muted rounded animate-pulse" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  // Generate default values for all items to be open by default
  const defaultValue = items.map((_, index) => `item-${index}`);

  return (
    <Card className="my-2">
      {content && (
        <CardHeader>
          <CardTitle className="text-base font-medium">
            <TextBlockComponent content={content} status="finished" />
          </CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <Accordion
          type="multiple"
          className="w-full"
          defaultValue={defaultValue} // This makes all items open by default
        >
          {items.map((item, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger>
                {/* <TextBlockComponent
                  content={
                    Array.isArray(item.title)
                      ? item.title.join(" ")
                      : item.title
                  }
                  status="finished"
                /> */}
                {Array.isArray(item.title) ? item.title.join(" ") : item.title}
              </AccordionTrigger>
              <AccordionContent>
                <TextBlockComponent
                  content={
                    Array.isArray(item.content)
                      ? item.content.join(" ")
                      : item.content
                  }
                  status="finished"
                />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}
