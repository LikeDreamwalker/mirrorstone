import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { TableBlock } from "./types";
import { TextBlockComponent } from "./text";

interface TableBlockProps {
  block: TableBlock;
}

export function TableBlockComponent({ block }: TableBlockProps) {
  const { headers, rows, caption, content, status } = block;

  if (status === "init") {
    return (
      <div className="my-4 rounded-md border">
        <div className="p-4">
          <div className="space-y-2">
            <div className="h-4 w-full bg-muted rounded animate-pulse" />
            <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
            <div className="h-4 w-1/2 bg-muted rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="my-4">
      {content && (
        <div className="mb-2">
          <TextBlockComponent content={content} status="finished" />
        </div>
      )}
      <Table>
        {caption && <TableCaption>{caption}</TableCaption>}
        <TableHeader>
          <TableRow>
            {headers.map((header, index) => (
              <TableHead key={index}>
                <TextBlockComponent
                  content={header}
                  status="finished"
                  className="m-0 font-medium"
                />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, rowIndex) => (
            <TableRow key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <TableCell key={cellIndex}>
                  <TextBlockComponent
                    content={cell}
                    status="finished"
                    className="m-0"
                  />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
