import fs from "node:fs/promises";
import path from "node:path";
import YTDlpWrapPkg from "yt-dlp-wrap";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";

const ROOT = process.cwd();
const YTDlpWrap = YTDlpWrapPkg.default ?? YTDlpWrapPkg;
const AD_DIR = path.join(ROOT, "assets", "ad");
const SRC_DIR = path.join(AD_DIR, "sources");
const AUDIO_DIR = path.join(AD_DIR, "audio");
const VISUAL_DIR = path.join(AD_DIR, "visuals");
const TOOLS_DIR = path.join(ROOT, "tools");
const YTDLP_BIN = path.join(TOOLS_DIR, process.platform === "win32" ? "yt-dlp.exe" : "yt-dlp");

const ARC_MEDIA_PAGE = "https://arcraiders.nexon.com/en-US/media";

const STATIC_DOWNLOADS = [
  {
    url: "https://commons.wikimedia.org/wiki/Special:FilePath/Soviet%20Union%20national%20anthem%20(instrumental)%2C%201977.oga",
    out: path.join(AUDIO_DIR, "soviet-sting-source.oga"),
    note: "Public-domain style source for short end sting (trim in edit).",
    license: "Wikimedia Commons file page (see attribution metadata there).",
  },
  {
    url: "https://commons.wikimedia.org/wiki/Special:FilePath/Hammer%20and%20Sickle.svg",
    out: path.join(VISUAL_DIR, "hammer-and-sickle.svg"),
    note: "Brief end-card visual element.",
    license: "Wikimedia Commons (check specific file license details).",
  },
];

async function ensureDirs() {
  await fs.mkdir(SRC_DIR, { recursive: true });
  await fs.mkdir(AUDIO_DIR, { recursive: true });
  await fs.mkdir(VISUAL_DIR, { recursive: true });
  await fs.mkdir(TOOLS_DIR, { recursive: true });
}

async function download(url, out) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed (${res.status}) for ${url}`);
  const data = Buffer.from(await res.arrayBuffer());
  await fs.writeFile(out, data);
}

function extractYouTubeLinks(html) {
  const links = new Set();
  const re = /https:\/\/www\.youtube\.com\/watch\?v=[A-Za-z0-9_-]+/g;
  let m;
  while ((m = re.exec(html)) !== null) links.add(m[0]);
  return [...links];
}

async function fetchArcYoutubeLinks() {
  const res = await fetch(ARC_MEDIA_PAGE);
  if (!res.ok) throw new Error(`Failed to fetch ARC media page (${res.status})`);
  const html = await res.text();
  const links = extractYouTubeLinks(html);
  if (!links.length) throw new Error("No YouTube links found on ARC media page.");
  return links;
}

async function ensureYtDlp() {
  await YTDlpWrap.downloadFromGithub(YTDLP_BIN);
  return new YTDlpWrap(YTDLP_BIN);
}

async function downloadYoutubeClips(wrap, urls) {
  const selected = urls.slice(0, 2);
  const outputs = [];

  for (let i = 0; i < selected.length; i += 1) {
    const url = selected[i];
    const outTemplate = path.join(SRC_DIR, `arc-source-${i + 1}.%(ext)s`);
    const mergedOut = path.join(SRC_DIR, `arc-source-${i + 1}.mp4`);
    await wrap.execPromise([
      url,
      "-f",
      "bv*[height<=1080][ext=mp4]+ba[ext=m4a]/b[height<=1080][ext=mp4]/b[height<=1080]",
      "--ffmpeg-location",
      ffmpegInstaller.path,
      "--merge-output-format",
      "mp4",
      "-o",
      outTemplate,
    ]);
    outputs.push({ url, out: mergedOut });
  }

  return outputs;
}

async function writeSourcesFile(rows) {
  const lines = [
    "# Ad Asset Sources",
    "",
    "Downloaded assets for short-form ad production.",
    "",
    "## Files",
  ];

  for (const row of rows) {
    lines.push(`- ${row.file}`);
    lines.push(`  - source: ${row.source}`);
    if (row.license) lines.push(`  - license: ${row.license}`);
    if (row.note) lines.push(`  - note: ${row.note}`);
  }

  lines.push("");
  await fs.writeFile(path.join(AD_DIR, "SOURCES.md"), lines.join("\n"), "utf8");
}

async function main() {
  await ensureDirs();

  const sourceRows = [];

  const ytLinks = await fetchArcYoutubeLinks();
  const yt = await ensureYtDlp();
  const ytFiles = await downloadYoutubeClips(yt, ytLinks);

  for (const item of ytFiles) {
    sourceRows.push({
      file: path.relative(ROOT, item.out),
      source: item.url,
      license: "Owned by original publisher/channel (confirm usage rights for ad publishing).",
      note: "ARC Raiders source clip downloaded for edit selection.",
    });
  }

  for (const item of STATIC_DOWNLOADS) {
    await download(item.url, item.out);
    sourceRows.push({
      file: path.relative(ROOT, item.out),
      source: item.url,
      license: item.license,
      note: item.note,
    });
  }

  await writeSourcesFile(sourceRows);

  console.log("Fetched ad assets:");
  for (const row of sourceRows) console.log(`- ${row.file}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
