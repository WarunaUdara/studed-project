export interface LeaderboardEntry {
  rank: number;
  user: { id: string; fullName: string };
  totalXp: number;
}
