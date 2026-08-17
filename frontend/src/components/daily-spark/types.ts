export interface PolygonRegion {
  id: string;
  name: string;
  points: string; // SVG points attribute "x1,y1 x2,y2 x3,y3"
  areaFraction: number; // e.g. 0.25 for 1/4, 0.125 for 1/8
}

export interface SparkTask {
  id: string;
  title: string;
  targetFraction: number; // e.g. 0.25 for 1/4, 0.5 for 2/4, 0.75 for 3/4
  targetFractionLabel: string; // e.g. "1/4", "2/4", "3/4"
  numerator: number;
  denominator: number;
  xpReward: number;
  explanation: string;
}

export type SparkScreenState = "task" | "motivation" | "streak" | "charge" | "league";

export interface LeagueMember {
  rank: number;
  name: string;
  avatarLetter: string;
  avatarColor: string; // e.g. "green" | "yellow" | "gold"
  xp: number;
  isCurrentUser?: boolean;
}
