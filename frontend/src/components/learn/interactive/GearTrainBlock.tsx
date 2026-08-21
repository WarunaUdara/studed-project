import { SCIENCE_GEAR_PUZZLES } from "@/components/waves/science/gear-network-engine";
import { ScientificThinkingGearsMaster } from "@/components/waves/science/ScientificThinkingGearsMaster";
import type { GearTrainConfig } from "@/lib/content/interactiveBlocks";
import { parseBlockConfig } from "@/lib/content/interactiveBlocks";

interface GearTrainBlockProps {
  content: string;
  metadata?: string | object | null;
}

/**
 * The gear train puzzles as a content block.
 *
 * The puzzles themselves stay in the engine, because they are geometry rather
 * than prose; a wave selects the ones it wants by id. That is what lets the
 * science course flow through the standard wave player instead of a page that
 * the router special-cases by wave id.
 */
export function GearTrainBlock({ content, metadata }: GearTrainBlockProps) {
  const config = parseBlockConfig<GearTrainConfig>(metadata);

  const selected = config?.puzzleIds?.length
    ? SCIENCE_GEAR_PUZZLES.filter((puzzle) => config.puzzleIds?.includes(puzzle.id))
    : SCIENCE_GEAR_PUZZLES;

  // An unknown id must not leave an empty puzzle set on screen.
  const puzzles = selected.length > 0 ? selected : SCIENCE_GEAR_PUZZLES;

  return (
    <section className="space-y-3">
      {content && <p className="text-sm font-medium text-foreground">{content}</p>}
      <ScientificThinkingGearsMaster puzzles={puzzles} />
    </section>
  );
}
