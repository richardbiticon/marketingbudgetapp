// Discipline scanner (brand requirement), ported from the OS.
// Flags em dashes, banned words, hard year references, quote promises.
// Locked brand phrases are exempt from the banned-word check.

export interface Violation { type: string; term: string; message: string }
export interface ScanResult { clean: boolean; violations: Violation[] }

const BANNED = [
  "solutions", "premium", "best in class", "passionate", "reach out",
  "excited to announce", "game changer", "next level", "world class",
  "leverage", "synergy", "ecosystem", "family", "bulk", "elevated", "cheapest",
];

const LOCKED = [
  "Volleyball only. That is the whole business.",
  "If you are serious about your program, we are your partner.",
  "The rest is logistics.",
  "We are not the cheapest.",
  "Too big to care. Too small to deliver.",
  "Either way, you pay for it.",
  "Gear you love. On time. Under budget. Done correctly.",
  "Where average isn't good enough.",
];

export function scanCopy(text: string | null | undefined): ScanResult {
  const violations: Violation[] = [];
  if (!text) return { clean: true, violations };
  const str = String(text);
  let lower = str.toLowerCase();
  for (const p of LOCKED) lower = lower.split(p.toLowerCase()).join(" ");

  if (/—/.test(str)) {
    violations.push({ type: "em-dash", term: "—", message: "Em dash found. Use periods and colons only." });
  }
  for (const word of BANNED) {
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = word.includes(" ") ? new RegExp(escaped, "i") : new RegExp(`\\b${escaped}\\b`, "i");
    if (re.test(lower)) violations.push({ type: "banned-word", term: word, message: `Banned word: "${word}".` });
  }
  const years = str.match(/\b20\d{2}\b/g);
  if (years) {
    for (const y of Array.from(new Set(years))) {
      violations.push({ type: "year", term: y, message: `Hard year reference: ${y}. Use season-relative language.` });
    }
  }
  if (lower.includes("quote") && /(24[\s-]?hour|same[\s-]?day)/.test(lower)) {
    violations.push({
      type: "quote-promise", term: "24 hour / same day + quote",
      message: "No 24-hour or same-day quote promises. Quote flow is consultative.",
    });
  }
  return { clean: violations.length === 0, violations };
}
