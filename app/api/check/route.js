import { NextResponse } from "next/server";

/**
 * Steam Profile Checker — API Route
 * Path: app/api/check/route.js
 *
 * Expects JSON body:
 * {
 *   input: string,                 // steamcommunity URL, vanity name, or 17-digit steamid64
 *   selectedAppId?: number|null,   // optional game appid for hours lookup
 *   selectedGameName?: string|null // optional game name for display/explanation
 * }
 */

function asJsonError(message, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

class SteamApiError extends Error {
  constructor(message, status, endpoint) {
    super(message);
    this.name = "SteamApiError";
    this.status = status;
    this.endpoint = endpoint;
  }
}

const CACHE_TTL_MS = 5 * 60 * 1000;
const resultCache = new Map();

function cacheKey({ steamid, selectedAppId }) {
  return `${steamid}:${selectedAppId ? Number(selectedAppId) : "none"}`;
}

function getCachedResult(key) {
  const hit = resultCache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.ts > CACHE_TTL_MS) {
    resultCache.delete(key);
    return null;
  }
  return hit.payload;
}

function setCachedResult(key, payload) {
  if (resultCache.size > 500) {
    const firstKey = resultCache.keys().next().value;
    if (firstKey) resultCache.delete(firstKey);
  }
  resultCache.set(key, { ts: Date.now(), payload });
}

function mapSteamErrorToClient(err) {
  if (!(err instanceof SteamApiError)) return null;
  if (err.status === 429) {
    return {
      status: 429,
      message: "Steam is rate-limiting requests right now. Please retry in about 30-60 seconds.",
    };
  }
  if (err.status >= 500) {
    return {
      status: 503,
      message: "Steam is temporarily unavailable. Please retry in a minute.",
    };
  }
  return {
    status: 502,
    message: "Steam returned an unexpected response. Please retry shortly.",
  };
}

function isLikelySteamId(s) {
  return /^\d{17}$/.test(s);
}

function extractFromSteamUrl(url) {
  // Supports:
  // https://steamcommunity.com/id/NAME/
  // https://steamcommunity.com/profiles/STEAMID/
  const m1 = url.match(/steamcommunity\.com\/id\/([^/]+)/i);
  if (m1) return { type: "vanity", value: m1[1] };

  const m2 = url.match(/steamcommunity\.com\/profiles\/(\d{17})/i);
  if (m2) return { type: "steamid", value: m2[1] };

  return null;
}

async function steamFetchJson(url, endpoint = "Steam API") {
  const r = await fetch(url, { cache: "no-store" });
  const text = await r.text();

  let j;
  try {
    j = JSON.parse(text);
  } catch {
    throw new SteamApiError(`${endpoint} returned non-JSON (HTTP ${r.status}).`, r.status, endpoint);
  }

  if (!r.ok) throw new SteamApiError(`${endpoint} HTTP ${r.status}.`, r.status, endpoint);
  return j;
}

