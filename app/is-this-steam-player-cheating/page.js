import Link from "next/link";
import { getSiteUrl, seoConfig } from "../seo";

export const metadata = {
    title: "Is This Steam Player Cheating?",
    description:
        "How to gather profile context after a suspicious kill instead of guessing. Use public Steam signals like account age, bans, and library depth to make informed decisions.",
    alternates: { canonical: "/is-this-steam-player-cheating" },
    keywords: [
        "is this steam player cheating",
        "steam cheater",
        "how to tell if steam player is cheating",
        "is he cheating steam",
        "steam hacker check",
        "suspicious steam player",
        "steam cheater check",
    ],
    openGraph: {
        title: "Is This Steam Player Cheating? | Steam Checker",
        description:
            "Stop guessing. Gather real context from public Steam profile signals after a suspicious kill.",
        type: "article",
        url: "/is-this-steam-player-cheating",
        siteName: seoConfig.siteName,
        images: [seoConfig.ogImagePath],
    },
    twitter: {
        card: "summary_large_image",
        title: "Is This Steam Player Cheating? | Steam Checker",
        description:
            "Stop guessing. Gather real context from public Steam profile signals after a suspicious kill.",
        images: [seoConfig.twitterImagePath],
    },
};

export default function IsThisSteamPlayerCheatingPage() {
    const siteUrl = getSiteUrl();

    const breadcrumbLd = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: `${siteUrl}/` },
            { "@type": "ListItem", position: 2, name: "Is This Steam Player Cheating?", item: `${siteUrl}/is-this-steam-player-cheating` },
        ],
    };

    const faqLd = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: [
            {
                "@type": "Question",
                name: "Can Steam Checker tell me if someone is cheating?",
                acceptedAnswer: { "@type": "Answer", text: "No. Steam Checker is not an anti-cheat. It summarizes public profile signals so you can evaluate the risk level of an account yourself, not issue a verdict." },
            },
            {
                "@type": "Question",
                name: "What are the signs of a suspicious Steam profile?",
                acceptedAnswer: { "@type": "Answer", text: "Red flags include: very new account (under 30 days), past VAC or game bans, very few games owned, no friends, private profile, and low Steam level. These signals combined paint a clearer picture." },
            },
            {
                "@type": "Question",
                name: "Should I report based on the trust score?",
                acceptedAnswer: { "@type": "Answer", text: "Report based on in-game behavior, not external tools. Steam Checker gives context to help you process what happened, but the in-game report system is for cheating behavior you witnessed." },
            },
            {
                "@type": "Question",
                name: "What should I do after checking a profile?",
                acceptedAnswer: { "@type": "Answer", text: "Share the results with your squad, discuss what happened, and move on to the next match. The goal is fast closure, not extended frustration." },
            },
        ],
    };

    return (
        <main className="min-h-screen bg-black text-white">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />

            <div className="mx-auto max-w-4xl px-4 py-14">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-400">The Question Every Gamer Asks</p>
                <h1 className="mt-3 text-3xl font-black sm:text-4xl">Is This Steam Player Cheating?</h1>
                <p className="mt-4 max-w-3xl text-white/70">
                    You just got destroyed in under a second. All headshots. No time to react. Your squad is tilted and
                    someone says what everyone's thinking: "That guy's cheating." But is he? Here's how to stop guessing
                    and start getting context.
                </p>

                <section className="mt-10 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                    <h2 className="text-xl font-bold">The Problem With Guessing</h2>
                    <p className="mt-3 text-sm text-white/70 leading-relaxed">
                        In high-skill competitive games, the line between "cracked player" and "cheater" is razor thin from
                        the receiving end. Aim-assist, wallhacks, and aimbots produce kills that <em>can</em> look like
                        legitimate high-skill plays. And legitimate high-skill plays <em>can</em> look like cheats.
                    </p>
                    <p className="mt-3 text-sm text-white/70 leading-relaxed">
                        Without context, you're flipping a coin. That's frustrating. And it leads to two bad outcomes: either
                        you accuse a legit player, or you brush off a real cheater and keep queuing into them.
                    </p>
                </section>

                <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                    <h2 className="text-xl font-bold">Context Over Accusations</h2>
                    <p className="mt-3 text-sm text-white/70 leading-relaxed">
                        Steam Checker doesn't tell you if someone is cheating. No external tool can do that reliably.
                        What it does is give you fast context from publicly available Steam profile data:
                    </p>
                    <ul className="mt-4 space-y-2 text-sm text-white/70">
                        <li>• <strong>Account age:</strong> Was this account created 2 days ago or 8 years ago?</li>
                        <li>• <strong>Ban history:</strong> Do they have previous VAC or game bans?</li>
                        <li>• <strong>Library depth:</strong> Do they own 200 games or just the one you're playing?</li>
                        <li>• <strong>Social footprint:</strong> Do they have friends, a Steam level, community activity?</li>
                        <li>• <strong>Game hours:</strong> Have they played 2,000 hours of the game or 3?</li>
                    </ul>
                    <p className="mt-4 text-sm text-white/70 leading-relaxed">
                        A 7-year account with 300 games and 2,000 hours in your title is probably just cracked. A 3-day
                        account with 1 game and no friends? That's context worth having.
                    </p>
                </section>

                <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                    <h2 className="text-xl font-bold">The Squad Workflow</h2>
                    <ol className="mt-4 space-y-3 text-sm text-white/70">
                        <li><strong>1.</strong> Get killed in a suspicious way. Grab the enemy's Steam profile.</li>
                        <li><strong>2.</strong> Paste it into Steam Checker. Takes 10 seconds.</li>
                        <li><strong>3.</strong> Read the trust score and signal breakdown.</li>
                        <li><strong>4.</strong> Share the result link with your squad in Discord.</li>
                        <li><strong>5.</strong> Align on what happened and re-queue with a clear head.</li>
                    </ol>
                </section>

                <section className="mt-10 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                    <h2 className="text-2xl font-bold">FAQ</h2>
                    <div className="mt-4 grid gap-3">
                        {[
                            { q: "Can Steam Checker tell me if someone is cheating?", a: "No. Steam Checker is not an anti-cheat. It summarizes public profile signals so you can evaluate the risk level of an account yourself, not issue a verdict." },
                            { q: "What are the signs of a suspicious Steam profile?", a: "Red flags include: very new account (under 30 days), past VAC or game bans, very few games owned, no friends, private profile, and low Steam level. These signals combined paint a clearer picture." },
                            { q: "Should I report based on the trust score?", a: "Report based on in-game behavior, not external tools. Steam Checker gives context to help you process what happened, but the in-game report system is for cheating behavior you witnessed." },
                            { q: "What should I do after checking a profile?", a: "Share the results with your squad, discuss what happened, and move on to the next match. The goal is fast closure, not extended frustration." },
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
                        href="/?utm_source=guide&utm_medium=internal&utm_campaign=is_player_cheating"
                        className="rounded-xl bg-white px-5 py-3 text-sm font-bold uppercase tracking-wide text-black transition hover:bg-white/90"
                    >
                        Check a Profile Now
                    </a>
                    <Link
                        href="/how-trust-score-works"
                        className="rounded-xl border border-white/20 px-5 py-3 text-sm font-semibold uppercase tracking-wide text-white/80 transition hover:bg-white/10 hover:text-white"
                    >
                        How Scoring Works
                    </Link>
                    <Link
                        href="/steam-vac-ban-context"
                        className="rounded-xl border border-white/20 px-5 py-3 text-sm font-semibold uppercase tracking-wide text-white/80 transition hover:bg-white/10 hover:text-white"
                    >
                        VAC Ban Context
                    </Link>
                </div>
            </div>
        </main>
    );
}
