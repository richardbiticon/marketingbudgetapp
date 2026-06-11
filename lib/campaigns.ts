// Shared client types + color maps for the Campaigns module.

export interface EmailRow {
  id: string;
  sendDate: string; // YYYY-MM-DD
  track: string;
  platform: string;
  subjectA: string;
  subjectB: string | null;
  preheader: string | null;
  body: string | null;
  status: string;
  owner: string | null;
  html: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SocialRow {
  id: string;
  postDate: string;
  pillar: string;
  concept: string;
  caption: string | null;
  format: string | null;
  status: string;
  owner: string | null;
  createdAt: string;
  updatedAt: string;
}

export const TRACKS = ["teams", "retail", "customfuze", "other"] as const;
export const TRACK_LABEL: Record<string, string> = {
  teams: "Teams", retail: "Retail", customfuze: "CustomFuze", other: "Other",
};
export const TRACK_COLOR: Record<string, string> = {
  teams: "#D7172A", retail: "#ede7da", customfuze: "#ff6178", other: "#6b7280",
};

export const EMAIL_STATUSES = ["idea", "draft", "built", "review", "scheduled", "sent"] as const;
export const EMAIL_STATUS_COLOR: Record<string, string> = {
  idea: "#807868", draft: "#9aa1ad", built: "#e3ad36", review: "#ff6178", scheduled: "#cdc7ba", sent: "#57c47b",
};

export const PILLARS = ["Education", "Product", "Club Spotlight", "Win + BTS", "CustomFuze", "Tournament / UGC", "Brand"];
export const PILLAR_COLOR: Record<string, string> = {
  "Education": "#cdc7ba", "Product": "#8b93a3", "Club Spotlight": "#ef2540",
  "Win + BTS": "#e3ad36", "CustomFuze": "#ff6178", "Tournament / UGC": "#b7b0a3", "Brand": "#57c47b",
};

export const SOCIAL_STATUSES = ["planned", "drafted", "approved", "posted"] as const;
export const SOCIAL_STATUS_COLOR: Record<string, string> = {
  planned: "#807868", drafted: "#e3ad36", approved: "#cdc7ba", posted: "#57c47b",
};
