import { Info } from "lucide-react";
import { CodeBlock } from "@/components/learn/visualizations/CodeBlock";
import { ManimBlock } from "@/components/learn/visualizations/ManimBlock";
import { MatterPhysicsBlock } from "@/components/learn/visualizations/MatterPhysicsBlock";
import { Mol3DBlock } from "@/components/learn/visualizations/Mol3DBlock";
import { TsCircuitBlock } from "@/components/learn/visualizations/TsCircuitBlock";
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
  switch (block.type.toLowerCase()) {
    case "heading":
      return <h3 className="text-xl font-semibold text-foreground font-serif">{block.content}</h3>;

    case "text":
      return <p className="whitespace-pre-wrap text-foreground leading-relaxed">{block.content}</p>;

    case "image":
      return (
        <div className="rounded-2xl border bg-muted/40 p-2 shadow-sm">
          {block.content ? (
            <img
              src={block.content}
              alt="Learning material"
              className="max-h-96 w-full rounded-xl object-contain"
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
        <div className="rounded-2xl border bg-card p-4 shadow-sm space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Embedded Video
          </p>
          {block.content.startsWith("http") ? (
            <div className="aspect-video w-full rounded-xl overflow-hidden bg-black">
              <iframe
                src={block.content}
                title="Lesson Video"
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <p className="text-sm text-foreground">{block.content}</p>
          )}
        </div>
      );

    case "formula":
      return (
        <div className="overflow-x-auto rounded-2xl border bg-muted/40 p-5 text-center text-lg shadow-sm">
          <MathFormula formula={block.content} />
        </div>
      );

    /* ---------------- Submodule Visualization Block Renderers ---------------- */

    case "mathviz_manim":
    case "manim":
    case "math_animation":
      return <ManimBlock content={block.content} metadata={block.metadata} />;

    case "molecule_3dmol":
    case "3dmol":
    case "molecule":
      return <Mol3DBlock content={block.content} metadata={block.metadata} />;

    case "circuit_tscircuit":
    case "tscircuit":
    case "circuit":
      return <TsCircuitBlock content={block.content} metadata={block.metadata} />;

    case "simulation_matter":
    case "matter_js":
    case "physics":
    case "simulation":
      return <MatterPhysicsBlock content={block.content} metadata={block.metadata} />;

    case "code":
      return <CodeBlock content={block.content} />;

    case "callout":
    case "note":
      return (
        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 shadow-sm flex items-start gap-3">
          <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="text-sm text-foreground leading-relaxed">{block.content}</div>
        </div>
      );

    default:
      return (
        <div className="rounded-2xl border bg-card p-4 shadow-sm">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            [{block.type}]
          </p>
          <p className="whitespace-pre-wrap text-foreground mt-1 text-sm">{block.content}</p>
        </div>
      );
  }
}
