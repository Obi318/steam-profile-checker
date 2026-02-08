"use client";

import { useEffect, useMemo, useState } from "react";

function isSteamishInput(s) {
  const t = (s || "").trim();
  if (!t) return false;
  if (/^\d{17}$/.test(t)) return true;
  if (/steamcommunity\.com\/(id|profiles)\//i.test(t)) return true;
  if (/^[a-zA-Z0-9_-]{2,64}$/.test(t)) return true;
  return false;
}

function formatShortDate(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { month: "short", day: "2-digit", year: "numeric" });
}

function verdictColorClass(verdict) {
  switch (verdict) {
    case "CERTIFIED LEGIT":
    case "LIKELY LEGIT":
      return "text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]";
    case "PROBABLY LEGIT":
      return "text-lime-300 drop-shadow-[0_0_8px_rgba(163,230,53,0.5)]";
    case "MIXED SIGNALS":
      return "text-yellow-300 drop-shadow-[0_0_8px_rgba(253,224,71,0.5)]";
    case "SUSPECT":
      return "text-orange-400 drop-shadow-[0_0_8px_rgba(251,146,60,0.5)]";
    case "HIGH RISK":
      return "text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]";
    case "UNKNOWN":
      return "text-orange-400";
    default:
      return "text-gray-200";
  }
}

function scoreBarVisuals(score) {
  if (score >= 85) return { color: "#34d399", glow: "rgba(52,211,153,0.6)" }; // emerald-400
  if (score >= 70) return { color: "#a3e635", glow: "rgba(163,230,53,0.6)" }; // lime-400
  if (score >= 50) return { color: "#fde047", glow: "rgba(253,224,71,0.6)" }; // yellow-300
  if (score >= 30) return { color: "#fb923c", glow: "rgba(251,146,60,0.6)" }; // orange-400
  return { color: "#ef4444", glow: "rgba(239,68,68,0.6)" }; // red-500
}

function socialButtonClass(label) {
  if (label === "Twitch") return "border-purple-500/30 text-purple-200 hover:bg-purple-500/20 hover:border-purple-400/50 hover:shadow-[0_0_15px_rgba(168,85,247,0.3)]";
  if (label === "YouTube") return "border-red-500/30 text-red-200 hover:bg-red-500/20 hover:border-red-400/50 hover:shadow-[0_0_15px_rgba(239,68,68,0.3)]";
  if (label === "X") return "border-slate-400/30 text-slate-200 hover:bg-slate-400/20 hover:border-slate-300/50 hover:shadow-[0_0_15px_rgba(148,163,184,0.3)]";
  if (label === "Kick") return "border-green-500/30 text-green-200 hover:bg-green-500/20 hover:border-green-400/50 hover:shadow-[0_0_15px_rgba(34,197,94,0.3)]";
  return "border-white/20 text-white/80 hover:bg-white/10";
}

/* -----------------------------
   Steam-y signal UI helpers
------------------------------ */

function Tag({ tier, children }) {
  const base =
    "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold backdrop-blur-md transition-all duration-300";

  const styles =
    tier === "good"
      ? "border-lime-500/30 bg-lime-500/10 text-lime-200 shadow-[0_0_10px_rgba(132,204,22,0.1)]"
      : tier === "warn"
        ? "border-yellow-500/30 bg-yellow-500/10 text-yellow-200 shadow-[0_0_10px_rgba(234,179,8,0.1)]"
        : tier === "bad"
          ? "border-red-500/30 bg-red-500/10 text-red-200 shadow-[0_0_10px_rgba(239,68,68,0.1)]"
          : "border-white/10 bg-white/5 text-white/60";

  return <span className={`${base} ${styles}`}>{children}</span>;
}

