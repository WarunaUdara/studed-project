import {
  CardStackCarousel,
  DEFAULT_STUDENT_CARDS,
  type CardStackItem,
} from "@/components/ui/CardStackCarousel";

export type DeckCardData = CardStackItem;

export function BilateralCardDeck() {
  return <CardStackCarousel cards={DEFAULT_STUDENT_CARDS} />;
}
