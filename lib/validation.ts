import { z } from "zod";
import { CHANNELS, CATEGORIES, TYPES, STATUSES } from "./constants";

const periodRe = /^\d{4}-(0[1-9]|1[0-2])$/;

export const expenseInput = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  channel: z.enum(CHANNELS),
  category: z.enum(CATEGORIES),
  // Accept dollars from the form, store cents in the route.
  amount: z.coerce.number().min(0, "Amount must be zero or more").max(100_000_000),
  period: z.string().regex(periodRe, "Period must be YYYY-MM"),
  type: z.enum(TYPES).default("one_time"),
  status: z.enum(STATUSES).default("planned"),
  vendor: z.string().trim().max(120).optional().nullable(),
  notes: z.string().trim().max(500).optional().nullable(),
});

export const expensePatch = expenseInput.partial();

export const targetInput = z.object({
  period: z.string().regex(periodRe),
  category: z.enum(CATEGORIES),
  targetPct: z.coerce.number().min(0).max(100),
});

export const settingsInput = z.object({
  monthlyBudget: z.coerce.number().min(0).max(100_000_000),
  testInnovationPct: z.coerce.number().min(0).max(100),
});

export const commentInput = z.object({
  entityType: z.string().trim().min(1).max(60),
  entityId: z.string().trim().min(1).max(120),
  body: z.string().trim().min(1, "Write something").max(2000),
});

const dateRe = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

export const EMAIL_TRACKS = ["teams", "retail", "customfuze", "other"] as const;
export const EMAIL_STATUSES = ["idea", "draft", "built", "review", "scheduled", "sent"] as const;
export const SOCIAL_STATUSES = ["planned", "drafted", "approved", "posted"] as const;

export const emailInput = z.object({
  sendDate: z.string().regex(dateRe, "Date must be YYYY-MM-DD"),
  track: z.enum(EMAIL_TRACKS).default("teams"),
  platform: z.string().trim().max(40).default("Redo"),
  subjectA: z.string().trim().min(1, "Subject A is required").max(200),
  subjectB: z.string().trim().max(200).optional().nullable(),
  preheader: z.string().trim().max(200).optional().nullable(),
  body: z.string().trim().max(20000).optional().nullable(),
  status: z.enum(EMAIL_STATUSES).default("draft"),
  owner: z.string().trim().max(60).optional().nullable(),
  html: z.string().max(900000).optional().nullable(),
});
export const emailPatch = emailInput.partial();

export const socialInput = z.object({
  postDate: z.string().regex(dateRe, "Date must be YYYY-MM-DD"),
  pillar: z.string().trim().min(1).max(60).default("Education"),
  concept: z.string().trim().min(1, "Concept is required").max(200),
  caption: z.string().trim().max(3000).optional().nullable(),
  format: z.string().trim().max(80).optional().nullable(),
  status: z.enum(SOCIAL_STATUSES).default("planned"),
  owner: z.string().trim().max(60).optional().nullable(),
});
export const socialPatch = socialInput.partial();

export const attachmentInput = z.object({
  entityType: z.string().trim().min(1).max(60),
  entityId: z.string().trim().min(1).max(120),
  filename: z.string().trim().min(1).max(200),
  mime: z.string().trim().regex(/^image\//, "Only images for now"),
  dataBase64: z.string().min(1).max(3_800_000, "Image too large. Keep it under ~2.5 MB."),
});

export type ExpenseInput = z.infer<typeof expenseInput>;
export type EmailInput = z.infer<typeof emailInput>;
export type SocialInput = z.infer<typeof socialInput>;