function SignalRow({ label, value, tier, note, rightHint }) {
  return (
    <div className="py-3 sm:py-4 border-b border-white/[0.06] last:border-b-0 group">
      <div className="flex items-center justify-between gap-4">
        <div className="text-white/70 font-medium text-sm sm:text-[15px] group-hover:text-white/90 transition-colors">{label}</div>
        <div className="text-white font-semibold text-sm sm:text-[15px] tracking-wide text-glow">{value}</div>
      </div>
      <div className="mt-2.5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <Tag tier={tier}>{note}</Tag>
        {rightHint ? (
          <div className="text-xs sm:text-sm text-white/40 sm:text-right italic">{rightHint}</div>
        ) : null}
      </div>
    </div>
  );
}

function tierForAccountAgeDays(days) {
  if (typeof days !== "number") return { tier: "neutral", note: "Unknown age", hint: "" };
  if (days < 30) return { tier: "bad", note: "Brand new (<30d)", hint: "High risk signal" };
  if (days < 180) return { tier: "warn", note: "Newish (<6mo)", hint: "Caution signal" };
  if (days < 365) return { tier: "warn", note: "Young (<1y)", hint: "Caution signal" };
  return { tier: "good", note: "Older account", hint: "Strong signal" };
}

function tierForSteamLevel(level) {
  if (typeof level !== "number") return { tier: "neutral", note: "Unknown level", hint: "" };
  if (level <= 5) return { tier: "warn", note: "Low Steam level", hint: "Mild risk" };
  if (level <= 15) return { tier: "warn", note: "Developing level", hint: "Neutral+" };
  return { tier: "good", note: "Established level", hint: "Good signal" };
}

function tierForGamesOwned(count) {
  if (typeof count !== "number") return { tier: "neutral", note: "Unknown library", hint: "" };
  if (count <= 3) return { tier: "bad", note: "Very few games", hint: "High risk signal" };
  if (count <= 10) return { tier: "warn", note: "Limited library", hint: "Caution signal" };
  return { tier: "good", note: "Healthy library", hint: "Good signal" };
}

function tierForFriends(count) {
  if (typeof count !== "number") return { tier: "neutral", note: "Unknown friends", hint: "" };
  if (count === 0) return { tier: "warn", note: "No visible friends", hint: "Context-dependent" };
  if (count < 10) return { tier: "warn", note: "Few friends", hint: "Mild signal" };
  if (count < 50) return { tier: "good", note: "Some friends", hint: "Good signal" };
  return { tier: "good", note: "Strong social footprint", hint: "Good signal" };
}

function tierForGameHours(hours) {
  if (hours == null) return { tier: "neutral", note: "Not checked", hint: "" };
  if (typeof hours !== "number") return { tier: "neutral", note: "Unavailable", hint: "" };
  if (hours < 10) return { tier: "bad", note: "Very low hours", hint: "High risk signal" };
  if (hours < 20) return { tier: "warn", note: "Low hours", hint: "Caution signal" };
  if (hours < 100) return { tier: "warn", note: "Moderate hours", hint: "Neutral+" };
  return { tier: "good", note: "High hours", hint: "Good signal" };
}

function tierForBans(bans, economyRelevant) {
  if (!bans) return { tier: "neutral", note: "Not available", hint: "" };

  const vac = bans.NumberOfVACBans ?? 0;
  const game = bans.NumberOfGameBans ?? 0;
  const community = !!bans.CommunityBanned;
  const economy = bans.EconomyBan ?? "none";

  const hasAny = vac > 0 || game > 0 || community || (economy && economy !== "none");

  if (!hasAny) return { tier: "good", note: "No bans shown", hint: "Good signal" };

  const days = typeof bans.DaysSinceLastBan === "number" ? bans.DaysSinceLastBan : null;
  const totalCore = vac + game;

  if (community) return { tier: "bad", note: "Community ban", hint: "Severe impact" };

  if (economy && economy !== "none") {
    return economyRelevant
      ? { tier: "bad", note: "Economy restriction", hint: "High impact" }
      : { tier: "warn", note: "Economy flag", hint: "Context-dependent" };
  }

  if (totalCore >= 2) {
    if (days === null) return { tier: "bad", note: "Multiple bans", hint: "High impact" };
    if (days < 730) return { tier: "bad", note: "Multiple bans (last 2y)", hint: "Severe impact" };
    if (days < 1825) return { tier: "bad", note: "Multiple bans (2-5y)", hint: "High impact" };
    if (days < 3650) return { tier: "warn", note: "Multiple bans (5-10y)", hint: "Moderate impact" };
    return { tier: "warn", note: "Multiple bans (10y+)", hint: "Low impact" };
  }

  if (days === null) return { tier: "warn", note: "Ban history", hint: "Unknown recency" };
  if (days < 730) return { tier: "bad", note: "Ban in last 2y", hint: "High impact" };
  if (days < 1825) return { tier: "warn", note: "Ban 2-5y ago", hint: "Moderate impact" };
  if (days < 3650) return { tier: "warn", note: "Old ban (5-10y)", hint: "Low impact" };
  return { tier: "neutral", note: "Very old ban (10y+)", hint: "Near-zero impact" };
}

