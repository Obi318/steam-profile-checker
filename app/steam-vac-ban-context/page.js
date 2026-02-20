import Link from "next/link";
import { seoConfig } from "../seo";

export const metadata = {
  title: "VAC and Game Ban Context For Steam Profiles",
  description:
    "Learn how to interpret VAC and game bans with recency context, and how Steam Checker uses this data in trust snapshots.",
  alternates: { canonical: "/steam-vac-ban-context" },
  keywords: [
    "vac ban checker context",
    "steam game ban meaning",
    "steam ban recency",
    "steam checker vac",
    "steam trust score bans",
  ],
  openGraph: {
    title: "VAC and Game Ban Context For Steam Profiles",
    description:
      "A practical guide to understanding what Steam bans mean in competitive profile checks.",
    type: "article",
    url: "/steam-vac-ban-context",
    siteName: seoConfig.siteName,
    images: [seoConfig.ogImagePath],
  },
  twitter: {
    card: "summary_large_image",
    title: "VAC and Game Ban Context For Steam Profiles",
    description:
      "A practical guide to understanding what Steam bans mean in competitive profile checks.",
    images: [seoConfig.twitterImagePath],
  },
};

export default function SteamVacBanContextPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-4xl px-4 py-14">
        <h1 className="text-3xl font-black sm:text-4xl">VAC and Game Ban Context</h1>
        <p className="mt-4 text-white/70">
          Ban indicators are meaningful, but context matters. Steam Checker uses recency and ban type so one old flag
          is treated differently than recent or repeated bans.
        </p>

        <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-xl font-bold">How To Read Ban Signals</h2>
          <ul className="mt-3 space-y-2 text-sm text-white/75">
            <li>1. Recent bans usually have stronger risk impact.</li>
            <li>2. Multiple ban indicators generally raise risk more than a single old event.</li>
            <li>3. Community or economy restrictions can matter based on game context.</li>
            <li>4. Zero visible bans is positive but should still be read with other profile signals.</li>
          </ul>
        </section>

        <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-xl font-bold">Decision Framework For Squads</h2>
          <ol className="mt-3 space-y-2 text-sm text-white/75">
            <li>1. Check account age first.</li>
            <li>2. Review bans with recency context.</li>
            <li>3. Compare with games owned and friends footprint.</li>
            <li>4. Use score plus judgment. Do not treat score as proof.</li>
          </ol>
        </section>

        <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-xl font-bold">Important Boundary</h2>
          <p className="mt-3 text-sm text-white/75">
            Steam Checker is an independent context tool and not an official anti-cheat system.
          </p>
        </section>

        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href="/?utm_source=guide&utm_medium=internal&utm_campaign=vac_context"
            className="rounded-xl bg-white px-5 py-3 text-sm font-bold uppercase tracking-wide text-black transition hover:bg-white/90"
          >
            Check A Profile
          </a>
          <Link
            href="/steam-profile-private-vs-public"
            className="rounded-xl border border-white/20 px-5 py-3 text-sm font-semibold uppercase tracking-wide text-white/80 transition hover:bg-white/10 hover:text-white"
          >
            Private vs Public Guide
          </Link>
        </div>
      </div>
    </main>
  );
}
