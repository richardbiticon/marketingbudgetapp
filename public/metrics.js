/* ============================================================
   SEMANTIC LAYER (the metric dictionary, in code).
   Every account KPI is defined and computed here, exactly once.
   Views read from this, never recompute. When live data lands,
   only the seed source changes. The definitions do not.
   ============================================================ */
window.AVBMetrics = (function () {
  "use strict";

  const A = window.AVBAccounts;

  // Stage win-probability for weighting open pipeline.
  const STAGE_PROB = { "Lead": 0.15, "Quote sent": 0.40, "Negotiation": 0.60, "Verbal yes": 0.85 };
  const OPEN_STAGES = ["Lead", "Quote sent", "Negotiation", "Verbal yes"];

  function parse(d) { return new Date(d + "T00:00:00Z"); }
  function daysBetween(a, b) { return Math.round((parse(b) - parse(a)) / 86400000); }

  /* ---- Account health: status derived from cadence, not stored ---- */
  function accountHealth(acc) {
    const daysSince = daysBetween(acc.lastOrder, A.asOf);
    const over = daysSince - acc.cadenceDays;
    let status = "active";
    if (over > acc.cadenceDays * 0.5) status = "at_risk";
    else if (over > 0) status = "overdue";
    return { daysSince: daysSince, daysOverdue: Math.max(0, over), status: status };
  }
  function accountsWithHealth() {
    return A.accounts.map(function (a) { return Object.assign({}, a, accountHealth(a)); });
  }

  /* ---- Book of business ---- */
  function bookValue() { return A.accounts.reduce(function (s, a) { return s + a.annualSpend; }, 0); }
  function activeAccounts() { return A.accounts.length; }
  function avgShareOfWallet() {
    return Math.round(A.accounts.reduce(function (s, a) { return s + a.shareOfWallet; }, 0) / A.accounts.length);
  }
  function newThisQuarter() { return A.accounts.filter(function (a) { return a.newThisQtr; }).length; }
  function atRisk() {
    return accountsWithHealth()
      .filter(function (a) { return a.status !== "active"; })
      .sort(function (x, y) { return y.annualSpend - x.annualSpend; });
  }
  function bookByTier() {
    const t = { Anchor: 0, Core: 0, Developing: 0 };
    A.accounts.forEach(function (a) { t[a.tier] += a.annualSpend; });
    return t;
  }

  /* ---- Pipeline ---- */
  function openQuotes() { return A.quotes.filter(function (q) { return OPEN_STAGES.indexOf(q.stage) !== -1; }); }
  function pipelineValue() { return openQuotes().reduce(function (s, q) { return s + q.value; }, 0); }
  function weightedPipeline() {
    return Math.round(openQuotes().reduce(function (s, q) { return s + q.value * (STAGE_PROB[q.stage] || 0); }, 0));
  }
  function pipelineByStage() {
    return OPEN_STAGES.map(function (st) {
      const rows = A.quotes.filter(function (q) { return q.stage === st; });
      return { stage: st, count: rows.length, value: rows.reduce(function (s, q) { return s + q.value; }, 0), prob: STAGE_PROB[st] };
    });
  }
  function winRate() {
    const t = A.history.closedWon + A.history.closedLost;
    return t ? Math.round((A.history.closedWon / t) * 100) : 0;
  }
  function avgCycleDays() { return A.history.avgCycleDays; }

  /* ---- CustomFuze production capacity by week of due date ---- */
  function mondayOf(dateStr) {
    const d = parse(dateStr);
    const dow = (d.getUTCDay() + 6) % 7; // Mon=0
    d.setUTCDate(d.getUTCDate() - dow);
    return d.toISOString().slice(0, 10);
  }
  function leadWeeks(o) {
    const d = daysBetween(o.orderDate, o.dueDate);
    return Math.round((d / 7) * 10) / 10;
  }
  function fuzeWithLead() {
    return A.customfuze.map(function (o) {
      const weeksToDue = daysBetween(A.asOf, o.dueDate) / 7;
      return Object.assign({}, o, { lead: leadWeeks(o), weeksToDue: Math.round(weeksToDue * 10) / 10 });
    });
  }
  function fuzeCapacityByWeek() {
    const buckets = {};
    A.customfuze.forEach(function (o) {
      const wk = mondayOf(o.dueDate);
      if (!buckets[wk]) buckets[wk] = { week: wk, load: 0, items: 0 };
      buckets[wk].load += o.value; buckets[wk].items += 1;
    });
    return Object.keys(buckets).sort().map(function (k) {
      const b = buckets[k];
      return Object.assign({}, b, { ceiling: A.customfuzeWeeklyCeiling, over: b.load > A.customfuzeWeeklyCeiling });
    });
  }

  /* ---- One summary object for the KPI strip ---- */
  function summary() {
    return {
      activeAccounts: activeAccounts(),
      bookValue: bookValue(),
      pipelineValue: pipelineValue(),
      weightedPipeline: weightedPipeline(),
      winRate: winRate(),
      avgCycleDays: avgCycleDays(),
      atRiskCount: atRisk().length,
      newThisQuarter: newThisQuarter(),
      avgShareOfWallet: avgShareOfWallet(),
    };
  }

  return {
    asOf: A.asOf, STAGE_PROB: STAGE_PROB,
    accountsWithHealth, accountHealth, bookValue, activeAccounts, avgShareOfWallet,
    newThisQuarter, atRisk, bookByTier, openQuotes, pipelineValue, weightedPipeline,
    pipelineByStage, winRate, avgCycleDays, fuzeWithLead, fuzeCapacityByWeek, summary,
  };
})();
