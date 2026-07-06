import { z } from "zod";

export const contentBlockTypeSchema = z.enum(["LEARN", "EVALUATE"]);
export const contentBlockStatusSchema = z.enum(["DRAFT", "PUBLISHED"]);

export const learnPayloadSchema = z.object({
  type: z.string().min(1, "Block type is required"),
  content: z.string().min(1, "Content is required"),
  metadata: z.string().optional(),
  attachments: z
    .array(
      z.object({
        mediaAssetId: z.string(),
        filename: z.string(),
        cdnUrl: z.string(),
      }),
    )
    .optional(),
});

export const evaluatePayloadSchema = z.object({
  type: z.string().min(1, "Block type is required"),
  question: z.string().min(1, "Question is required"),
  options: z.array(z.string()).optional(),
  correctAnswer: z.string().optional(),
  explanation: z.string().optional(),
  metadata: z.string().optional(),
  attachments: z
    .array(
      z.object({
        mediaAssetId: z.string(),
        filename: z.string(),
        cdnUrl: z.string(),
      }),
    )
    .optional(),
});

export const createContentBlockSchema = z.object({
  waveId: z.string().min(1, "Wave is required"),
  title: z.string().min(1, "Title is required"),
  type: contentBlockTypeSchema,
  payloadJson: z.string().min(2, "Payload is required"),
});

export const updateContentBlockSchema = z.object({
  title: z.string().min(1, "Title is required"),
  payloadJson: z.string().min(2, "Payload is required"),
});

export type ContentBlockType = z.infer<typeof contentBlockTypeSchema>;
export type ContentBlockStatus = z.infer<typeof contentBlockStatusSchema>;
export type CreateContentBlockInput = z.infer<typeof createContentBlockSchema>;
export type UpdateContentBlockInput = z.infer<typeof updateContentBlockSchema>;
export type LearnPayload = z.infer<typeof learnPayloadSchema>;
export type EvaluatePayload = z.infer<typeof evaluatePayloadSchema>;
