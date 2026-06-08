/* ============================================================
   ALL VOLLEYBALL — June Social and Email Plan (seed).
   The month's operating plan: ordering-window spine, three parallel
   tracks, full email + social calendar, mockups source, guardrails.
   June 1 is a Monday. 30 days. Drives the / JUNE view and calendar.
   ============================================================ */
window.AVBJune = (function () {
  "use strict";

  const jobLine =
    "June is the next-season ordering window. CustomFuze custom uniforms run four to six weeks, so an order placed in June lands on time for the first whistle. That is the spine of the month.";

  const tracks = [
    { key: "teams", label: "Teams repositioning", cadence: "Mon + Wed",
      note: "The built 10-email series continues. Pricing stays consultative. No public percentages, no quote-turnaround promises." },
    { key: "retail", label: "Retail discount + shipping", cadence: "Tue + Thu",
      note: "Live and promoted openly. Free shipping at $99, plus 10% at $150 and 15% at $200. Equipment excluded." },
    { key: "customfuze", label: "CustomFuze", cadence: "Fri",
      note: "Rotates in on Fridays, anchored to the ordering deadline and the lookbook." },
  ];

  const cadence = {
    cols: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat / Sun"],
    email: ["Teams", "Retail", "Teams", "Retail", "CustomFuze", "none"],
    social: ["Education", "Product in use", "Club Spotlight", "Customer win + BTS", "CustomFuze drop", "Tournament / UGC"],
  };

  /* ---- EMAIL TRACKS ---- */
  const teams = [
    { date: "Mon Jun 1", day: 1, theme: "The tension", a: "Most dealers are built wrong for your team", b: "Too big to care. Too small to deliver.", cta: "Tell us about your program" },
    { date: "Wed Jun 3", day: 3, theme: "Specialization", a: "We only do one thing", b: "Volleyball only. That is the whole business.", cta: "See how we work" },
    { date: "Mon Jun 8", day: 8, theme: "The system", a: "Why your gear shows up right every time", b: "We run a system, not heroics", cta: "See how we work" },
    { date: "Wed Jun 10", day: 10, theme: "Built for teams", a: "Built for teams where average is not good enough", b: "Your program deserves a real partner", cta: "Start a quote" },
    { date: "Mon Jun 15", day: 15, theme: "Proof", a: "How [Club] runs their season with us", b: "See what serious programs do differently", cta: "Read the story" },
    { date: "Wed Jun 17", day: 17, theme: "The guarantee", a: "Gear you love. On time. Under budget.", b: "Here is exactly what we guarantee", cta: "Start a quote" },
    { date: "Mon Jun 22", day: 22, theme: "Pricing honesty", a: "We are not the cheapest. Here is why.", b: "What you actually pay for", cta: "Start a quote" },
    { date: "Wed Jun 24", day: 24, theme: "Ordering window", a: "Order now or chase it later", b: "The window for fall uniforms is open", cta: "Start your order" },
    { date: "Mon Jun 29", day: 29, theme: "The ask", a: "Ready when you are", b: "If you are serious about your program, we are your partner", cta: "Book a consultation" },
  ];

  const retail = [
    { date: "Tue Jun 2", day: 2, angle: "Rollout announce", a: "Free shipping starts at $99", b: "New this month: ship free and save more" },
    { date: "Thu Jun 4", day: 4, angle: "Tier explainer", a: "$150 gets you 10% off and free shipping", b: "Spend a little more, save a lot more" },
    { date: "Tue Jun 9", day: 9, angle: "Bestsellers", a: "The gear teams reorder all season", b: "Restock the basics" },
    { date: "Thu Jun 11", day: 11, angle: "Footwear", a: "Shoes that hold up to a full season", b: "Find your court shoe" },
    { date: "Tue Jun 16", day: 16, angle: "Mid-month tiers", a: "Still shipping free at $99", b: "Round out your cart, take 15% off at $200" },
    { date: "Thu Jun 18", day: 18, angle: "Gift angle (optional)", a: "For the player in your life", b: "Gift the gear they will actually use", optional: true },
    { date: "Tue Jun 23", day: 23, angle: "Equipment", a: "Balls, nets, and the stuff that lasts", b: "Equipment built for the long season", durability: true },
    { date: "Thu Jun 25", day: 25, angle: "Urgency", a: "Free shipping through the month", b: "Last days for the deal" },
    { date: "Tue Jun 30", day: 30, angle: "Month-end", a: "Last call on the free shipping tiers", b: "Ends today: ship free, save more" },
  ];

  const customfuze = [
    { date: "Fri Jun 12", day: 12, angle: "Lookbook", a: "See the CustomFuze lookbook", b: "Your next uniform starts here", carries: "Carries the v1 lookbook PDF." },
    { date: "Fri Jun 19", day: 19, angle: "Ordering deadline", a: "Order now to be ready for the first whistle", b: "Custom takes four to six weeks. Start today." },
    { date: "Fri Jun 26", day: 26, angle: "Design showcase", a: "Designs we built this season", b: "Build yours next" },
  ];

  const quoteCTA = "Send your roster and we will build your quote.";
  const pricingLine = "Contact us for club pricing.";

  /* ---- SOCIAL (4 weeks) ---- */
  const social = [
    { week: 1, range: "Jun 1–7", posts: [
      { date: "Mon 1", day: 1, pillar: "Education", concept: "When to order for fall", hook: "If your team needs uniforms by the first whistle, here is the timeline.", format: "Typography carousel" },
      { date: "Tue 2", day: 2, pillar: "Product", concept: "Court shoe in play", hook: "Free shipping starts at $99. Here is where most teams start.", format: "Real photo" },
      { date: "Wed 3", day: 3, pillar: "Club Spotlight", concept: "Feature a serious program", hook: "@[club] runs their season the right way. Here is how they gear up.", format: "Club photos" },
      { date: "Thu 4", day: 4, pillar: "Win + BTS", concept: "We made it right", hook: "A reorder ran tight. Here is what we did about it.", format: "Reel or photo" },
      { date: "Fri 5", day: 5, pillar: "CustomFuze", concept: "Uniform reveal", hook: "Built for one team, one season.", format: "Real uniform photo" },
      { date: "Sat 6", day: 6, pillar: "Tournament / UGC", concept: "Repost from the floor", hook: "These are their jerseys. Built for this.", format: "UGC repost" },
      { date: "Sun 7", day: 7, pillar: "Brand", concept: "Typography post", hook: "Too big to care. Too small to deliver.", format: "Typography" },
    ]},
    { week: 2, range: "Jun 8–14", posts: [
      { date: "Mon 8", day: 8, pillar: "Education", concept: "Sizing without the guesswork", hook: "Ordering for a full roster? Read this first.", format: "Typography carousel" },
      { date: "Tue 9", day: 9, pillar: "Product", concept: "Bestseller restock", hook: "The basics teams reorder every season.", format: "Real photo" },
      { date: "Wed 10", day: 10, pillar: "Club Spotlight", concept: "Director feature", hook: "A club director on building a program that lasts.", format: "Photo + quote" },
      { date: "Thu 11", day: 11, pillar: "Win + BTS", concept: "Warehouse day", hook: "What happens between your order and your door.", format: "Reel" },
      { date: "Fri 12", day: 12, pillar: "CustomFuze", concept: "Lookbook drop", hook: "The lookbook is here. Your next look starts inside.", format: "Carousel" },
      { date: "Sat 13", day: 13, pillar: "Tournament / UGC", concept: "Athlete content", hook: "From The Roster. On the floor this weekend.", format: "UGC repost" },
      { date: "Sun 14", day: 14, pillar: "Brand", concept: "Typography post", hook: "Volleyball only. That is the whole business.", format: "Typography" },
    ]},
    { week: 3, range: "Jun 15–21", posts: [
      { date: "Mon 15", day: 15, pillar: "Education", concept: "Care that keeps gear looking new", hook: "Your uniforms can last more than one season. Here is how.", format: "Typography carousel" },
      { date: "Tue 16", day: 16, pillar: "Product", concept: "Cart-builder", hook: "At $200 you take 15% off and ship free.", format: "Real photo" },
      { date: "Wed 17", day: 17, pillar: "Club Spotlight", concept: "Season recap", hook: "How one program ran a clean season start to finish.", format: "Carousel" },
      { date: "Thu 18", day: 18, pillar: "Win + BTS", concept: "First-name CS story", hook: "Real person. Real fix. Signed by name.", format: "Screenshot + photo" },
      { date: "Fri 19", day: 19, pillar: "CustomFuze", concept: "Deadline push", hook: "Start now and your team is in uniform for the first whistle.", format: "Typography" },
      { date: "Sat 20", day: 20, pillar: "Tournament / UGC", concept: "Megan partnership content", hook: "Creator content from the season.", format: "UGC" },
      { date: "Sun 21", day: 21, pillar: "Brand", concept: "Typography post", hook: "Built for teams and clubs where average is not good enough.", format: "Typography" },
    ]},
    { week: 4, range: "Jun 22–30", posts: [
      { date: "Mon 22", day: 22, pillar: "Education", concept: "The ordering window, plainly", hook: "If fall feels far away, the calendar disagrees.", format: "Typography carousel" },
      { date: "Tue 23", day: 23, pillar: "Product", concept: "Equipment that lasts", hook: "Balls and nets built for a long season.", format: "Real photo" },
      { date: "Wed 24", day: 24, pillar: "Club Spotlight", concept: "New partner intro", hook: "A program that just made the switch.", format: "Photo + quote" },
      { date: "Thu 25", day: 25, pillar: "Win + BTS", concept: "Build process", hook: "From design approval to the box.", format: "Reel" },
      { date: "Fri 26", day: 26, pillar: "CustomFuze", concept: "Design showcase", hook: "Designs we built this season. Build yours next.", format: "Carousel" },
      { date: "Sat 27", day: 27, pillar: "Tournament / UGC", concept: "Weekend coverage", hook: "On the floor with our teams.", format: "UGC" },
      { date: "Sun 28", day: 28, pillar: "Brand", concept: "Typography post", hook: "If you are serious about your program, we are your partner.", format: "Typography" },
      { date: "Mon 29", day: 29, pillar: "Education", concept: "Last-week recap", hook: "Everything you need to order for fall, in one place.", format: "Typography carousel" },
      { date: "Tue 30", day: 30, pillar: "Product", concept: "Month-end", hook: "Last day for the free shipping tiers.", format: "Real photo" },
    ]},
  ];

  const stories =
    "Daily Stories: polls, behind-the-scenes clips, link stickers to the lookbook and the quote form. Tournament weekends get live reposts. Comments get real replies, not emoji stacks. Real over polished, customer over brand.";

  const guardrails = [
    "Periods, never em dashes.",
    "No year references. Seasonal language only.",
    "Banned words stay out, now including elevated and cheapest.",
    "No competitor names. Let the contrast line do the work.",
    "No quote-turnaround promises anywhere.",
    "No AI imagery. Real photography or typography only.",
  ];

  const sourceFlag =
    'The brand guide doc still contains "Real quote in 24 hours" in its sales examples. Strip that before any of it gets reused. Use verbatim locked phrases, never the contracted forms.';

  /* Pillar palette for the calendar + charts (dark-theme friendly). */
  const pillarColor = {
    "Education": "#cdc7ba",
    "Product": "#8b93a3",
    "Product in use": "#8b93a3",
    "Club Spotlight": "#ef2540",
    "Win + BTS": "#e3ad36",
    "Customer win + BTS": "#e3ad36",
    "CustomFuze": "#ff6178",
    "CustomFuze drop": "#ff6178",
    "Tournament / UGC": "#b7b0a3",
    "Brand": "#57c47b",
  };
  const trackColor = { Teams: "#8b93a3", Retail: "#ef2540", CustomFuze: "#ff6178" };

  /* ---- DAY MAP: build a 1..30 lookup of {emailTrack, emailSubject, social} ---- */
  function buildDayMap() {
    const map = {};
    for (let d = 1; d <= 30; d++) map[d] = { day: d, email: null, social: null };
    teams.forEach(function (e) { map[e.day].email = { track: "Teams", theme: e.theme, a: e.a, b: e.b, cta: e.cta }; });
    retail.forEach(function (e) { map[e.day].email = { track: "Retail", angle: e.angle, a: e.a, b: e.b }; });
    customfuze.forEach(function (e) { map[e.day].email = { track: "CustomFuze", angle: e.angle, a: e.a, b: e.b }; });
    social.forEach(function (w) { w.posts.forEach(function (p) { map[p.day].social = p; }); });
    return map;
  }

  return {
    jobLine, tracks, cadence, teams, retail, customfuze, quoteCTA, pricingLine,
    social, stories, guardrails, sourceFlag, pillarColor, trackColor,
    dayMap: buildDayMap(),
    counts: {
      teams: teams.length, retail: retail.length, customfuze: customfuze.length,
      socialPosts: social.reduce(function (a, w) { return a + w.posts.length; }, 0),
    },
  };
})();
