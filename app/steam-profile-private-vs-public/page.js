import Link from "next/link";
import { seoConfig } from "../seo";

export const metadata = {
  title: "Private vs Public Steam Profiles: What Changes",
  description:
    "Understand how Steam profile privacy changes trust confidence and why hidden data can produce mixed risk signals.",
  alternates: { canonical: "/steam-profile-private-vs-public" },
  keywords: [
    "private steam profile meaning",
    "public steam profile checker",
    "steam profile privacy trust score",
    "steam checker private profile",
    "steam profile transparency",
  ],
  openGraph: {
    title: "Private vs Public Steam Profiles: What Changes",
    description:
      "A practical guide to evaluating private versus public Steam profiles in competitive matches.",
    type: "article",
    url: "/steam-profile-private-vs-public",
    siteName: seoConfig.siteName,
    images: [seoConfig.ogImagePath],
  },
  twitter: {
    card: "summary_large_image",
    title: "Private vs Public Steam Profiles: What Changes",
    description:
      "A practical guide to evaluating private versus public Steam profiles in competitive matches.",
    images: [seoConfig.twitterImagePath],
  },
};

export default function SteamProfilePrivateVsPublicPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-4xl px-4 py-14">
        <h1 className="text-3xl font-black sm:text-4xl">Private vs Public Steam Profiles</h1>
        <p className="mt-4 text-white/70">
          Profile privacy affects how much confidence any checker can provide. If key signals are hidden, trust
          certainty naturally drops.
        </p>

        <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-xl font-bold">Why Visibility Matters</h2>
          <ul className="mt-3 space-y-2 text-sm text-white/75">
            <li>1. Public profiles expose more maturity signals.</li>
            <li>2. Private or limited profiles reduce available evidence.</li>
            <li>3. Reduced evidence can lead to mixed confidence outcomes.</li>
          </ul>
        </section>

        <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-xl font-bold">What To Do In Practice</h2>
          <ol className="mt-3 space-y-2 text-sm text-white/75">
            <li>1. Treat private profiles as incomplete data, not automatic guilt.</li>
            <li>2. Compare with gameplay evidence and team observations.</li>
            <li>3. Save and share result links so your squad uses the same context.</li>
          </ol>
        </section>

        <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-xl font-bold">Model Boundary</h2>
          <p className="mt-3 text-sm text-white/75">
            Steam Checker summarizes available public signals. It does not provide a cheating verdict.
          </p>
        </section>

        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href="/?utm_source=guide&utm_medium=internal&utm_campaign=privacy_guide"
            className="rounded-xl bg-white px-5 py-3 text-sm font-bold uppercase tracking-wide text-black transition hover:bg-white/90"
          >
            Check A Profile Now
          </a>
          <Link
            href="/how-trust-score-works"
            className="rounded-xl border border-white/20 px-5 py-3 text-sm font-semibold uppercase tracking-wide text-white/80 transition hover:bg-white/10 hover:text-white"
          >
            Back To Scoring Guide
          </Link>
        </div>
      </div>
    </main>
  );
}
