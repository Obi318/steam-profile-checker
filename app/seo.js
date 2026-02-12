const DEFAULT_SITE_URL = "https://steamchecker.io";

export function getSiteUrl() {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) {
    if (/^https?:\/\//i.test(explicit)) return explicit;
    return `https://${explicit}`;
  }

  const vercelProd = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercelProd) return `https://${vercelProd}`;

  return DEFAULT_SITE_URL;
}

export const seoConfig = {
  siteName: "Steam Profile Checker",
  titleDefault: "Steam Profile Checker | Trust & Reputation Score",
  titleTemplate: "%s | Steam Profile Checker",
  description:
    "Check any Steam profile instantly. Get a Trust Score based on account age, ban indicators, and transparency signals. The fastest CS2 and Steam reputation checker.",
  ogImagePath: "/opengraph-image.png",
  twitterImagePath: "/twitter-image.png",
  keywords: [
    "steam profile checker",
    "steam trust score",
    "cs2 profile checker",
    "cs2 trust score",
    "steam account checker",
    "steam profile trust",
    "steam ban checker",
    "steam vac checker",
    "steam account legitimacy",
    "steam trading scam check",
    "is this steam profile legit",
    "steam scammed check",
    "check steam id",
  ],
};
