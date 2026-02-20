import Link from "next/link";
import { guidePages, gameLandingPages } from "../marketing-data";
import { seoConfig } from "../seo";

export const metadata = {
  title: "Steam Checker Marketing Hub",
  description:
    "Campaign-ready positioning, target audience framing, and launch links for Steam Checker growth execution.",
  alternates: { canonical: "/marketing" },
  openGraph: {
    title: "Steam Checker Marketing Hub",
    description:
      "Campaign-ready positioning, target audience framing, and launch links for Steam Checker growth execution.",
    type: "article",
    url: "/marketing",
    siteName: seoConfig.siteName,
    images: [seoConfig.ogImagePath],
  },
  twitter: {
    card: "summary_large_image",
    title: "Steam Checker Marketing Hub",
    description:
      "Campaign-ready positioning, target audience framing, and launch links for Steam Checker growth execution.",
    images: [seoConfig.twitterImagePath],
  },
};

const pillars = [
  {
    title: "Emotional Timing",
    body: "Target the 30-second window after a suspicious death, when squads actively search for context.",
  },
  {
    title: "Fast Evidence",
    body: "Promise speed: profile URL in, trust snapshot out, share link copied in seconds.",
  },
  {
    title: "Non-Accusatory Voice",
    body: "Position as confidence tooling, never a witch-hunt product. This protects brand trust and retention.",
  },
];

const channels = [
  {
    name: "YouTube Shorts / TikTok",
    tactic: "Show suspicious kill clip -> quick profile check -> trust read -> squad reaction.",
  },
  {
    name: "Reddit + Discord",
    tactic: "Publish educational posts on profile signals, then offer Steam Checker as the practical workflow.",
  },
  {
    name: "SEO",
    tactic: "Own long-tail intent pages for specific games and profile-check questions.",
  },
  {
    name: "Creator Partnerships",
    tactic: "Give streamers a weekly format: " +
      '"Sus Check Saturday" using shared result links for community discussion.',
  },
];

export default function MarketingPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-5xl px-4 py-14">
        <h1 className="text-3xl font-black sm:text-4xl">Steam Checker Growth Hub</h1>
        <p className="mt-4 max-w-3xl text-white/70">
          This page is the live execution center for positioning, channels, and landing surfaces. Core message: when a
          suspicious kill feels wrong, Steam Checker gives fast context from public profile signals.
        </p>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          {pillars.map((pillar) => (
            <article key={pillar.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <h2 className="text-lg font-bold">{pillar.title}</h2>
              <p className="mt-2 text-sm text-white/75">{pillar.body}</p>
            </article>
          ))}
        </section>

        <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-2xl font-bold">Primary Audience</h2>
          <ul className="mt-4 space-y-2 text-sm text-white/75">
            <li>1. Competitive players in games like ARC Raiders, CS2, COD, Rust, and The Finals.</li>
            <li>2. Duo/trio/clan squads who discuss suspicious fights in comms immediately after death.</li>
            <li>3. Players who want context quickly, without accusing people blindly.</li>
          </ul>
        </section>

        <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-2xl font-bold">Channel Plan</h2>
          <div className="mt-4 grid gap-3">
            {channels.map((channel) => (
              <article key={channel.name} className="rounded-xl border border-white/10 bg-black/40 p-4">
                <h3 className="font-semibold">{channel.name}</h3>
                <p className="mt-2 text-sm text-white/70">{channel.tactic}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-2xl font-bold">Game Landing Pages</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            {gameLandingPages.map((page) => (
              <Link
                key={page.path}
                href={page.path}
                className="rounded-lg border border-white/15 px-4 py-2 text-sm text-white/80 transition hover:bg-white/10 hover:text-white"
              >
                {page.gameName}
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-2xl font-bold">Evergreen SEO Guides</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            {guidePages.map((guide) => (
              <Link
                key={guide.path}
                href={guide.path}
                className="rounded-lg border border-white/15 px-4 py-2 text-sm text-white/80 transition hover:bg-white/10 hover:text-white"
              >
                {guide.title}
              </Link>
            ))}
          </div>
        </section>

        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href="/?utm_source=marketing_hub&utm_medium=internal&utm_campaign=main_cta"
            className="rounded-xl bg-white px-5 py-3 text-sm font-bold uppercase tracking-wide text-black transition hover:bg-white/90"
          >
            Open Steam Checker
          </a>
          <Link
            href="/how-trust-score-works"
            className="rounded-xl border border-white/20 px-5 py-3 text-sm font-semibold uppercase tracking-wide text-white/80 transition hover:bg-white/10 hover:text-white"
          >
            Read Scoring Guide
          </Link>
        </div>
      </div>
    </main>
  );
}
