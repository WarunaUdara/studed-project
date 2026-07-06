import { z } from "zod";

export const mediaAssetStatusSchema = z.enum(["PENDING", "READY", "FAILED"]);

export const mediaAssetSchema = z.object({
  id: z.string(),
  uploaderId: z.string(),
  filename: z.string(),
  mimeType: z.string(),
  sizeBytes: z.number(),
  storageKey: z.string(),
  cdnUrl: z.string().nullable(),
  status: mediaAssetStatusSchema,
  createdAt: z.string(),
});

export type MediaAsset = z.infer<typeof mediaAssetSchema>;

export const uploadProgressSchema = z.object({
  loaded: z.number(),
  total: z.number(),
  percentage: z.number(),
});

export type UploadProgress = z.infer<typeof uploadProgressSchema>;
