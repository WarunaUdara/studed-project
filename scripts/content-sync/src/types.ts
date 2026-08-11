export const GRADES = [
  "G1", "G2", "G3", "G4", "G5", "G6", "G7", "G8", "G9", "G10", "G11", "OL", "AL",
] as const;

export type Grade = (typeof GRADES)[number];

export const DIFFICULTIES = ["EASY", "MEDIUM", "HARD"] as const;

export type Difficulty = (typeof DIFFICULTIES)[number];

export const WAVE_STATUSES = ["published", "draft"] as const;

export type WaveStatus = (typeof WAVE_STATUSES)[number];

export const LEARN_BLOCK_TYPES = [
  "heading", "text", "image", "video", "formula", "code", "callout",
  "coordinate_plane", "manim", "molecule", "circuit", "physics",
] as const;

export type LearnBlockType = (typeof LEARN_BLOCK_TYPES)[number];

export const EVALUATE_BLOCK_TYPES = [
  "multiple_choice", "fill_in_blank", "true_false", "numeric",
] as const;

export type EvaluateBlockType = (typeof EVALUATE_BLOCK_TYPES)[number];

export interface LearnBlock {
  id: string;
  type: LearnBlockType;
  content: string;
  metadata?: string | Record<string, unknown>;
}

export interface EvaluateBlock {
  id: string;
  type: EvaluateBlockType;
  question: string;
  options?: string[];
  correctAnswer?: string;
  explanation?: string;
  metadata?: string | Record<string, unknown>;
}

export interface WaveDef {
  title: string;
  sequenceOrder: number;
  xpReward: number;
  maxReattempts: number;
  passingThreshold: number;
  estimatedDuration: number;
  difficulty: Difficulty;
  status?: WaveStatus;
  learnBlocks: LearnBlock[];
  evaluateBlocks: EvaluateBlock[];
}

export interface LessonDef {
  title: string;
  sequenceOrder: number;
  status?: WaveStatus;
  waves: WaveDef[];
}

export interface CourseManifest {
  slug: string;
  title: string;
  description: string;
  gradeLevel: Grade;
  price?: number;
  subject?: string;
  version?: number;
  lessons: LessonDef[];
}

export interface ValidationIssue {
  path: string;
  message: string;
}
