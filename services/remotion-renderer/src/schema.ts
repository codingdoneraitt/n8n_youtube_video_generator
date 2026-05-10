import { z } from 'zod';

export const OptionSchema = z.union([
  z.string(),
  z.object({
    id: z.string().optional(),
    text: z.string(),
  }),
]);

export const QuestionSchema = z.object({
  id: z.string().min(1).max(128),
  question: z.string().min(1).max(900),
  options: z.array(OptionSchema).min(2).max(8),
  correctAnswers: z.array(z.string()).min(1).optional(),
  correctAnswer: z.union([z.string(), z.array(z.string())]).optional(),
  explanation: z.string().max(1600).default(''),
  topic: z.string().max(120).optional(),
  difficulty: z.string().max(60).optional(),
});

export const AudioAssetSchema = z.object({
  fileName: z.string().regex(/^[a-zA-Z0-9._-]+\.(wav|mp3|m4a)$/),
  contentBase64: z.string().min(1),
});

export const RenderRequestSchema = z.object({
  runId: z.string().min(1).max(128).regex(/^[a-zA-Z0-9._-]+$/).optional(),
  title: z.string().min(1).max(180).default('Practice Exam Walkthrough'),
  examTitle: z.string().min(1).max(120).default('Practice Exam'),
  sourceApp: z.string().min(1).max(80).default('sample'),
  questions: z.array(QuestionSchema).min(1).max(80),
  audioAssets: z.array(AudioAssetSchema).default([]),
  dryRun: z.boolean().default(false),
  fps: z.number().int().min(24).max(60).default(30),
  width: z.number().int().min(720).max(2160).default(1920),
  height: z.number().int().min(720).max(3840).default(1080),
});

export type RenderRequest = z.infer<typeof RenderRequestSchema>;
export type RenderQuestion = z.infer<typeof QuestionSchema>;
