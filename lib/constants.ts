// Shared enums, labels, and the locked color system.

export const CHANNELS = [
  "meta",
  "google",
  "microsoft",
  "klaviyo",
  "attentive",
  "partnerships",
  "tools",
  "labor",
  "ugc",
  "other",
] as const;
export type Channel = (typeof CHANNELS)[number];

export const CHANNEL_LABEL: Record<Channel, string> = {
  meta: "Meta",
  google: "Google",
  microsoft: "Microsoft",
  klaviyo: "Klaviyo",
  attentive: "Attentive",
  partnerships: "Partnerships",
  tools: "Tools",
  labor: "Labor",
  ugc: "UGC",
  other: "Other",
};

export const CATEGORIES = ["team", "retail", "shared"] as const;
export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_LABEL: Record<Category, string> = {
  team: "Team",
  retail: "Retail",
  shared: "Shared",
};

export const TYPES = ["one_time", "recurring"] as const;
export type ExpenseType = (typeof TYPES)[number];

export const TYPE_LABEL: Record<ExpenseType, string> = {
  one_time: "One time",
  recurring: "Recurring",
};

export const STATUSES = ["planned", "committed", "spent"] as const;
export type Status = (typeof STATUSES)[number];

export const STATUS_LABEL: Record<Status, string> = {
  planned: "Planned",
  committed: "Committed",
  spent: "Spent",
};

// Locked brand palette. Team red, Retail cream, Shared slate.
export const CATEGORY_COLOR: Record<Category, string> = {
  team: "#D7172A",
  retail: "#ede7da",
  shared: "#6b7280",
};

export const RED = "#D7172A";
