import { MathFormula } from "@/components/ui/MathFormula";

interface LearnBlock {
  id: string;
  type: string;
  content: string;
  metadata?: string | null;
}

interface LearnBlockRendererProps {
  block: LearnBlock;
}

export function LearnBlockRenderer({ block }: LearnBlockRendererProps) {
  switch (block.type) {
    case "heading":
      return <h3 className="text-xl font-semibold text-foreground">{block.content}</h3>;
    case "text":
      return <p className="whitespace-pre-wrap text-foreground leading-relaxed">{block.content}</p>;
    case "image":
      return (
        <div className="rounded-lg border bg-muted p-2">
          {block.content ? (
            <img
              src={block.content}
              alt="Learning material"
              className="max-h-96 w-full rounded-md object-contain"
            />
          ) : (
            <div className="flex h-48 items-center justify-center text-muted-foreground">
              Image placeholder
            </div>
          )}
        </div>
      );
    case "video":
      return (
        <div className="rounded-lg border bg-muted p-4">
          <p className="text-sm text-muted-foreground">Video: {block.content}</p>
        </div>
      );
    case "formula":
      return (
        <div className="overflow-x-auto rounded-lg border bg-muted/40 p-4 text-center text-lg">
          <MathFormula formula={block.content} />
        </div>
      );
    default:
      return (
        <div className="rounded-lg border bg-muted p-4">
          <p className="text-sm text-muted-foreground">[{block.type}]</p>
          <p className="whitespace-pre-wrap text-foreground">{block.content}</p>
        </div>
      );
  }
}
