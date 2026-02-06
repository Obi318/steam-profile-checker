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
  titleDefault: "Steam Profile Checker",
  titleTemplate: "%s | Steam Profile Checker",
  description:
    "Check a Steam profile fast with a trust-style score based on public signals like account age and ban indicators. Paste a Steam URL, vanity name, or SteamID64.",
  ogImagePath: "/opengraph-image.png",
  twitterImagePath: "/twitter-image.png",
  keywords: [
    "steam profile checker",
    "steam trust score",
    "steam account checker",
    "steam profile trust",
    "steam ban checker",
    "steam vac checker",
    "steam account legitimacy",
  ],
};
