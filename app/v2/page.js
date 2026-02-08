"use client";

import { useEffect, useMemo, useState } from "react";
import { Sora, Chakra_Petch } from "next/font/google";
import styles from "./v2.module.css";

const sora = Sora({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-sora",
});

const chakra = Chakra_Petch({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-chakra",
});

const DEFAULT_PROFILE_URL = "https://steamcommunity.com/id/C9shroud/";

const GAMES = [
  { name: "Apex Legends", appid: 1172470 },
  { name: "ARC Raiders", appid: 1808500 },
  { name: "Call of Duty", appid: 1938090 },
  { name: "Counter-Strike 2", appid: 730 },
  { name: "Deadlock", appid: 1422450 },
  { name: "Destiny 2", appid: 1085660 },
  { name: "Dota 2", appid: 570 },
  { name: "Overwatch 2", appid: 2357570 },
  { name: "PUBG: BATTLEGROUNDS", appid: 578080 },
  { name: "Rust", appid: 252490 },
  { name: "Team Fortress 2", appid: 440 },
  { name: "Tom Clancy's Rainbow Six Siege", appid: 359550 },
].sort((a, b) => a.name.localeCompare(b.name));

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
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function verdictTone(verdict) {
  if (verdict === "CERTIFIED LEGIT" || verdict === "LIKELY LEGIT") return "good";
  if (verdict === "PROBABLY LEGIT" || verdict === "MIXED SIGNALS") return "warn";
  if (verdict === "SUSPECT" || verdict === "HIGH RISK") return "bad";
  return "neutral";
}

function confidenceLabel(score) {
  if (typeof score !== "number") return "Low confidence";
  if (score >= 85) return "High confidence";
  if (score >= 60) return "Moderate confidence";
  return "Low confidence";
}

function scoreRingColor(score) {
  if (score >= 85) return "#58e0ac";
  if (score >= 70) return "#98d54f";
  if (score >= 50) return "#e1c75b";
  if (score >= 30) return "#d88d4d";
  return "#e45f5f";
}

function signalTone(label) {
  if (!label) return "neutral";
  const t = String(label).toLowerCase();
  if (t.includes("strong") || t.includes("good") || t.includes("clean") || t.includes("older")) return "good";
  if (t.includes("risk") || t.includes("severe") || t.includes("ban")) return "bad";
  if (t.includes("caution") || t.includes("moderate") || t.includes("low")) return "warn";
  return "neutral";
}

function metricToneFromPenalty(penalty) {
  if (typeof penalty !== "number") return "neutral";
  if (penalty <= -20) return "bad";
  if (penalty < 0) return "warn";
  return "good";
}

function tagClassFromTone(tone) {
  if (tone === "good") return styles.tagGood;
  if (tone === "warn") return styles.tagWarn;
  if (tone === "bad") return styles.tagBad;
  return styles.tagNeutral;
}

