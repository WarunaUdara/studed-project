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

export interface LeaderboardQueryData {
  leaderboard?: Array<{
    rank: number;
    totalXp: number;
    user: {
      id: string;
      fullName: string | null;
    };
  }>;
}
