export interface CourseListItem {
  id: string;
  title: string;
  isPublished: boolean;
}

export interface CoursesQueryData {
  courses?: {
    edges?: Array<{
      node: CourseListItem;
    }>;
  };
}

export interface LeaderboardEntryData {
  rank: number;
  userId: string;
  /** Already masked by the gateway. */
  displayName: string;
  totalXp: number;
  isMe: boolean;
}

export interface LeaderboardQueryData {
  leaderboard?: {
    totalRanked: number;
    entries: LeaderboardEntryData[];
    /** The viewer's standing, present even when they fall outside the page. */
    me: LeaderboardEntryData | null;
  };
}

export interface AchievementData {
  id: string;
  name: string;
  description: string;
  iconUrl: string | null;
  unlocked: boolean;
  unlockedAt: string | null;
}

export interface AchievementsQueryData {
  achievements?: AchievementData[];
}