export default function V2Page() {
  const [input, setInput] = useState("");
  const [selectedAppId, setSelectedAppId] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [data, setData] = useState(null);
  const [shareHint, setShareHint] = useState("");

  const selectedGame = useMemo(() => {
    if (!selectedAppId) return null;
    const id = Number(selectedAppId);
    return GAMES.find((g) => g.appid === id) || null;
  }, [selectedAppId]);

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
      setErr("Enter a Steam profile URL, vanity name, or 17-digit SteamID64.");
      return;
    }

    const appidNum = appidOverride ? Number(appidOverride) : selectedGame?.appid ?? null;
    const gameName = appidNum ? GAMES.find((g) => g.appid === appidNum)?.name ?? null : null;

    setLoading(true);
    try {
      const r = await fetch("/api/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: effectiveInput,
          selectedAppId: appidNum,
          selectedGameName: gameName,
        }),
      });

      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        if (r.status === 429) {
          throw new Error("Steam is busy right now. Wait about 30-60 seconds and retry.");
        }
        if (r.status >= 500) {
          throw new Error("Steam data is temporarily unavailable. Retry in a minute.");
        }
        throw new Error(j?.error || `Request failed (${r.status})`);
      }

      setData(j);

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
    const effectiveInput = raw || DEFAULT_PROFILE_URL;
    if (!raw) setInput(DEFAULT_PROFILE_URL);
    await runCheck({ effectiveInput, appidOverride: null });
  }

  async function onShare() {
    if (!data?.steamid) return;
    const url = buildShareUrl({ steamid: data.steamid, appid: selectedGame?.appid ?? null });
    if (!url) return;

    setShareHint("");
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Steam Profile Checker v2",
          text: "Steam Trust Score snapshot",
          url,
        });
        setShareHint("Shared");
        setTimeout(() => setShareHint(""), 1400);
        return;
      } catch {
        // Fall through to clipboard copy.
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setShareHint("Copied");
      setTimeout(() => setShareHint(""), 1400);
    } catch {
      setShareHint("Copy failed");
      setTimeout(() => setShareHint(""), 1400);
    }
  }

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (data || loading) return;

    const sp = new URLSearchParams(window.location.search);
    const id = (sp.get("id") || sp.get("q") || "").trim();
    const game = (sp.get("game") || "").trim();

    if (!id) return;
    setInput(id);
    if (game) {
      setSelectedAppId(game);
      setShowAdvanced(true);
    }
    if (isSteamishInput(id)) {
      runCheck({ effectiveInput: id, appidOverride: game || null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const score = data?.trustLevel ?? null;
  const hasScore = typeof score === "number";
  const safeScore = clamp(hasScore ? score : 0, 0, 100);
  const ringColor = scoreRingColor(safeScore);
  const ringStyle = {
    background: `conic-gradient(${ringColor} ${safeScore}%, rgba(255,255,255,0.1) ${safeScore}% 100%)`,
  };

  const verdict = data?.verdict || "No result yet";
  const tone = verdictTone(verdict);
  const created = formatShortDate(data?.createdAt);
  const region = data?.region?.label || "Unknown region";
  const confidence = confidenceLabel(score);

  const topSignals = useMemo(() => {
    if (!data) return [];
    const out = [];
    if (data?.signals?.ageText) {
      out.push({
        label: "Account age",
        value: data.signals.ageText,
        hint: "older accounts are generally more stable",
        tone: signalTone(data.signals.ageText),
      });
    }
    if (data?.bans) {
      const vac = data.bans.NumberOfVACBans ?? 0;
      const game = data.bans.NumberOfGameBans ?? 0;
      const clean = vac === 0 && game === 0 && !data.bans.CommunityBanned && (data.bans.EconomyBan ?? "none") === "none";
      out.push({
        label: "Ban indicators",
        value: clean ? "No visible bans" : `VAC ${vac}, Game ${game}`,
        hint: clean ? "no penalty applied" : data?.signals?.ban?.impact || "penalty applied",
        tone: clean ? "good" : metricToneFromPenalty(data?.signals?.ban?.penalty),
      });
    }
    if (typeof data?.steamLevel === "number") {
      out.push({
        label: "Steam level",
        value: String(data.steamLevel),
        hint: data.steamLevel >= 20 ? "good maturity signal" : "light support signal",
        tone: data.steamLevel >= 20 ? "good" : "warn",
      });
    }
    if (selectedGame?.name && typeof data?.selectedGame?.hours === "number") {
      out.push({
        label: `${selectedGame.name} hours`,
        value: `${data.selectedGame.hours} hrs`,
        hint: data.selectedGame.hours < 20 ? "low playtime context" : "healthy playtime context",
        tone: data.selectedGame.hours < 20 ? "warn" : "good",
      });
    }
    return out.slice(0, 3);
  }, [data, selectedGame]);

  const scoreBreakdown = data?.signals?.points || null;

  return (
    <main className={`${styles.shell} ${sora.variable} ${chakra.variable}`}>
      <div className={styles.bgMesh} />

      <div className={styles.container}>
        <section className={styles.hero}>
          <div className={styles.heroTop}>
            <div className={styles.steamChip}>Steam Profile Checker</div>
            <div className={styles.versionPill}>V2 Local Trial</div>
          </div>
          <h1 className={styles.heading}>Crisp trust snapshot for public Steam profiles</h1>
          <p className={styles.subheading}>
            Same scoring engine, redesigned layout. Your original page and data flow remain untouched.
          </p>

          <div className={styles.inputRow}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className={styles.input}
              placeholder={DEFAULT_PROFILE_URL}
            />
            <button onClick={onCheck} disabled={loading} className={styles.checkBtn}>
              {loading ? "Checking..." : "Check Profile"}
            </button>
          </div>

          <div className={styles.advancedWrap}>
            <button
              type="button"
              onClick={() => setShowAdvanced((v) => !v)}
              className={styles.advancedToggle}
            >
              {showAdvanced ? "Hide advanced context" : "Add advanced context"}
            </button>
            {showAdvanced ? (
              <select
                className={styles.select}
                value={selectedAppId}
                onChange={(e) => setSelectedAppId(e.target.value)}
              >
                <option value="">No game context</option>
                {GAMES.map((g) => (
                  <option key={g.appid} value={String(g.appid)}>
                    {g.name}
                  </option>
                ))}
              </select>
            ) : null}
          </div>

          {err ? <p className={styles.errorText}>{err}</p> : null}
        </section>

        {data ? (
          <section className={styles.results}>
            <div className={styles.summaryCol}>
              <div className={styles.identityCard}>
                <img src={data.avatar || ""} alt="" className={styles.avatar} />
                <div className={styles.identityText}>
                  <h2 className={styles.persona}>{data.personaName || "Unknown profile"}</h2>
                  <p className={styles.metaLine}>
                    {created ? `Created ${created}` : "Creation date unavailable"} | {region}
                  </p>
                  {data.profileUrl ? (
                    <a href={data.profileUrl} target="_blank" rel="noreferrer" className={styles.profileLink}>
                      Open Steam profile
                    </a>
                  ) : null}
                </div>
              </div>

              <div className={styles.verdictBlock}>
                <p className={styles.kicker}>Verdict</p>
                <div
                  className={`${styles.verdictValue} ${
                    tone === "good" ? styles.goodText : tone === "warn" ? styles.warnText : tone === "bad" ? styles.badText : ""
                  }`}
                >
                  {verdict}
                </div>
                <p className={styles.summaryText}>
                  {data.scoreSummary || "Trust score is based on available public signals."}
                </p>
                <div className={styles.actions}>
                  <button onClick={onShare} className={styles.shareBtn} disabled={!data?.steamid}>
                    Share snapshot
                  </button>
                  {shareHint ? <span className={styles.shareHint}>{shareHint}</span> : null}
                </div>
              </div>
            </div>

            <div className={styles.scoreCol}>
              <div className={styles.ringWrap}>
                <div className={styles.ringOuter} style={ringStyle}>
                  <div className={styles.ringInner}>
                    <div className={styles.scoreNumber}>{hasScore ? safeScore : "--"}</div>
                    <div className={styles.scoreUnit}>/ 100</div>
                  </div>
                </div>
                <div className={styles.confidence}>{confidence}</div>
              </div>

              <div className={styles.signalCard}>
                <h3 className={styles.panelTitle}>Top signals</h3>
                <div className={styles.signalList}>
                  {topSignals.length ? (
                    topSignals.map((item) => (
                      <div key={item.label} className={styles.signalRow}>
                        <div>
                          <p className={styles.signalLabel}>{item.label}</p>
                          <p className={styles.signalHint}>{item.hint}</p>
                        </div>
                        <span className={`${styles.signalValue} ${tagClassFromTone(item.tone)}`}>{item.value}</span>
                      </div>
                    ))
                  ) : (
                    <p className={styles.noDataText}>Run a check to see the strongest trust signals.</p>
                  )}
                </div>
              </div>

              <details className={styles.breakdown}>
                <summary>Why this score?</summary>
                <div className={styles.breakdownGrid}>
                  <div className={styles.metricRow}>
                    <span>Account age points</span>
                    <span>{scoreBreakdown?.age ?? 0}</span>
                  </div>
                  <div className={styles.metricRow}>
                    <span>Clean ban bonus</span>
                    <span>{scoreBreakdown?.cleanBansBonus ?? 0}</span>
                  </div>
                  <div className={styles.metricRow}>
                    <span>Ban penalty</span>
                    <span>{scoreBreakdown?.banPenalty ?? 0}</span>
                  </div>
                  <div className={styles.metricRow}>
                    <span>Games footprint</span>
                    <span>{scoreBreakdown?.gamesOwned ?? 0}</span>
                  </div>
                  <div className={styles.metricRow}>
                    <span>Friends footprint</span>
                    <span>{scoreBreakdown?.friends ?? 0}</span>
                  </div>
                  <div className={styles.metricRow}>
                    <span>Steam level</span>
                    <span>{scoreBreakdown?.level ?? 0}</span>
                  </div>
                  <div className={styles.metricRow}>
                    <span>Game hours adjustment</span>
                    <span>{scoreBreakdown?.gameHoursAdj ?? 0}</span>
                  </div>
                </div>
                <p className={styles.disclaimerText}>
                  {data.disclaimer || "Snapshot model only, not a cheat detector."}
                </p>
              </details>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
