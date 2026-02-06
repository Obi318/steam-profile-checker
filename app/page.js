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
      return "text-emerald-400";
    case "PROBABLY LEGIT":
      return "text-lime-400";
    case "MIXED SIGNALS":
      return "text-yellow-300";
    case "SUSPECT":
      return "text-orange-400";
    case "HIGH RISK":
      return "text-red-500";
    case "UNKNOWN":
      return "text-orange-400";
    default:
      return "text-gray-200";
  }
}

function scoreBarColorClass(score) {
  if (score >= 85) return "bg-emerald-400";
  if (score >= 70) return "bg-lime-400";
  if (score >= 50) return "bg-yellow-300";
  if (score >= 30) return "bg-orange-400";
  return "bg-red-500";
}

function scoreBarVisuals(score) {
  // Minimal "premium" look: subtle gradient + glow that matches the tier color.
  if (score >= 85) return { color: "#34d399", glow: "rgba(52,211,153,0.28)" }; // emerald-400
  if (score >= 70) return { color: "#a3e635", glow: "rgba(163,230,53,0.26)" }; // lime-400
  if (score >= 50) return { color: "#fde047", glow: "rgba(253,224,71,0.22)" }; // yellow-300
  if (score >= 30) return { color: "#fb923c", glow: "rgba(251,146,60,0.22)" }; // orange-400
  return { color: "#ef4444", glow: "rgba(239,68,68,0.22)" }; // red-500
}

function socialButtonClass(label) {
  if (label === "Twitch") return "border-purple-500/40 text-purple-200 hover:bg-purple-500/10";
  if (label === "YouTube") return "border-red-500/40 text-red-200 hover:bg-red-500/10";
  if (label === "X") return "border-slate-400/40 text-slate-100 hover:bg-slate-400/10";
  if (label === "Kick") return "border-green-500/40 text-green-200 hover:bg-green-500/10";
  return "border-white/20 text-white/80 hover:bg-white/10";
}

/* -----------------------------
   Steam-y signal UI helpers
------------------------------ */

function Tag({ tier, children }) {
  const base =
    "inline-flex items-center rounded-full border border-white/10 px-3 py-1 text-xs sm:text-sm font-semibold";
  const tone =
    tier === "good"
      ? "text-[#a4d007]"
      : tier === "warn"
      ? "text-[#f1c40f]"
      : tier === "bad"
      ? "text-[#e74c3c]"
      : "text-white/70";

  const bg =
    tier === "good"
      ? "rgba(164,208,7,0.10)"
      : tier === "warn"
      ? "rgba(241,196,15,0.10)"
      : tier === "bad"
      ? "rgba(231,76,60,0.10)"
      : "rgba(255,255,255,0.06)";

  return (
    <span className={`${base} ${tone}`} style={{ background: bg }}>
      {children}
    </span>
  );
}

