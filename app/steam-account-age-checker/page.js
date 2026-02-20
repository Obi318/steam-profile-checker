import Link from "next/link";
import { getSiteUrl, seoConfig } from "../seo";

export const metadata = {
    title: "Steam Account Age Checker",
    description:
        "Check how old a Steam account is. Account age is the strongest trust signal — new accounts with thin profiles are higher risk after suspicious kills.",
    alternates: { canonical: "/steam-account-age-checker" },
    keywords: [
        "steam account age checker",
        "check steam account age",
        "how old is steam account",
        "steam account creation date",
        "steam profile age",
        "when was steam account created",
    ],
    openGraph: {
        title: "Steam Account Age Checker | Steam Checker",
        description:
            "Check when a Steam account was created. Account age is the strongest signal for evaluating suspicious profiles.",
        type: "article",
        url: "/steam-account-age-checker",
        siteName: seoConfig.siteName,
        images: [seoConfig.ogImagePath],
    },
    twitter: {
        card: "summary_large_image",
        title: "Steam Account Age Checker | Steam Checker",
        description:
            "Check when a Steam account was created. Account age is the strongest signal for evaluating suspicious profiles.",
        images: [seoConfig.twitterImagePath],
    },
};

export default function SteamAccountAgeCheckerPage() {
    const siteUrl = getSiteUrl();

    const breadcrumbLd = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: `${siteUrl}/` },
            { "@type": "ListItem", position: 2, name: "Steam Account Age Checker", item: `${siteUrl}/steam-account-age-checker` },
        ],
    };

    const faqLd = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: [
            {
                "@type": "Question",
                name: "How do I check how old a Steam account is?",
                acceptedAnswer: { "@type": "Answer", text: "Paste a Steam profile URL into Steam Checker. The trust snapshot includes the account creation date and account age in the signal breakdown." },
            },
            {
                "@type": "Question",
                name: "Why does account age matter?",
                acceptedAnswer: { "@type": "Answer", text: "Account age is the strongest stability signal. Brand-new accounts (under 30 days) are the highest risk because cheaters frequently create throwaway accounts." },
            },
            {
                "@type": "Question",
                name: "Can I see the exact creation date?",
                acceptedAnswer: { "@type": "Answer", text: "Yes. Steam Checker shows the creation date when the profile is public, along with how many days old the account is." },
            },
        ],
    };

    return (
        <main className="min-h-screen bg-black text-white">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />

            <div className="mx-auto max-w-4xl px-4 py-14">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">Trust Signal Deep Dive</p>
                <h1 className="mt-3 text-3xl font-black sm:text-4xl">Steam Account Age Checker</h1>
                <p className="mt-4 max-w-3xl text-white/70">
                    Account age is the single most important trust signal in Steam Checker's model. A 10-year-old account
                    with hundreds of games tells a completely different story than a 3-day-old account with one game. Here's
                    why it matters and how to check it fast.
                </p>

                <section className="mt-10 grid gap-5 md:grid-cols-3">
                    <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                        <h2 className="text-lg font-bold text-red-400">🔴 Under 30 Days</h2>
                        <p className="mt-2 text-sm text-white/70">
                            Brand-new accounts are the highest risk. Cheaters create fresh accounts to avoid bans on their
                            main. If someone dominated your squad and their account is days old — that's your context.
                        </p>
                    </article>
                    <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                        <h2 className="text-lg font-bold text-yellow-400">🟡 Under 1 Year</h2>
                        <p className="mt-2 text-sm text-white/70">
                            Young accounts aren't proof of anything, but combined with thin libraries and few friends, they
                            move the needle toward caution. More context is needed.
                        </p>
                    </article>
                    <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                        <h2 className="text-lg font-bold text-emerald-400">🟢 1+ Years</h2>
                        <p className="mt-2 text-sm text-white/70">
                            Older accounts with clean records generally trend toward trust. Years of investment make burner
                            behavior less likely, though context always matters.
                        </p>
                    </article>
                </section>

                <section className="mt-10 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                    <h2 className="text-xl font-bold">Why Account Age Is the Strongest Signal</h2>
                    <ul className="mt-4 space-y-3 text-sm text-white/70 leading-relaxed">
                        <li><strong>Investment proxy:</strong> Years of Steam activity, game purchases, and community engagement are hard to fake quickly.</li>
                        <li><strong>Ban evasion tells:</strong> Cheaters who get VAC banned frequently make new accounts to continue. These accounts are inevitably young.</li>
                        <li><strong>Stability indicator:</strong> A 5-year account that just started playing your game is very different from a 2-day account doing the same thing.</li>
                        <li><strong>Combined weight:</strong> Account age works best alongside other signals. A young account with many games and friends is less concerning than a young empty one.</li>
                    </ul>
                </section>

                <section className="mt-10 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                    <h2 className="text-2xl font-bold">FAQ</h2>
                    <div className="mt-4 grid gap-3">
                        {[
                            { q: "How do I check how old a Steam account is?", a: "Paste a Steam profile URL into Steam Checker. The trust snapshot includes the account creation date and account age in the signal breakdown." },
                            { q: "Why does account age matter?", a: "Account age is the strongest stability signal. Brand-new accounts (under 30 days) are the highest risk because cheaters frequently create throwaway accounts." },
                            { q: "Can I see the exact creation date?", a: "Yes. Steam Checker shows the creation date when the profile is public, along with how many days old the account is." },
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
                        href="/?utm_source=guide&utm_medium=internal&utm_campaign=account_age_checker"
                        className="rounded-xl bg-white px-5 py-3 text-sm font-bold uppercase tracking-wide text-black transition hover:bg-white/90"
                    >
                        Check Account Age Now
                    </a>
                    <Link
                        href="/how-trust-score-works"
                        className="rounded-xl border border-white/20 px-5 py-3 text-sm font-semibold uppercase tracking-wide text-white/80 transition hover:bg-white/10 hover:text-white"
                    >
                        All Trust Signals
                    </Link>
                </div>
            </div>
        </main>
    );
}
