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
  siteName: "Steam Checker",
  titleDefault: "Steam Checker | Suspicious Kill Context in Seconds",
  titleTemplate: "%s | Steam Checker",
  description:
    "Got deleted instantly and it felt off? Steam Checker gives a fast trust snapshot using public Steam signals like account age, bans, games owned, friends, and optional game hours.",
  ogImagePath: "/opengraph-image.png",
  twitterImagePath: "/twitter-image.png",
  keywords: [
    "steam profile checker",
    "steam checker",
    "steam trust score",
    "suspicious kill checker",
    "is he cheating",
    "cs2 cheater check",
    "arc raiders suspicious kill",
    "cod cheater check",
    "steam account age",
    "steam ban checker",
    "vac ban check",
    "steam profile risk check",
    "steam id lookup",
    "steam reputation",
    "steam report helper",
    "check steam id",
    "steam calculator",
    "faceit finder alternative",
    "steam account checker",
    "is this steam profile legit",
    "steam cheater lookup",
    "steam profile age check",
    "suspicious steam account",
    "steam ban checker tool",
    "check steam player",
    "steam profile scanner",
    "deadlock steam checker",
    "pubg steam profile check",
    "apex legends steam checker",
    "rust cheater check steam",
    "the finals steam checker",
    "how to check steam profile",
    "steam account age checker",
    "is this steam player cheating",
    "steam profile trust check",
    "how old is steam account",
    "steam profile legitimacy check",
    "steam account risk assessment",
    "check if steam player is legit",
    "rainbow six siege steam checker",
    "overwatch 2 steam profile check",
  ],
};
