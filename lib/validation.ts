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

export type ExpenseInput = z.infer<typeof expenseInput>;
