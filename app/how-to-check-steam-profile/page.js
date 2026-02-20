import Link from "next/link";
import { getSiteUrl, seoConfig } from "../seo";

export const metadata = {
    title: "How to Check a Steam Profile",
    description:
        "Step-by-step guide to checking any Steam profile for trust signals. Paste a profile URL into Steam Checker to get instant context on account age, bans, games, and friends.",
    alternates: { canonical: "/how-to-check-steam-profile" },
    keywords: [
        "how to check steam profile",
        "check steam profile",
        "steam profile lookup",
        "steam id checker",
        "steam profile search",
        "check steam account",
    ],
    openGraph: {
        title: "How to Check a Steam Profile | Steam Checker",
        description:
            "Fast step-by-step guide to checking any Steam profile for trust signals using Steam Checker.",
        type: "article",
        url: "/how-to-check-steam-profile",
        siteName: seoConfig.siteName,
        images: [seoConfig.ogImagePath],
    },
    twitter: {
        card: "summary_large_image",
        title: "How to Check a Steam Profile | Steam Checker",
        description:
            "Fast step-by-step guide to checking any Steam profile for trust signals using Steam Checker.",
        images: [seoConfig.twitterImagePath],
    },
};

export default function HowToCheckSteamProfilePage() {
    const siteUrl = getSiteUrl();

    const howToJsonLd = {
        "@context": "https://schema.org",
        "@type": "HowTo",
        name: "How to Check a Steam Profile for Trust Signals",
        description:
            "Use Steam Checker to get a fast trust snapshot of any public Steam profile after a suspicious kill.",
        totalTime: "PT30S",
        step: [
            {
                "@type": "HowToStep",
                name: "Find the Steam Profile",
                text: "After a suspicious death, go to the killer's Steam profile. Copy the profile URL, vanity name, or SteamID64 from the address bar.",
            },
            {
                "@type": "HowToStep",
                name: "Open Steam Checker",
                text: "Navigate to steamchecker.io in your browser. The search bar loads instantly.",
            },
            {
                "@type": "HowToStep",
                name: "Paste and Check",
                text: "Paste the profile URL into the search bar and click Check. The trust snapshot generates in seconds.",
            },
            {
                "@type": "HowToStep",
                name: "Read the Trust Signals",
                text: "Review the trust score, account age, ban record, games owned, friends count, and optional game hours.",
            },
            {
                "@type": "HowToStep",
                name: "Share With Your Squad",
                text: "Click Share Link or Copy Report to paste the result into Discord or team comms for instant squad alignment.",
            },
        ],
    };

    const breadcrumbLd = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: `${siteUrl}/` },
            { "@type": "ListItem", position: 2, name: "How to Check a Steam Profile", item: `${siteUrl}/how-to-check-steam-profile` },
        ],
    };

    const faqLd = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: [
            {
                "@type": "Question",
                name: "What do I need to check a Steam profile?",
                acceptedAnswer: { "@type": "Answer", text: "Just a Steam profile URL, vanity name, or SteamID64. Paste it into Steam Checker and you get results in seconds." },
            },
            {
                "@type": "Question",
                name: "Is this free?",
                acceptedAnswer: { "@type": "Answer", text: "Yes. Steam Checker trust snapshots are completely free for any public Steam profile." },
            },
            {
                "@type": "Question",
                name: "Does the player know I checked them?",
                acceptedAnswer: { "@type": "Answer", text: "No. Steam Checker reads publicly available Steam data. The profile owner is not notified." },
            },
        ],
    };

    return (
        <main className="min-h-screen bg-black text-white">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />

            <div className="mx-auto max-w-4xl px-4 py-14">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">Step-by-Step Guide</p>
                <h1 className="mt-3 text-3xl font-black sm:text-4xl">How to Check a Steam Profile</h1>
                <p className="mt-4 max-w-3xl text-white/70">
                    Got deleted instantly and something felt off? Here's exactly how to check the enemy's Steam profile
                    for trust signals in under 30 seconds — no accusations, just context.
                </p>

                <section className="mt-10 space-y-6">
                    {[
                        { step: "1", title: "Find the Steam Profile", body: "After a suspicious death, navigate to the killer's Steam profile. You can find it through the in-game scoreboard, recent players list, or kill feed. Copy the profile URL from your browser's address bar. You can also use their vanity name or SteamID64." },
                        { step: "2", title: "Open Steam Checker", body: "Go to steamchecker.io. The tool loads instantly — no sign-up, no account required. Just the search bar, ready to go." },
                        { step: "3", title: "Paste and Check", body: "Paste the profile URL, vanity name, or SteamID64 into the search bar. Optionally select a game from the dropdown for playtime context. Hit Check." },
                        { step: "4", title: "Read the Trust Signals", body: "In seconds, you get a trust score (0–100), a verdict label, and a full breakdown: account age, ban record, games owned, friends count, Steam level, and optional game hours. Each signal is tagged with a risk tier." },
                        { step: "5", title: "Share With Your Squad", body: "Click Copy Report for a text-formatted summary ready for Discord. Or hit Share Link for a direct URL your teammates can open to see the same results. Align fast, re-queue faster." },
                    ].map((item) => (
                        <div key={item.step} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                            <div className="flex items-start gap-4">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-black text-lg">
                                    {item.step}
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold">{item.title}</h2>
                                    <p className="mt-2 text-sm text-white/70 leading-relaxed">{item.body}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </section>

                <section className="mt-10 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                    <h2 className="text-2xl font-bold">FAQ</h2>
                    <div className="mt-4 grid gap-3">
                        {[
                            { q: "What do I need to check a Steam profile?", a: "Just a Steam profile URL, vanity name, or SteamID64. Paste it into Steam Checker and you get results in seconds." },
                            { q: "Is this free?", a: "Yes. Steam Checker trust snapshots are completely free for any public Steam profile." },
                            { q: "Does the player know I checked them?", a: "No. Steam Checker reads publicly available Steam data. The profile owner is not notified." },
                        ].map((item) => (
                            <article key={item.q} className="rounded-xl border border-white/10 bg-black/40 p-4">
                                <h3 className="font-semibold">{item.q}</h3>
                                <p className="mt-2 text-sm text-white/70">{item.a}</p>
                            </article>
                        ))}
                    </div>
                </section>

                <div className="mt-8 flex flex-wrap gap-3">
                    <a
                        href="/?utm_source=guide&utm_medium=internal&utm_campaign=how_to_check_profile"
                        className="rounded-xl bg-white px-5 py-3 text-sm font-bold uppercase tracking-wide text-black transition hover:bg-white/90"
                    >
                        Check a Steam Profile Now
                    </a>
                    <Link
                        href="/how-trust-score-works"
                        className="rounded-xl border border-white/20 px-5 py-3 text-sm font-semibold uppercase tracking-wide text-white/80 transition hover:bg-white/10 hover:text-white"
                    >
                        How Scoring Works
                    </Link>
                </div>
            </div>
        </main>
    );
}
