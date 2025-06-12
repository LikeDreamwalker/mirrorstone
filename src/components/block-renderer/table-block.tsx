"use client";

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import type { TableBlock } from "./types";

interface TableBlockProps {
  data: TableBlock;
  isStreaming?: boolean; // ✅ Added missing props
  status?: "initializing" | "streaming" | "completed" | "error"; // ✅ Added missing props
}

export function TableBlockComponent({
  data,
  isStreaming,
  status,
}: TableBlockProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredRows = data.searchable
    ? data.rows.filter((row) =>
        row.some((cell) =>
          cell.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    : data.rows;

  return (
    <div className="w-full space-y-4">
      {/* ✅ Show loading state */}
      {isStreaming && (
        <div className="text-sm text-muted-foreground animate-pulse">
          Loading table data...
        </div>
      )}

      {data.title && <h3 className="text-lg font-semibold">{data.title}</h3>}

      {data.searchable && (
        <Input
          placeholder="Search table..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      )}

      <div className="rounded-md border">
        <Table>
          {data.caption && <TableCaption>{data.caption}</TableCaption>}
          <TableHeader>
            <TableRow>
              {data.headers.map((header, index) => (
                <TableHead key={index}>{header}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={data.headers.length}
                  className="text-center text-muted-foreground"
                >
                  {isStreaming ? "Loading..." : "No data available"}
                </TableCell>
              </TableRow>
            ) : (
              filteredRows.map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  {row.map((cell, cellIndex) => (
                    <TableCell key={cellIndex}>{cell}</TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
