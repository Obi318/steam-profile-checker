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

async function steamFetchJson(url) {
  const r = await fetch(url, { cache: "no-store" });
  const text = await r.text();

  let j;
  try {
    j = JSON.parse(text);
  } catch {
    throw new Error(`Steam returned non-JSON (HTTP ${r.status}).`);
  }

  if (!r.ok) throw new Error(`Steam HTTP ${r.status}.`);
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

  const j = await steamFetchJson(url);
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

  // Brazil as its own region
  if (c === "BR") return { code: "BR", label: "Brazil (BR)" };

  // CIS (Russia, Ukraine, nearby states)
  const CIS = new Set(["RU", "UA", "BY", "KZ", "AM", "AZ", "GE", "MD", "KG", "TJ", "TM", "UZ"]);
  if (CIS.has(c)) return { code: "CIS", label: "CIS (Russia, Ukraine, nearby states)" };

  // NA
  const NA = new Set(["US", "CA", "MX"]);
  if (NA.has(c)) return { code: "NA", label: "North America (NA)" };

  // LATAM (excluding MX, BR handled above)
  const LATAM = new Set([
    "AR",
    "BO",
    "CL",
    "CO",
    "CR",
    "CU",
    "DO",
    "EC",
    "SV",
    "GT",
    "HN",
    "NI",
    "PA",
    "PY",
    "PE",
    "PR",
    "UY",
    "VE",
    "GY",
    "SR",
    "BZ",
  ]);
  if (LATAM.has(c)) return { code: "LATAM", label: "Latin America (LATAM)" };

  // MENA
  const MENA = new Set([
    "AE",
    "BH",
    "DZ",
    "EG",
    "IL",
    "IQ",
    "IR",
    "JO",
    "KW",
    "LB",
    "LY",
    "MA",
    "OM",
    "PS",
    "QA",
    "SA",
    "SD",
    "SY",
    "TN",
    "TR",
    "YE",
  ]);
  if (MENA.has(c)) return { code: "MENA", label: "Middle East & North Africa (MENA)" };

  // EU (broad bucket; we’re not splitting EUW/EUNE in V1.1)
  const EU = new Set([
    "AL",
    "AD",
    "AT",
    "BA",
    "BE",
    "BG",
    "BY",
    "CH",
    "CY",
    "CZ",
    "DE",
    "DK",
    "EE",
    "ES",
    "FI",
    "FR",
    "GB",
    "GR",
    "HR",
    "HU",
    "IE",
    "IS",
    "IT",
    "LI",
    "LT",
    "LU",
    "LV",
    "MC",
    "MD",
    "ME",
    "MK",
    "MT",
    "NL",
    "NO",
    "PL",
    "PT",
    "RO",
    "RS",
    "SE",
    "SI",
    "SK",
    "SM",
    "UA",
    "VA",
  ]);
  // Note: UA is included above but CIS check happens first, so it’ll become CIS.
  if (EU.has(c)) return { code: "EU", label: "Europe (EU)" };

  // East Asia (sometimes separate)
  const EAST_ASIA = new Set(["JP", "KR", "CN", "TW", "HK", "MO"]);
  if (EAST_ASIA.has(c)) return { code: "EA", label: "East Asia (EA)" };

  // APAC (umbrella)
  const APAC = new Set([
    "AU",
    "NZ",
    "SG",
    "PH",
    "TH",
    "VN",
    "MY",
    "ID",
    "BN",
    "KH",
    "LA",
    "MM",
    "IN",
    "PK",
    "BD",
    "LK",
    "NP",
    "MN",
  ]);
  if (APAC.has(c)) return { code: "APAC", label: "Asia-Pacific (APAC)" };

  // If unknown, return null (don’t show)
  return null;
}

