"use client";
export type Theme = "dark" | "light";

export function getTheme(): Theme {
  if (typeof document === "undefined") return "dark";
  const m = document.cookie.match(/avb_theme=(light|dark)/);
  return (m ? m[1] : "dark") as Theme;
}

export function applyTheme(t: Theme) {
  const el = document.documentElement;
  el.classList.remove("dark", "light");
  el.classList.add(t);
  // Shared with the static OS at / via the cookie. path=/ covers both.
  document.cookie = `avb_theme=${t}; path=/; max-age=31536000; samesite=lax`;
}

// Inline this in <head> so the theme applies before first paint (no flash).
export const themeInitScript =
  "(function(){try{var m=document.cookie.match(/avb_theme=(light|dark)/);var t=m?m[1]:'dark';var e=document.documentElement;e.classList.remove('dark','light');e.classList.add(t);}catch(e){document.documentElement.classList.add('dark');}})();";
