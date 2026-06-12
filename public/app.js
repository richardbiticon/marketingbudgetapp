/* ============================================================
   ALL VOLLEYBALL — Dashboard app.
   Hash router + view renderers + hand-built SVG charts.
   Vanilla JS. Zero build step. Boots entirely on seed data.
   ============================================================ */
(function () {
  "use strict";

  const D = window.AVB;
  const Scan = window.Discipline;

  /* ---------- tiny DOM helpers ---------- */
  function h(tag, attrs, children) {
    const e = document.createElement(tag);
    if (attrs) for (const k in attrs) {
      if (k === "class") e.className = attrs[k];
      else if (k === "html") e.innerHTML = attrs[k];
      else if (k.slice(0, 2) === "on" && typeof attrs[k] === "function") e.addEventListener(k.slice(2), attrs[k]);
      else if (attrs[k] != null) e.setAttribute(k, attrs[k]);
    }
    if (children != null) (Array.isArray(children) ? children : [children]).forEach(function (c) {
      if (c == null) return;
      e.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    });
    return e;
  }
  function esc(s) { const d = document.createElement("div"); d.textContent = s == null ? "" : String(s); return d.innerHTML; }
  function money(n) { return "$" + Math.round(n).toLocaleString("en-US"); }
  function titleCase(s) { return s.replace(/_/g, " "); }

  /* ---------- status helpers ---------- */
  const STATUS_WEIGHT = { done: 1, in_progress: 0.5, blocked: 0.15, not_started: 0 };
  function rollup(leaves) {
    if (!leaves.length) return 0;
    const sum = leaves.reduce(function (a, l) { return a + (STATUS_WEIGHT[l.status] || 0); }, 0);
    return Math.round((sum / leaves.length) * 100);
  }
  function rockLeaves(rock) { return rock.subgroups.reduce(function (a, g) { return a.concat(g.leaves); }, []); }
  function rockPct(rock) { return rollup(rockLeaves(rock)); }
  function countStatus(leaves, st) { return leaves.filter(function (l) { return l.status === st; }).length; }

  function chip(status, label) {
    return h("span", { class: "chip " + status },
      [h("span", { class: "d" }), document.createTextNode(label || titleCase(status))]);
  }

  /* ---------- scan badge ---------- */
  function scanBadge(text) {
    const r = Scan.scanCopy(text);
    if (r.clean) {
      return h("span", { class: "scan clean" }, [
        h("span", { class: "glyph" }, "✓"),
        document.createTextNode("scan clean"),
      ]);
    }
    const tip = h("span", { class: "tip" });
    tip.appendChild(h("div", { html: "<b>" + r.violations.length + " violation" + (r.violations.length > 1 ? "s" : "") + "</b>" }));
    const ul = h("ul");
    r.violations.forEach(function (v) { ul.appendChild(h("li", null, v.message)); });
    tip.appendChild(ul);
    return h("span", { class: "scan dirty" }, [
      h("span", { class: "glyph" }, "✕"),
      document.createTextNode(r.violations.length + " flag" + (r.violations.length > 1 ? "s" : "")),
      tip,
    ]);
  }

  /* ---------- view head ---------- */
  function head(label, title, lede) {
    return h("div", { class: "view-head" }, [
      h("div", { class: "mono" }, "/ " + label),
      h("h1", null, title),
      lede ? h("p", { class: "lede" }, lede) : null,
    ]);
  }
  function sectionLabel(txt) { return h("div", { class: "section-label" }, [h("span", { class: "mono" }, "/ " + txt)]); }

  /* animate any .bar/.mini-bar/.actual widths after mount */
  function animateBars(root) {
    requestAnimationFrame(function () {
      root.querySelectorAll("[data-w]").forEach(function (el) { el.style.width = el.getAttribute("data-w") + "%"; });
    });
  }

  /* ============================================================
     VIEW: OVERVIEW
     ============================================================ */
  function viewOverview() {
    const v = h("div", { class: "view" });
    v.appendChild(head("OVERVIEW", "Quarter at a glance",
      "The quarter's Rocks, the live test, and the most exposed open items. Everything routes back to: volleyball only. That is the whole business."));

    // Account intelligence callout (the B2B engine)
    if (window.AVBMetrics) {
      const sm = window.AVBMetrics.summary();
      v.appendChild(sectionLabel("THE B2B ENGINE"));
      v.appendChild(h("div", { class: "panel ink", onclick: function () { location.hash = "#/accounts"; }, style: "cursor:pointer" }, [
        h("div", { style: "display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:8px" }, [
          h("span", { class: "mono", style: "color:var(--red)" }, "/ ACCOUNT INTELLIGENCE"),
          h("strong", { style: "font-size:17px" }, "The book of business"),
        ]),
        h("p", { style: "color:var(--muted-ink);max-width:74ch" }, "Clubs are the unit of value, not orders. Pipeline, reorder cadence, and CustomFuze capacity in one place."),
        h("div", { style: "display:flex;gap:22px;margin-top:14px;flex-wrap:wrap;align-items:flex-end" }, [
          miniStat(money(sm.bookValue), "book value"),
          miniStat(money(sm.pipelineValue), "open pipeline"),
          miniStat(sm.winRate + "%", "win rate"),
          miniStat(String(sm.atRiskCount), "accounts at risk"),
          h("a", { href: "#/accounts", class: "fbtn on", style: "margin-left:auto;text-decoration:none" }, "Open accounts"),
        ]),
      ]));
    }

    // Rock progress cards
    v.appendChild(sectionLabel("THE ROCKS"));
    const rg = h("div", { class: "grid g4" });
    D.rocks.forEach(function (r) {
      const leaves = rockLeaves(r);
      const pct = rockPct(r);
      rg.appendChild(h("div", { class: "rock-card", onclick: function () { location.hash = "#/rocks"; }, style: "cursor:pointer" }, [
        h("div", { class: "mono", style: "color:var(--red)" }, r.num),
        h("h3", null, r.title),
        h("div", { class: "owner" }, "Owner: " + (r.owner || "team")),
        h("div", { class: "bar" + (pct === 100 ? " done" : "") }, [h("span", { "data-w": pct })]),
        h("div", { class: "pct-row" }, [
          h("span", { class: "pct" }, pct + "%"),
          h("span", { class: "ratio" }, countStatus(leaves, "done") + "/" + leaves.length + " done"),
        ]),
      ]));
    });
    v.appendChild(rg);

    // This week focus
    v.appendChild(sectionLabel("THIS WEEK"));
    const focus = h("div", { class: "focus-strip" }, [
      focusItem("SHIP", "PDP sublimation module goes first. UA page follows the proven adidas template.", "Jerico"),
      focusItem("UNBLOCK", "Brett confirms turnaround language and quote routing CTA. Two leaves blocked on it.", "Brett"),
      focusItem("SIGN OFF", '"Where average isn\'t good enough." waits on Corey before it ships in copy.', "Corey"),
      focusItem("PULL", "Meta and Google spend pulls in progress. Klaviyo and Attentive next.", "Richard"),
    ]);
    v.appendChild(focus);

    // June plan callout
    v.appendChild(sectionLabel("THE MONTH"));
    const jc = window.AVBJune;
    v.appendChild(h("div", { class: "panel", onclick: function () { location.hash = "#/june"; }, style: "cursor:pointer" }, [
      h("div", { style: "display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:8px" }, [
        h("span", { class: "mono", style: "color:var(--red)" }, "/ JUNE PLAN"),
        h("strong", { style: "font-size:17px" }, "Next-season ordering window"),
      ]),
      h("p", { style: "color:var(--muted);max-width:74ch" }, jc.jobLine),
      h("div", { style: "display:flex;gap:18px;margin-top:14px;flex-wrap:wrap" }, [
        miniStat(String(jc.counts.teams + jc.counts.retail + jc.counts.customfuze), "emails"),
        miniStat(String(jc.counts.socialPosts), "social posts"),
        miniStat("3", "parallel tracks"),
        h("a", { href: "#/june", class: "fbtn on", style: "margin-left:auto;text-decoration:none" }, "Open June plan"),
      ]),
    ]));

    // Active promo callout
    v.appendChild(sectionLabel("LIVE TEST"));
    const june = D.promos.find(function (p) { return p.status === "active"; });
    v.appendChild(h("div", { class: "panel ink" }, [
      h("div", { style: "display:flex;align-items:center;gap:14px;flex-wrap:wrap" }, [
        chip("active", "Active"),
        h("strong", { style: "font-size:18px" }, june.name),
      ]),
      h("p", { style: "margin-top:12px;color:var(--muted-ink);max-width:70ch" },
        "Tiered retail shipping with a held team floor. Teams ceiling is 20% off plus free shipping. Hold that line. Equipment excluded."),
      h("div", { style: "margin-top:16px" }, [
        h("a", { href: "#/promos", class: "fbtn on", style: "display:inline-block;text-decoration:none" }, "Open the matrix"),
      ]),
    ]));

    // Alerts: most exposed open items first
    v.appendChild(sectionLabel("ALERTS"));
    const alerts = h("div");
    alerts.appendChild(alertRow("hot", "BLOCKED", "Quote routing CTA + turnaround language",
      "Two Sublimation leaves blocked pending Brett. Quote / lead flow integration cannot ship until resolved."));
    alerts.appendChild(alertRow("hot", "TAKEDOWN", "VIP75 clearance is ended",
      "Confirm VIP75 is deactivated in Shopify and any link-in-bio is repointed."));
    const flagged = D.campaigns.teams.emails.filter(function (e) { return e.status === "placeholder_flagged"; });
    alerts.appendChild(alertRow("warn", "PLACEHOLDER", flagged.length + " teams emails flagged",
      "Real customer quotes, founder name substitution, and longevity-claim verification needed before go-live."));
    alerts.appendChild(alertRow("warn", "SIGN-OFF", "Corey on locked phrase",
      '"Where average isn\'t good enough." is a candidate locked phrase, not yet cleared for copy.'));
    v.appendChild(alerts);

    // Live discipline scanner playground
    v.appendChild(sectionLabel("DISCIPLINE CHECK"));
    v.appendChild(scannerPlayground());

    animateBars(v);
    return v;
  }

  function miniStat(num, label) {
    return h("div", null, [
      h("div", { style: "font-size:26px;font-weight:700;letter-spacing:-0.02em;line-height:1" }, num),
      h("div", { class: "mono", style: "margin-top:4px" }, label),
    ]);
  }
  function focusItem(label, text, owner) {
    return h("div", { class: "focus-item" }, [
      h("div", { class: "mono" }, "/ " + label),
      h("p", null, text),
      owner ? h("div", { class: "own" }, owner) : null,
    ]);
  }
  function alertRow(kind, mark, title, body) {
    return h("div", { class: "alert " + kind }, [
      h("span", { class: "a-mark" }, mark),
      h("div", { class: "a-body" }, [h("strong", null, title), h("span", null, body)]),
    ]);
  }
  function scannerPlayground() {
    const box = h("div", { class: "panel scanner-box" });
    const out = h("div", { class: "scanner-out" });
    const ta = h("textarea", {
      placeholder: "Paste a subject line or any customer-facing copy. The scanner flags em dashes, banned words, hard year references, and quote promises.",
    });
    function run() {
      out.innerHTML = "";
      out.appendChild(scanBadge(ta.value));
      const r = Scan.scanCopy(ta.value);
      if (!r.clean) {
        const ul = h("ul", { class: "bullets", style: "margin-top:14px" });
        r.violations.forEach(function (vi) { ul.appendChild(h("li", null, vi.message)); });
        out.appendChild(ul);
      }
    }
    ta.addEventListener("input", run);
    ta.value = "If you are serious about your program, we are your partner.";
    box.appendChild(h("p", { class: "mono", style: "margin-bottom:12px" }, "/ LIVE SCAN"));
    box.appendChild(ta);
    box.appendChild(out);
    run();
    return box;
  }

  /* ============================================================
     VIEW: ROCKS
     ============================================================ */
  function viewRocks() {
    const v = h("div", { class: "view" });
    v.appendChild(head("ROCKS", "Q2 Rocks",
      "Live-sync from Asana project " + D.meta.asanaProject + " when the connector is configured. Seed data otherwise. Click a Rock to expand its tree."));

    // summary tiles
    const all = D.rocks.reduce(function (a, r) { return a.concat(rockLeaves(r)); }, []);
    const tiles = h("div", { class: "grid g4", style: "margin-bottom:30px" }, [
      tile("dark", "OVERALL", rollup(all) + "%", all.length + " leaves tracked"),
      tile("light", "DONE", countStatus(all, "done"), "leaves complete"),
      tile("light", "IN PROGRESS", countStatus(all, "in_progress"), "moving now"),
      tile("light", "BLOCKED", countStatus(all, "blocked"), "need a decision"),
    ]);
    v.appendChild(tiles);

    D.rocks.forEach(function (r) {
      const leaves = rockLeaves(r);
      const pct = rockPct(r);
      const block = h("div", { class: "rock-block" });
      const body = h("div", { class: "rb-body" });

      r.subgroups.forEach(function (g) {
        const sg = h("div", { class: "subgroup" });
        sg.appendChild(h("h4", null, [
          document.createTextNode(g.name),
          h("span", { class: "sg-pct" }, "  " + rollup(g.leaves) + "%"),
        ]));
        g.leaves.forEach(function (lf) {
          sg.appendChild(h("div", { class: "leaf" }, [
            chip(lf.status),
            h("span", { class: "lf-name" }, lf.name),
            lf.note ? h("span", { class: "lf-note" }, lf.note) : null,
            lf.owner ? h("span", { class: "lf-owner" }, lf.owner) : null,
          ]));
        });
        body.appendChild(sg);
      });

      if (r.live) {
        body.appendChild(h("div", { class: "note-line hot", style: "margin-top:16px" }, [
          document.createTextNode("Live page: "),
          h("a", { href: r.live, target: "_blank", class: "accent", style: "text-decoration:underline" }, r.live),
        ]));
      }

      const headRow = h("div", { class: "rb-head", onclick: function () { block.classList.toggle("open"); } }, [
        h("span", { class: "caret" }, "›"),
        h("span", { class: "rb-num" }, r.num),
        h("span", { class: "rb-title" }, r.title),
        h("span", { class: "lf-owner" }, r.owner || "team"),
        h("span", { class: "mini-bar" }, [h("span", { "data-w": pct })]),
        h("span", { class: "rb-pct" }, pct + "%"),
      ]);
      block.appendChild(headRow);
      block.appendChild(body);
      v.appendChild(block);
    });

    // first rock open by default
    const first = v.querySelector(".rock-block");
    if (first) first.classList.add("open");

    animateBars(v);
    return v;
  }

  function tile(kind, label, num, sub) {
    return h("div", { class: "tile" + (kind === "light" ? " light" : "") }, [
      h("div", { class: "mono" }, "/ " + label),
      h("div", { class: "num" }, String(num)),
      h("div", { class: "sub" }, sub),
    ]);
  }

  /* ============================================================
     VIEW: CAMPAIGNS
     ============================================================ */
  let campaignFilter = "all";
  // --- Campaigns sub-modules (the Campaigns folder of tiles) ---
  function viewCampaignsKlaviyo() {
    const v = h("div", { class: "view" });
    v.appendChild(head("CAMPAIGNS / KLAVIYO", "Klaviyo performance",
      "Send metrics for the email program. Wires to the connector with a seed fallback."));
    const k = D.klaviyo;
    v.appendChild(h("div", { class: "grid g4" }, [
      kpiTile("OPEN RATE", k.openRate + "%", k.openDelta),
      kpiTile("CLICK RATE", k.clickRate + "%", k.clickDelta),
      kpiTile("REVENUE", money(k.revenue), k.revenueDelta, true),
      kpiTile("RECIPIENTS", k.recipients.toLocaleString("en-US"), null),
    ]));
    v.appendChild(h("div", { class: "note-line" }, "Source: " + k.source + ". Set KLAVIYO_API_KEY to pull live. Revenue is a placeholder figure."));
    return v;
  }
  function viewCampaignsTeams() {
    const v = h("div", { class: "view" });
    v.appendChild(head("CAMPAIGNS / TEAMS", "Teams repositioning",
      "The Q2 10-email A/B arc. Every subject line runs through the discipline scanner. " + D.campaigns.teams.meta + " Platform: " + D.campaigns.teams.platform + "."));
    const counts = D.campaigns.teams.emails;
    const fb = h("div", { class: "filterbar" });
    fb.appendChild(h("span", { class: "fb-label" }, "Filter"));
    [["all", "All"], ["sent", "Sent"], ["scheduled", "Scheduled"], ["built", "Built"], ["placeholder_flagged", "Flagged"]].forEach(function (f) {
      const n = f[0] === "all" ? counts.length : counts.filter(function (e) { return e.status === f[0]; }).length;
      const b = h("button", { class: "fbtn" + (campaignFilter === f[0] ? " on" : "") }, f[1] + " (" + n + ")");
      b.addEventListener("click", function () { campaignFilter = f[0]; renderEmails(); fb.querySelectorAll(".fbtn").forEach(function (x) { x.classList.remove("on"); }); b.classList.add("on"); });
      fb.appendChild(b);
    });
    v.appendChild(fb);
    const list = h("div");
    v.appendChild(list);
    function renderEmails() {
      list.innerHTML = "";
      const rows = D.campaigns.teams.emails.filter(function (e) { return campaignFilter === "all" || e.status === campaignFilter; });
      if (!rows.length) { list.appendChild(h("div", { class: "note-line" }, "No emails in this state.")); return; }
      rows.forEach(function (e) { list.appendChild(emailRow(e)); });
    }
    renderEmails();
    return v;
  }
  function viewCampaignsRetail() {
    const v = h("div", { class: "view" });
    v.appendChild(head("CAMPAIGNS / RETAIL", "Retail email track",
      "The parallel, product-forward retail track. " + D.campaigns.retail.meta + " Platform: " + D.campaigns.retail.platform + "."));
    const rlist = h("div");
    D.campaigns.retail.emails.forEach(function (e) { rlist.appendChild(emailRow(e)); });
    v.appendChild(rlist);
    return v;
  }
  function kpiTile(label, num, delta, isRev) {
    const children = [h("div", { class: "mono" }, "/ " + label), h("div", { class: "kpi-num" }, num)];
    if (delta != null) {
      children.push(h("div", { class: "kpi-delta " + (delta >= 0 ? "up" : "down") },
        (delta >= 0 ? "▲ +" : "▼ ") + Math.abs(delta) + (isRev ? "%" : " pts") + " vs last send"));
    } else {
      children.push(h("div", { class: "kpi-delta", style: "color:var(--muted)" }, "warm list"));
    }
    return h("div", { class: "tile light" }, [h("div", { class: "kpi" }, children)]);
  }
  function emailRow(e) {
    const subj = e.a;
    const right = h("div", { class: "right" }, [chip(e.status, titleCase(e.status)), scanBadge(subj)]);
    const mid = h("div", null, [
      h("div", { class: "subj" }, subj),
      e.b ? h("div", { class: "variant" }, "B: " + e.b) : (e.note ? h("div", { class: "variant" }, e.note) : null),
      e.flag ? h("div", { class: "flag" }, "⚠ " + e.flag) : null,
    ]);
    return h("div", { class: "email-row" }, [h("span", { class: "eno" }, String(e.no)), mid, right]);
  }

  /* ============================================================
     VIEW: PROMOS
     ============================================================ */
  function viewPromos() {
    const v = h("div", { class: "view" });
    v.appendChild(head("PROMOS", "Active and ended",
      "Active vs ended promotions in one place. We are not the cheapest. The discount line is held with intent."));

    const active = D.promos.filter(function (p) { return p.status === "active"; });
    const ended = D.promos.filter(function (p) { return p.status === "ended"; });

    v.appendChild(sectionLabel("ACTIVE"));
    active.forEach(function (p) {
      const card = h("div", { class: "panel" });
      card.appendChild(h("div", { style: "display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:6px" }, [
        chip("active", "Active"),
        h("strong", { style: "font-size:20px" }, p.name),
      ]));
      card.appendChild(h("div", { class: "mono", style: "margin-bottom:18px" }, p.scope + "  /  " + p.start + " → " + p.end));

      // Retail matrix
      if (p.retailTiers) {
        card.appendChild(h("div", { class: "mono", style: "margin-bottom:8px;color:var(--cream-ink)" }, "RETAIL ONLINE TIERS"));
        const t = h("table", { class: "matrix" });
        t.appendChild(h("thead", null, h("tr", null, [th("Order threshold"), th("Shipping"), th("Discount")])));
        const tb = h("tbody");
        p.retailTiers.forEach(function (r) {
          tb.appendChild(h("tr", null, [
            h("td", { class: "strong" }, r.threshold),
            h("td", null, r.ship),
            h("td", { class: "num-cell" }, r.discount),
          ]));
        });
        t.appendChild(tb);
        card.appendChild(t);
      }

      // Teams floor/ceiling
      if (p.teams) {
        card.appendChild(h("div", { class: "mono", style: "margin:22px 0 8px;color:var(--cream-ink)" }, "TEAMS / SMALL CLUBS"));
        const t2 = h("table", { class: "matrix" });
        t2.appendChild(h("thead", null, h("tr", null, [th("Floor"), th("Up to"), th("Ceiling")])));
        t2.appendChild(h("tbody", null, h("tr", null, [
          h("td", { class: "strong" }, p.teams.floor),
          h("td", { class: "strong" }, p.teams.upTo),
          h("td", { class: "ceiling" }, p.teams.ceiling),
        ])));
        card.appendChild(t2);
      }

      // rules
      if (p.rules) {
        const ul = h("ul", { class: "bullets", style: "margin-top:18px" });
        p.rules.forEach(function (rule) {
          if (rule.indexOf("PDP copy add") !== -1) {
            ul.appendChild(h("li", null, [document.createTextNode(rule + "  "), scanBadge('Buying for club? Contact us for special pricing.')]));
          } else {
            ul.appendChild(h("li", null, rule));
          }
        });
        card.appendChild(ul);
      }
      if (p.note) card.appendChild(h("div", { class: "note-line" }, "Note: " + p.note));
      v.appendChild(card);
    });

    v.appendChild(sectionLabel("ENDED / ARCHIVED"));
    ended.forEach(function (p) {
      v.appendChild(h("div", { class: "panel cream", style: "opacity:.92" }, [
        h("div", { style: "display:flex;align-items:center;gap:12px;flex-wrap:wrap" }, [
          chip("ended", "Ended"),
          h("strong", { style: "font-size:18px;color:var(--muted)" }, p.name),
          p.code ? h("span", { class: "tag" }, "code " + p.code) : null,
        ]),
        h("p", { style: "margin-top:10px;color:var(--muted)" }, p.terms),
        h("div", { class: "note-line hot" }, "⚠ " + p.note),
      ]));
    });

    return v;
  }
  function th(t) { return h("th", null, t); }

  /* ============================================================
     VIEW: BUDGET
     ============================================================ */
  function viewBudget() {
    const v = h("div", { class: "view" });
    v.appendChild(head("BUDGET", "Marketing P&L",
      "Spend by channel and category. Target mix vs actual, with the Test and Innovation carve-out tracked. Every figure here is a placeholder until the real pulls land."));

    const b = D.budget;
    const byCat = { Retail: 0, Team: 0, Shared: 0 };
    b.channels.forEach(function (c) { byCat[c.category] += c.monthly; });
    const total = byCat.Retail + byCat.Team + byCat.Shared;

    // tiles
    v.appendChild(h("div", { class: "grid g4", style: "margin-bottom:8px" }, [
      tilePlaceholder("dark", "MONTHLY TOTAL", money(total), "across all channels"),
      tilePlaceholder("light", "TEAM", money(byCat.Team), Math.round(byCat.Team / total * 100) + "% of spend"),
      tilePlaceholder("light", "RETAIL", money(byCat.Retail), Math.round(byCat.Retail / total * 100) + "% of spend"),
      tilePlaceholder("light", "SHARED", money(byCat.Shared), Math.round(byCat.Shared / total * 100) + "% of spend"),
    ]));
    v.appendChild(h("div", { class: "note-line" }, [
      h("span", { class: "placeholder-tag" }, "PLACEHOLDER"),
      document.createTextNode("  Figures are seeded. Swap them for Meta, Google, Klaviyo, Attentive, partnerships, tools, and labor pulls."),
    ]));

    // Stacked bar by source
    v.appendChild(sectionLabel("SPEND BY CHANNEL"));
    v.appendChild(stackedBySource(b));

    // Target mix vs actual
    v.appendChild(sectionLabel("TARGET MIX VS ACTUAL"));
    const mixWrap = h("div", { class: "panel" });
    [["Team", byCat.Team], ["Retail", byCat.Retail], ["Test", 0]].forEach(function (row) {
      const name = row[0];
      const actualPct = name === "Test" ? b.testCarveout.currentPct : Math.round(row[1] / total * 100);
      const target = b.targetMix[name];
      mixWrap.appendChild(h("div", { class: "mix-row" }, [
        h("div", { class: "mix-head" }, [
          h("span", { class: "strong", style: "font-weight:700" }, name),
          h("span", { class: "mono" }, "actual " + actualPct + "%  /  target " + target + "%"),
        ]),
        h("div", { class: "mix-track" }, [
          h("span", { class: "actual", "data-w": actualPct }),
          h("span", { class: "target", style: "left:0", "data-target": target }),
        ]),
      ]));
    });
    v.appendChild(mixWrap);

    // Test carve-out tracker
    v.appendChild(sectionLabel("TEST / INNOVATION CARVE-OUT"));
    const tc = b.testCarveout;
    v.appendChild(h("div", { class: "panel ink" }, [
      h("div", { class: "mono" }, "/ 5-10% TARGET"),
      h("div", { style: "display:flex;align-items:baseline;gap:14px;margin:12px 0" }, [
        h("span", { style: "font-size:42px;font-weight:700" }, tc.currentPct + "%"),
        h("span", { style: "color:var(--muted-ink)" }, "current  /  target " + tc.targetPct + "%"),
      ]),
      h("div", { class: "bar", style: "background:var(--line-ink)" }, [h("span", { "data-w": Math.round(tc.currentPct / tc.targetPct * 100) })]),
      h("p", { style: "margin-top:14px;color:var(--muted-ink)" }, "Carve-out is below the floor. Reallocation walkthrough with Andrew sets the target mix and funds the test line."),
    ]));

    animateBars(v);
    // set target marker positions
    requestAnimationFrame(function () {
      v.querySelectorAll("[data-target]").forEach(function (el) { el.style.left = el.getAttribute("data-target") + "%"; });
    });
    return v;
  }
  function tilePlaceholder(kind, label, num, sub) {
    const t = tile(kind, label, num, sub);
    t.querySelector(".mono").appendChild(document.createTextNode(""));
    return t;
  }
  function stackedBySource(b) {
    const sources = {};
    b.channels.forEach(function (c) {
      if (!sources[c.source]) sources[c.source] = { Retail: 0, Team: 0, Shared: 0, total: 0 };
      sources[c.source][c.category] += c.monthly;
      sources[c.source].total += c.monthly;
    });
    const names = Object.keys(sources).sort(function (a, c) { return sources[c].total - sources[a].total; });
    const max = Math.max.apply(null, names.map(function (n) { return sources[n].total; }));
    const catColor = { Team: "var(--red)", Retail: "#cfc9bc", Shared: "#6b7280" };

    const W = 760, rowH = 38, gap = 14, padL = 110, padR = 70;
    const Hsvg = names.length * (rowH + gap);
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 " + W + " " + Hsvg);
    function rect(x, y, w, hh, fill) {
      const r = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      r.setAttribute("x", x); r.setAttribute("y", y); r.setAttribute("width", Math.max(0, w)); r.setAttribute("height", hh);
      r.setAttribute("fill", fill); r.setAttribute("class", "bar-seg");
      const tt = document.createElementNS("http://www.w3.org/2000/svg", "title");
      r.appendChild(tt); r._tt = tt; return r;
    }
    function text(x, y, s, cls) {
      const t = document.createElementNS("http://www.w3.org/2000/svg", "text");
      t.setAttribute("x", x); t.setAttribute("y", y); t.textContent = s;
      t.setAttribute("font-family", "var(--mono)"); t.setAttribute("font-size", cls === "lab" ? "11" : "12");
      t.setAttribute("fill", cls === "lab" ? "#8d897f" : "#f1efe9");
      if (cls === "val") { t.setAttribute("text-anchor", "start"); t.setAttribute("font-weight", "700"); }
      return t;
    }
    const avail = W - padL - padR;
    names.forEach(function (n, i) {
      const y = i * (rowH + gap);
      svg.appendChild(text(0, y + rowH / 2 + 4, n, "lab"));
      let x = padL;
      ["Team", "Retail", "Shared"].forEach(function (cat) {
        const val = sources[n][cat];
        if (val <= 0) return;
        const w = (val / max) * avail;
        const r = rect(x, y, w, rowH, catColor[cat]);
        r._tt.textContent = n + " / " + cat + ": " + money(val);
        svg.appendChild(r);
        x += w;
      });
      svg.appendChild(text(x + 8, y + rowH / 2 + 4, money(sources[n].total), "val"));
    });

    const wrap = h("div", { class: "chart-wrap" });
    wrap.appendChild(svg);
    wrap.appendChild(h("div", { class: "legend" }, [
      legendItem("var(--red)", "Team"),
      legendItem("#cfc9bc", "Retail"),
      legendItem("#6b7280", "Shared"),
    ]));
    return wrap;
  }
  function legendItem(color, label) {
    return h("span", null, [h("i", { style: "background:" + color }), document.createTextNode(label)]);
  }

  /* ============================================================
     VIEW: AUTOMATION
     ============================================================ */
  function viewAutomation() {
    const v = h("div", { class: "view" });
    const a = D.automation;
    v.appendChild(head("AUTOMATION", "n8n workflow health",
      "What is live, what is planned, and the idea backlog. Base: " + a.base + ". Set N8N_API_KEY to pull run status."));

    v.appendChild(sectionLabel("LIVE"));
    a.live.forEach(function (w) {
      const card = h("div", { class: "auto-card live" });
      card.appendChild(h("div", { style: "display:flex;align-items:center;gap:12px;margin-bottom:6px" }, [chip("live", "Live"), h("h3", null, w.name)]));
      card.appendChild(h("div", { class: "meta" }, w.desc));
      const spec = h("div", { class: "spec" });
      w.spec.forEach(function (s) { spec.appendChild(h("div", null, "• " + s)); });
      card.appendChild(spec);
      const tags = h("div", { class: "tags" });
      w.tags.forEach(function (t) { tags.appendChild(h("span", { class: "tag" }, t)); });
      card.appendChild(tags);
      v.appendChild(card);
    });

    v.appendChild(sectionLabel("VENDOR EXPANSION ROADMAP"));
    v.appendChild(h("p", { class: "lede", style: "margin-top:-6px;margin-bottom:16px" }, a.vendorRoadmap.note));
    const vg = h("div", { class: "grid g4" });
    a.vendorRoadmap.vendors.forEach(function (vn) {
      vg.appendChild(h("div", { class: "auto-card", style: "display:flex;align-items:center;justify-content:space-between" }, [
        h("strong", null, vn.name), chip(vn.status, "Planned"),
      ]));
    });
    v.appendChild(vg);

    v.appendChild(sectionLabel("IDEA BACKLOG"));
    const bg = h("div", { class: "grid g3" });
    a.backlog.forEach(function (idea) {
      bg.appendChild(h("div", { class: "auto-card", style: "display:flex;align-items:flex-start;justify-content:space-between;gap:12px" }, [
        h("span", { style: "font-size:14px" }, idea.name), chip("idea", "Idea"),
      ]));
    });
    v.appendChild(bg);
    return v;
  }

  /* ============================================================
     VIEW: CONTENT
     ============================================================ */
  function viewContent() {
    const v = h("div", { class: "view" });
    v.appendChild(head("CONTENT", "Team-side buildout",
      "Event coverage, knowledge content, spotlight series, and the UGC partnership. The brand shows up in real comments, not canned replies."));

    v.appendChild(sectionLabel("BUILDOUT PLAN"));
    const ul = h("ul", { class: "bullets" });
    D.content.buildout.forEach(function (item) { ul.appendChild(h("li", null, item)); });
    v.appendChild(h("div", { class: "panel" }, [ul]));

    v.appendChild(sectionLabel("UGC PARTNERSHIP"));
    D.partnerships.forEach(function (p) {
      v.appendChild(h("div", { class: "spotlight" }, [
        h("div", { style: "display:flex;align-items:center;gap:12px;flex-wrap:wrap" }, [
          chip(p.status, titleCase(p.status)),
          h("span", { class: "name" }, p.name),
        ]),
        h("div", { class: "role" }, p.role),
        h("p", { style: "margin-top:12px;color:var(--muted)" }, p.note),
        h("div", { class: "note-line" }, "Source: " + p.source),
      ]));
    });

    v.appendChild(sectionLabel("SPOTLIGHT SERIES"));
    const sg = h("div", { class: "grid g3" });
    D.content.spotlightSeries.forEach(function (s) {
      sg.appendChild(h("div", { class: "auto-card" }, [h("p", { style: "font-size:14px" }, s)]));
    });
    v.appendChild(sg);

    v.appendChild(sectionLabel("VOICE"));
    const lock = h("div", { class: "panel cream" });
    D.meta.phrases.forEach(function (p) {
      lock.appendChild(h("div", { style: "display:flex;align-items:center;justify-content:space-between;gap:16px;padding:10px 0;border-bottom:1px dotted var(--line)" }, [
        h("span", { class: "locked-quote" }, p),
        scanBadge(p),
      ]));
    });
    v.appendChild(lock);
    return v;
  }

  /* ============================================================
     VIEW: JUNE PLAN
     ============================================================ */
  const J = window.AVBJune;
  let juneTab = "teams";

  function viewJune() {
    const v = h("div", { class: "view" });
    v.appendChild(head("JUNE", "June social and email plan",
      "The next-season ordering window is the spine of the month. Every Teams send and most education content points at it. Three tracks run in parallel."));

    // The month's job
    v.appendChild(h("div", { class: "panel ink" }, [
      h("div", { class: "mono" }, "/ THE MONTH'S JOB"),
      h("p", { style: "margin-top:12px;font-size:16px;max-width:78ch;line-height:1.5" }, J.jobLine),
      h("p", { style: "margin-top:12px;color:var(--muted-ink);max-width:78ch" },
        "Month-end success: quote requests up from the Teams track, the discount tiers lifting retail AOV toward $150 and $200, and the lookbook in the hands of every club that opened a Teams email."),
    ]));

    // Three parallel tracks
    v.appendChild(sectionLabel("THREE TRACKS IN PARALLEL"));
    const tg = h("div", { class: "grid g3" });
    J.tracks.forEach(function (t, i) {
      tg.appendChild(h("div", { class: "rock-card" }, [
        h("div", { class: "mono", style: "color:var(--red)" }, "0" + (i + 1) + " / " + t.cadence),
        h("h3", null, t.label),
        h("p", { style: "font-size:13px;color:var(--muted);margin-top:8px" }, t.note),
      ]));
    });
    v.appendChild(tg);

    // Volume tiles + pillar donut
    v.appendChild(sectionLabel("THE MONTH BY THE NUMBERS"));
    v.appendChild(h("div", { class: "grid g4", style: "margin-bottom:16px" }, [
      tile("dark", "TOTAL SENDS", J.counts.teams + J.counts.retail + J.counts.customfuze, "emails across three tracks"),
      tile("light", "TEAMS", J.counts.teams, "Mon + Wed repositioning"),
      tile("light", "RETAIL", J.counts.retail, "Tue + Thu discount rollout"),
      tile("light", "SOCIAL POSTS", J.counts.socialPosts, "feed posts, stories daily"),
    ]));
    v.appendChild(h("div", { class: "grid g2" }, [pillarDonut(), trackSplit()]));

    // Cadence at a glance
    v.appendChild(sectionLabel("CADENCE AT A GLANCE"));
    v.appendChild(cadenceGrid());
    v.appendChild(h("div", { class: "note-line" }, "A/B subject variants on every email. Stories run daily regardless of the feed post."));

    // Month calendar
    v.appendChild(sectionLabel("JUNE CALENDAR"));
    v.appendChild(monthCalendar());
    v.appendChild(calLegend());

    // Email plan with track tabs
    v.appendChild(sectionLabel("EMAIL PLAN"));
    v.appendChild(emailTabs(v));

    // Email mockups
    v.appendChild(sectionLabel("EMAIL MOCKUPS"));
    v.appendChild(h("div", { class: "mock-grid" }, [
      emailMock("Teams", "Wed Jun 3", "Volleyball only. That is the whole business.",
        "Specialization. The whole business is volleyball.", "We only do one thing. We do it correctly.", "See how we work", "TYPOGRAPHY HERO"),
      emailMock("Retail", "Tue Jun 16", "Round out your cart, take 15% off at $200",
        "Still shipping free at $99. More in cart, more off.", "Free shipping at $99. 15% off at $200.", "Shop the tiers", "REAL PRODUCT PHOTO"),
      emailMock("CustomFuze", "Fri Jun 12", "See the CustomFuze lookbook",
        "Your next uniform starts here.", "Built for one team. One season.", "Open the lookbook", "LOOKBOOK COVER"),
    ]));
    v.appendChild(h("div", { class: "note-line hot" }, "Jun 12 carries the v1 lookbook PDF. Hold turnaround and comparison language until Brett confirms timelines and Andrew signs off the comparison copy."));

    // Social plan
    v.appendChild(sectionLabel("SOCIAL PLAN"));
    J.social.forEach(function (w) {
      v.appendChild(h("h4", { class: "mono", style: "margin:22px 0 12px;color:var(--cream-ink)" }, "WEEK " + w.week + "  /  " + w.range));
      const t = h("table", { class: "matrix" });
      t.appendChild(h("thead", null, h("tr", null, [th("Day"), th("Pillar"), th("Concept"), th("Caption hook"), th("Format"), th("Scan")])));
      const tb = h("tbody");
      w.posts.forEach(function (p) {
        tb.appendChild(h("tr", null, [
          h("td", { class: "strong" }, p.date),
          h("td", null, pillarChip(p.pillar)),
          h("td", null, p.concept),
          h("td", { style: "color:var(--muted)" }, p.hook),
          h("td", { class: "mono", style: "font-size:10px" }, p.format),
          h("td", null, scanBadge(p.hook)),
        ]));
      });
      t.appendChild(tb);
      v.appendChild(t);
    });

    // Social mockups
    v.appendChild(sectionLabel("SOCIAL MOCKUPS"));
    v.appendChild(h("p", { class: "lede", style: "margin-top:-6px;margin-bottom:16px" }, "Real photography or typography only. No AI imagery in any customer-facing asset."));
    v.appendChild(h("div", { class: "mock-grid" }, [
      socialTypo("ink", "BRAND / SUN", "Too big to care.", "Too small to deliver.", "@allvolleyball", "Typography"),
      socialTypo("red", "BRAND / SUN", "Volleyball only.", "That is the whole business.", "@allvolleyball", "Typography"),
      socialPhoto("PRODUCT / TUE", "Court shoe in play", "Free shipping starts at $99. Here is where most teams start.", "Real photo"),
      socialTypo("cream", "EDUCATION / MON", "When to order", "for fall.", "Swipe for the timeline", "Carousel"),
      socialPhoto("CLUB SPOTLIGHT / WED", "Feature a serious program", "Runs their season the right way. Here is how they gear up.", "Club photos"),
      socialCarousel("CUSTOMFUZE / FRI", "The lookbook is here.", "Your next look starts inside.", "Lookbook carousel"),
    ]));

    // Stories + engagement
    v.appendChild(sectionLabel("STORIES AND ENGAGEMENT"));
    v.appendChild(h("div", { class: "panel cream" }, [h("p", { style: "font-size:15px;line-height:1.55;max-width:80ch" }, J.stories)]));

    // Guardrails + source flag (with live scan demo)
    v.appendChild(sectionLabel("GUARDRAILS"));
    const gWrap = h("div", { class: "panel" });
    const gl = h("ul", { class: "bullets" });
    J.guardrails.forEach(function (g) { gl.appendChild(h("li", null, g)); });
    gWrap.appendChild(gl);
    v.appendChild(gWrap);

    v.appendChild(h("div", { class: "alert hot", style: "margin-top:16px" }, [
      h("span", { class: "a-mark" }, "SOURCE FLAG"),
      h("div", { class: "a-body" }, [
        h("strong", null, "Strip this before reuse"),
        h("span", null, J.sourceFlag),
        h("div", { style: "margin-top:10px;display:flex;align-items:center;gap:10px;flex-wrap:wrap" }, [
          h("span", { style: "font-family:var(--serif);font-style:italic;color:var(--cream-ink)" }, '"Real quote in 24 hours"'),
          scanBadge("Real quote in 24 hours"),
        ]),
      ]),
    ]));

    // Pricing discipline
    v.appendChild(h("div", { class: "panel ink", style: "margin-top:16px" }, [
      h("div", { class: "mono" }, "/ PRICING DISCIPLINE"),
      h("div", { style: "margin-top:14px;display:flex;gap:14px;flex-wrap:wrap" }, [
        miniLine("QUOTE CTA", J.quoteCTA),
        miniLine("CLUB PRICING", J.pricingLine),
        miniLine("THE 20% CEILING", "Held internally. Never a headline."),
      ]),
    ]));

    animateBars(v);
    return v;
  }

  function miniLine(label, text) {
    return h("div", { style: "flex:1;min-width:200px;border-left:2px solid var(--red);padding-left:12px" }, [
      h("div", { class: "mono", style: "color:var(--muted-ink)" }, label),
      h("div", { style: "margin-top:6px;font-size:14px" }, text),
    ]);
  }
  function pillarChip(pillar) {
    return h("span", { class: "chip", style: "background:rgba(255,255,255,.05);color:var(--text)" }, [
      h("span", { class: "d", style: "background:" + (J.pillarColor[pillar] || "var(--muted)") }),
      document.createTextNode(pillar),
    ]);
  }

  function cadenceGrid() {
    const t = h("table", { class: "cadence" });
    const head2 = h("tr", null, [h("th", null, "")].concat(J.cadence.cols.map(function (c) { return h("th", null, c); })));
    t.appendChild(h("thead", null, head2));
    const tb = h("tbody");
    const emailRow = h("tr", null, [h("td", { class: "row-label" }, "Email")]);
    J.cadence.email.forEach(function (e) {
      let cls = "cad-none", label = e;
      if (e === "Teams") cls = "cad-teams"; else if (e === "Retail") cls = "cad-retail"; else if (e === "CustomFuze") cls = "cad-fuze";
      emailRow.appendChild(h("td", null, e === "none" ? h("span", { class: "cad-none" }, "none") : h("span", { class: "cell-pill " + cls }, label)));
    });
    tb.appendChild(emailRow);
    const socialRow = h("tr", null, [h("td", { class: "row-label" }, "Social")]);
    J.cadence.social.forEach(function (s) {
      socialRow.appendChild(h("td", null, h("span", { class: "cell-pill cad-social" }, s)));
    });
    tb.appendChild(socialRow);
    t.appendChild(tb);
    return t;
  }

  function monthCalendar() {
    const wrap = h("div", { class: "panel", style: "background:var(--bg)" });
    const cal = h("div", { class: "cal" });
    ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].forEach(function (d) { cal.appendChild(h("div", { class: "cal-head" }, d)); });
    for (let d = 1; d <= 30; d++) {
      const wd = (d - 1) % 7; // June 1 = Monday = 0
      const day = J.dayMap[d];
      const cell = h("div", { class: "cal-day" + (wd >= 5 ? " weekend" : "") });
      cell.appendChild(h("div", { class: "dnum" }, String(d)));
      if (day.email) {
        const cls = day.email.track === "Teams" ? "cad-teams" : day.email.track === "Retail" ? "cad-retail" : "cad-fuze";
        cell.appendChild(h("span", { class: "em-chip " + cls, title: day.email.a }, day.email.track));
      }
      if (day.social) {
        cell.appendChild(h("div", { class: "so-row", title: day.social.concept + ": " + day.social.hook }, [
          h("span", { class: "dot", style: "background:" + (J.pillarColor[day.social.pillar] || "var(--muted)") }),
          document.createTextNode(day.social.pillar),
        ]));
      }
      cal.appendChild(cell);
    }
    // trailing empties to complete the final week row (30 days from Monday -> 2 trailing on row 5)
    for (let e = 0; e < 5; e++) cal.appendChild(h("div", { class: "cal-day empty" }));
    wrap.appendChild(cal);
    return wrap;
  }
  function calLegend() {
    return h("div", { class: "legend", style: "margin-top:14px" }, [
      legendItem("#8b93a3", "Teams email"),
      legendItem("var(--red)", "Retail email"),
      legendItem("#ff6178", "CustomFuze email"),
      legendItem("var(--done)", "Brand"),
      legendItem("var(--progress)", "Win + BTS"),
      legendItem("var(--idle)", "Tournament / UGC"),
    ]);
  }

  function emailTabs(rootView) {
    const wrap = h("div");
    const tabs = h("div", { class: "tabs" });
    const body = h("div");
    const defs = [
      ["teams", "Teams (Mon + Wed)"],
      ["retail", "Retail (Tue + Thu)"],
      ["customfuze", "CustomFuze (Fri)"],
    ];
    function paint() {
      body.innerHTML = "";
      tabs.querySelectorAll("button").forEach(function (b) { b.classList.toggle("on", b.getAttribute("data-k") === juneTab); });
      if (juneTab === "teams") body.appendChild(teamsTable());
      else if (juneTab === "retail") body.appendChild(retailTable());
      else body.appendChild(fuzeTable());
    }
    defs.forEach(function (d) {
      const b = h("button", { "data-k": d[0] }, d[1]);
      b.addEventListener("click", function () { juneTab = d[0]; paint(); });
      tabs.appendChild(b);
    });
    wrap.appendChild(tabs);
    wrap.appendChild(body);
    paint();
    return wrap;
  }
  function teamsTable() {
    const t = h("table", { class: "matrix" });
    t.appendChild(h("thead", null, h("tr", null, [th("Date"), th("Theme"), th("Subject A"), th("Subject B"), th("CTA"), th("Scan")])));
    const tb = h("tbody");
    J.teams.forEach(function (e) {
      tb.appendChild(h("tr", null, [
        h("td", { class: "strong", style: "white-space:nowrap" }, e.date),
        h("td", { class: "mono", style: "font-size:10px" }, e.theme),
        h("td", null, e.a),
        h("td", { style: "color:var(--muted)" }, e.b),
        h("td", { class: "mono", style: "font-size:10px" }, e.cta),
        h("td", null, scanBadge(e.a + " " + e.b)),
      ]));
    });
    t.appendChild(tb);
    const wrap = h("div");
    wrap.appendChild(t);
    wrap.appendChild(h("div", { class: "note-line hot" }, "Quote CTA: " + J.quoteCTA + " No turnaround number. Club inquiries: " + J.pricingLine + " Hold the 20% ceiling internally."));
    return wrap;
  }
  function retailTable() {
    const t = h("table", { class: "matrix" });
    t.appendChild(h("thead", null, h("tr", null, [th("Date"), th("Angle"), th("Subject A"), th("Subject B"), th("Scan")])));
    const tb = h("tbody");
    J.retail.forEach(function (e) {
      tb.appendChild(h("tr", null, [
        h("td", { class: "strong", style: "white-space:nowrap" }, e.date),
        h("td", { class: "mono", style: "font-size:10px" }, [document.createTextNode(e.angle), e.optional ? h("span", { class: "placeholder-tag", style: "margin-left:6px" }, "optional") : null]),
        h("td", null, e.a),
        h("td", { style: "color:var(--muted)" }, e.b),
        h("td", null, scanBadge(e.a + " " + e.b)),
      ]));
    });
    t.appendChild(tb);
    const wrap = h("div");
    wrap.appendChild(t);
    wrap.appendChild(h("div", { class: "note-line" }, "Every discount email states equipment is excluded. Jun 23 equipment is framed on durability, not price. Jun 18 gift angle is soft and optional."));
    return wrap;
  }
  function fuzeTable() {
    const t = h("table", { class: "matrix" });
    t.appendChild(h("thead", null, h("tr", null, [th("Date"), th("Angle"), th("Subject A"), th("Subject B"), th("Scan")])));
    const tb = h("tbody");
    J.customfuze.forEach(function (e) {
      tb.appendChild(h("tr", null, [
        h("td", { class: "strong", style: "white-space:nowrap" }, e.date),
        h("td", { class: "mono", style: "font-size:10px" }, e.angle),
        h("td", null, [document.createTextNode(e.a), e.carries ? h("div", { class: "flag", style: "color:var(--red);font-size:11px;font-style:italic;margin-top:3px" }, e.carries) : null]),
        h("td", { style: "color:var(--muted)" }, e.b),
        h("td", null, scanBadge(e.a + " " + e.b)),
      ]));
    });
    t.appendChild(tb);
    return t;
  }

  /* ---- Mockup builders ---- */
  function emailMock(track, date, subject, preheader, line, cta, artLabel) {
    const trackCls = track === "Teams" ? "cad-teams" : track === "Retail" ? "cad-retail" : "cad-fuze";
    return h("div", { class: "email-mock" }, [
      h("div", { class: "em-top" }, [
        h("div", { class: "em-from" }, "FROM ALL VOLLEYBALL  /  " + date),
        h("div", { class: "em-brand" }, [h("span", { class: "tick" }), document.createTextNode("ALL VOLLEYBALL")]),
      ]),
      h("span", { class: "em-track cell-pill " + trackCls }, track + " track"),
      h("div", { class: "em-subj" }, subject),
      h("div", { class: "em-pre" }, preheader),
      h("div", { class: "em-body" }, [
        h("div", { class: "em-art" }, artLabel),
        h("div", { class: "em-line" }, line),
        h("span", { class: "em-cta" }, cta),
      ]),
      h("div", { class: "em-foot" }, [scanBadge(subject + " " + preheader + " " + line), h("span", { class: "mono", style: "font-size:9px" }, "A/B ON")]),
    ]);
  }
  function socialTypo(tone, tag, l1, l2, foot, fmt) {
    return h("div", { class: "social-mock " + tone }, [
      h("div", { class: "sm-tag" }, tag),
      h("div", { class: "sm-main" }, [document.createTextNode(l1), h("span", { class: "accent" }, l2)]),
      h("div", { class: "sm-foot" }, [h("span", null, foot), h("span", null, fmt)]),
    ]);
  }
  function socialPhoto(tag, headline, sub, fmt) {
    return h("div", { class: "social-mock photo" }, [
      h("div", { class: "sm-art" }, "REAL PHOTO"),
      h("div", { class: "sm-tag", style: "position:relative;z-index:2" }, tag),
      h("div", { class: "sm-overlay" }, [
        h("div", { class: "h" }, headline),
        h("div", { style: "font-size:11px;color:var(--muted);margin-top:4px" }, sub),
        h("div", { style: "margin-top:8px" }, [scanBadge(sub)]),
      ]),
      h("div", { class: "sm-foot", style: "position:relative;z-index:2" }, [h("span", null, "@allvolleyball"), h("span", null, fmt)]),
    ]);
  }
  function socialCarousel(tag, l1, l2, fmt) {
    return h("div", { class: "social-mock ink" }, [
      h("div", { class: "sm-tag" }, tag),
      h("div", { class: "sm-main" }, [document.createTextNode(l1), h("span", { class: "accent" }, l2)]),
      h("div", { class: "sm-foot" }, [h("span", { class: "carousel-dots" }, [h("i"), h("i"), h("i"), h("i")]), h("span", null, fmt)]),
    ]);
  }

  /* ---- June charts ---- */
  function pillarDonut() {
    // count posts by normalized pillar
    const counts = {};
    J.social.forEach(function (w) { w.posts.forEach(function (p) { counts[p.pillar] = (counts[p.pillar] || 0) + 1; }); });
    const order = ["Education", "Product", "Club Spotlight", "Win + BTS", "CustomFuze", "Tournament / UGC", "Brand"];
    const segs = order.filter(function (k) { return counts[k]; }).map(function (k) { return { label: k, value: counts[k], color: J.pillarColor[k] }; });
    const total = segs.reduce(function (a, s) { return a + s.value; }, 0);

    const NS = "http://www.w3.org/2000/svg";
    const size = 180, r = 70, cx = size / 2, cy = size / 2, circ = 2 * Math.PI * r;
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", "0 0 " + size + " " + size);
    svg.setAttribute("style", "max-width:180px;margin:0 auto");
    let offset = 0;
    segs.forEach(function (s) {
      const c = document.createElementNS(NS, "circle");
      const len = (s.value / total) * circ;
      c.setAttribute("cx", cx); c.setAttribute("cy", cy); c.setAttribute("r", r);
      c.setAttribute("fill", "none"); c.setAttribute("stroke", s.color); c.setAttribute("stroke-width", "26");
      c.setAttribute("stroke-dasharray", len + " " + (circ - len));
      c.setAttribute("stroke-dashoffset", -offset);
      c.setAttribute("transform", "rotate(-90 " + cx + " " + cy + ")");
      const tt = document.createElementNS(NS, "title"); tt.textContent = s.label + ": " + s.value + " posts"; c.appendChild(tt);
      svg.appendChild(c);
      offset += len;
    });
    const center = document.createElementNS(NS, "text");
    center.setAttribute("x", cx); center.setAttribute("y", cy - 2); center.setAttribute("text-anchor", "middle");
    center.setAttribute("font-size", "30"); center.setAttribute("font-weight", "700"); center.setAttribute("fill", "#f1efe9");
    center.textContent = String(total);
    const sub = document.createElementNS(NS, "text");
    sub.setAttribute("x", cx); sub.setAttribute("y", cy + 16); sub.setAttribute("text-anchor", "middle");
    sub.setAttribute("font-size", "9"); sub.setAttribute("fill", "#8d897f"); sub.setAttribute("font-family", "var(--mono)");
    sub.textContent = "FEED POSTS";
    svg.appendChild(center); svg.appendChild(sub);

    const wrap = h("div", { class: "chart-wrap" });
    wrap.appendChild(h("div", { class: "mono", style: "margin-bottom:12px" }, "/ SOCIAL PILLAR MIX"));
    wrap.appendChild(svg);
    const leg = h("div", { class: "legend", style: "margin-top:16px" });
    segs.forEach(function (s) { leg.appendChild(h("span", null, [h("i", { style: "background:" + s.color }), document.createTextNode(s.label + " (" + s.value + ")")])); });
    wrap.appendChild(leg);
    return wrap;
  }
  function trackSplit() {
    const data = [
      { label: "Teams", value: J.counts.teams, color: "#8b93a3", note: "Mon + Wed" },
      { label: "Retail", value: J.counts.retail, color: "var(--red)", note: "Tue + Thu" },
      { label: "CustomFuze", value: J.counts.customfuze, color: "#ff6178", note: "Fri" },
    ];
    const max = Math.max.apply(null, data.map(function (d) { return d.value; }));
    const wrap = h("div", { class: "chart-wrap" });
    wrap.appendChild(h("div", { class: "mono", style: "margin-bottom:18px" }, "/ EMAIL VOLUME BY TRACK"));
    data.forEach(function (d) {
      wrap.appendChild(h("div", { class: "mix-row" }, [
        h("div", { class: "mix-head" }, [
          h("span", { style: "font-weight:700" }, d.label),
          h("span", { class: "mono" }, d.value + " sends  /  " + d.note),
        ]),
        h("div", { class: "mix-track" }, [h("span", { class: "actual", "data-w": Math.round(d.value / max * 100), style: "background:" + d.color })]),
      ]));
    });
    wrap.appendChild(h("p", { style: "margin-top:6px;font-size:13px;color:var(--muted)" }, "Stories run daily on top of the feed. Tournament weekends add live reposts."));
    return wrap;
  }

  /* ============================================================
     VIEW: ACCOUNT INTELLIGENCE (the B2B engine, crown jewel)
     Reads the semantic layer (window.AVBMetrics). Never recomputes.
     ============================================================ */
  const M = window.AVBMetrics;
  let acctFilter = "all";
  let acctSort = "value";

  function viewAccounts() {
    const v = h("div", { class: "view" });
    v.appendChild(head("ACCOUNTS", "Account intelligence",
      "The book of business: clubs are the unit of value, not orders. Marketing leads to a quote, a consultative close, seasonal reorders, then CustomFuze production. As of June 6, seed data."));

    const s = M.summary();

    // KPI strip (two rows)
    v.appendChild(h("div", { class: "grid g4", style: "margin-bottom:16px" }, [
      tile("dark", "BOOK VALUE", money(s.bookValue), "trailing 12-mo gear spend"),
      tile("light", "ACTIVE ACCOUNTS", s.activeAccounts, s.newThisQuarter + " new this quarter"),
      tile("light", "OPEN PIPELINE", money(s.pipelineValue), money(s.weightedPipeline) + " weighted"),
      tile("light", "AVG SHARE OF WALLET", s.avgShareOfWallet + "%", "room to grow inside accounts"),
    ]));
    v.appendChild(h("div", { class: "grid g4", style: "margin-bottom:8px" }, [
      tile("light", "WIN RATE", s.winRate + "%", "quote to close, trailing"),
      tile("light", "AVG CYCLE", s.avgCycleDays + " days", "quote sent to close"),
      tile("light", "AT RISK", s.atRiskCount, "accounts off cadence"),
      tile("light", "REORDER RADAR", s.atRiskCount, "owners to follow up"),
    ]));
    v.appendChild(h("div", { class: "note-line" }, [
      h("span", { class: "placeholder-tag" }, "PLACEHOLDER"),
      document.createTextNode("  Seed figures shaped like the future warehouse schema. Wire the quote and order data to make live."),
    ]));

    // Pipeline funnel + quotes
    v.appendChild(sectionLabel("QUOTE PIPELINE"));
    v.appendChild(h("div", { class: "grid g2" }, [pipelineFunnel(), pipelineNote(s)]));
    v.appendChild(quotesTable());

    // Reorder radar (actionable)
    v.appendChild(sectionLabel("REORDER RADAR"));
    const risk = M.atRisk();
    if (!risk.length) {
      v.appendChild(h("div", { class: "panel cream" }, "Every account is inside its reorder cadence."));
    } else {
      const radar = h("div");
      risk.forEach(function (a) {
        radar.appendChild(h("div", { class: "alert " + (a.status === "at_risk" ? "hot" : "warn") }, [
          h("span", { class: "a-mark" }, a.status === "at_risk" ? "AT RISK" : "OVERDUE"),
          h("div", { class: "a-body" }, [
            h("strong", null, a.name + "  /  " + money(a.annualSpend) + " book"),
            h("span", null, a.daysOverdue + " days past a " + a.cadenceDays + " day cadence. Owner " + a.owner + " to follow up. " + a.shareOfWallet + "% share of wallet."),
          ]),
        ]));
      });
      v.appendChild(radar);
    }

    // Account health table (filter + sort)
    v.appendChild(sectionLabel("ACCOUNT HEALTH"));
    v.appendChild(accountControls(v));
    const tableMount = h("div", { id: "acct-table" });
    v.appendChild(tableMount);
    renderAccountsTable(tableMount);

    // CustomFuze production capacity
    v.appendChild(sectionLabel("CUSTOMFUZE PRODUCTION"));
    v.appendChild(h("p", { class: "lede", style: "margin-top:-6px;margin-bottom:16px" },
      "Lead time is four to six weeks. Due dates are the team's first whistle. Watch the weeks where production load runs over capacity."));
    v.appendChild(h("div", { class: "grid g2" }, [fuzeTable(), capacityChart()]));

    // Seasonality
    v.appendChild(sectionLabel("SEASONALITY"));
    v.appendChild(h("p", { class: "lede", style: "margin-top:-6px;margin-bottom:16px" },
      "Teams order-volume index by month. June opens the window into the late-summer fall peak. Market ahead of it, not into it."));
    v.appendChild(seasonalityHeat());

    animateBars(v);
    requestAnimationFrame(function () {
      v.querySelectorAll("[data-w]").forEach(function (el) { el.style.width = el.getAttribute("data-w") + "%"; });
      v.querySelectorAll("[data-ceil]").forEach(function (el) { el.style.left = el.getAttribute("data-ceil") + "%"; });
    });
    return v;
  }

  function pipelineFunnel() {
    const stages = M.pipelineByStage();
    const max = Math.max.apply(null, stages.map(function (s) { return s.value || 1; }));
    const wrap = h("div", { class: "funnel" });
    wrap.appendChild(h("div", { class: "mono", style: "margin-bottom:16px" }, "/ OPEN BY STAGE"));
    stages.forEach(function (st) {
      wrap.appendChild(h("div", { class: "funnel-row" }, [
        h("div", { class: "funnel-head" }, [
          h("span", { class: "fn-stage" }, st.stage),
          h("span", { class: "fn-meta" }, st.count + " quotes  /  " + Math.round(st.prob * 100) + "% win prob"),
        ]),
        h("div", { class: "funnel-track" }, [
          h("span", { "data-w": Math.round((st.value / max) * 100) }),
          h("span", { class: "fn-val" }, money(st.value)),
        ]),
      ]));
    });
    return wrap;
  }
  function pipelineNote(s) {
    return h("div", { class: "panel ink" }, [
      h("div", { class: "mono" }, "/ PIPELINE HEALTH"),
      h("div", { style: "display:flex;align-items:baseline;gap:12px;margin:14px 0 4px" }, [
        h("span", { style: "font-size:38px;font-weight:700" }, money(s.pipelineValue)),
        h("span", { style: "color:var(--muted-ink)" }, "open"),
      ]),
      h("p", { style: "color:var(--muted-ink);max-width:46ch" },
        money(s.weightedPipeline) + " weighted by stage. Win rate " + s.winRate + "% on a " + s.avgCycleDays + " day average cycle. Pricing stays consultative. No turnaround promise."),
    ]);
  }
  function quotesTable() {
    const stageChip = { "Lead": "not_started", "Quote sent": "scheduled", "Negotiation": "in_progress", "Verbal yes": "active" };
    const t = h("table", { class: "matrix", style: "margin-top:16px" });
    t.appendChild(h("thead", null, h("tr", null, [th("Account"), th("Type"), th("Value"), th("Stage"), th("Owner"), th("Age"), th("Expected close")])));
    const tb = h("tbody");
    M.openQuotes().slice().sort(function (a, b) { return b.value - a.value; }).forEach(function (q) {
      tb.appendChild(h("tr", null, [
        h("td", { class: "strong" }, [document.createTextNode(q.account), q.prospect ? h("span", { class: "tier-tag", style: "margin-left:8px" }, "prospect") : null]),
        h("td", { class: "mono", style: "font-size:10px" }, q.kind),
        h("td", { class: "num-cell strong" }, money(q.value)),
        h("td", null, chip(stageChip[q.stage], q.stage)),
        h("td", { class: "mono", style: "font-size:10px" }, q.owner),
        h("td", { class: "num-cell" }, q.ageDays + "d"),
        h("td", { class: "mono", style: "font-size:10px" }, q.expectedClose.slice(5)),
      ]));
    });
    t.appendChild(tb);
    return t;
  }

  function accountControls(rootView) {
    const bar = h("div", { class: "filterbar" });
    bar.appendChild(h("span", { class: "fb-label" }, "Status"));
    [["all", "All"], ["active", "Active"], ["overdue", "Overdue"], ["at_risk", "At risk"]].forEach(function (f) {
      const b = h("button", { class: "fbtn" + (acctFilter === f[0] ? " on" : "") }, f[1]);
      b.addEventListener("click", function () {
        acctFilter = f[0];
        bar.querySelectorAll(".fbtn[data-grp='st']").forEach(function (x) { x.classList.remove("on"); });
        b.classList.add("on");
        renderAccountsTable(document.getElementById("acct-table"));
      });
      b.setAttribute("data-grp", "st");
      bar.appendChild(b);
    });
    bar.appendChild(h("span", { class: "fb-label", style: "margin-left:14px" }, "Sort"));
    [["value", "Book value"], ["overdue", "Most overdue"], ["sow", "Share of wallet"]].forEach(function (f) {
      const b = h("button", { class: "fbtn" + (acctSort === f[0] ? " on" : "") }, f[1]);
      b.addEventListener("click", function () {
        acctSort = f[0];
        bar.querySelectorAll(".fbtn[data-grp='so']").forEach(function (x) { x.classList.remove("on"); });
        b.classList.add("on");
        renderAccountsTable(document.getElementById("acct-table"));
      });
      b.setAttribute("data-grp", "so");
      bar.appendChild(b);
    });
    return bar;
  }
  function renderAccountsTable(mount) {
    if (!mount) return;
    const statusChipMap = { active: "active", overdue: "in_progress", at_risk: "blocked" };
    let rows = M.accountsWithHealth();
    if (acctFilter !== "all") rows = rows.filter(function (a) { return a.status === acctFilter; });
    rows.sort(function (a, b) {
      if (acctSort === "overdue") return b.daysOverdue - a.daysOverdue || b.annualSpend - a.annualSpend;
      if (acctSort === "sow") return a.shareOfWallet - b.shareOfWallet;
      return b.annualSpend - a.annualSpend;
    });
    mount.innerHTML = "";
    const t = h("table", { class: "matrix" });
    t.appendChild(h("thead", null, h("tr", null, [th("Account"), th("Tier"), th("Region"), th("Owner"), th("Book value"), th("Last order"), th("Cadence"), th("Status"), th("Share of wallet")])));
    const tb = h("tbody");
    rows.forEach(function (a) {
      tb.appendChild(h("tr", null, [
        h("td", { class: "strong" }, [document.createTextNode(a.name), a.newThisQtr ? h("span", { class: "tier-tag", style: "margin-left:8px;color:var(--done);border-color:var(--done)" }, "new") : null]),
        h("td", null, h("span", { class: "tier-tag " + a.tier }, a.tier)),
        h("td", null, h("span", { class: "acct-region" }, a.region)),
        h("td", { class: "mono", style: "font-size:10px" }, a.owner),
        h("td", { class: "num-cell strong" }, money(a.annualSpend)),
        h("td", { class: "mono", style: "font-size:10px" }, a.lastOrder.slice(5)),
        h("td", { class: "num-cell", style: "color:var(--muted)" }, a.daysSince + "/" + a.cadenceDays + "d"),
        h("td", null, chip(statusChipMap[a.status], a.status === "at_risk" ? "At risk" : a.status === "overdue" ? "Overdue" : "Active")),
        h("td", null, [h("span", { class: "sow-bar" }, [h("span", { style: "width:" + a.shareOfWallet + "%" })]), h("span", { class: "sow-label" }, a.shareOfWallet + "%")]),
      ]));
    });
    t.appendChild(tb);
    mount.appendChild(t);
    if (!rows.length) mount.appendChild(h("div", { class: "note-line" }, "No accounts in this state."));
  }

  function fuzeTable() {
    const statusChipMap = { "Queued": "not_started", "Design approval": "scheduled", "In production": "in_progress", "Shipping": "active", "Delivered": "done" };
    const t = h("table", { class: "matrix" });
    t.appendChild(h("thead", null, h("tr", null, [th("Account"), th("Value"), th("Due"), th("Lead"), th("Status")])));
    const tb = h("tbody");
    M.fuzeWithLead().slice().sort(function (a, b) { return a.dueDate < b.dueDate ? -1 : 1; }).forEach(function (o) {
      const tight = o.weeksToDue < o.lead - 0.5;
      tb.appendChild(h("tr", null, [
        h("td", { class: "strong" }, o.account),
        h("td", { class: "num-cell" }, money(o.value)),
        h("td", { class: "mono", style: "font-size:10px" }, o.dueDate.slice(5)),
        h("td", { class: "num-cell" + (tight ? " ceiling" : ""), style: "font-size:12px" }, o.weeksToDue + "w left"),
        h("td", null, chip(statusChipMap[o.status], o.status)),
      ]));
    });
    t.appendChild(tb);
    return t;
  }
  function capacityChart() {
    const weeks = M.fuzeCapacityByWeek();
    const max = Math.max(weeks.reduce(function (m, w) { return Math.max(m, w.load); }, 0), weeks[0] ? weeks[0].ceiling : 1);
    const wrap = h("div", { class: "chart-wrap" });
    wrap.appendChild(h("div", { class: "mono", style: "margin-bottom:20px" }, "/ PRODUCTION LOAD BY WEEK"));
    weeks.forEach(function (w) {
      wrap.appendChild(h("div", { class: "cap-row" }, [
        h("div", { class: "cap-head" }, [
          h("span", null, "Week of " + w.week.slice(5)),
          h("span", { class: w.over ? "over" : "" }, money(w.load) + (w.over ? "  over" : "") + "  /  " + w.items + " orders"),
        ]),
        h("div", { class: "cap-track" }, [
          h("span", { class: w.over ? "over" : "", "data-w": Math.round((w.load / max) * 100) }),
          h("span", { class: "ceil", "data-ceil": Math.round((w.ceiling / max) * 100) }),
        ]),
      ]));
    });
    wrap.appendChild(h("p", { style: "margin-top:6px;font-size:13px;color:var(--muted)" }, "Capacity ceiling " + money(weeks[0] ? weeks[0].ceiling : 0) + " per week. Move design-approval orders forward before a peak week locks up."));
    return wrap;
  }

  function seasonalityHeat() {
    const wrap = h("div", { class: "panel" });
    const grid = h("div", { class: "heat" });
    window.AVBAccounts.seasonality.forEach(function (m) {
      const op = 0.12 + (m.idx / 100) * 0.8;
      grid.appendChild(h("div", { class: "heat-cell" + (m.here ? " here" : ""), style: "background:rgba(200,16,46," + op.toFixed(2) + ")" }, [
        h("div", { class: "hm", style: m.idx > 60 ? "color:var(--white)" : "" }, m.m),
        h("div", { class: "hv", style: m.idx > 60 ? "color:var(--white)" : "" }, String(m.idx)),
        h("div", { class: "hn", style: m.idx > 60 ? "color:rgba(255,255,255,.85)" : "" }, m.note || ""),
      ]));
    });
    wrap.appendChild(grid);
    return wrap;
  }

  /* ============================================================
     ROUTER
     ============================================================ */
  // Navigation TREE. A node is a leaf (has render) or a folder (has children).
  // Add child tiles here as the system grows; the shell handles the rest.
  const NAV = [
    { key: "machine", title: "The Machine", label: "MACHINE", color: "red", icon: "machine", href: "/machine",
      glance: function () { return "BUILD MODE"; } },
    { key: "overview", title: "Overview", label: "OVERVIEW", color: "ink", icon: "overview", render: viewOverview },
    { key: "accounts", title: "Accounts", label: "ACCOUNTS", color: "red", icon: "accounts", render: viewAccounts },
    { key: "rocks", title: "Rocks", label: "ROCKS", color: "cream", icon: "rocks", render: viewRocks },
    { key: "june", title: "June Plan", label: "JUNE", color: "ink", icon: "june", render: viewJune },
    { key: "campaigns", title: "Campaigns", label: "CAMPAIGNS", color: "cream", icon: "campaigns", href: "/campaigns",
      glance: function () { return "EMAIL + SOCIAL CALENDAR"; } },
    { key: "promos", title: "Promos", label: "PROMOS", color: "red", icon: "promos", render: viewPromos },
    { key: "budget", title: "Budget", label: "BUDGET", color: "ink", icon: "budget", href: "/budget" },
    { key: "rebuild", title: "The Rebuild", label: "REBUILD", color: "ink", icon: "lock", href: "/rebuild",
      glance: function () { return "TEAM BUILD"; } },
    { key: "automation", title: "Automation", label: "AUTOMATION", color: "cream", icon: "automation", render: viewAutomation },
    { key: "content", title: "Content", label: "CONTENT", color: "cream", icon: "content", render: viewContent },
  ];

  /* ============================================================
     CARPLAY-STYLE SHELL: springboard + zoom-open app screens
     ============================================================ */

  // Inline icon set (24x24, stroke = currentColor).
  function icon(name) {
    const P = {
      overview: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
      accounts: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
      rocks: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>',
      june: '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/>',
      campaigns: '<rect x="2.5" y="5" width="19" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
      promos: '<path d="M20.6 13.4 13 21l-9-9V4h8z"/><circle cx="8.5" cy="8.5" r="1.4"/>',
      budget: '<path d="M3 21h18"/><rect x="5" y="11" width="3.5" height="8"/><rect x="10.5" y="6" width="3.5" height="13"/><rect x="16" y="14" width="3.5" height="5"/>',
      automation: '<path d="M13 2 4.5 13.5H11l-1 8.5L19.5 10H13z"/>',
      content: '<rect x="3" y="4" width="18" height="14" rx="2"/><circle cx="8.5" cy="9" r="1.6"/><path d="m4 17 5-4 4 3 3-2 4 3"/>',
      lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
      machine: '<rect x="2" y="7" width="20" height="11" rx="5.5"/><path d="M8 11v3M6.5 12.5h3M15 11.5h.01M18 13.5h.01"/>',
      home: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
      back: '<path d="M15 18l-6-6 6-6"/>',
    };
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + (P[name] || "") + "</svg>";
  }

  function shortMoney(n) {
    if (n >= 1000000) return "$" + (n / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
    if (n >= 1000) return "$" + Math.round(n / 1000) + "K";
    return "$" + n;
  }

  // Live glance + badge per app, computed from the data.
  function glances() {
    const flagged = D.campaigns.teams.emails.filter(function (e) { return e.status === "placeholder_flagged"; }).length;
    const blocked = D.rocks.reduce(function (a, r) { return a + countStatus(rockLeaves(r), "blocked"); }, 0);
    const allLeaves = D.rocks.reduce(function (a, r) { return a.concat(rockLeaves(r)); }, []);
    const rockPctAll = (function () { const w = { done: 1, in_progress: 0.5, blocked: 0.15, not_started: 0 };
      return Math.round(allLeaves.reduce(function (s, l) { return s + (w[l.status] || 0); }, 0) / allLeaves.length * 100); })();
    const m = window.AVBMetrics ? window.AVBMetrics.summary() : null;
    const atRisk = window.AVBMetrics ? window.AVBMetrics.atRisk().length : 0;
    const bud = D.budget.channels.reduce(function (s, c) { return s + c.monthly; }, 0);
    const j = window.AVBJune ? window.AVBJune.counts : null;
    const activePromos = D.promos.filter(function (p) { return p.status === "active"; }).length;
    return {
      overview: { glance: "Q2 / " + D.rocks.length + " ROCKS", badge: null },
      accounts: { glance: (m ? shortMoney(m.bookValue) + " BOOK" : "BOOK OF BUSINESS"), badge: atRisk || null },
      rocks: { glance: rockPctAll + "% / " + blocked + " BLOCKED", badge: blocked || null },
      june: { glance: (j ? j.teams + j.retail + j.customfuze : 0) + " SENDS / " + (j ? j.socialPosts : 0) + " POSTS", badge: null },
      campaigns: { glance: D.campaigns.teams.emails.length + " EMAILS / " + flagged + " FLAGGED", badge: flagged || null },
      promos: { glance: activePromos + " ACTIVE / 1 ENDED", badge: null },
      budget: { glance: shortMoney(bud) + " / MO", badge: null },
      automation: { glance: D.automation.live.length + " LIVE / " + D.automation.backlog.length + " IDEAS", badge: null },
      content: { glance: "UGC / 5 PILLARS", badge: null },
    };
  }

  let stageEl, springboardEl, appScreen, appInner, dockHome, currentPath = [];

  function greeting() {
    const hr = new Date().getHours();
    return hr < 12 ? "Good morning" : hr < 18 ? "Good afternoon" : "Good evening";
  }

  // --- tree helpers ---
  function nodeAt(path) {
    let level = NAV, node = null;
    for (let i = 0; i < path.length; i++) {
      node = null;
      for (let j = 0; j < level.length; j++) { if (level[j].key === path[i]) { node = level[j]; break; } }
      if (!node) return null;
      level = node.children || [];
    }
    return node;
  }
  function pathFromHash() {
    const hsh = location.hash.replace(/^#\/?/, "");
    if (!hsh || hsh === "home") return [];
    return hsh.split("/").filter(Boolean);
  }

  function tileEl(node, onClick, i) {
    const gl = typeof node.glance === "function" ? node.glance() : (glances()[node.key] ? glances()[node.key].glance : "");
    const el = h("button", { class: "app-tile " + (node.color || "ink"), "data-key": node.key, style: "animation-delay:" + (i * 45) + "ms" }, [
      h("div", { class: "ti-icon", html: icon(node.icon) }),
      h("div", { class: "ti-spacer" }),
      h("div", { class: "ti-name" }, node.title),
      h("div", { class: "ti-glance" }, gl),
    ]);
    let bd = typeof node.badge === "function" ? node.badge() : (glances()[node.key] ? glances()[node.key].badge : null);
    if (bd) el.appendChild(h("span", { class: "ti-badge" }, String(bd)));
    if (node.children) el.appendChild(h("span", { class: "ti-sub" }, node.children.length + " ›"));
    el.addEventListener("click", onClick);
    return el;
  }

  function buildSpringboard() {
    springboardEl.innerHTML = "";
    springboardEl.appendChild(h("div", { class: "sb-hello" }, [
      h("div", { class: "mono" }, "/ MARKETING OS  ·  Q2"),
      h("h2", null, [document.createTextNode(greeting() + ", team. "), h("span", { class: "accent" }, "Volleyball only.")]),
    ]));
    const grid = h("div", { class: "tile-grid" });
    NAV.forEach(function (node, i) {
      grid.appendChild(tileEl(node, function () {
        if (node.href) { window.location.href = node.href; return; }
        location.hash = "#/" + node.key;
      }, i));
    });
    springboardEl.appendChild(grid);
  }

  function subGrid(node, path) {
    const wrap = h("div", { class: "view sub-board" });
    wrap.appendChild(h("div", { class: "sb-hello" }, [
      h("div", { class: "mono" }, "/ " + node.label + "  ·  " + node.children.length + " SECTIONS"),
      h("h2", null, [document.createTextNode(node.title + ". "), h("span", { class: "accent" }, "Pick a section.")]),
    ]));
    const grid = h("div", { class: "tile-grid" });
    node.children.forEach(function (ch, i) {
      const childPath = path.concat(ch.key);
      grid.appendChild(tileEl(ch, function () { location.hash = "#/" + childPath.join("/"); }, i));
    });
    wrap.appendChild(grid);
    return wrap;
  }

  function buildBar(path) {
    const top = nodeAt([path[0]]);
    const bar = h("div", { class: "app-bar" });
    bar.appendChild(h("button", { class: "back", onclick: goUp }, [h("span", { html: icon("back") }), document.createTextNode(path.length > 1 ? "Back" : "Home")]));
    bar.appendChild(h("span", { class: "ab-icon", html: icon(top.icon) }));
    const crumbs = h("span", { class: "ab-crumb" });
    crumbs.appendChild(h("a", { href: "#/home", class: "cr" }, "Home"));
    let acc = [];
    path.forEach(function (seg, idx) {
      acc = acc.concat(seg);
      const node = nodeAt(acc);
      crumbs.appendChild(h("span", { class: "cr-sep" }, "›"));
      if (idx === path.length - 1) crumbs.appendChild(h("span", { class: "cr cur" }, node.title));
      else { const a2 = acc.slice(); crumbs.appendChild(h("a", { href: "#/" + a2.join("/"), class: "cr" }, node.title)); }
    });
    bar.appendChild(crumbs);
    return bar;
  }

  function buildAppContent(path) {
    appInner.innerHTML = "";
    appInner.appendChild(buildBar(path));
    const node = nodeAt(path);
    if (node && node.children) appInner.appendChild(subGrid(node, path));
    else if (node && node.render) appInner.appendChild(node.render());
    appInner.scrollTop = 0;
  }

  function tileRectFor(key) {
    const t = springboardEl.querySelector('.app-tile[data-key="' + key + '"]');
    const sr = stageEl.getBoundingClientRect();
    if (!t) return { dx: sr.width / 2, dy: sr.height / 2, sx: 0.1, sy: 0.1 };
    const r = t.getBoundingClientRect();
    return { dx: r.left - sr.left, dy: r.top - sr.top, sx: r.width / sr.width, sy: r.height / sr.height };
  }

  function openZoom(path) {
    buildAppContent(path);
    const o = tileRectFor(path[0]);
    appScreen.style.transition = "none";
    appScreen.style.transformOrigin = "top left";
    appScreen.style.opacity = "";
    appScreen.style.transform = "translate(" + o.dx + "px," + o.dy + "px) scale(" + o.sx + "," + o.sy + ")";
    appScreen.style.borderRadius = "22px";
    appScreen.classList.add("open");
    springboardEl.classList.add("dim");
    requestAnimationFrame(function () { requestAnimationFrame(function () {
      appScreen.style.transition = "transform .52s cubic-bezier(.2,.8,.2,1), border-radius .52s cubic-bezier(.2,.8,.2,1)";
      appScreen.style.transform = "translate(0,0) scale(1,1)";
      appScreen.style.borderRadius = "0px";
      appScreen.classList.add("shown");
    }); });
  }

  function swapContent(path) {
    buildAppContent(path);
    appScreen.classList.remove("shown");
    void appScreen.offsetWidth; // reflow so the fade replays
    requestAnimationFrame(function () { appScreen.classList.add("shown"); });
  }

  function closeApp(key) {
    const o = tileRectFor(key);
    appScreen.classList.remove("shown");
    appScreen.style.transition = "transform .42s cubic-bezier(.4,0,.2,1), border-radius .42s, opacity .34s .08s";
    appScreen.style.transform = "translate(" + o.dx + "px," + o.dy + "px) scale(" + o.sx + "," + o.sy + ")";
    appScreen.style.borderRadius = "22px";
    appScreen.style.opacity = "0";
    springboardEl.classList.remove("dim");
    const finish = function () {
      appScreen.classList.remove("open");
      appScreen.style.opacity = ""; appScreen.style.transition = "none";
      appScreen.style.transform = ""; appScreen.style.borderRadius = "";
      appInner.innerHTML = "";
      appScreen.removeEventListener("transitionend", finish);
    };
    appScreen.addEventListener("transitionend", finish);
  }

  function goHome() { location.hash = "#/home"; }
  function goUp() {
    const p = currentPath;
    if (p.length <= 1) location.hash = "#/home";
    else location.hash = "#/" + p.slice(0, -1).join("/");
  }
  function setActive(key) { dockHome.classList.toggle("on", !key); }

  function route() {
    const newPath = pathFromHash();
    if (newPath.length && !nodeAt(newPath)) { location.hash = "#/home"; return; }
    // External feature (e.g. the Budget tool) lives at its own URL.
    if (newPath.length) {
      const n = nodeAt(newPath);
      if (n && n.href) { window.location.href = n.href; return; }
    }
    const prev = currentPath;
    if (newPath.length === 0) {
      if (prev.length) closeApp(prev[0]);
      currentPath = []; setActive(null); return;
    }
    if (prev.length === 0) { currentPath = newPath; openZoom(newPath); }
    else if (prev.join("/") !== newPath.join("/")) { currentPath = newPath; swapContent(newPath); }
    else { currentPath = newPath; }
    setActive(newPath[0]);
  }

  function clock() {
    const c = document.getElementById("clock"), dc = document.getElementById("dock-clock");
    // Local timezone abbreviation for wherever this is opened (US -> CDT/EST/PST, etc.)
    let tzAbbr = "";
    try {
      const parts = new Intl.DateTimeFormat("en-US", { timeZoneName: "short" }).formatToParts(new Date());
      const p = parts.find(function (x) { return x.type === "timeZoneName"; });
      tzAbbr = p ? p.value : "";
    } catch (e) {}
    function stamp() {
      const d = new Date();
      const hh = String(d.getHours()).padStart(2, "0");
      const mm = String(d.getMinutes()).padStart(2, "0");
      const ss = String(d.getSeconds()).padStart(2, "0");
      if (c) c.textContent = hh + ":" + mm + ":" + ss + (tzAbbr ? " " + tzAbbr : "");
      if (dc) dc.textContent = hh + ":" + mm + (tzAbbr ? " " + tzAbbr : "");
    }
    stamp(); setInterval(stamp, 1000);
  }

  function setupLogin() {
    const login = document.getElementById("login");
    if (!login) return;
    const form = document.getElementById("login-form");
    const user = document.getElementById("login-user");
    function enter(e) {
      if (e) e.preventDefault();
      login.classList.add("gone");
      window.setTimeout(function () { login.style.display = "none"; }, 650);
    }
    if (form) form.addEventListener("submit", enter);
    if (user) { try { user.focus(); } catch (e) {} }
  }

  function setupTheme() {
    var btn = document.getElementById("theme-toggle");
    if (!btn) return;
    var sun = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
    var moon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z"/></svg>';
    function current() { var m = document.cookie.match(/avb_theme=(light|dark)/); return m ? m[1] : "dark"; }
    function paint() { btn.innerHTML = current() === "dark" ? sun : moon; }
    paint();
    btn.addEventListener("click", function () {
      var next = current() === "dark" ? "light" : "dark";
      var e = document.documentElement;
      e.classList.remove("dark", "light"); e.classList.add(next);
      document.cookie = "avb_theme=" + next + "; path=/; max-age=31536000; samesite=lax";
      paint();
    });
  }

  function init() {
    stageEl = document.querySelector(".stage");
    springboardEl = document.getElementById("springboard");
    appScreen = document.getElementById("app-screen");
    appInner = document.getElementById("app-inner");
    dockHome = document.getElementById("dock-home");
    dockHome.innerHTML = icon("home");
    dockHome.addEventListener("click", goHome);
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && currentPath.length) goUp(); });
    buildSpringboard();
    clock();
    setupTheme();
    setupLogin();
    window.addEventListener("hashchange", route);
    route(); // honor deep links on load
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
