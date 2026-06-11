"use client";
import * as React from "react";
import { Sun, Moon } from "lucide-react";
import { getTheme, applyTheme, type Theme } from "@/lib/theme";

export function ThemeToggle() {
  const [theme, setThemeState] = React.useState<Theme>("dark");
  React.useEffect(() => { setThemeState(getTheme()); }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    applyTheme(next);
    setThemeState(next);
  }

  return (
    <button
      onClick={toggle}
      title={theme === "dark" ? "Switch to light" : "Switch to dark"}
      aria-label="Toggle theme"
      className="grid h-9 w-9 place-items-center rounded-lg border border-line bg-ink-panel text-cream-base transition-colors hover:bg-white/[0.06] hover:text-cream-light"
    >
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
