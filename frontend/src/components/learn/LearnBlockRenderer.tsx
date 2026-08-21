import { Info } from "lucide-react";
import { AnimationBlock } from "@/components/learn/interactive/AnimationBlock";
import { BlobDialogBlock } from "@/components/learn/interactive/BlobDialogBlock";
import { BlobMazeBlock } from "@/components/learn/interactive/BlobMazeBlock";
import { CircuitLabBlock } from "@/components/learn/interactive/CircuitLabBlock";
import { ForceLabBlock } from "@/components/learn/interactive/ForceLabBlock";
import { FractionLabBlock } from "@/components/learn/interactive/FractionLabBlock";
import { GearTrainBlock } from "@/components/learn/interactive/GearTrainBlock";
import { LeverLabBlock } from "@/components/learn/interactive/LeverLabBlock";
import { OhmsLawLabBlock } from "@/components/learn/interactive/OhmsLawLabBlock";
import { PythonRunnerBlock } from "@/components/learn/interactive/PythonRunnerBlock";
import { WaterFlowBlock } from "@/components/learn/interactive/WaterFlowBlock";
import { CodeBlock } from "@/components/learn/visualizations/CodeBlock";
import { CoordinatePlaneBlock } from "@/components/learn/visualizations/CoordinatePlaneBlock";
import { HtmlSimulationBlock } from "@/components/learn/visualizations/HtmlSimulationBlock";
import { ManimBlock } from "@/components/learn/visualizations/ManimBlock";
import { TsCircuitBlock } from "@/components/learn/visualizations/TsCircuitBlock";
import { MarkdownContent } from "@/components/ui/MarkdownContent";
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
      return (
        <MarkdownContent content={block.content} className="text-foreground leading-relaxed" />
      );

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

    case "example":
      return (
        <div className="rounded-2xl border bg-card p-4 shadow-sm">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
            Example
          </p>
          <MarkdownContent content={block.content} className="text-foreground leading-relaxed" />
        </div>
      );

    /* ---------------- Submodule Visualization Block Renderers ---------------- */

    case "coordinate_plane":
    case "coordinate_grid":
    case "interactive_coordinates":
    case "coordinates":
      return <CoordinatePlaneBlock content={block.content} metadata={block.metadata} />;

    case "mathviz_manim":
    case "manim":
    case "math_animation":
      return <ManimBlock content={block.content} metadata={block.metadata} />;

    case "chemviz_3dmol":
    case "molecule_3dmol":
    case "3dmol":
    case "molecule":
      return <HtmlSimulationBlock content={block.content} metadata={block.metadata} />;

    case "circuit_tscircuit":
    case "elecsim_tscircuit":
    case "tscircuit":
    case "circuit":
      return <TsCircuitBlock content={block.content} metadata={block.metadata} />;

    case "html_simulation":
    case "simulation_html":
      return <HtmlSimulationBlock content={block.content} metadata={block.metadata} />;

    /* ------------------------- Interactive Learn Blocks --------------------- */

    case "blob_dialog":
      return <BlobDialogBlock content={block.content} metadata={block.metadata} />;

    case "force_lab":
      return <ForceLabBlock content={block.content} metadata={block.metadata} />;

    case "circuit_lab":
      return <CircuitLabBlock content={block.content} metadata={block.metadata} />;

    case "fraction_lab":
      return <FractionLabBlock content={block.content} metadata={block.metadata} />;

    case "water_flow":
      return <WaterFlowBlock content={block.content} metadata={block.metadata} />;

    case "lever_lab":
      return <LeverLabBlock content={block.content} metadata={block.metadata} />;

    case "ohms_law_lab":
      return <OhmsLawLabBlock content={block.content} metadata={block.metadata} />;

    case "gear_train":
      return <GearTrainBlock content={block.content} metadata={block.metadata} />;

    case "blob_maze":
      return <BlobMazeBlock content={block.content} metadata={block.metadata} />;

    case "python_runner":
      return <PythonRunnerBlock content={block.content} metadata={block.metadata} />;

    case "animation":
      return <AnimationBlock content={block.content} metadata={block.metadata} />;

    case "code":
      return <CodeBlock content={block.content} />;

    case "callout":
    case "note":
      return (
        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 shadow-sm flex items-start gap-3">
          <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <MarkdownContent
            content={block.content}
            className="text-sm text-foreground leading-relaxed"
          />
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