/* -----------------------------
   Trust score model (V1.1)
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

  // Age points: 0–60 (dominant)
  let agePoints = 0;
  if (ageDays >= 3650) agePoints = 62; // 10+ years (elite anchor)
  else if (ageDays >= 1825) agePoints = 50; // 5–10
  else if (ageDays >= 730) agePoints = 38; // 2–5
  else if (ageDays >= 180) agePoints = 22; // 6–24mo
  else if (ageDays >= 90) agePoints = 12; // 3–6mo
  else agePoints = 4; // <3mo

  return { ageDays, ageYears, ageText, agePoints };
}

function levelPoints(steamLevel) {
  // 0–18 (nice-to-have, not dominant)
  if (typeof steamLevel !== "number") return 0;
  if (steamLevel >= 50) return 18;
  if (steamLevel >= 25) return 15;
  if (steamLevel >= 10) return 8;
  if (steamLevel >= 1) return 3;
  return 0;
}

function transparencyPoints({ isProfilePublic, gamesCount }) {
  // 0–15
  let pts = 0;
  if (isProfilePublic === true) pts += 6;

  // “gamesCount available” = transparency signal
  if (typeof gamesCount === "number") pts += 9;

  return pts;
}

function vacPenalty(vacCount, daysSinceLastBan) {
  if (!vacCount || vacCount <= 0) return 0;

  // Time-decayed penalty: recent bans matter a lot more than old history.
  // Floors at a small penalty even if the ban was a long time ago.
  // daysSinceLastBan comes from Steam GetPlayerBans.
  const d = typeof daysSinceLastBan === "number" ? daysSinceLastBan : null;

  // Defaults if unknown recency
  let base = -18;

  if (d !== null) {
    if (d < 365) base = -35; // < 1y
    else if (d < 730) base = -30; // 1–2y
    else if (d < 1460) base = -24; // 2–4y
    else if (d < 2555) base = -16; // 4–7y
    else if (d < 3650) base = -10; // 7–10y
    else base = -5; // 10y+
  }

  // Multiple VAC bans are a heavier indicator than a one-off.
  // Each additional ban adds extra penalty, capped.
  const extra = Math.min(Math.max(vacCount - 1, 0) * 6, 18);

  return clamp(base - extra, -60, 0);
}

function gameBanPenalty(gameBanCount, daysSinceLastBan) {
  if (!gameBanCount || gameBanCount <= 0) return 0;

  const d = typeof daysSinceLastBan === "number" ? daysSinceLastBan : null;

  // Slightly lighter than VAC, but still meaningful.
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
  // 0 to -70
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
  // penalty is negative (or 0). Return a human-friendly impact label.
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
  const days =
    typeof bans.DaysSinceLastBan === "number" ? bans.DaysSinceLastBan : null;

  let approxDateISO = null;
  let approxYear = null;

  if (days !== null) {
    const dt = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    approxDateISO = dt.toISOString();
    approxYear = dt.getFullYear();
  }

  const hasAny =
    vac > 0 || game > 0 || community || (economy && economy !== "none");

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
  // Only used when user picks a game AND hours is known
  // Strongly penalize 0–10; mild penalty 10–20; 20+ no effect
  if (typeof hours !== "number") return 0;

  if (hours < 5) return -18; // prime sus
  if (hours < 10) return -12; // still sus
  if (hours < 20) return -6; // mild flag
  return 0; // 20+ no effect
}

function verdictFromScore(score) {
  if (score >= 95) return "CERTIFIED LEGIT";
  if (score >= 85) return "LIKELY LEGIT";
  if (score >= 70) return "PROBABLY LEGIT";
  if (score >= 50) return "MIXED SIGNALS";
  if (score >= 30) return "SUSPECT";
  return "HIGH RISK";
}

function buildExplanation({
  verdict,
  trustLevel,
  ageText,
  steamLevel,
  bans,
  gamesCount,
  isProfilePublic,
  selectedGameName,
  selectedGameHours,
  gameAdj,
}) {
  const parts = [];

  if (ageText) parts.push(`a ${ageText} account`);
  if (typeof steamLevel === "number") parts.push(`Steam level (${steamLevel})`);

  const hasAnyBan =
    bans &&
    ((bans.NumberOfVACBans ?? 0) > 0 ||
      (bans.NumberOfGameBans ?? 0) > 0 ||
      bans.CommunityBanned ||
      (bans.EconomyBan && bans.EconomyBan !== "none"));

  if (bans) parts.push(hasAnyBan ? "visible ban indicators" : "no visible bans");

  if (typeof gamesCount !== "number") {
    if (isProfilePublic === false) parts.push("private/limited game details");
  }

  if (selectedGameName && typeof selectedGameHours === "number") {
    parts.push(`${selectedGameHours} hrs in ${selectedGameName}${gameAdj < 0 ? " (low playtime)" : ""}`);
  }

  const core = parts.length ? parts.join(", ") : "limited public signals";
  return `This profile shows ${verdict === "HIGH RISK" || verdict === "SUSPECT" ? "risk" : "legitimacy"} signals — ${core}. Trust Score: ${trustLevel}/100.`;
}

function buildScoreSummary({
  signals,
  steamLevel,
  gamesCount,
  bans,
  selectedGameName,
  selectedGameHours,
}) {
  const bits = [];

  if (signals?.ageText) bits.push("Account age: " + signals.ageText);
  if (typeof steamLevel === "number") bits.push("Steam level: " + steamLevel);

  if (selectedGameName) {
    if (typeof selectedGameHours === "number") {
      bits.push(selectedGameName + " hours: " + selectedGameHours);
    } else {
      bits.push(selectedGameName + " hours: unavailable");
    }
  }

  if (bans) {
    const vac = bans.NumberOfVACBans ?? 0;
    const game = bans.NumberOfGameBans ?? 0;
    const hasAny =
      vac > 0 ||
      game > 0 ||
      !!bans.CommunityBanned ||
      (bans.EconomyBan && bans.EconomyBan !== "none");

    if (!hasAny) {
      bits.push("Ban indicators: none");
    } else {
      const days = typeof bans.DaysSinceLastBan === "number" ? bans.DaysSinceLastBan : null;
      const approx = days !== null ? new Date(Date.now() - days * 86400000).getFullYear() : null;
      bits.push(
        "Ban indicators: VAC " +
          vac +
          ", Game " +
          game +
          (approx ? `, last ban ~${approx}` : "")
      );
    }
  }

  if (typeof gamesCount === "number") bits.push("Games owned: " + gamesCount);

  return bits.length
    ? "Score breakdown — " + bits.join(" • ") + "."
    : "Score breakdown is limited by available public signals.";
}


function calcTrust({ createdAt, isProfilePublic, steamLevel, gamesCount, bans, selectedGameName, selectedGameHours }) {
  const age = computeAgeSignals(createdAt);
  const lvlPts = levelPoints(steamLevel);
  const trPts = transparencyPoints({ isProfilePublic, gamesCount });
  const banPen = banPenalty(bans);

  const gameAdj = selectedGameName ? gameHoursAdjustment(selectedGameHours) : 0;

  const veteranBonus =
    typeof age.ageDays === "number" &&
    age.ageDays >= 3650 &&
    typeof steamLevel === "number" &&
    steamLevel >= 20 &&
    bans &&
    bans.NumberOfVACBans === 0 &&
    bans.NumberOfGameBans === 0 &&
    bans.CommunityBanned === false
      ? 8
      : 0;

  let score = age.agePoints + lvlPts + trPts + banPen + gameAdj + veteranBonus;
  score = clamp(score, 0, 100);

  const verdict = verdictFromScore(score);

  return {
    trustLevel: score,
    verdict,
    signals: {
      ageText: age.ageText,
      ageYears: age.ageYears,
      ageDays: age.ageDays,
      points: {
        age: age.agePoints,
        level: lvlPts,
        transparency: trPts,
        banPenalty: banPen,
        gameHoursAdj: gameAdj,
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
  return null; // only allow the 4
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

  // URLs with scheme
  const urlRegex = /\b(https?:\/\/[^\s<>"']+)\b/gi;
  let m;
  while ((m = urlRegex.exec(text))) {
    const n = normalizeUrl(m[1]);
    if (n) hits.push(n);
  }

  // common bare patterns without scheme
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
  if (!r.ok) return null;
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

    // 1) Player summary
    const summaryUrl =
      `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?` +
      `key=${key}&steamids=${steamid}`;
    const summaryJ = await steamFetchJson(summaryUrl);
    const player = summaryJ?.response?.players?.[0];

    const personaName = player?.personaname ?? null;
    const profileUrl = player?.profileurl ?? null;
    const avatar = player?.avatarfull ?? null;
    const isProfilePublic = player ? player.communityvisibilitystate === 3 : null;
    const createdAt = player?.timecreated ? new Date(player.timecreated * 1000).toISOString() : null;

    // Region
    const locCountryCode = player?.loccountrycode ?? null;
    const region = regionFromCountryCode(locCountryCode);

    // “Currently playing” (Steam can expose this when in-game)
    const currentlyPlaying = player?.gameextrainfo
      ? {
          name: player.gameextrainfo,
          appid: player?.gameid ? Number(player.gameid) : null,
        }
      : null;

    // 2) Steam level
    let steamLevel = null;
    try {
      const levelUrl =
        `https://api.steampowered.com/IPlayerService/GetSteamLevel/v1/?` +
        `key=${key}&steamid=${steamid}`;
      const levelJ = await steamFetchJson(levelUrl);
      steamLevel = typeof levelJ?.response?.player_level === "number" ? levelJ.response.player_level : null;
    } catch {
      steamLevel = null;
    }

    // 3) Owned games count + optional hours for selected game
    let gamesCount = null;
    let selectedGameHours = null;

    try {
      // If we need hours, include appinfo list so we can locate the game by appid
      const includeAppInfo = !!selectedAppId;
      const gamesUrl =
        `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?` +
        `key=${key}&steamid=${steamid}&include_played_free_games=1` +
        (includeAppInfo ? `&include_appinfo=1` : "");

      const gamesJ = await steamFetchJson(gamesUrl);
      gamesCount = typeof gamesJ?.response?.game_count === "number" ? gamesJ.response.game_count : null;

      if (selectedAppId && Array.isArray(gamesJ?.response?.games)) {
        const appidNum = Number(selectedAppId);
        const found = gamesJ.response.games.find((g) => Number(g.appid) === appidNum);
        if (found && typeof found.playtime_forever === "number") {
          selectedGameHours = Math.round((found.playtime_forever / 60) * 10) / 10; // 0.1h precision
        }
      }
    } catch {
      gamesCount = null;
      selectedGameHours = null;
    }

    // 4) Bans
    let bans = null;
    try {
      const bansUrl =
        `https://api.steampowered.com/ISteamUser/GetPlayerBans/v1/?` +
        `key=${key}&steamids=${steamid}`;
      const bansJ = await steamFetchJson(bansUrl);
      bans = bansJ?.players?.[0] ?? null;
    } catch {
      bans = null;
    }

    // 5) Social links (best-effort)
    let socialLinks = [];
    try {
      const html = await fetchProfileHtml(profileUrl);
      const summaryText = extractProfileSummaryText(html);
      socialLinks = extractSocialLinksFromText(summaryText);

      // fallback: scan entire html if summary was empty
      if (!socialLinks.length && html) {
        socialLinks = extractSocialLinksFromText(html);
      }

      // Only keep 1 link per platform (Twitch / X / YouTube / Kick) and cap at 4
      socialLinks = uniqByLabel(socialLinks).slice(0, 4);
    } catch {
      socialLinks = [];
    }

    // Trust score
    const { trustLevel, verdict, signals, gameAdj } = calcTrust({
      createdAt,
      isProfilePublic,
      steamLevel,
      gamesCount,
      bans,
      selectedGameName,
      selectedGameHours,
    });

    const explanation = buildExplanation({
      verdict,
      trustLevel,
      ageText: signals?.ageText,
      steamLevel,
      bans,
      gamesCount,
      isProfilePublic,
      selectedGameName,
      selectedGameHours,
      gameAdj,
    });

    return NextResponse.json({
      steamid,
      personaName,
      profileUrl,
      avatar,

      isProfilePublic,

      createdAt,
      steamLevel,
      gamesCount,
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
      explanation,
      scoreSummary: buildScoreSummary({ signals, steamLevel, gamesCount, bans, selectedGameName, selectedGameHours }),
      signals,

      disclaimer:
        "Trust Score is a quick snapshot using public Steam signals (age, profile visibility, Steam level, bans, and optional game hours). Not a cheat detector.",
    });
  } catch (e) {
    return asJsonError(e?.message || "Unknown error", 400);
  }
}
