"use client";
import { memo, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ExternalLink, ImageOff } from "lucide-react";
import Image from "next/image";
import { TextAnimate } from "@/components/magicui/text-animate";

// Helper function to extract pure text from React children
const extractTextContent = (children: React.ReactNode): string => {
  if (typeof children === "string") {
    return children;
  }
  if (Array.isArray(children)) {
    return children.map(extractTextContent).join("");
  }
  if (children && typeof children === "object" && "props" in children) {
    return extractTextContent((children as any).props.children);
  }
  return String(children || "");
};

// Base component implementation
function MarkdownBase({
  content,
}: {
  content: string;
  reverseTheme?: boolean;
}) {
  const components = useMemo<Components>(
    () => ({
      // Headings - use span inside headings
      h1: ({ children, ...props }) => (
        <h1
          className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl mb-6"
          {...props}
        >
          <TextAnimate animation="blurInUp" by="character" once as="span">
            {extractTextContent(children)}
          </TextAnimate>
        </h1>
      ),
      h2: ({ children, ...props }) => (
        <h2
          className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0 mt-10 mb-4"
          {...props}
        >
          <TextAnimate animation="blurInUp" by="character" once as="span">
            {extractTextContent(children)}
          </TextAnimate>
        </h2>
      ),
      h3: ({ children, ...props }) => (
        <h3
          className="scroll-m-20 text-2xl font-semibold tracking-tight mt-8 mb-4"
          {...props}
        >
          <TextAnimate animation="blurInUp" by="character" once as="span">
            {extractTextContent(children)}
          </TextAnimate>
        </h3>
      ),
      h4: ({ children, ...props }) => (
        <h4
          className="scroll-m-20 text-xl font-semibold tracking-tight mt-6 mb-3"
          {...props}
        >
          <TextAnimate animation="blurInUp" by="character" once as="span">
            {extractTextContent(children)}
          </TextAnimate>
        </h4>
      ),
      h5: ({ children, ...props }) => (
        <h5
          className="scroll-m-20 text-lg font-semibold tracking-tight mt-6 mb-2"
          {...props}
        >
          <TextAnimate animation="blurInUp" by="character" once as="span">
            {extractTextContent(children)}
          </TextAnimate>
        </h5>
      ),
      h6: ({ children, ...props }) => (
        <h6
          className="scroll-m-20 text-base font-semibold tracking-tight mt-6 mb-2"
          {...props}
        >
          <TextAnimate animation="blurInUp" by="character" once as="span">
            {extractTextContent(children)}
          </TextAnimate>
        </h6>
      ),

      // FIXED: Paragraphs - use span to avoid nested p tags
      p: ({ children, ...props }) => (
        <p className="leading-7 [&:not(:first-child)]:mt-6" {...props}>
          <TextAnimate animation="fadeIn" by="word" once as="span">
            {extractTextContent(children)}
          </TextAnimate>
        </p>
      ),

      // FIXED: Inline elements - use span
      strong: ({ children, ...props }) => (
        <strong className="font-semibold" {...props}>
          <TextAnimate animation="blurInUp" by="character" once as="span">
            {extractTextContent(children)}
          </TextAnimate>
        </strong>
      ),
      em: ({ children, ...props }) => (
        <em className="italic" {...props}>
          <TextAnimate animation="fadeIn" by="character" once as="span">
            {extractTextContent(children)}
          </TextAnimate>
        </em>
      ),

      // Lists
      ul: ({ children, ...props }) => (
        <ul className="my-6 ml-6 list-disc [&>li]:mt-2" {...props}>
          {children}
        </ul>
      ),
      ol: ({ children, ...props }) => (
        <ol className="my-6 ml-6 list-decimal [&>li]:mt-2" {...props}>
          {children}
        </ol>
      ),
      li: ({ children, ...props }) => (
        <li className="mt-2" {...props}>
          <TextAnimate animation="slideLeft" by="word" once as="span">
            {extractTextContent(children)}
          </TextAnimate>
        </li>
      ),

      // Blockquotes
      blockquote: ({ children }) => (
        <Card className="my-6 border-l-4 border-l-primary bg-background">
          <CardContent className="pt-6">
            <div className="italic text-muted-foreground">
              <TextAnimate animation="slideRight" by="word" once as="span">
                {extractTextContent(children)}
              </TextAnimate>
            </div>
          </CardContent>
        </Card>
      ),

      // FIXED: Links - use span
      a: ({ href, children, ...props }) => {
        const textContent = extractTextContent(children);
        const isInternalLink = href?.startsWith("/") || href?.startsWith("#");

        if (isInternalLink && href) {
          return (
            <Link
              href={href}
              className="font-medium text-primary underline underline-offset-4 hover:text-primary/80"
              {...props}
            >
              <TextAnimate animation="blurInUp" by="character" once as="span">
                {textContent}
              </TextAnimate>
            </Link>
          );
        }

        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <a
                  href={href}
                  className="font-medium text-primary underline underline-offset-4 hover:text-primary/80 inline-flex items-center"
                  target="_blank"
                  rel="noopener noreferrer"
                  {...props}
                >
                  <TextAnimate
                    animation="blurInUp"
                    by="character"
                    once
                    as="span"
                  >
                    {textContent}
                  </TextAnimate>
                  <ExternalLink className="ml-1 h-3 w-3" />
                </a>
              </TooltipTrigger>
              <TooltipContent>Opens in a new tab</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      },

      // Tables - use span for cells
      table: ({ children, ...props }) => (
        <Card className="my-6 w-full overflow-y-auto bg-background">
          <Table {...props}>{children}</Table>
        </Card>
      ),
      thead: ({ children, ...props }) => (
        <TableHeader {...props}>{children}</TableHeader>
      ),
      tbody: ({ children, ...props }) => (
        <TableBody {...props}>{children}</TableBody>
      ),
      tr: ({ children, ...props }) => (
        <TableRow {...props}>{children}</TableRow>
      ),
      th: ({ children, ...props }) => (
        <TableHead {...props}>
          <TextAnimate animation="fadeIn" by="word" once as="span">
            {extractTextContent(children)}
          </TextAnimate>
        </TableHead>
      ),
      td: ({ children, ...props }) => (
        <TableCell {...props}>
          <TextAnimate animation="fadeIn" by="word" once as="span">
            {extractTextContent(children)}
          </TextAnimate>
        </TableCell>
      ),

      // Horizontal rule
      hr: ({ ...props }) => <Separator className="my-6" {...props} />,

      // Images
      img: ({ src, alt }) => {
        if (!src) {
          return (
            <Card className="flex flex-col items-center justify-center rounded-md border border-dashed border-muted-foreground/50 bg-background p-8 text-muted-foreground">
              <ImageOff className="h-10 w-10 mb-2 opacity-50" />
              <span className="text-sm font-medium">{alt || "Image"}</span>
              <span className="text-xs mt-1 max-w-xs text-center">
                This image is not available or is an external link.
              </span>
            </Card>
          );
        }
        return (
          <div className="my-6 relative">
            <div
              className="relative w-full max-w-3xl mx-auto h-auto rounded-md border overflow-hidden"
              style={{ maxHeight: "30rem" }}
            >
              <Image
                src={typeof src === "string" ? src : "/placeholder.svg"}
                alt={alt || ""}
                width={800}
                height={600}
                className="object-contain w-full h-auto max-h-120"
                unoptimized
              />
            </div>
            {alt && (
              <span className="mt-2 text-center text-sm text-muted-foreground block">
                <TextAnimate animation="fadeIn" by="word" once as="span">
                  {alt}
                </TextAnimate>
              </span>
            )}
          </div>
        );
      },

      // Code blocks
      code: ({ className, children, ...props }) => {
        const match = /language-(\w+)/.exec(className || "");
        const textContent = extractTextContent(children);

        // Inline code - no animation to avoid complications
        if (!match && children) {
          return (
            <code
              className="px-1 py-0.5 bg-muted rounded text-sm font-mono"
              {...props}
            >
              {textContent}
            </code>
          );
        }

        // Code block - no animation for code blocks
        return (
          <pre className="my-4 p-4 bg-muted rounded-md overflow-x-auto">
            <code className="text-sm font-mono" {...props}>
              {textContent}
            </code>
          </pre>
        );
      },
    }),
    []
  );

  return (
    <ReactMarkdown components={components} remarkPlugins={[remarkGfm]}>
      {content}
    </ReactMarkdown>
  );
}

export const MarkdownRenderer = memo(
  MarkdownBase,
  (prevProps, nextProps) => prevProps.content === nextProps.content
);