function SignalRow({ label, value, tier, note, rightHint }) {
  return (
    <div className="py-1.5 sm:py-2 border-b border-white/10 last:border-b-0">
      <div className="flex items-center justify-between gap-4">
        <div className="text-white/90 font-medium text-sm sm:text-base">{label}</div>
        <div className="text-white font-semibold text-sm sm:text-base">{value}</div>
      </div>
      <div className="mt-2 flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <Tag tier={tier}>{note}</Tag>
        {rightHint ? (
          <div className="text-xs sm:text-sm text-white/55 sm:text-right">{rightHint}</div>
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
    if (days < 365) return { tier: "bad", note: "Multiple bans (recent)", hint: "Severe impact" };
    if (days < 1460) return { tier: "bad", note: "Multiple bans (last 4y)", hint: "High impact" };
    return { tier: "bad", note: "Multiple bans (older)", hint: "Moderate impact" };
  }

  if (days === null) return { tier: "warn", note: "Ban history", hint: "Unknown recency" };
  if (days < 365) return { tier: "bad", note: "Recent ban (<1y)", hint: "Severe impact" };
  if (days < 730) return { tier: "bad", note: "Ban in last 2y", hint: "High impact" };
  if (days < 1460) return { tier: "bad", note: "Ban in last 4y", hint: "High impact" };
  if (days < 3650) return { tier: "warn", note: "Old ban", hint: "Moderate impact" };
  return { tier: "warn", note: "Very old ban", hint: "Low impact" };
}

export default function HomePage() {
  const DEFAULT_PROFILE_URL = "https://steamcommunity.com/id/C9shroud/";

  const [input, setInput] = useState("");
  const [selectedAppId, setSelectedAppId] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [data, setData] = useState(null);
  const [shareHint, setShareHint] = useState("");

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

    const url = buildShareUrl({ steamid: data.steamid, appid: selectedGame?.appid ?? null });
    if (!url) return;

    setShareHint("");

    // Prefer native share sheet on mobile when available.
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Steam Profile Checker",
          text: "Steam Trust Score snapshot",
          url,
        });
        setShareHint("Shared");
        setTimeout(() => setShareHint(""), 1500);
        return;
      } catch {
        // fall back to copy
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setShareHint("Copied");
      setTimeout(() => setShareHint(""), 1500);
    } catch {
      setShareHint("Copy failed");
      setTimeout(() => setShareHint(""), 1500);
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
      if (impact === "High") {
        why = approxYear
          ? `Recent ban activity (last ~${approxYear}) significantly reduces trust.`
          : "Recent ban activity significantly reduces trust.";
      } else if (impact === "Medium") {
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

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#0b0f14] via-black to-black text-white text-[15px]">
      <div className="mx-auto max-w-5xl px-4 py-5">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-4 sm:p-5 md:p-7 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          <div className="pb-4 mb-4">
            <div className="rounded-2xl bg-white/[0.03] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] px-5 py-4">
              <div className="relative">
                <div className="text-center">
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-white leading-none">
                    Steam Profile Checker
                  </h1>
                  <div className="mt-2 text-sm text-white/60">
                    A snapshot of public Steam profile information summarized into a trust score.
                  </div>
                </div>

                <div className="absolute right-0 top-0 hidden sm:flex items-center gap-2 pt-1">
                  <div className="text-xs uppercase tracking-widest text-white/50">v1.1</div>
                  <div className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-[11px] text-white/70">
                    Beta
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Input */}
          <div className="mb-3">
            <label className="block text-sm text-white/80 mb-2">Enter a Steam profile URL</label>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                className="w-full min-w-0 rounded-xl bg-white/10 border border-white/15 px-4 py-2 text-white placeholder:text-white/30 outline-none focus:border-white/30"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={DEFAULT_PROFILE_URL}
              />
              <button
                onClick={onCheck}
                disabled={loading}
                className="w-full sm:w-auto rounded-xl px-5 py-2 bg-white/10 border border-white/15 hover:bg-white/15 disabled:opacity-50"
              >
                {loading ? "Checking..." : "Check"}
              </button>
            </div>

            {err ? (
              <div className="mt-3 text-red-300">
                {err}{" "}
                <span className="text-white/60">
                  (Tip: open someone’s Steam profile and copy the URL from the address bar.)
                </span>
              </div>
            ) : null}
          </div>

          {/* Game dropdown */}
          <div className="mt-4 mb-7">
            <div className="text-sm text-white/60 mb-2">
              Optional: pick a game to add extra context (hours can slightly adjust the score)
            </div>
            <select
              className="w-full md:w-[520px] rounded-xl bg-white/10 border border-white/15 px-4 py-2 text-white outline-none focus:border-white/30"
              value={selectedAppId}
              onChange={(e) => setSelectedAppId(e.target.value)}
            >
              <option value="" className="bg-[#0b0f14] text-white">
                None (base score)
              </option>
              {games.map((g) => (
                <option key={g.appid} value={String(g.appid)} className="bg-[#0b0f14] text-white">
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          {/* Results */}
          {data ? (
            <div className="rounded-2xl border border-white/12 bg-white/5 p-4 sm:p-5">
              <div className="grid gap-5 md:grid-cols-2">
                {/* LEFT: Summary */}
                <div className="min-w-0">
                  <div className="flex items-start gap-4">
                    <img
                      src={data.avatar || ""}
                      alt=""
                      className="h-16 w-16 rounded-xl border border-white/10 object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-xl sm:text-3xl md:text-4xl font-extrabold leading-none truncate">
                        {data.personaName || "Unknown"}
                      </div>

                      <div className="mt-2 text-white/70 flex flex-wrap gap-x-6 gap-y-1">
                        {data.profileUrl ? (
                          <a
                            href={data.profileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sky-300 hover:text-sky-200"
                          >
                            Open profile
                          </a>
                        ) : null}

                        {createdShort || openness ? (
                          <span className="flex flex-col leading-tight">
                            {createdShort ? (
                              <span>
                                Created:{" "}
                                <span className="font-semibold text-white/85">{createdShort}</span>
                              </span>
                            ) : null}

                            {openness ? (
                              <span className="mt-1 text-xs text-white/60">
                                Openness:{" "}
                                <span
                                  className={
                                    openness === "Open"
                                      ? "font-semibold text-emerald-300"
                                      : openness === "Semi-Open"
                                      ? "font-semibold text-yellow-300"
                                      : "font-semibold text-red-400"
                                  }
                                >
                                  {openness}
                                </span>
                              </span>
                            ) : null}

                            {coverage ? (
                              <span className="mt-1 text-xs text-white/60">
                                Coverage:{" "}
                                <span className="font-semibold text-white/75">
                                  {coverage.available}/{coverage.possible} ({coverage.label})
                                </span>
                              </span>
                            ) : null}
                          </span>
                        ) : null}

                        {regionLabel ? (
                          <span>
                            Region: <span className="font-semibold text-white/85">{regionLabel}</span>
                          </span>
                        ) : null}

                        {data.currentlyPlaying?.name ? (
                          <span>
                            Playing:{" "}
                            <span className="font-semibold text-white/85">
                              {data.currentlyPlaying.name}
                            </span>
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5">
                    <div className={`text-2xl font-extrabold ${verdictColorClass(data.verdict)}`}>
                      {data.verdict}
                    </div>

                    <div className="mt-3 text-white/75 text-sm">
                      {scoreSummary || "Trust score is based on the available public signals."}
                    </div>

                    {data?.steamid ? (
                      <div className="mt-3 flex items-center gap-2">
                        <button
                          onClick={onShare}
                          className="rounded-lg px-3 py-1.5 text-xs sm:text-sm bg-white/10 border border-white/15 hover:bg-white/15"
                        >
                          Share result
                        </button>
                        {shareHint ? <div className="text-xs text-white/55">{shareHint}</div> : null}
                      </div>
                    ) : null}

                    <div className="mt-4 sm:mt-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                      <div className="text-xl font-extrabold">
                        Trust Score: {hasScore ? `${score} / 100` : "Unknown"}
                      </div>

                      <div className="w-full sm:flex-1 sm:max-w-xl">
                        <div className="relative h-3 rounded-full bg-white/10 overflow-hidden border border-white/10">
                          {hasScore ? (
                            <>
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${scorePct}%`,
                                  backgroundColor: visuals.color,
                                  backgroundImage:
                                    "linear-gradient(180deg, rgba(255,255,255,0.20), rgba(0,0,0,0.15))",
                                  boxShadow: `0 0 18px ${visuals.glow}`,
                                }}
                              />
                              <div
                                className="absolute top-1/2 -translate-y-1/2 h-4 w-4 rounded-full bg-white/90 border border-black/40 shadow-[0_6px_18px_rgba(0,0,0,0.35)]"
                                style={{ left: `calc(${knobPct}% - 8px)` }}
                              />
                            </>
                          ) : (
                            <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-white/5 to-white/10 opacity-70" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* RIGHT: Details */}
                <div className="min-w-0">
                  <div className="mt-5 rounded-xl border border-white/10 bg-black/20 px-4">
                    {data?.signals?.ageText ? (
                      <SignalRow
                        label="Account age"
                        value={data?.signals?.ageText ?? "—"}
                        tier={ageTier.tier}
                        note={ageTier.note}
                        rightHint={ageTier.hint}
                      />
                    ) : null}

                    {bans ? (
                      <SignalRow
                        label="Ban indicators"
                        value={banDisplay.value}
                        tier={bansTier.tier}
                        note={bansTier.note}
                        rightHint={banDisplay.hint}
                      />
                    ) : null}

                    {selectedHours ? (
                      <SignalRow
                        label={`${selectedHours.name} hours`}
                        value={`${selectedHours.hours} hrs`}
                        tier={hoursTier.tier}
                        note={hoursTier.note}
                        rightHint={hoursTier.hint}
                      />
                    ) : null}

                    {typeof data.gamesCount === "number" ? (
                      <SignalRow
                        label="Games owned"
                        value={String(data.gamesCount)}
                        tier={gamesTier.tier}
                        note={gamesTier.note}
                        rightHint={gamesTier.hint}
                      />
                    ) : null}

                    {typeof friendsCount === "number" ? (
                      <SignalRow
                        label="Friends"
                        value={String(friendsCount)}
                        tier={friendsTier.tier}
                        note={friendsTier.note}
                        rightHint={friendsTier.hint}
                      />
                    ) : null}

                    {typeof data.steamLevel === "number" ? (
                      <SignalRow
                        label="Steam level"
                        value={String(data.steamLevel)}
                        tier={levelTier.tier}
                        note={levelTier.note}
                        rightHint={levelTier.hint}
                      />
                    ) : null}
                  </div>

                  {Array.isArray(data.socialLinks) && data.socialLinks.length ? (
                    <div className="mt-5">
                      <div className="text-white/80 font-semibold mb-2">Social links</div>
                      <div className="flex flex-wrap gap-2">
                        {data.socialLinks.map((l) => (
                          <a
                            key={l.url}
                            href={l.url}
                            target="_blank"
                            rel="noreferrer"
                            className={`inline-flex items-center rounded-full border px-3 py-1 text-sm ${socialButtonClass(
                              l.label
                            )}`}
                          >
                            {l.label}
                          </a>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <div className="mt-5 text-white/50 text-sm">
                    {data.disclaimer ||
                      "Trust Score uses available Steam signals. Not a cheat detector."}
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {/* Explainer */}
          <div className="mt-8 border-t border-white/10 pt-6">
            <h2 className="text-xl font-extrabold mb-3">How our Trust Score works</h2>
            <ul className="space-y-2 text-white/80 text-sm sm:text-base">
              <li>
                • <span className="font-semibold text-white/90">Account age is the #1 factor.</span>{" "}
                Very old accounts get a large boost.
              </li>
              <li>
                • <span className="font-semibold text-white/90">Ban indicators</span> are heavy negatives.
              </li>
              <li>
                • <span className="font-semibold text-white/90">Clean ban history</span> adds confidence when visible.
              </li>
              <li>
                • <span className="font-semibold text-white/90">Game library footprint</span> and{" "}
                <span className="font-semibold text-white/90">friends count</span> can add confidence when available.
              </li>
              <li>
                • <span className="font-semibold text-white/90">Optional game hours</span> only applies if you pick a game.
              </li>
            </ul>
          </div>

          {/* Footer */}
          <div className="mt-8 pb-5 text-white/40 text-xs">
            V1.1 — Steam Profile Checker.
          </div>
        </div>
      </div>
    </main>
  );
}
