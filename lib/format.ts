// Money is stored in cents. Format for display only.

export function fromCents(cents: number): number {
  return cents / 100;
}

export function dollars(cents: number, opts: { compact?: boolean } = {}): string {
  const v = cents / 100;
  if (opts.compact) {
    if (Math.abs(v) >= 1_000_000) return "$" + (v / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
    if (Math.abs(v) >= 1_000) return "$" + Math.round(v / 1000) + "K";
  }
  return v.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

export function pct(n: number, digits = 0): string {
  return n.toFixed(digits) + "%";
}

export function periodLabel(period: string): string {
  const [y, m] = period.split("-").map(Number);
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  return (months[m - 1] ?? "") + " " + y;
}

export function periodShort(period: string): string {
  const [y, m] = period.split("-").map(Number);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return (months[m - 1] ?? "") + " " + String(y).slice(2);
}

export function shiftPeriod(period: string, delta: number): string {
  const [y, m] = period.split("-").map(Number);
  const idx = y * 12 + (m - 1) + delta;
  const ny = Math.floor(idx / 12);
  const nm = (idx % 12) + 1;
  return `${ny}-${String(nm).padStart(2, "0")}`;
}

export function currentPeriod(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
