/* ============================================================
   CONNECTORS — typed contracts, seed fallback.
   This dashboard ships fully working on seed data. These are the
   live-source contracts. Each fetchX() returns live data or throws,
   and the caller falls back to window.AVB seed. Every call is gated
   on an env var so the app runs with none set.

   Static hosting (GitHub Pages) has no server, so live pulls require
   a tiny proxy or serverless route to hold the tokens. NEVER put a
   token in client code. The shapes below are what that route returns.
   ============================================================ */
window.AVBConnectors = (function () {
  "use strict";

  // Read config from a global the host page may inject server-side.
  const ENV = window.__AVB_ENV || {};

  function need(key) {
    if (!ENV[key]) throw new Error("connector disabled: " + key + " not set, using seed");
  }

  /* ---- Asana: project GID 1215155436119479 ----
     Map sections to Rocks, task completion to leaf status.
     Section names use prefix grouping (API cannot create sections). */
  async function fetchRocks() {
    need("ASANA_TOKEN");
    // const res = await fetch("/api/sync/asana");  // serverless route holds the token
    // return mapAsanaToRocks(await res.json());
    throw new Error("Asana live pull requires a server route. Seed in use.");
  }

  /* ---- Klaviyo: campaign metrics for Campaigns view ---- */
  async function fetchKlaviyo() {
    need("KLAVIYO_API_KEY");
    throw new Error("Klaviyo live pull requires a server route. Seed in use.");
  }

  /* ---- n8n: workflow run status, base https://richardbiticon.app.n8n.cloud ---- */
  async function fetchAutomation() {
    need("N8N_API_KEY");
    throw new Error("n8n live pull requires a server route. Seed in use.");
  }

  /* ---- Meta / Google / Attentive: typed stubs, not implemented yet ---- */
  // TODO: implement auth flows. Seed budget figures stand in until then.
  async function fetchMetaSpend() { throw new Error("TODO: Meta connector not implemented"); }
  async function fetchGoogleSpend() { throw new Error("TODO: Google connector not implemented"); }
  async function fetchAttentive() { throw new Error("TODO: Attentive connector not implemented"); }

  /* Generic helper: try a connector, fall back to seed, never throw to UI. */
  async function withFallback(fn, seed, label) {
    try { return { source: "live", data: await fn() }; }
    catch (e) { console.info("[connector] " + (label || "") + " -> seed (" + e.message + ")"); return { source: "seed", data: seed }; }
  }

  return {
    fetchRocks, fetchKlaviyo, fetchAutomation,
    fetchMetaSpend, fetchGoogleSpend, fetchAttentive,
    withFallback,
  };
})();
