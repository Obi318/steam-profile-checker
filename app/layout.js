import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { getSiteUrl, seoConfig } from "./seo";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = getSiteUrl();

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: seoConfig.titleDefault,
    template: seoConfig.titleTemplate,
  },
  description: seoConfig.description,
  applicationName: seoConfig.siteName,
  keywords: seoConfig.keywords,
  authors: [{ name: "Steven Negron" }],
  creator: "Steven Negron",
  publisher: seoConfig.siteName,
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    url: "/",
    title: seoConfig.titleDefault,
    description: seoConfig.description,
    siteName: seoConfig.siteName,
    images: [
      {
        url: seoConfig.ogImagePath,
        width: 1200,
        height: 630,
        alt: seoConfig.siteName,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: seoConfig.titleDefault,
    description: seoConfig.description,
    images: [seoConfig.twitterImagePath],
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({ children }) {
  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: seoConfig.siteName,
    description: seoConfig.description,
    url: siteUrl,
  };

  const softwareJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: seoConfig.siteName,
    description: seoConfig.description,
    applicationCategory: "Utility",
    operatingSystem: "Web",
    url: siteUrl,
    author: {
      "@type": "Person",
      name: "Steven Negron",
    },
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };

  const searchActionJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    url: siteUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteUrl}/?id={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What is this Trust Score?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "A reality check on whether a player is sus or just cracked. We analyze account age, bans, library depth, and friends to spot red flags.",
        },
      },
      {
        "@type": "Question",
        name: "Does this detect cheats?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "We aren't an anti-cheat. We reveal the likelihood of a burner account. If they have a 2-day old account, 1 game, and no friends, you know the deal.",
        },
      },
      {
        "@type": "Question",
        name: "What can I check?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Paste their Steam profile URL, custom ID, or SteamID64. We'll pull the public data instantly.",
        },
      },
      {
        "@type": "Question",
        name: "Is this official?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "No. We are an independent tool for gamers who want peace of mind after a suspicious death.",
        },
      },
      {
        "@type": "Question",
        name: "Why is the score low with no bans?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Private profiles are suspicious. If they hide their hours, friends, and games, they're hiding something. Real players usually have nothing to hide.",
        },
      },
    ],
  };

  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(searchActionJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-black text-white min-h-screen`}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