const FAQ_ITEMS = [
  {
    question: "What is a Steam trust score?",
    answer:
      "It is a quick snapshot score based on public Steam signals like account age, ban indicators, library footprint, friends count, Steam level, and optional game hours.",
  },
  {
    question: "Does this check VAC bans?",
    answer:
      "Yes. If ban data is visible from Steam, VAC and game ban indicators are included in the score model and shown in the ban row.",
  },
  {
    question: "What can I paste into the checker?",
    answer:
      "You can paste a Steam profile URL, a vanity name, or a 17-digit SteamID64.",
  },
  {
    question: "Is this an official Steam tool?",
    answer:
      "No. It is an independent utility that reads public Steam data and summarizes it. It is not an anti-cheat detector.",
  },
  {
    question: "Why can a profile score lower even with no bans?",
    answer:
      "Missing public signals like private friends or game library visibility can reduce confidence, so scores may stay moderate even without ban history.",
  },
];

export default function HomePage() {
  const DEFAULT_PROFILE_URL = "https://steamcommunity.com/id/C9shroud/";

  const [input, setInput] = useState("");
  const [selectedAppId, setSelectedAppId] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [data, setData] = useState(null);
  const [shareHint, setShareHint] = useState("");

  // Add mount animation state
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const games = useMemo(() => {
    const list = [
      { name: "Apex Legends", appid: 1172470 },
      { name: "ARC Raiders", appid: 1808500 },
      { name: "Call of Duty®", appid: 1938090 },
      { name: "Counter-Strike 2", appid: 730 },
      { name: "Deadlock", appid: 1422450 },
      { name: "Destiny 2", appid: 1085660 },
      { name: "Dota 2", appid: 570 },
      { name: "Overwatch 2", appid: 2357570 },
      { name: "PUBG: BATTLEGROUNDS", appid: 578080 },
      { name: "Rust", appid: 252490 },
      { name: "Team Fortress 2", appid: 440 },
      { name: "The Finals", appid: 2073850 },
      { name: "Tom Clancy's Rainbow Six Siege", appid: 359550 },
    ];

    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  const selectedGame = useMemo(() => {
    if (!selectedAppId) return null;
    const id = Number(selectedAppId);
    return games.find((g) => g.appid === id) || null;
  }, [selectedAppId, games]);

  function buildShareUrl({ steamid, appid }) {
    if (typeof window === "undefined") return "";

    const u = new URL(window.location.href);
    u.searchParams.delete("q");
    u.searchParams.delete("id");
    u.searchParams.delete("game");

    if (steamid) u.searchParams.set("id", String(steamid));
    if (appid) u.searchParams.set("game", String(appid));

    return u.toString();
  }

  async function runCheck({ effectiveInput, appidOverride }) {
    setErr("");
    setData(null);

    if (!isSteamishInput(effectiveInput)) {
      setErr("Please enter a Steam community profile URL, vanity name, or a 17-digit SteamID64.");
      return;
    }

    const appidNum = appidOverride ? Number(appidOverride) : selectedGame?.appid ?? null;
    const gameName = appidNum ? games.find((g) => g.appid === appidNum)?.name ?? null : null;

    setLoading(true);
    try {
      const payload = {
        input: effectiveInput,
        selectedAppId: appidNum,
        selectedGameName: gameName,
      };

      const r = await fetch("/api/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        if (r.status === 429) {
          throw new Error("Steam is busy right now. Please wait about 30-60 seconds and try again.");
        }
        if (r.status >= 500) {
          throw new Error("Steam data is temporarily unavailable. Please retry in a minute.");
        }
        throw new Error(j?.error || `Request failed (${r.status})`);
      }

      setData(j);

      // Persist a stable permalink using SteamID64 once resolved.
      const shareUrl = buildShareUrl({ steamid: j?.steamid ?? null, appid: appidNum });
      if (shareUrl) window.history.replaceState(null, "", shareUrl);
    } catch (e) {
      setErr(e?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function onCheck() {
    const raw = (input || "").trim();
    const effectiveInput = raw ? raw : DEFAULT_PROFILE_URL;

    if (!raw) setInput(DEFAULT_PROFILE_URL);

    await runCheck({ effectiveInput, appidOverride: null });
  }

  async function onShare() {
    if (!data?.steamid) return;

    const url = buildShareUrl({ steamid: data.steamid, appid: selectedAppId || null });
    if (!url) return;

    setShareHint("");

    const handleSuccess = (msg) => {
      setShareHint(msg);
      setTimeout(() => setShareHint(""), 2500);
    };

    // 1. Try Native Share (Mobile/Supported)
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Steam Profile Checker",
          text: `Check out ${data.personaName}'s Steam Trust Score!`,
          url: url,
        });
        handleSuccess("Shared!");
        return;
      } catch (err) {
        // User cancelled or share failed, fall back to clipboard
      }
    }

    // 2. Try Clipboard API
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
        handleSuccess("Link Copied!");
        return;
      }
    } catch (err) {
      // Fallback to execCommand
    }

    // 3. Legacy Fallback
    try {
      const textArea = document.createElement("textarea");
      textArea.value = url;
      textArea.style.position = "fixed";
      textArea.style.left = "-9999px";
      textArea.style.top = "0";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand("copy");
      document.body.removeChild(textArea);
      if (successful) {
        handleSuccess("Link Copied!");
      } else {
        throw new Error();
      }
    } catch (err) {
      setShareHint("Copy failed");
      setTimeout(() => setShareHint(""), 2500);
    }
  }

  // Support share links like ?id=STEAMID64&game=730
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (data || loading) return;

    const sp = new URLSearchParams(window.location.search);
    const id = (sp.get("id") || sp.get("q") || "").trim();
    const game = (sp.get("game") || "").trim();

    if (!id) return;

    setInput(id);
    if (game) setSelectedAppId(game);

    // Run once on load if link is valid.
    if (isSteamishInput(id)) {
      runCheck({ effectiveInput: id, appidOverride: game || null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const score = data?.trustLevel ?? null;
  const hasScore = typeof score === "number";
  const scorePct = hasScore ? Math.max(0, Math.min(100, score)) : 0;
  const knobPct = hasScore ? Math.min(98, Math.max(2, scorePct)) : 0;
  const visuals = scoreBarVisuals(scorePct);

  const createdShort = formatShortDate(data?.createdAt);
  const regionLabel = data?.region?.label ?? null;

  const selectedHours =
    data?.selectedGame?.hours != null && data?.selectedGame?.name
      ? { name: data.selectedGame.name, hours: data.selectedGame.hours }
      : null;

  const bans = data?.bans || null;
  const friendsCount = typeof data?.friendsCount === "number" ? data.friendsCount : null;

  const coverage = useMemo(() => {
    // A lightweight "how much was visible" meter. This mirrors the API's idea of openness
    // but shows an explicit numerator/denominator to reduce confusion on private profiles.
    if (!data) return null;

    let possible = 0;
    let available = 0;

    possible += 1;
    if (data?.createdAt) available += 1;

    possible += 1;
    if (data?.bans) available += 1;

    possible += 1;
    if (typeof data?.steamLevel === "number") available += 1;

    possible += 1;
    if (typeof data?.gamesCount === "number") available += 1;

    possible += 1;
    if (typeof data?.friendsCount === "number") available += 1;

    if (selectedAppId) {
      possible += 1;
      if (typeof data?.selectedGame?.hours === "number") available += 1;
    }

    const pct = possible ? Math.round((available / possible) * 100) : 0;
    const label = pct >= 75 ? "Open" : pct >= 25 ? "Semi-Open" : "Private";

    return { possible, available, pct, label };
  }, [data, selectedAppId]);
  const openness = data?.openness ?? null;

  const scoreSummary = data?.scoreSummary ?? null;

  const ageTier = tierForAccountAgeDays(data?.signals?.ageDays ?? null);
  const levelTier = tierForSteamLevel(data?.steamLevel);
  const gamesTier = tierForGamesOwned(data?.gamesCount);
  const friendsTier = tierForFriends(friendsCount);
  const hoursTier = selectedGame
    ? tierForGameHours(data?.selectedGame?.hours ?? null)
    : { tier: "neutral", note: "No game selected", hint: "" };
  const bansTier = tierForBans(bans, selectedGame?.appid === 730);

  const banDisplay = useMemo(() => {
    if (!bans) return { value: "—", hint: "" };

    const vac = bans.NumberOfVACBans ?? 0;
    const game = bans.NumberOfGameBans ?? 0;
    const community = !!bans.CommunityBanned;
    const economy = bans.EconomyBan ?? "none";
    const days = typeof bans.DaysSinceLastBan === "number" ? bans.DaysSinceLastBan : null;

    const hasAny = vac > 0 || game > 0 || community || (economy && economy !== "none");
    if (!hasAny) return { value: "No visible bans", hint: "No penalty applied" };

    let approxYear = null;
    let yearsAgo = null;
    if (days !== null) {
      const dt = new Date(Date.now() - days * 86400000);
      approxYear = dt.getFullYear();
      yearsAgo = Math.round((days / 365) * 10) / 10;
    }

    const penalty = data?.signals?.ban?.penalty;
    const impact = data?.signals?.ban?.impact;

    const core = `VAC ${vac} • Game ${game}${community ? " • Community" : ""}`;
    const econShown =
      selectedGame?.appid === 730 && economy && economy !== "none" ? ` • Economy: ${economy}` : "";

    const when =
      approxYear ? ` • Last ban ~${approxYear}${yearsAgo !== null ? ` (~${yearsAgo}y ago)` : ""}` : "";
    const pen = typeof penalty === "number" && penalty < 0 ? ` • Penalty ${penalty} pts` : "";

    let why = "";
    if (impact && impact !== "None") {
      if (/Severe|High/i.test(impact)) {
        why = approxYear
          ? `Recent ban activity (last ~${approxYear}) significantly reduces trust.`
          : "Recent ban activity significantly reduces trust.";
      } else if (/Moderate/i.test(impact)) {
        why = approxYear
          ? `Older ban activity (last ~${approxYear}) reduces trust, but less than a recent ban.`
          : "Older ban activity reduces trust, but less than a recent ban.";
      } else {
        why = approxYear
          ? `Old/one-off ban signal (last ~${approxYear}) is a small trust hit.`
          : "Old/one-off ban signal is a small trust hit.";
      }
    }

    return {
      value: core + econShown + when + pen,
      hint: why,
    };
  }, [bans, data?.signals?.ban?.penalty, data?.signals?.ban?.impact, selectedGame?.appid]);

  // If not mounted yet to avoid hydration mismatch on random noise bg
  if (!mounted) return null;

  return (
    <main className="min-h-screen text-[15px] selection:bg-white/20 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full mix-blend-screen filter blur-[100px] opacity-30 animate-blob" />
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full mix-blend-screen filter blur-[100px] opacity-30 animate-blob animation-delay-2000" />
        <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-emerald-500/10 rounded-full mix-blend-screen filter blur-[100px] opacity-30 animate-blob animation-delay-4000" />
      </div>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:py-12 relative z-10">
        {/* Main Glass Card */}
        <div className="glass-card rounded-[32px] p-1 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)]">
          <div className="rounded-[28px] bg-black/40 p-6 sm:p-10 border border-white/[0.03]">
            <div className="pb-8 mb-6 border-b border-white/[0.08]">
              {/* Header */}
              <div className="relative">
                <div className="text-center space-y-4">
                  <h1 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-[0.3em] text-white drop-shadow-2xl">
                    Steam Checker
                  </h1>
                  <div className="text-xs sm:text-sm text-white/40 font-bold uppercase tracking-[0.2em] max-w-lg mx-auto leading-relaxed">
                    Instant trust analysis for any Steam account.
                  </div>
                </div>

                <div className="absolute right-0 top-1 hidden sm:flex items-center gap-2">
                  <div className="px-2.5 py-1 rounded-full bg-white/[0.07] border border-white/10 text-[10px] uppercase font-bold tracking-widest text-white/60 shadow-lg backdrop-blur-sm">
                    v1.1
                  </div>
                </div>
              </div>
            </div>

            {/* Input Section */}
            <div className="mb-8 space-y-6">
              <div className="relative group z-10">
                <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-lg" />
                <div className="relative flex flex-col sm:flex-row gap-4">
                  <input
                    className="w-full min-w-0 rounded-xl bg-white/[0.07] border-2 border-white/5 px-5 py-4 text-lg text-white placeholder:text-white/20 outline-none focus:border-white/20 focus:bg-white/10 transition-all font-medium backdrop-blur-sm shadow-inner"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Paste profile URL, SteamID64, or vanity name..."
                  />
                  <button
                    onClick={onCheck}
                    disabled={loading}
                    className="w-full sm:w-auto rounded-xl px-8 py-4 bg-white text-black font-bold text-lg hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:shadow-[0_0_30px_rgba(255,255,255,0.25)] transition-all active:scale-95"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                      </span>
                    ) : "Check"}
                  </button>
                </div>
              </div>

              {err ? (
                <div className="animate-in fade-in slide-in-from-top-2 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 text-sm font-medium flex gap-3 items-center">
                  <div className="h-2 w-2 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                  {err}
                </div>
              ) : null}

              {/* Game Context */}
              <div className="flex flex-col sm:flex-row items-baseline gap-4 pt-2">
                <label className="text-xs font-bold uppercase tracking-widest text-white/40">Optional Context</label>
                <div className="relative flex-1 w-full">
                  <select
                    className="w-full appearance-none rounded-lg bg-black/40 border border-white/10 px-4 py-2.5 text-sm text-white/80 outline-none focus:border-white/30 transition-colors cursor-pointer hover:bg-white/[0.07]"
                    value={selectedAppId}
                    onChange={(e) => setSelectedAppId(e.target.value)}
                  >
                    <option value="" className="bg-[#050505] text-white/50">Select a game for hour analysis...</option>
                    <option value="" className="bg-[#050505] text-white">None (Base Score)</option>
                    {games.map((g) => (
                      <option key={g.appid} value={String(g.appid)} className="bg-[#050505] text-white">
                        {g.name}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 opacity-50">
                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" className="stroke-white">
                      <path d="M1 1L5 5L9 1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Results Area */}
            {data ? (
              <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="grid gap-6 lg:gap-8 lg:grid-cols-2">

                  {/* LEFT: Identity & Score */}
                  <div className="space-y-6">
                    {/* Identity Card */}
                    <div className="glass-card hover:glass-card-hover rounded-2xl p-6 relative overflow-hidden group">
                      {/* Avatar & Name */}
                      <div className="flex items-start gap-5 relative z-10">
                        <div className="relative">
                          <img
                            src={data.avatar || ""}
                            alt=""
                            className="h-20 w-20 rounded-2xl border-2 border-white/10 shadow-2xl"
                          />
                          <div className={`absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-2 border-[#1a1a1a] ${openness === 'Private' ? 'bg-red-500' : openness === 'Semi-Open' ? 'bg-yellow-400' : 'bg-emerald-500'} shadow-[0_0_10px_rgba(0,0,0,0.5)]`} />
                        </div>

                        <div className="flex-1 min-w-0 pt-1">
                          <div className="flex items-center gap-3 mb-1">
                            <h2 className="text-2xl font-bold text-white truncate text-glow">{data.personaName}</h2>
                            {regionLabel && (
                              <span className="px-2 py-0.5 rounded text-xs font-bold bg-white/10 text-white/60 tracking-wider uppercase border border-white/5">
                                {data?.region?.code || "UNK"}
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-white/50 mt-1">
                            {data.profileUrl && (
                              <a
                                href={data.profileUrl}
                                target="_blank"
                                noreferrer="true"
                                className="hover:text-white transition-colors flex items-center gap-1"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                Steam Profile
                              </a>
                            )}

                            <div className="flex items-center gap-2 px-2.5 py-1 bg-white/5 rounded-lg border border-white/5 shadow-sm hover:bg-white/10 transition-colors group cursor-default">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 group-hover:shadow-[0_0_8px_rgba(52,211,153,0.6)] transition-shadow"></span>
                              <span className="text-white/50 font-bold text-[10px] tracking-wider uppercase">CREATED</span>
                              <span className="text-white font-medium tracking-wide text-xs uppercase opacity-90">{createdShort || "Unknown"}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Verdict */}
                      <div className="mt-8 mb-2">
                        <div className="text-xs font-bold text-white/30 uppercase tracking-[0.2em] mb-2">Trust Verdict</div>
                        <div className={`text-4xl sm:text-5xl font-black italic tracking-tight ${verdictColorClass(data.verdict)}`}>
                          {data.verdict}
                        </div>
                        <p className="mt-4 text-white/60 text-sm leading-relaxed border-l-2 border-white/10 pl-4 pr-16">
                          {scoreSummary || "Analysis based on public profile visibility."}
                        </p>
                      </div>

                      {/* Share */}
                      {data?.steamid && (
                        <div className="absolute bottom-6 right-6 z-50 pointer-events-auto flex flex-col items-end gap-2">
                          {shareHint && (
                            <span className="text-xs font-bold text-emerald-400 bg-black/80 backdrop-blur-md px-2 py-1 rounded-md border border-emerald-500/20 shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-200">
                              {shareHint}
                            </span>
                          )}
                          <button
                            onClick={onShare}
                            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all border border-white/10 hover:border-white/20 hover:scale-105 active:scale-95 shadow-xl"
                            title="Share this result"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Trust Score Meter */}
                    <div className="glass-card p-6 rounded-2xl flex flex-col justify-center">
                      <div className="flex justify-between items-end mb-4">
                        <div className="text-sm font-bold text-white/40 uppercase tracking-widest">Trust Score</div>
                        <div className="text-3xl font-black text-white">{hasScore ? score : "?"}<span className="text-lg text-white/30 font-normal">/100</span></div>
                      </div>

                      <div className="relative h-6 bg-black/50 rounded-full overflow-hidden shadow-inner border border-white/5">
                        {hasScore ? (
                          <>
                            <div
                              className="absolute top-0 bottom-0 left-0 transition-all duration-1000 ease-out"
                              style={{
                                width: `${scorePct}%`,
                                background: `linear-gradient(90deg, ${visuals.color} 0%, ${visuals.color} 100%)`,
                                boxShadow: `0 0 20px ${visuals.glow}`
                              }}
                            >
                              <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]" />
                            </div>
                            {/* Knob */}
                            <div
                              className="absolute top-1/2 -translate-y-1/2 h-8 w-1 bg-white shadow-[0_0_15px_rgba(255,255,255,0.8)] z-10 transition-all duration-1000"
                              style={{ left: `${knobPct}%` }}
                            />
                          </>
                        ) : (
                          <div className="w-full h-full bg-white/5 animate-pulse" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* RIGHT: Signals */}
                  <div className="glass-card rounded-2xl p-6 sm:p-8 flex flex-col h-full">
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
                      <div className="h-2 w-2 rounded-full bg-white/50" />
                      <h3 className="font-bold text-white uppercase tracking-widest text-sm">Signal Analysis</h3>
                    </div>

                    <div className="flex-1 space-y-1">
                      {data?.signals?.ageText ? (
                        <SignalRow
                          label="Account Age"
                          value={data?.signals?.ageText}
                          tier={ageTier.tier}
                          note={ageTier.note}
                          rightHint={ageTier.hint}
                        />
                      ) : null}

                      {bans ? (
                        <SignalRow
                          label="Ban Record"
                          value={banDisplay.value}
                          tier={bansTier.tier}
                          note={bansTier.note}
                          rightHint={banDisplay.hint}
                        />
                      ) : null}

                      {selectedHours ? (
                        <SignalRow
                          label={`${selectedHours.name}`}
                          value={`${selectedHours.hours} hrs`}
                          tier={hoursTier.tier}
                          note={hoursTier.note}
                          rightHint={hoursTier.hint}
                        />
                      ) : null}

                      {typeof data.gamesCount === "number" ? (
                        <SignalRow
                          label="Game Library"
                          value={data.gamesCount.toLocaleString()}
                          tier={gamesTier.tier}
                          note={gamesTier.note}
                          rightHint={gamesTier.hint}
                        />
                      ) : null}

                      {typeof friendsCount === "number" ? (
                        <SignalRow
                          label="Friends List"
                          value={friendsCount.toLocaleString()}
                          tier={friendsTier.tier}
                          note={friendsTier.note}
                          rightHint={friendsTier.hint}
                        />
                      ) : null}

                      {typeof data.steamLevel === "number" ? (
                        <SignalRow
                          label="Steam Level"
                          value={data.steamLevel}
                          tier={levelTier.tier}
                          note={levelTier.note}
                          rightHint={levelTier.hint}
                        />
                      ) : null}
                    </div>

                    {Array.isArray(data.socialLinks) && data.socialLinks.length > 0 && (
                      <div className="mt-8 pt-6 border-t border-white/5">
                        <div className="text-xs font-bold text-white/30 uppercase tracking-widest mb-4">Linked Accounts</div>
                        <div className="flex flex-wrap gap-2">
                          {data.socialLinks.map((l) => (
                            <a
                              key={l.url}
                              href={l.url}
                              target="_blank"
                              rel="noreferrer"
                              className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-bold uppercase tracking-wide transition-all ${socialButtonClass(l.label)}`}
                            >
                              {l.label}
                              <svg className="w-3 h-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="pt-12 pb-8 text-center">
                <div className="inline-block p-4 rounded-full bg-white/[0.03] border border-white/5 mb-4">
                  <svg className="w-8 h-8 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <p className="text-white/30 text-sm font-medium">Ready to analyze</p>
              </div>
            )}
          </div>
        </div>
        {/* FAQ Section */}
        <div className="mt-24 max-w-3xl mx-auto">
          <h3 className="text-xl font-bold text-white mb-8 text-center uppercase tracking-widest opacity-80">Frequently Asked Questions</h3>
          <div className="grid gap-6">
            {FAQ_ITEMS.map((item, i) => (
              <div key={i} className="glass-card p-6 rounded-2xl border border-white/5 hover:bg-white/5 transition-colors">
                <h4 className="text-white font-bold mb-2 text-lg">{item.question}</h4>
                <p className="text-white/60 text-sm leading-relaxed">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>


        {/* Footer */}
        <div className="mt-12 text-center text-white/20 text-xs">
          <p>© 2024 Steam Checker. Not affiliated with Valve Corp.</p>
        </div>
      </div>
    </main>
  );
}
