import Link from "next/link";
import { notFound } from "next/navigation";
import { gameLandingPages, guidePages } from "../../marketing-data";
import { getSiteUrl, seoConfig } from "../../seo";

function getGameLanding(slug) {
  return gameLandingPages.find((entry) => entry.slug === slug) ?? null;
}

function faqForGame(gameName) {
  return [
    {
      q: `Does Steam Checker detect cheats in ${gameName}?`,
      a: "No. It summarizes public Steam account signals so you can evaluate profile risk faster.",
    },
    {
      q: "What should I paste into the checker?",
      a: "Use a Steam profile URL, vanity name, or SteamID64.",
    },
    {
      q: "Why include game context?",
      a: "Selecting a game can add playtime context, which can help explain whether the profile looks established in that title.",
    },
  ];
}

export function generateStaticParams() {
  return gameLandingPages.map((page) => ({ slug: page.slug }));
}

export function generateMetadata({ params }) {
  const page = getGameLanding(params.slug);
  if (!page) {
    return {
      title: "Steam Checker",
      description: seoConfig.description,
    };
  }

  const title = `${page.gameName} Steam Checker | Suspicious Kill Context`;
  const description = `${page.hero} Check account age, ban indicators, games owned, friends, and optional ${page.gameName} hours.`;

  return {
    title,
    description,
    alternates: { canonical: page.path },
    keywords: [
      page.keyword,
      `${page.gameName.toLowerCase()} suspicious kill`,
      `${page.gameName.toLowerCase()} cheater check`,
      "steam trust score",
      "steam profile checker",
    ],
    openGraph: {
      title,
      description,
      type: "article",
      url: page.path,
      siteName: seoConfig.siteName,
      images: [seoConfig.ogImagePath],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [seoConfig.twitterImagePath],
    },
  };
}

export default function GameLandingPage({ params }) {
  const page = getGameLanding(params.slug);
  if (!page) notFound();

  const ctaHref = `/?game=${page.appid}&utm_source=seo&utm_medium=game_landing&utm_campaign=${page.slug}`;
  const faq = faqForGame(page.gameName);
  const siteUrl = getSiteUrl();

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
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
        name: "Game Checker",
        item: `${siteUrl}${page.path}`,
      },
    ],
  };

  return (
    <main className="min-h-screen bg-black text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <div className="mx-auto max-w-5xl px-4 py-14">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
            Suspicious Kill Recovery Page
          </p>
          <h1 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">{page.hero}</h1>
          <p className="mt-5 max-w-3xl text-white/70">{page.pain}</p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={ctaHref}
              className="rounded-xl bg-white px-5 py-3 text-sm font-bold uppercase tracking-wide text-black transition hover:bg-white/90"
            >
              Open Steam Checker For {page.gameName}
            </a>
            <Link
              href="/how-trust-score-works"
              className="rounded-xl border border-white/20 px-5 py-3 text-sm font-semibold uppercase tracking-wide text-white/80 transition hover:bg-white/10 hover:text-white"
            >
              How Scoring Works
            </Link>
          </div>
        </div>

        <section className="mt-10 grid gap-5 md:grid-cols-3">
          <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="text-lg font-bold">Who This Helps</h2>
            <p className="mt-2 text-sm text-white/70">{page.audience}</p>
          </article>
          <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="text-lg font-bold">Signals You Get</h2>
            <p className="mt-2 text-sm text-white/70">
              Account age, bans, games owned, friends footprint, Steam level, and optional game-hour context.
            </p>
          </article>
          <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="text-lg font-bold">Positioning</h2>
            <p className="mt-2 text-sm text-white/70">
              Steam Checker is a context tool for competitive players, not an anti-cheat verdict engine.
            </p>
          </article>
        </section>

        <section className="mt-10 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
          <h2 className="text-2xl font-bold">Fast Loop For Competitive Squads</h2>
          <ol className="mt-4 space-y-2 text-sm text-white/75">
            <li>1. Get wiped in a suspicious fight and grab the enemy Steam profile.</li>
            <li>2. Run a Steam Checker trust snapshot in under 10 seconds.</li>
            <li>3. Share the result URL with your team to align quickly before re-queueing.</li>
          </ol>
        </section>

        <section className="mt-10 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
          <h2 className="text-2xl font-bold">FAQ</h2>
          <div className="mt-4 grid gap-3">
            {faq.map((item) => (
              <article key={item.q} className="rounded-xl border border-white/10 bg-black/40 p-4">
                <h3 className="font-semibold">{item.q}</h3>
                <p className="mt-2 text-sm text-white/70">{item.a}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-10 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
          <h2 className="text-2xl font-bold">Next Reads</h2>
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
      </div>
    </main>
  );
}
