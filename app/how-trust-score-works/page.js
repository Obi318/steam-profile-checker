import Link from "next/link";
import { getSiteUrl, seoConfig } from "../seo";

export const metadata = {
  title: "How Steam Checker Trust Score Works",
  description:
    "Breakdown of Steam Checker trust signals: account age, ban context, games owned, friends, Steam level, and optional game hours.",
  alternates: { canonical: "/how-trust-score-works" },
  keywords: [
    "steam checker trust score",
    "how steam trust score works",
    "steam profile risk signals",
    "steam account age checker",
    "steam bans context",
  ],
  openGraph: {
    title: "How Steam Checker Trust Score Works",
    description:
      "Understand exactly how Steam Checker builds a trust snapshot from public Steam profile signals.",
    type: "article",
    url: "/how-trust-score-works",
    siteName: seoConfig.siteName,
    images: [seoConfig.ogImagePath],
  },
  twitter: {
    card: "summary_large_image",
    title: "How Steam Checker Trust Score Works",
    description:
      "Understand exactly how Steam Checker builds a trust snapshot from public Steam profile signals.",
    images: [seoConfig.twitterImagePath],
  },
};

export default function HowTrustScoreWorksPage() {
  const siteUrl = getSiteUrl();

  const howToJsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How to Check a Steam Profile with Steam Checker",
    description:
      "Use Steam Checker to get a fast trust snapshot of any public Steam profile in seconds.",
    step: [
      {
        "@type": "HowToStep",
        name: "Copy the Steam Profile URL",
        text: "Find the suspicious player's Steam profile page and copy the URL, vanity name, or SteamID64.",
      },
      {
        "@type": "HowToStep",
        name: "Paste Into Steam Checker",
        text: "Go to steamchecker.io and paste the profile URL into the search bar.",
      },
      {
        "@type": "HowToStep",
        name: "Optionally Select a Game",
        text: "Choose a game from the dropdown to add playtime context to the trust analysis.",
      },
      {
        "@type": "HowToStep",
        name: "Read the Trust Snapshot",
        text: "Review the trust score, signal breakdown, and verdict to understand the profile's risk level.",
      },
      {
        "@type": "HowToStep",
        name: "Share With Your Squad",
        text: "Copy the share link or report and paste it into Discord or team comms for fast alignment.",
      },
    ],
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: `${siteUrl}/`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "How Trust Score Works",
        item: `${siteUrl}/how-trust-score-works`,
      },
    ],
  };

  return (
    <main className="min-h-screen bg-black text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <div className="mx-auto max-w-4xl px-4 py-14">
        <h1 className="text-3xl font-black sm:text-4xl">How Steam Checker Trust Score Works</h1>
        <p className="mt-4 text-white/70">
          Steam Checker creates a fast trust snapshot for public Steam profiles. It is designed for players who need
          quick context after suspicious kills, not a cheat verdict.
        </p>

        <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-xl font-bold">Core Signals</h2>
          <ul className="mt-3 space-y-2 text-sm text-white/75">
            <li>1. Account age: strongest stability signal in the model.</li>
            <li>2. Ban indicators: VAC, game bans, community bans, and economy restrictions can lower trust.</li>
            <li>3. Library footprint: games owned can indicate account maturity.</li>
            <li>4. Social footprint: friends count can add confidence context.</li>
            <li>5. Steam level: lighter maturity signal.</li>
            <li>6. Optional game hours: selected game context can apply a small adjustment.</li>
          </ul>
        </section>

        <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-xl font-bold">Interpretation Rules</h2>
          <ul className="mt-3 space-y-2 text-sm text-white/75">
            <li>1. Older accounts with clean ban indicators generally trend higher.</li>
            <li>2. Very recent bans apply stronger penalties than older bans.</li>
            <li>3. Limited public data can produce mixed confidence.</li>
            <li>4. A low score is a risk signal, not proof of cheating.</li>
          </ul>
        </section>

        <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-xl font-bold">What It Is Not</h2>
          <p className="mt-3 text-sm text-white/75">
            Steam Checker does not detect cheats and is not affiliated with Valve. It summarizes visible profile
            signals so squads can make better decisions quickly.
          </p>
        </section>

        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href="/?utm_source=guide&utm_medium=internal&utm_campaign=how_trust_score_works"
            className="rounded-xl bg-white px-5 py-3 text-sm font-bold uppercase tracking-wide text-black transition hover:bg-white/90"
          >
            Run A Steam Check
          </a>
          <Link
            href="/steam-vac-ban-context"
            className="rounded-xl border border-white/20 px-5 py-3 text-sm font-semibold uppercase tracking-wide text-white/80 transition hover:bg-white/10 hover:text-white"
          >
            VAC Ban Context Guide
          </Link>
        </div>
      </div>
    </main>
  );
}

