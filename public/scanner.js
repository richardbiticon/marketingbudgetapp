/* ============================================================
   DISCIPLINE SCANNER
   Brand requirement. scanCopy(text) flags:
     - em dashes
     - banned words
     - hard year references (4-digit, 2000-2099)
     - "24 hour" / "same day" near "quote"
   Returns { clean: boolean, violations: Violation[] }
   Violation = { type, term, message }

   Locked brand phrases are used verbatim and are exempt from the
   banned-word check (so "We are not the cheapest." stays clean even
   though "cheapest" is a banned word in loose copy).
   ============================================================ */
window.Discipline = (function () {
  "use strict";

  // June plan extends the original list with "elevated" and "cheapest".
  const BANNED = [
    "solutions", "premium", "best in class", "passionate", "reach out",
    "excited to announce", "game changer", "next level", "world class",
    "leverage", "synergy", "ecosystem", "family", "bulk", "elevated", "cheapest",
  ];

  // Verbatim locked phrases. Their words are exempt from the banned-word scan.
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

  function stripLocked(lower) {
    let out = lower;
    LOCKED.forEach(function (p) {
      out = out.split(p.toLowerCase()).join(" ");
    });
    return out;
  }

  function scanCopy(text) {
    const violations = [];
    if (text == null) return { clean: true, violations };
    const str = String(text);
    const lower = str.toLowerCase();
    const lowerNoLocked = stripLocked(lower);

    // 1. Em dashes
    if (/[—]/.test(str)) {
      violations.push({ type: "em-dash", term: "—", message: "Em dash found. Use periods and colons only." });
    }

    // 2. Banned words (locked phrases removed first so verbatim use stays clean)
    BANNED.forEach(function (word) {
      const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const re = word.indexOf(" ") === -1
        ? new RegExp("\\b" + escaped + "\\b", "i")
        : new RegExp(escaped, "i");
      if (re.test(lowerNoLocked)) {
        violations.push({ type: "banned-word", term: word, message: 'Banned word: "' + word + '".' });
      }
    });

    // 3. Hard year reference (2000-2099)
    const years = str.match(/\b20\d{2}\b/g);
    if (years) {
      Array.from(new Set(years)).forEach(function (y) {
        violations.push({ type: "year", term: y, message: "Hard year reference: " + y + ". Use season-relative language." });
      });
    }

    // 4. Quote-promise: "24 hour" / "same day" near "quote"
    if (lower.indexOf("quote") !== -1) {
      if (/(24[\s-]?hour|same[\s-]?day)/.test(lower)) {
        violations.push({
          type: "quote-promise",
          term: "24 hour / same day + quote",
          message: "No 24-hour or same-day quote promises. Quote flow is consultative.",
        });
      }
    }

    return { clean: violations.length === 0, violations: violations };
  }

  return { scanCopy: scanCopy, BANNED: BANNED, LOCKED: LOCKED };
})();
