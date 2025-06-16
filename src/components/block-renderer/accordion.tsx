import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { AccordionBlock } from "./types";
import { TextBlockComponent } from "./text";

interface AccordionBlockProps {
  block: AccordionBlock;
}

export function AccordionBlockComponent({ block }: AccordionBlockProps) {
  const { items, content, status } = block;

  if (status === "init") {
    return (
      <div className="my-4 space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="border rounded-md p-4">
            <div className="h-4 w-1/3 bg-muted rounded animate-pulse mb-2" />
            <div className="h-3 w-full bg-muted rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="my-4">
      {content && (
        <div className="mb-4">
          <TextBlockComponent content={content} status="finished" />
        </div>
      )}
      <Accordion type="single" collapsible className="w-full">
        {items.map((item, index) => (
          <AccordionItem key={index} value={`item-${index}`}>
            <AccordionTrigger>
              <TextBlockComponent
                content={item.title}
                status="finished"
                className="m-0 text-left"
              />
            </AccordionTrigger>
            <AccordionContent>
              <TextBlockComponent
                content={item.content}
                status="finished"
                className="m-0"
              />
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
