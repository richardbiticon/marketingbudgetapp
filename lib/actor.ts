"use client";
// Interim identity. Stored in a cookie and sent as the x-actor header on every
// mutation so changes and comments are attributed. Real Google auth (Auth.js)
// replaces this layer without changing the API contract.
export const TEAM = ["Richard", "Corey", "Andrew", "Brett", "Kelsey"];

export function getActor(): string {
  if (typeof document === "undefined") return TEAM[0];
  const m = document.cookie.match(/(?:^|; )avb_actor=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : TEAM[0];
}

export function setActor(name: string) {
  document.cookie = `avb_actor=${encodeURIComponent(name)}; path=/; max-age=31536000`;
}

// Headers for a mutating request, carrying the current actor.
export function authedHeaders(extra: Record<string, string> = {}): Record<string, string> {
  return { "Content-Type": "application/json", "x-actor": getActor(), ...extra };
}
