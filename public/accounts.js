/* ============================================================
   ALL VOLLEYBALL — Account Intelligence seed (the B2B engine).
   Warehouse-shaped seed: normalized tables (accounts, quotes,
   customfuze, history, seasonality) that mirror the future schema,
   so seed and live data share one shape. All figures PLACEHOLDER.

   This is the book of business: clubs are the unit of value, not
   orders. Marketing -> quote -> consultative close -> seasonal
   reorders -> CustomFuze production (4 to 6 week lead time).
   ============================================================ */
window.AVBAccounts = (function () {
  "use strict";

  // Reference "today" so the mock is deterministic regardless of clock.
  const asOf = "2026-06-06";

  /* tier: Anchor (largest book) | Core | Developing
     annualSpend: trailing 12-month gear spend (book value contribution)
     cadenceDays: expected interval between orders for this account
     shareOfWallet: estimated % of the club's total gear spend we hold */
  const accounts = [
    { id: "ac-01", name: "Northshore Volleyball Club", tier: "Anchor", region: "Midwest", owner: "Brett", annualSpend: 84200, lastOrder: "2026-05-12", cadenceDays: 90, shareOfWallet: 78 },
    { id: "ac-02", name: "Metro Thunder VBC", tier: "Anchor", region: "Northeast", owner: "Kelsey", annualSpend: 92000, lastOrder: "2026-03-10", cadenceDays: 75, shareOfWallet: 71 },
    { id: "ac-03", name: "Summit Juniors VBC", tier: "Anchor", region: "West", owner: "Kelsey", annualSpend: 76500, lastOrder: "2026-03-02", cadenceDays: 120, shareOfWallet: 65 },
    { id: "ac-04", name: "Desert Heat VBC", tier: "Anchor", region: "West", owner: "Kelsey", annualSpend: 68300, lastOrder: "2026-04-28", cadenceDays: 85, shareOfWallet: 69 },
    { id: "ac-05", name: "Capital Spike VBC", tier: "Core", region: "Northeast", owner: "Brett", annualSpend: 46700, lastOrder: "2026-05-05", cadenceDays: 90, shareOfWallet: 58 },
    { id: "ac-06", name: "Coastal Elite VBC", tier: "Core", region: "South", owner: "Corey", annualSpend: 41800, lastOrder: "2026-02-18", cadenceDays: 90, shareOfWallet: 52 },
    { id: "ac-07", name: "Lakeside Power VBC", tier: "Core", region: "Midwest", owner: "Brett", annualSpend: 38400, lastOrder: "2026-05-28", cadenceDays: 100, shareOfWallet: 60 },
    { id: "ac-08", name: "Highland Crush VBC", tier: "Core", region: "West", owner: "Andrew", annualSpend: 33200, lastOrder: "2026-01-25", cadenceDays: 90, shareOfWallet: 48 },
    { id: "ac-09", name: "Granite State Smash", tier: "Core", region: "Northeast", owner: "Andrew", annualSpend: 29400, lastOrder: "2026-06-01", cadenceDays: 80, shareOfWallet: 55, newThisQtr: true },
    { id: "ac-10", name: "Prairie Storm VBC", tier: "Developing", region: "Midwest", owner: "Corey", annualSpend: 14500, lastOrder: "2026-05-30", cadenceDays: 110, shareOfWallet: 40, newThisQtr: true },
    { id: "ac-11", name: "Riverside Rally VBC", tier: "Developing", region: "South", owner: "Kelsey", annualSpend: 11900, lastOrder: "2026-04-08", cadenceDays: 120, shareOfWallet: 35 },
    { id: "ac-12", name: "Valley Velocity VBC", tier: "Developing", region: "West", owner: "Corey", annualSpend: 9800, lastOrder: "2026-02-02", cadenceDays: 100, shareOfWallet: 30 },
  ];

  /* Quote pipeline. stage: Lead | Quote sent | Negotiation | Verbal yes
     (open). kind labels the opportunity type. value in USD. */
  const quotes = [
    { id: "q-01", account: "Eastvale Surge VBC", prospect: true, kind: "New program", value: 52000, stage: "Negotiation", owner: "Brett", ageDays: 18, expectedClose: "2026-06-20" },
    { id: "q-02", account: "Harbor City VBC", prospect: true, kind: "New program", value: 44500, stage: "Lead", owner: "Kelsey", ageDays: 2, expectedClose: "2026-07-10" },
    { id: "q-03", account: "Pinnacle Junior VB", prospect: true, kind: "New program", value: 38000, stage: "Quote sent", owner: "Andrew", ageDays: 9, expectedClose: "2026-07-01" },
    { id: "q-04", account: "Metro Thunder VBC", kind: "Seasonal reorder", value: 31000, stage: "Quote sent", owner: "Kelsey", ageDays: 7, expectedClose: "2026-06-22" },
    { id: "q-05", account: "Desert Heat VBC", kind: "CustomFuze", value: 27800, stage: "Verbal yes", owner: "Kelsey", ageDays: 5, expectedClose: "2026-06-14" },
    { id: "q-06", account: "Summit Juniors VBC", kind: "Expansion", value: 24000, stage: "Quote sent", owner: "Kelsey", ageDays: 6, expectedClose: "2026-06-25" },
    { id: "q-07", account: "Coastal Elite VBC", kind: "Seasonal reorder", value: 19500, stage: "Verbal yes", owner: "Corey", ageDays: 11, expectedClose: "2026-06-12" },
    { id: "q-08", account: "Ridgeline VBC", prospect: true, kind: "New program", value: 16200, stage: "Lead", owner: "Corey", ageDays: 1, expectedClose: "2026-07-15" },
    { id: "q-09", account: "Northshore Volleyball Club", kind: "Add-on", value: 12800, stage: "Negotiation", owner: "Brett", ageDays: 4, expectedClose: "2026-06-18" },
    { id: "q-10", account: "Capital Spike VBC", kind: "Expansion", value: 9400, stage: "Negotiation", owner: "Brett", ageDays: 13, expectedClose: "2026-06-16" },
  ];

  /* CustomFuze production. status: Queued | Design approval | In production | Shipping | Delivered
     Lead time is 4 to 6 weeks. dueDate is the team's first whistle. */
  const customfuze = [
    { account: "Summit Juniors VBC", value: 16500, orderDate: "2026-05-10", dueDate: "2026-06-20", status: "Shipping" },
    { account: "Lakeside Power VBC", value: 12600, orderDate: "2026-05-15", dueDate: "2026-06-28", status: "In production" },
    { account: "Northshore Volleyball Club", value: 18400, orderDate: "2026-05-20", dueDate: "2026-07-01", status: "In production" },
    { account: "Metro Thunder VBC", value: 22000, orderDate: "2026-05-28", dueDate: "2026-07-05", status: "Design approval" },
    { account: "Desert Heat VBC", value: 14800, orderDate: "2026-06-01", dueDate: "2026-07-15", status: "Design approval" },
    { account: "Capital Spike VBC", value: 9200, orderDate: "2026-06-03", dueDate: "2026-07-10", status: "Queued" },
  ];
  const customfuzeWeeklyCeiling = 45000; // production capacity per week, PLACEHOLDER

  /* Closed history for win rate and cycle time (trailing two quarters). */
  const history = { closedWon: 23, closedLost: 13, avgCycleDays: 27 };

  /* Seasonality: Teams order-volume index by month (0 to 100). The story:
     June opens the window into the late-summer fall peak. */
  const seasonality = [
    { m: "Jan", idx: 70, note: "Club season" },
    { m: "Feb", idx: 55 },
    { m: "Mar", idx: 40 },
    { m: "Apr", idx: 35 },
    { m: "May", idx: 45 },
    { m: "Jun", idx: 60, note: "Window opens", here: true },
    { m: "Jul", idx: 88 },
    { m: "Aug", idx: 100, note: "Fall peak" },
    { m: "Sep", idx: 78 },
    { m: "Oct", idx: 50 },
    { m: "Nov", idx: 72, note: "Club ramp" },
    { m: "Dec", idx: 65 },
  ];

  return { asOf, accounts, quotes, customfuze, customfuzeWeeklyCeiling, history, seasonality };
})();
