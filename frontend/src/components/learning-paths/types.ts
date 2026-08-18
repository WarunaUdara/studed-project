export type PathCategory = "ALL" | "MATH" | "CS" | "SCIENCE" | "LANGUAGES";

export interface CourseNode {
  id: string;
  title: string;
  description: string;
  slug: string;
  gradeLevel: string;
  price?: number | null;
  myProgress?: { completedWaves: number; totalWaves: number } | null;
  isNew?: boolean;
}

export interface LearningPathDef {
  id: string;
  title: string;
  subtitle: string;
  levelBadge: string;
  category: PathCategory;
  courses: CourseNode[];
}
