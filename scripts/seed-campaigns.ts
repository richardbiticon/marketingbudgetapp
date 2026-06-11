import "dotenv/config";
import { like } from "drizzle-orm";
import { getDb } from "../lib/db";
import { plannedEmails, socialPosts } from "../lib/schema";

// Migrates the June social and email plan from the static OS into the live
// tables. Idempotent: clears June rows first. Statuses derive from today.
const MONTH = "2026-06";

const teams: [number, string, string, string][] = [
  [1, "Most dealers are built wrong for your team", "Too big to care. Too small to deliver.", "Tell us about your program"],
  [3, "We only do one thing", "Volleyball only. That is the whole business.", "See how we work"],
  [8, "Why your gear shows up right every time", "We run a system, not heroics", "See how we work"],
  [10, "Built for teams where average is not good enough", "Your program deserves a real partner", "Start a quote"],
  [15, "How [Club] runs their season with us", "See what serious programs do differently", "Read the story"],
  [17, "Gear you love. On time. Under budget.", "Here is exactly what we guarantee", "Start a quote"],
  [22, "We are not the cheapest. Here is why.", "What you actually pay for", "Start a quote"],
  [24, "Order now or chase it later", "The window for fall uniforms is open", "Start your order"],
  [29, "Ready when you are", "If you are serious about your program, we are your partner", "Book a consultation"],
];

const retail: [number, string, string][] = [
  [2, "Free shipping starts at $99", "New this month: ship free and save more"],
  [4, "$150 gets you 10% off and free shipping", "Spend a little more, save a lot more"],
  [9, "The gear teams reorder all season", "Restock the basics"],
  [11, "Shoes that hold up to a full season", "Find your court shoe"],
  [16, "Still shipping free at $99", "Round out your cart, take 15% off at $200"],
  [18, "For the player in your life", "Gift the gear they will actually use"],
  [23, "Balls, nets, and the stuff that lasts", "Equipment built for the long season"],
  [25, "Free shipping through the month", "Last days for the deal"],
  [30, "Last call on the free shipping tiers", "Ends today: ship free, save more"],
];

const customfuze: [number, string, string][] = [
  [12, "See the CustomFuze lookbook", "Your next uniform starts here"],
  [19, "Order now to be ready for the first whistle", "Custom takes four to six weeks. Start today."],
  [26, "Designs we built this season", "Build yours next"],
];

const social: [number, string, string, string, string][] = [
  [1, "Education", "When to order for fall", "If your team needs uniforms by the first whistle, here is the timeline.", "Typography carousel"],
  [2, "Product", "Court shoe in play", "Free shipping starts at $99. Here is where most teams start.", "Real photo"],
  [3, "Club Spotlight", "Feature a serious program", "@[club] runs their season the right way. Here is how they gear up.", "Club photos"],
  [4, "Win + BTS", "We made it right", "A reorder ran tight. Here is what we did about it.", "Reel or photo"],
  [5, "CustomFuze", "Uniform reveal", "Built for one team, one season.", "Real uniform photo"],
  [6, "Tournament / UGC", "Repost from the floor", "These are their jerseys. Built for this.", "UGC repost"],
  [7, "Brand", "Typography post", "Too big to care. Too small to deliver.", "Typography"],
  [8, "Education", "Sizing without the guesswork", "Ordering for a full roster? Read this first.", "Typography carousel"],
  [9, "Product", "Bestseller restock", "The basics teams reorder every season.", "Real photo"],
  [10, "Club Spotlight", "Director feature", "A club director on building a program that lasts.", "Photo + quote"],
  [11, "Win + BTS", "Warehouse day", "What happens between your order and your door.", "Reel"],
  [12, "CustomFuze", "Lookbook drop", "The lookbook is here. Your next look starts inside.", "Carousel"],
  [13, "Tournament / UGC", "Athlete content", "From The Roster. On the floor this weekend.", "UGC repost"],
  [14, "Brand", "Typography post", "Volleyball only. That is the whole business.", "Typography"],
  [15, "Education", "Care that keeps gear looking new", "Your uniforms can last more than one season. Here is how.", "Typography carousel"],
  [16, "Product", "Cart-builder", "At $200 you take 15% off and ship free.", "Real photo"],
  [17, "Club Spotlight", "Season recap", "How one program ran a clean season start to finish.", "Carousel"],
  [18, "Win + BTS", "First-name CS story", "Real person. Real fix. Signed by name.", "Screenshot + photo"],
  [19, "CustomFuze", "Deadline push", "Start now and your team is in uniform for the first whistle.", "Typography"],
  [20, "Tournament / UGC", "Megan partnership content", "Creator content from the season.", "UGC"],
  [21, "Brand", "Typography post", "Built for teams and clubs where average is not good enough.", "Typography"],
  [22, "Education", "The ordering window, plainly", "If fall feels far away, the calendar disagrees.", "Typography carousel"],
  [23, "Product", "Equipment that lasts", "Balls and nets built for a long season.", "Real photo"],
  [24, "Club Spotlight", "New partner intro", "A program that just made the switch.", "Photo + quote"],
  [25, "Win + BTS", "Build process", "From design approval to the box.", "Reel"],
  [26, "CustomFuze", "Design showcase", "Designs we built this season. Build yours next.", "Carousel"],
  [27, "Tournament / UGC", "Weekend coverage", "On the floor with our teams.", "UGC"],
  [28, "Brand", "Typography post", "If you are serious about your program, we are your partner.", "Typography"],
  [29, "Education", "Last-week recap", "Everything you need to order for fall, in one place.", "Typography carousel"],
  [30, "Product", "Month-end", "Last day for the free shipping tiers.", "Real photo"],
];

function dateOf(day: number) { return `${MONTH}-${String(day).padStart(2, "0")}`; }

async function main() {
  const db = getDb();
  const today = new Date().toISOString().slice(0, 10);

  await db.delete(plannedEmails).where(like(plannedEmails.sendDate, `${MONTH}-%`));
  await db.delete(socialPosts).where(like(socialPosts.postDate, `${MONTH}-%`));

  const emailRows = [
    ...teams.map(([d, a, b, cta]) => ({
      sendDate: dateOf(d), track: "teams", platform: "Redo", subjectA: a, subjectB: b,
      body: `CTA: ${cta}. Warm list. Part of the Q2 repositioning arc.`,
      status: dateOf(d) < today ? "sent" : "scheduled", owner: "Richard",
    })),
    ...retail.map(([d, a, b]) => ({
      sendDate: dateOf(d), track: "retail", platform: "Klaviyo", subjectA: a, subjectB: b,
      body: "Discount and shipping rollout. Equipment excluded, state it in the email.",
      status: dateOf(d) < today ? "sent" : "scheduled", owner: "Corey",
    })),
    ...customfuze.map(([d, a, b]) => ({
      sendDate: dateOf(d), track: "customfuze", platform: "Klaviyo", subjectA: a, subjectB: b,
      body: "Anchored to the ordering deadline and the lookbook.",
      status: dateOf(d) < today ? "sent" : "scheduled", owner: "Kelsey",
    })),
  ];
  await db.insert(plannedEmails).values(emailRows as any);

  const postRows = social.map(([d, pillar, concept, caption, format]) => ({
    postDate: dateOf(d), pillar, concept, caption, format,
    status: dateOf(d) < today ? "posted" : "planned", owner: "Kelsey",
  }));
  await db.insert(socialPosts).values(postRows as any);

  console.log(`Seeded ${emailRows.length} emails and ${postRows.length} posts for ${MONTH}.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
