/* ============================================================
   ALL VOLLEYBALL — Seed data (the live current state).
   Single source of truth for the dashboard on first boot.
   Connectors (Asana / Klaviyo / n8n) overwrite these at runtime
   when env keys are present. Until then, this renders everything.

   Leaf status union: not_started | in_progress | blocked | done
   ============================================================ */
window.AVB = (function () {
  "use strict";

  /* ---------------- ROCKS (Q2) ---------------- */
  /* Asana project GID 1215155436119479. Sections map to subgroups. */
  const rocks = [
    {
      id: "rock-1",
      num: "ROCK 01",
      title: "Sublimation",
      owner: "Richard",
      live: "https://avb-sublimation-page.vercel.app/",
      subgroups: [
        {
          name: "Brand pages",
          leaves: [
            { name: "adidas page", status: "done", owner: "Jerico", note: "built first as the prototype template" },
            { name: "UA page", status: "in_progress", owner: "Jerico", note: "after adidas template proven" },
            { name: "Mizuno page", status: "not_started", owner: "Jerico", note: "after adidas template proven" },
            { name: "Comparison framework copy", status: "in_progress", owner: "Andrew", note: "Andrew sign-off before launch" },
          ],
        },
        {
          name: "Master Lookbook",
          leaves: [
            { name: "PDF v1", status: "done", note: "18 pages, image placeholders, scan clean" },
            { name: "Digital web version v2", status: "in_progress" },
            { name: "Decision framework section", status: "not_started", note: "non-negotiable" },
          ],
        },
        {
          name: "On-site placements",
          leaves: [
            { name: "PDP module", status: "in_progress", note: "ship first" },
            { name: "Nav entry point + mega menu", status: "not_started" },
            { name: "PLP promo tile", status: "not_started" },
            { name: "Quote / lead flow integration", status: "blocked", note: "waiting on routing CTA decision" },
          ],
        },
        {
          name: "Open items flagged",
          leaves: [
            { name: "Turnaround language", status: "blocked", owner: "Brett", note: "Brett to confirm" },
            { name: "Quote routing CTA", status: "blocked", owner: "Brett", note: "Brett to confirm" },
          ],
        },
      ],
    },
    {
      id: "rock-2",
      num: "ROCK 02",
      title: "Positioning Rollout",
      owner: "Corey",
      subgroups: [
        {
          name: "Voice and brand guide",
          leaves: [
            { name: "Andrew + Brett sign-off", status: "in_progress", owner: "Andrew" },
            { name: "Voice in action one-pager (right way / wrong way)", status: "done" },
            { name: "Weekly content rhythm doc", status: "in_progress" },
            { name: "30-min training session (social + CS)", status: "not_started" },
          ],
        },
        {
          name: "Teams and Clubs page rewrite",
          leaves: [
            { name: "Copy refinement", status: "in_progress" },
            { name: "Real proof points (replace placeholder stats)", status: "blocked", note: "need verified numbers" },
            { name: "Jerico builds", status: "not_started", owner: "Jerico" },
            { name: "Andrew approves before launch", status: "not_started", owner: "Andrew" },
          ],
        },
        {
          name: "Top 5 page audit and rewrite",
          leaves: [
            { name: "Homepage", status: "in_progress" },
            { name: "Teams and Clubs", status: "in_progress" },
            { name: "CustomFuze landing", status: "not_started" },
            { name: "About", status: "not_started" },
            { name: "Top-converting category page", status: "not_started" },
          ],
        },
        {
          name: "Customer service visibility",
          leaves: [
            { name: "Screenshot / quote permission workflow", status: "not_started" },
            { name: "Behind-the-scenes cadence", status: "not_started" },
            { name: '"We made it right" story series', status: "not_started" },
            { name: "First-name signature standard", status: "in_progress" },
            { name: "Customer / coach spotlight series", status: "not_started" },
          ],
        },
        {
          name: "Locked phrase pending sign-off",
          leaves: [
            { name: '"Where average isn\'t good enough."', status: "blocked", owner: "Corey", note: "candidate locked phrase pending Corey sign-off" },
          ],
        },
      ],
    },
    {
      id: "rock-3",
      num: "ROCK 03",
      title: "Marketing Budget",
      owner: "Richard",
      subgroups: [
        {
          name: "P&L Baseline",
          leaves: [
            { name: "Pull Meta", status: "in_progress" },
            { name: "Pull Google", status: "in_progress" },
            { name: "Pull Klaviyo + Attentive", status: "not_started" },
            { name: "Pull partnerships / sponsorships", status: "not_started" },
            { name: "Pull tools / software costs", status: "in_progress" },
            { name: "Allocate internal labor", status: "not_started" },
            { name: "Categorize by Retail / Team / Shared", status: "not_started" },
            { name: "Build live dashboard", status: "in_progress", note: "this view" },
          ],
        },
        {
          name: "Reallocation (joint with Andrew)",
          leaves: [
            { name: "Set target mix % (Team vs Retail vs Test)", status: "not_started", owner: "Andrew" },
            { name: "Zero-based rebuild walkthrough", status: "not_started", owner: "Andrew" },
            { name: "Carve out Test / Innovation budget (5-10%)", status: "not_started" },
          ],
        },
        {
          name: "Precision cuts",
          leaves: [
            { name: "Easy wins first", status: "not_started" },
            { name: "Diminishing-return channels", status: "not_started" },
            { name: "Hard cuts last (anything touching Team)", status: "not_started" },
          ],
        },
      ],
    },
    {
      id: "rock-4",
      num: "ROCK 04",
      title: "Team-side Content Buildout",
      owner: "Kelsey",
      subgroups: [
        {
          name: "Coverage and calendar",
          leaves: [
            { name: "Tournament / event coverage plan (NQ, JNats, AVCA)", status: "in_progress" },
            { name: "Knowledge content calendar (ordering timelines, sizing, care)", status: "in_progress" },
            { name: "Coach / club director spotlight series", status: "not_started" },
            { name: "Volleyball influencer outreach list", status: "in_progress" },
            { name: "Engagement workflow (real comments)", status: "not_started" },
          ],
        },
      ],
    },
  ];

  /* ---------------- CAMPAIGNS ---------------- */
  /* email status: built | placeholder_flagged | scheduled | sent */
  const teamsEmails = [
    { no: 1, a: "Volleyball only. That is the whole business.", b: "The whole business is volleyball. Nothing else.", status: "sent" },
    { no: 2, a: "If you are serious about your program, we are your partner.", b: "Serious programs need a serious partner.", status: "sent" },
    { no: 3, a: "The rest is logistics.", b: "Pick the gear. The rest is logistics.", status: "scheduled" },
    { no: 4, a: "We are not the cheapest. Here is why that matters.", b: "Cheap costs you later. Either way, you pay for it.", status: "scheduled",
      flag: "Longevity claim needs verification before go-live." },
    { no: 5, a: "Too big to care. Too small to deliver.", b: "Most dealers are too big to care or too small to deliver.", status: "built" },
    { no: 6, a: "Gear you love. On time. Under budget. Done correctly.", b: "On time. Under budget. Done correctly.", status: "built" },
    { no: 7, a: "Where average isn't good enough.", b: "Built for programs where average isn't good enough.", status: "placeholder_flagged",
      flag: "Hold: locked phrase pending Corey sign-off." },
    { no: 8, a: "A coach told us what changed. Here it is.", b: "One coach, one season, one honest result.", status: "placeholder_flagged",
      flag: "Need real customer quote and permission." },
    { no: 9, a: "Built for the programs that expect more.", b: "For directors who expect more from a dealer.", status: "built" },
    { no: 10, a: "Your season. Our system.", b: "Run your season on our system.", status: "placeholder_flagged",
      flag: "Founder name substitution still a placeholder." },
  ];

  const campaigns = {
    teams: {
      name: "Q2 Teams Repositioning Campaign",
      track: "teams",
      platform: "Redo",
      meta: "10-email arc. A/B variants. Warm list. Mon / Wed / Fri cadence.",
      emails: teamsEmails,
    },
    retail: {
      name: "Retail Email Track",
      track: "retail",
      platform: "Klaviyo",
      meta: "Parallel and warmer. Product-forward, individual-buyer oriented.",
      emails: [
        { no: "E2-A", a: "Five Shelves. One Sport.", b: null, status: "built", note: "complete, scan clean" },
        { no: "E2-B", a: "Everything for the player who only plays one game.", b: null, status: "built" },
        { no: "E3-A", a: "The shoe wall, sorted by how you move.", b: null, status: "placeholder_flagged",
          flag: "Awaiting final shoe-wall product set." },
      ],
    },
  };

  /* Klaviyo metrics panel (connector overwrites; seed fallback). PLACEHOLDER. */
  const klaviyo = {
    source: "seed",
    openRate: 41.2, openDelta: +3.4,
    clickRate: 4.8, clickDelta: -0.6,
    revenue: 18420, revenueDelta: +12.1, // PLACEHOLDER
    recipients: 9240,
  };

  /* ---------------- PROMOS ---------------- */
  const promos = [
    {
      name: "75% Clearance Shoes (VIP early + public)",
      code: "VIP75",
      scope: "VIP early access then public sale",
      status: "ended",
      start: "Spring, pre-season",
      end: "Spring, closed",
      terms: "75% off clearance footwear. VIP early window opened first, then public.",
      note: "Confirm VIP75 is deactivated in Shopify and any link-in-bio is repointed.",
    },
    {
      name: "June 1 Discount and Shipping Test",
      code: null,
      scope: "Retail online + Teams / small clubs",
      status: "active",
      start: "June 1",
      end: "Test window, open",
      terms: "Tiered retail shipping and discount test running in parallel with a held team floor.",
      retailTiers: [
        { threshold: "$99+", ship: "Free shipping", discount: "—" },
        { threshold: "$150+", ship: "Free shipping", discount: "+10%" },
        { threshold: "$200+", ship: "Free shipping", discount: "+15%" },
      ],
      teams: {
        floor: "15%",
        upTo: "20%",
        ceiling: "20% off PLUS free shipping. Hold that line.",
      },
      rules: [
        "Free shipping on online and team orders. Physical retail stores charge shipping.",
        "Equipment excluded from all discounts.",
        'PDP copy add: "Buying for club? Contact us for special pricing."',
      ],
      note: "Redo Checkout $6.95 review is Simon's, separate, not June.",
    },
  ];

  /* ---------------- BUDGET (P&L) ---------------- */
  /* All figures PLACEHOLDER until real pulls land. category: Retail | Team | Shared */
  const budget = {
    currency: "USD",
    channels: [
      { source: "Meta",         category: "Retail", monthly: 14200 }, // PLACEHOLDER
      { source: "Meta",         category: "Team",   monthly: 6100 },  // PLACEHOLDER
      { source: "Google",       category: "Retail", monthly: 9800 },  // PLACEHOLDER
      { source: "Google",       category: "Team",   monthly: 3400 },  // PLACEHOLDER
      { source: "Klaviyo",      category: "Shared", monthly: 1150 },  // PLACEHOLDER
      { source: "Attentive",    category: "Retail", monthly: 980 },   // PLACEHOLDER
      { source: "Partnerships", category: "Team",   monthly: 5200 },  // PLACEHOLDER
      { source: "Tools",        category: "Shared", monthly: 2300 },  // PLACEHOLDER
      { source: "Labor",        category: "Shared", monthly: 8800 },  // PLACEHOLDER
    ],
    targetMix: { Team: 45, Retail: 45, Test: 10 }, // % target
    testCarveout: { targetPct: 10, currentPct: 3.2 }, // PLACEHOLDER current
  };

  /* ---------------- AUTOMATION (n8n) ---------------- */
  const automation = {
    base: "https://richardbiticon.app.n8n.cloud",
    live: [
      {
        name: "UA B2B Shipment Email Parser",
        status: "live",
        desc: "Parses inbound UA B2B shipment emails into structured rows.",
        spec: [
          "OpenAI node. response_format: json_object. temperature 0.",
          "Production prompt with null handling and schema enforcement.",
          "parse-notes field captured on every run.",
          "Output to Google Sheets.",
        ],
        tags: ["OpenAI", "JSON mode", "Schema enforced", "Google Sheets"],
      },
    ],
    vendorRoadmap: {
      note: "Vendor expansion. Per-vendor prompts, separate per brand.",
      vendors: [
        { name: "adidas", status: "planned" },
        { name: "Mizuno", status: "planned" },
        { name: "Nike", status: "planned" },
        { name: "Asics", status: "planned" },
        { name: "Mikasa", status: "planned" },
        { name: "Tachikara", status: "planned" },
        { name: "Molten", status: "planned" },
      ],
    },
    backlog: [
      { name: "Customer intelligence / talking-points bot", status: "idea" },
      { name: "Churn radar", status: "idea" },
      { name: "Quote-to-close tracking", status: "idea" },
      { name: "Order status aggregation", status: "idea" },
      { name: "Exception reporting", status: "idea" },
      { name: "Margin analysis", status: "idea" },
      { name: "Internal comms synthesis", status: "idea" },
    ],
  };

  /* ---------------- PARTNERSHIPS / CONTENT ---------------- */
  const partnerships = [
    {
      name: "Megan Gormley",
      role: "UGC partnership",
      status: "in_progress",
      source: "Asana: Discount Strategy / UGC section",
      note: "Status tracked in Asana. UGC creative pipeline.",
    },
  ];

  const content = {
    buildout: [
      "Tournament / event coverage plan (NQ, JNats, AVCA).",
      "Knowledge content calendar: ordering timelines, sizing, care.",
      "Coach and club director spotlight series.",
      "Volleyball influencer outreach list.",
      "Engagement workflow built on real comments, not canned replies.",
    ],
    spotlightSeries: [
      "Coach / club director spotlight series.",
      '"We made it right" customer service story series.',
      "Customer and coach spotlight series, first-name signed.",
    ],
  };

  /* ---------------- META ---------------- */
  const meta = {
    quarter: "Q2",
    team: ["Richard", "Corey", "Andrew", "Brett", "Kelsey"],
    asanaProject: "1215155436119479",
    phrases: [
      "Volleyball only. That is the whole business.",
      "If you are serious about your program, we are your partner.",
      "The rest is logistics.",
      "We are not the cheapest.",
      "Too big to care. Too small to deliver.",
      "Either way, you pay for it.",
      "Gear you love. On time. Under budget. Done correctly.",
      "Where average isn't good enough.",
    ],
  };

  return { rocks, campaigns, klaviyo, promos, budget, automation, partnerships, content, meta };
})();