async function resolveSteamId({ input, key }) {
  const trimmed = (input || "").trim();
  if (!trimmed) throw new Error("Please paste a Steam profile URL, vanity name, or SteamID64.");

  if (isLikelySteamId(trimmed)) return trimmed;

  const parsed = extractFromSteamUrl(trimmed);
  if (parsed?.type === "steamid") return parsed.value;

  const vanity = parsed?.type === "vanity" ? parsed.value : trimmed;

  const url =
    `https://api.steampowered.com/ISteamUser/ResolveVanityURL/v1/?` +
    `key=${key}&vanityurl=${encodeURIComponent(vanity)}`;

  const j = await steamFetchJson(url, "ResolveVanityURL");
  const steamid = j?.response?.steamid;
  if (!steamid) throw new Error("Could not resolve that input to a Steam profile.");
  return steamid;
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

/* -----------------------------
   Gaming region mapping
------------------------------ */

function regionFromCountryCode(cc) {
  if (!cc) return null;
  const c = String(cc).toUpperCase();

  if (c === "BR") return { code: "BR", label: "Brazil (BR)" };

  const CIS = new Set(["RU", "UA", "BY", "KZ", "AM", "AZ", "GE", "MD", "KG", "TJ", "TM", "UZ"]);
  if (CIS.has(c)) return { code: "CIS", label: "CIS (Russia, Ukraine, nearby states)" };

  const NA = new Set(["US", "CA", "MX"]);
  if (NA.has(c)) return { code: "NA", label: "North America (NA)" };

  const LATAM = new Set([
    "AR","BO","CL","CO","CR","CU","DO","EC","SV","GT","HN","NI","PA","PY","PE","PR","UY","VE","GY","SR","BZ",
  ]);
  if (LATAM.has(c)) return { code: "LATAM", label: "Latin America (LATAM)" };

  const MENA = new Set([
    "AE","BH","DZ","EG","IL","IQ","IR","JO","KW","LB","LY","MA","OM","PS","QA","SA","SD","SY","TN","TR","YE",
  ]);
  if (MENA.has(c)) return { code: "MENA", label: "Middle East & North Africa (MENA)" };

  const EU = new Set([
    "AL","AD","AT","BA","BE","BG","BY","CH","CY","CZ","DE","DK","EE","ES","FI","FR","GB","GR","HR","HU","IE",
    "IS","IT","LI","LT","LU","LV","MC","MD","ME","MK","MT","NL","NO","PL","PT","RO","RS","SE","SI","SK","SM",
    "UA","VA",
  ]);
  if (EU.has(c)) return { code: "EU", label: "Europe (EU)" };

  const EAST_ASIA = new Set(["JP", "KR", "CN", "TW", "HK", "MO"]);
  if (EAST_ASIA.has(c)) return { code: "EA", label: "East Asia (EA)" };

  const APAC = new Set(["AU","NZ","SG","PH","TH","VN","MY","ID","BN","KH","LA","MM","IN","PK","BD","LK","NP","MN"]);
  if (APAC.has(c)) return { code: "APAC", label: "Asia-Pacific (APAC)" };

  return null;
}

/* -----------------------------
   Trust score model
------------------------------ */

function computeAgeSignals(createdAt) {
  if (!createdAt) return { ageDays: null, ageYears: null, ageText: null, agePoints: 0 };

  const ageMs = Date.now() - new Date(createdAt).getTime();
  const ageDays = Math.floor(ageMs / (1000 * 60 * 60 * 24));
  const ageYears = Math.floor(ageDays / 365);

  let ageText;
  if (ageYears >= 1) ageText = `${ageYears} year${ageYears === 1 ? "" : "s"} old`;
  else {
    const months = Math.floor(ageDays / 30);
    ageText =
      months >= 1
        ? `${months} month${months === 1 ? "" : "s"} old`
        : `${ageDays} day${ageDays === 1 ? "" : "s"} old`;
  }

  // Age points: 0–62 (dominant anchor)
  let agePoints = 0;
  if (ageDays >= 3650) agePoints = 62; // 10+ years
  else if (ageDays >= 1825) agePoints = 50; // 5–10
  else if (ageDays >= 730) agePoints = 38; // 2–5
  else if (ageDays >= 180) agePoints = 22; // 6–24mo
  else if (ageDays >= 90) agePoints = 12; // 3–6mo
  else agePoints = 4; // <3mo

  return { ageDays, ageYears, ageText, agePoints };
}

function levelPoints(steamLevel) {
  // 0–9 (light signal)
  if (typeof steamLevel !== "number") return 0;
  if (steamLevel >= 50) return 9;
  if (steamLevel >= 25) return 7;
  if (steamLevel >= 10) return 4;
  if (steamLevel >= 1) return 2;
  return 0;
}

function friendsPoints(friendsCount) {
  // 0–9 (social footprint)
  if (typeof friendsCount !== "number") return 0;
  if (friendsCount >= 200) return 9;
  if (friendsCount >= 50) return 6;
  if (friendsCount >= 10) return 3;
  if (friendsCount >= 1) return 1;
  return 0;
}

function gamesOwnedPoints(gamesCount) {
  // 0–10 (library footprint)
  if (typeof gamesCount !== "number") return 0;
  if (gamesCount >= 200) return 10;
  if (gamesCount >= 50) return 7;
  if (gamesCount >= 10) return 4;
  if (gamesCount >= 4) return 2;
  return 0;
}

function vacPenalty(vacCount, daysSinceLastBan) {
  if (!vacCount || vacCount <= 0) return 0;

  const d = typeof daysSinceLastBan === "number" ? daysSinceLastBan : null;
  let base = -18;

  if (d !== null) {
    if (d < 365) base = -35;
    else if (d < 730) base = -30;
    else if (d < 1460) base = -24;
    else if (d < 2555) base = -16;
    else if (d < 3650) base = -10;
    else base = -5;
  }

  const extra = Math.min(Math.max(vacCount - 1, 0) * 6, 18);
  return clamp(base - extra, -60, 0);
}

function gameBanPenalty(gameBanCount, daysSinceLastBan) {
  if (!gameBanCount || gameBanCount <= 0) return 0;

  const d = typeof daysSinceLastBan === "number" ? daysSinceLastBan : null;

  let base = -14;
  if (d !== null) {
    if (d < 365) base = -24;
    else if (d < 730) base = -20;
    else if (d < 1460) base = -16;
    else if (d < 2555) base = -12;
    else if (d < 3650) base = -8;
    else base = -4;
  }

  const extra = Math.min(Math.max(gameBanCount - 1, 0) * 4, 12);
  return clamp(base - extra, -45, 0);
}

function banPenalty(bans) {
  if (!bans) return 0;

  const vacCount = bans.NumberOfVACBans ?? 0;
  const gameCount = bans.NumberOfGameBans ?? 0;
  const days = typeof bans.DaysSinceLastBan === "number" ? bans.DaysSinceLastBan : null;

  let pen = 0;
  pen += vacPenalty(vacCount, days);
  pen += gameBanPenalty(gameCount, days);

  if (bans.CommunityBanned) pen -= 15;
  if (bans.EconomyBan && bans.EconomyBan !== "none") pen -= 15;

  return clamp(pen, -70, 0);
}

function banImpactLabel(penalty) {
  if (typeof penalty !== "number" || penalty >= 0) return "None";
  if (penalty <= -30) return "Severe impact";
  if (penalty <= -20) return "High impact";
  if (penalty <= -10) return "Moderate impact";
  return "Low impact";
}

function banMeta(bans, penalty) {
  if (!bans) return null;

  const vac = bans.NumberOfVACBans ?? 0;
  const game = bans.NumberOfGameBans ?? 0;
  const community = !!bans.CommunityBanned;
  const economy = bans.EconomyBan ?? "none";
  const days = typeof bans.DaysSinceLastBan === "number" ? bans.DaysSinceLastBan : null;

  let approxDateISO = null;
  let approxYear = null;

  if (days !== null) {
    const dt = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    approxDateISO = dt.toISOString();
    approxYear = dt.getFullYear();
  }

  const hasAny = vac > 0 || game > 0 || community || (economy && economy !== "none");

  return {
    hasAny,
    vac,
    game,
    community,
    economy,
    daysSinceLastBan: days,
    lastBanApproxDate: approxDateISO,
    lastBanApproxYear: approxYear,
    penalty,
    impact: banImpactLabel(penalty),
  };
}

function gameHoursAdjustment(hours) {
  if (typeof hours !== "number") return 0;
  if (hours < 5) return -10;
  if (hours < 10) return -6;
  if (hours < 20) return -3;
  return 0;
}

function verdictFromScore(score) {
  if (score >= 95) return "CERTIFIED LEGIT";
  if (score >= 85) return "LIKELY LEGIT";
  if (score >= 70) return "PROBABLY LEGIT";
  if (score >= 50) return "MIXED SIGNALS";
  if (score >= 30) return "SUSPECT";
  return "HIGH RISK";
}

function buildScoreSummary({
  trustLevel,
  verdict,
  ageYears,
  bans,
  gamesCount,
  friendsCount,
  selectedGameName,
  selectedGameHours,
}) {
  if (trustLevel == null || verdict === "UNKNOWN") {
    return "Profile is locked down; not enough public signals to score. Proceed with caution.";
  }

  const hasAnyBan =
    bans &&
    ((bans.NumberOfVACBans ?? 0) > 0 ||
      (bans.NumberOfGameBans ?? 0) > 0 ||
      bans.CommunityBanned ||
      (bans.EconomyBan && bans.EconomyBan !== "none"));

  const reasons = [];

  if (typeof ageYears === "number") {
    if (ageYears >= 10) reasons.push("older account");
    else if (ageYears >= 5) reasons.push("established account age");
    else if (ageYears >= 2) reasons.push("some account history");
    else reasons.push("young account");
  }

  if (bans) {
    reasons.push(hasAnyBan ? "ban history present" : "clean ban history");
  }

  if (selectedGameName && typeof selectedGameHours === "number") {
    if (selectedGameHours < 10) reasons.push(`very low ${selectedGameName} hours`);
    else if (selectedGameHours < 20) reasons.push(`low ${selectedGameName} hours`);
    else if (selectedGameHours >= 100) reasons.push(`strong ${selectedGameName} playtime`);
    else reasons.push(`solid ${selectedGameName} playtime`);
  }

  if (typeof gamesCount === "number") {
    if (gamesCount >= 100) reasons.push("real game library");
    else if (gamesCount <= 3) reasons.push("tiny library");
    else reasons.push("some library footprint");
  }

  if (typeof friendsCount === "number") {
    if (friendsCount >= 50) reasons.push("social footprint");
    else if (friendsCount === 0) reasons.push("no visible friends");
  }

  const tone = trustLevel >= 70 ? "pos" : trustLevel >= 50 ? "mid" : "neg";
  const maxReasons = tone === "pos" ? 3 : 2;
  const picked = reasons.filter(Boolean).slice(0, maxReasons);

  if (!picked.length) return "Trust score is based on the available public signals.";

  if (tone === "neg") return `Several risk signals: ${picked.join(", ")}.`;
  if (tone === "mid") return `Mixed signals: ${picked.join(", ")}.`;
  return `Strong signals: ${picked.join(", ")}.`;
}

function calcTrust({
  createdAt,
  steamLevel,
  gamesCount,
  friendsCount,
  bans,
  selectedGameName,
  selectedGameHours,
}) {
  const age = computeAgeSignals(createdAt);

  const lvlPts = levelPoints(steamLevel);
  const frPts = friendsPoints(friendsCount);
  const libPts = gamesOwnedPoints(gamesCount);

  const banPen = banPenalty(bans);
  const gameAdj = selectedGameName ? gameHoursAdjustment(selectedGameHours) : 0;

  const hasAnyBan =
    bans &&
    ((bans.NumberOfVACBans ?? 0) > 0 ||
      (bans.NumberOfGameBans ?? 0) > 0 ||
      bans.CommunityBanned ||
      (bans.EconomyBan && bans.EconomyBan !== "none"));
  const cleanBans = !!bans && !hasAnyBan;
  const cleanBansBonus = cleanBans ? 14 : 0;

  let evidence = 0;
  if (typeof age.ageDays === "number") evidence += 1;
  if (typeof steamLevel === "number") evidence += 1;
  if (typeof gamesCount === "number") evidence += 1;
  if (typeof friendsCount === "number") evidence += 1;
  if (selectedGameName && typeof selectedGameHours === "number") evidence += 1;

  const limitedSignals = evidence === 0;

  const veteranBonus =
    typeof age.ageDays === "number" &&
    age.ageDays >= 3650 &&
    (banPen === 0 || banPen === -0) &&
    (typeof gamesCount === "number" ||
      typeof friendsCount === "number" ||
      typeof steamLevel === "number")
      ? 5
      : 0;

  if (limitedSignals && !hasAnyBan) {
    return {
      trustLevel: null,
      verdict: "UNKNOWN",
      signals: {
        ageText: age.ageText,
        ageYears: age.ageYears,
        ageDays: age.ageDays,
        friendsCount: typeof friendsCount === "number" ? friendsCount : null,
        points: {
          age: age.agePoints,
          banPenalty: banPen,
          cleanBansBonus,
          gameHoursAdj: gameAdj,
          gamesOwned: libPts,
          friends: frPts,
          level: lvlPts,
          veteranBonus: 0,
        },
        ban: banMeta(bans, banPen),
      },
      gameAdj,
    };
  }

  let score =
    age.agePoints + lvlPts + frPts + libPts + banPen + gameAdj + cleanBansBonus + veteranBonus;
  score = clamp(score, 0, 100);

  const verdict = verdictFromScore(score);

  return {
    trustLevel: score,
    verdict,
    signals: {
      ageText: age.ageText,
      ageYears: age.ageYears,
      ageDays: age.ageDays,
      friendsCount: typeof friendsCount === "number" ? friendsCount : null,
      points: {
        age: age.agePoints,
        banPenalty: banPen,
        cleanBansBonus,
        gameHoursAdj: gameAdj,
        gamesOwned: libPts,
        friends: frPts,
        level: lvlPts,
        veteranBonus,
      },
      ban: banMeta(bans, banPen),
    },
    gameAdj,
  };
}

/* -----------------------------
   Social links (Twitch/YouTube/X/Kick only)
------------------------------ */

function normalizeUrl(u) {
  if (!u) return null;
  let url = u.trim();

  if (!/^https?:\/\//i.test(url) && /\./.test(url)) url = "https://" + url;
  url = url.replace(/[),.;]+$/g, "");

  try {
    const parsed = new URL(url);
    return parsed.toString();
  } catch {
    return null;
  }
}

function labelForHost(hostname) {
  const h = (hostname || "").toLowerCase();
  if (h.includes("twitch.tv")) return "Twitch";
  if (h.includes("youtube.com") || h.includes("youtu.be")) return "YouTube";
  if (h.includes("twitter.com") || h.includes("x.com")) return "X";
  if (h.includes("kick.com")) return "Kick";
  return null;
}

function uniqByUrl(arr) {
  const seen = new Set();
  const out = [];
  for (const x of arr) {
    if (!x?.url) continue;
    const key = x.url.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(x);
  }
  return out;
}

function uniqByLabel(arr) {
  const seen = new Set();
  const out = [];
  for (const x of arr) {
    if (!x?.label) continue;
    const k = String(x.label).toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(x);
  }
  return out;
}

function extractSocialLinksFromText(text) {
  if (!text) return [];

  const hits = [];

  const urlRegex = /\b(https?:\/\/[^\s<>"']+)\b/gi;
  let m;
  while ((m = urlRegex.exec(text))) {
    const n = normalizeUrl(m[1]);
    if (n) hits.push(n);
  }

  const bareRegex =
    /\b(twitch\.tv\/[^\s<>"']+|youtube\.com\/[^\s<>"']+|youtu\.be\/[^\s<>"']+|twitter\.com\/[^\s<>"']+|x\.com\/[^\s<>"']+|kick\.com\/[^\s<>"']+)\b/gi;

  while ((m = bareRegex.exec(text))) {
    const n = normalizeUrl(m[1]);
    if (n) hits.push(n);
  }

  const links = hits
    .map((u) => {
      try {
        const host = new URL(u).hostname;
        const label = labelForHost(host);
        if (!label) return null;
        return { label, url: u };
      } catch {
        return null;
      }
    })
    .filter(Boolean);

  return uniqByUrl(links);
}

async function fetchProfileHtml(profileUrl) {
  if (!profileUrl) return null;
  const url = profileUrl.includes("?") ? `${profileUrl}&l=english` : `${profileUrl}?l=english`;
  const r = await fetch(url, {
    cache: "no-store",
    headers: {
      "User-Agent": "Mozilla/5.0",
      "Accept-Language": "en-US,en;q=0.9",
    },
  });
  if (!r.ok) {
    if (r.status === 429 || r.status >= 500) {
      throw new SteamApiError("Steam profile page fetch failed.", r.status, "ProfileHtml");
    }
    return null;
  }
  return await r.text();
}

function extractProfileSummaryText(html) {
  if (!html) return "";
  const m = html.match(/<div[^>]+class="profile_summary"[^>]*>([\s\S]*?)<\/div>/i);
  const block = m ? m[1] : "";

  const text = block
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+\n/g, "\n")
    .replace(/\n\s+/g, "\n")
    .replace(/[ \t]+/g, " ")
    .trim();

  return text;
}

/* -----------------------------
   Main handler
------------------------------ */

export async function POST(req) {
  try {
    const key = process.env.STEAM_API_KEY;
    if (!key) return asJsonError("Missing STEAM_API_KEY in .env.local", 500);

    const body = await req.json().catch(() => ({}));
    const input = body?.input;
    const selectedAppId = body?.selectedAppId ?? null;
    const selectedGameName = body?.selectedGameName ?? null;

    const steamid = await resolveSteamId({ input, key });
    const ck = cacheKey({ steamid, selectedAppId });
    const cached = getCachedResult(ck);
    if (cached) return NextResponse.json({ ...cached, cache: "hit" });

    // 1) Player summary
    const summaryUrl =
      `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?` +
      `key=${key}&steamids=${steamid}`;
    const summaryJ = await steamFetchJson(summaryUrl, "GetPlayerSummaries");
    const player = summaryJ?.response?.players?.[0];

    const personaName = player?.personaname ?? null;
    const profileUrl = player?.profileurl ?? null;
    const avatar = player?.avatarfull ?? null;
    const isProfilePublic = player ? player.communityvisibilitystate === 3 : null;
    const createdAt = player?.timecreated ? new Date(player.timecreated * 1000).toISOString() : null;

    const locCountryCode = player?.loccountrycode ?? null;
    const region = regionFromCountryCode(locCountryCode);

    const currentlyPlaying = player?.gameextrainfo
      ? { name: player.gameextrainfo, appid: player?.gameid ? Number(player.gameid) : null }
      : null;

    // 2) Steam level
    let steamLevel = null;
    try {
      const levelUrl =
        `https://api.steampowered.com/IPlayerService/GetSteamLevel/v1/?` +
        `key=${key}&steamid=${steamid}`;
      const levelJ = await steamFetchJson(levelUrl, "GetSteamLevel");
      steamLevel = typeof levelJ?.response?.player_level === "number" ? levelJ.response.player_level : null;
    } catch (e) {
      if (e instanceof SteamApiError && (e.status === 429 || e.status >= 500)) throw e;
      steamLevel = null;
    }

    // 3) Owned games count + optional hours for selected game
    let gamesCount = null;
    let selectedGameHours = null;

    try {
      const includeAppInfo = !!selectedAppId;
      const gamesUrl =
        `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?` +
        `key=${key}&steamid=${steamid}&include_played_free_games=1` +
        (includeAppInfo ? `&include_appinfo=1` : "");

      const gamesJ = await steamFetchJson(gamesUrl, "GetOwnedGames");
      gamesCount = typeof gamesJ?.response?.game_count === "number" ? gamesJ.response.game_count : null;

      if (selectedAppId && Array.isArray(gamesJ?.response?.games)) {
        const appidNum = Number(selectedAppId);
        const found = gamesJ.response.games.find((g) => Number(g.appid) === appidNum);
        if (found && typeof found.playtime_forever === "number") {
          selectedGameHours = Math.round((found.playtime_forever / 60) * 10) / 10;
        }
      }
    } catch (e) {
      if (e instanceof SteamApiError && (e.status === 429 || e.status >= 500)) throw e;
      gamesCount = null;
      selectedGameHours = null;
    }

    // 3b) Friends count (best-effort; only works if friends list is public)
    let friendsCount = null;
    try {
      const friendsUrl =
        `https://api.steampowered.com/ISteamUser/GetFriendList/v1/?` +
        `key=${key}&steamid=${steamid}&relationship=friend`;
      const friendsJ = await steamFetchJson(friendsUrl, "GetFriendList");
      const friends = friendsJ?.friendslist?.friends;
      if (Array.isArray(friends)) friendsCount = friends.length;
    } catch (e) {
      if (e instanceof SteamApiError && (e.status === 429 || e.status >= 500)) throw e;
      friendsCount = null;
    }

    // 4) Bans
    let bans = null;
    try {
      const bansUrl =
        `https://api.steampowered.com/ISteamUser/GetPlayerBans/v1/?` +
        `key=${key}&steamids=${steamid}`;
      const bansJ = await steamFetchJson(bansUrl, "GetPlayerBans");
      bans = bansJ?.players?.[0] ?? null;
    } catch (e) {
      if (e instanceof SteamApiError && (e.status === 429 || e.status >= 500)) throw e;
      bans = null;
    }

    // Profile "openness" (display-only; does NOT affect Trust Score)
    let openness = "Private";
    if (isProfilePublic === false) {
      openness = "Private";
    } else if (isProfilePublic === true) {
      let possible = 0;
      let available = 0;

      possible += 1; if (createdAt) available += 1;
      possible += 1; if (bans) available += 1;
      possible += 1; if (typeof steamLevel === "number") available += 1;
      possible += 1; if (typeof gamesCount === "number") available += 1;
      possible += 1; if (typeof friendsCount === "number") available += 1;

      if (selectedAppId) {
        possible += 1;
        if (typeof selectedGameHours === "number") available += 1;
      }

      const ratio = possible ? available / possible : 0;
      if (ratio >= 0.75) openness = "Open";
      else if (ratio >= 0.25) openness = "Semi-Open";
      else openness = "Private";
    }

    // 5) Social links (best-effort)
    let socialLinks = [];
    try {
      const html = await fetchProfileHtml(profileUrl);
      const summaryText = extractProfileSummaryText(html);
      socialLinks = extractSocialLinksFromText(summaryText);

      if (!socialLinks.length && html) {
        socialLinks = extractSocialLinksFromText(html);
      }

      socialLinks = uniqByLabel(socialLinks).slice(0, 4);
    } catch {
      socialLinks = [];
    }

    const { trustLevel, verdict, signals, gameAdj } = calcTrust({
      createdAt,
      steamLevel,
      gamesCount,
      friendsCount,
      bans,
      selectedGameName,
      selectedGameHours,
    });

    const responsePayload = {
      steamid,
      personaName,
      profileUrl,
      avatar,

      isProfilePublic,
      openness,

      createdAt,
      steamLevel,
      gamesCount,
      friendsCount,
      bans,

      region,
      currentlyPlaying,

      selectedGame: selectedAppId
        ? {
            appid: Number(selectedAppId),
            name: selectedGameName ?? null,
            hours: typeof selectedGameHours === "number" ? selectedGameHours : null,
            adjustment: gameAdj,
          }
        : null,

      socialLinks,

      trustLevel,
      verdict,
      scoreSummary: buildScoreSummary({
        trustLevel,
        verdict,
        ageYears: signals?.ageYears ?? null,
        bans,
        gamesCount,
        friendsCount,
        selectedGameName,
        selectedGameHours,
      }),
      signals,

      disclaimer:
        "Trust Score is a quick snapshot using available Steam signals (account age, ban indicators, game library footprint, friends count, Steam level, and optional game hours). Not a cheat detector.",
    };

    setCachedResult(ck, responsePayload);
    return NextResponse.json({ ...responsePayload, cache: "miss" });
  } catch (e) {
    const mapped = mapSteamErrorToClient(e);
    if (mapped) return asJsonError(mapped.message, mapped.status);
    return asJsonError(e?.message || "Unknown error", 400);
  }
}
