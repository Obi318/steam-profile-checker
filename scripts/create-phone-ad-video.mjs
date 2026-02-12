import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const HOST = "127.0.0.1";
const PORT = 3310;
const BASE_URL = `http://${HOST}:${PORT}`;
const AD_URL = `${BASE_URL}/marketing`;
const DEMO_DIR = path.resolve("demo");
const FINAL_VIDEO_PATH = path.join(DEMO_DIR, "steam-checker-phone-ad.webm");
const VIDEO_SIZE = { width: 2160, height: 3840 };
const PROFILE_URL = "https://steamcommunity.com/id/datguylorik11";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function smoothScroll(page, totalPx, steps, delayMs) {
  const chunk = totalPx / steps;
  for (let i = 0; i < steps; i += 1) {
    await page.mouse.wheel(0, chunk);
    await sleep(delayMs);
  }
}

async function scrollWithoutFaq(page, totalPx, steps, delayMs) {
  const faqHeader = page.getByText("Frequently Asked Questions").first();
  const chunk = totalPx / steps;
  for (let i = 0; i < steps; i += 1) {
    const faqVisible = await faqHeader.isVisible().catch(() => false);
    if (faqVisible) break;
    await page.mouse.wheel(0, chunk);
    await sleep(delayMs);
    const faqAfter = await faqHeader.isVisible().catch(() => false);
    if (faqAfter) {
      await page.mouse.wheel(0, -220);
      await sleep(300);
      break;
    }
  }
}

async function isServerReady(url) {
  try {
    const res = await fetch(url, { method: "GET" });
    return res.ok;
  } catch {
    return false;
  }
}

async function waitForServer(url, timeoutMs = 120000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await isServerReady(url)) return;
    await sleep(1000);
  }
  throw new Error(`Server did not become ready within ${timeoutMs}ms: ${url}`);
}

function killProcessTree(pid) {
  if (!pid) return;
  if (process.platform === "win32") {
    spawnSync("taskkill", ["/PID", String(pid), "/T", "/F"], { stdio: "ignore" });
    return;
  }
  process.kill(-pid, "SIGTERM");
}

async function run() {
  await fs.mkdir(DEMO_DIR, { recursive: true });

  const devServer =
    process.platform === "win32"
      ? spawn(
          "cmd.exe",
          ["/c", "npm", "run", "dev", "--", "--hostname", HOST, "--port", String(PORT)],
          { stdio: ["ignore", "pipe", "pipe"] },
        )
      : spawn("npm", ["run", "dev", "--", "--hostname", HOST, "--port", String(PORT)], {
          stdio: ["ignore", "pipe", "pipe"],
          detached: true,
        });

  devServer.stdout.on("data", (chunk) => process.stdout.write(`[dev] ${chunk}`));
  devServer.stderr.on("data", (chunk) => process.stderr.write(`[dev] ${chunk}`));

  try {
    await waitForServer(BASE_URL);

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: VIDEO_SIZE,
      isMobile: true,
      colorScheme: "dark",
      deviceScaleFactor: 1,
      recordVideo: {
        dir: DEMO_DIR,
        size: VIDEO_SIZE,
      },
    });

    const page = await context.newPage();
    const video = page.video();

    await page.goto(AD_URL, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");
    await page.addStyleTag({
      content: `
        html, body {
          background: #000 !important;
          background-image: none !important;
          filter: none !important;
        }
        *,
        *::before,
        *::after {
          animation: none !important;
          transition: none !important;
          caret-color: transparent !important;
        }
        .glass-card,
        .glass-card * {
          backdrop-filter: none !important;
          filter: none !important;
        }
        input, button, select {
          transition: none !important;
        }
        .animate-blob, [class*="animate-[shimmer"] { animation: none !important; }
        .glass-card, .glass-card * { backface-visibility: hidden; transform: translateZ(0); }
      `,
    });
    await page.evaluate(() => window.scrollTo(0, 0));
    await sleep(900);

    const input = page
      .getByPlaceholder("Paste profile URL, SteamID64, or vanity name...")
      .or(page.locator('input[placeholder*="Paste profile URL"]'))
      .or(page.locator("input").first())
      .first();
    await input.waitFor({ state: "visible", timeout: 120000 });
    await input.scrollIntoViewIfNeeded();
    await input.click({ timeout: 120000 });
    await input.press("ControlOrMeta+a");
    await input.press("Backspace");
    await input.type(PROFILE_URL, { delay: 20 });
    await sleep(220);

    const resultButton = page.getByRole("button", { name: "Result" }).first();
    await resultButton.waitFor({ state: "visible", timeout: 120000 });
    await resultButton.hover();
    await sleep(320);
    await resultButton.click();

    await page.locator("text=Trust Verdict").first().waitFor({ timeout: 120000 });
    await sleep(900);

    await scrollWithoutFaq(page, 820, 10, 170);
    await sleep(550);
    await scrollWithoutFaq(page, 520, 7, 170);
    await sleep(800);

    await context.close();
    await browser.close();

    if (!video) throw new Error("No video handle returned by Playwright.");

    const generatedVideoPath = await video.path();
    await fs.copyFile(generatedVideoPath, FINAL_VIDEO_PATH);
    console.log(`Saved phone ad video: ${FINAL_VIDEO_PATH}`);
  } finally {
    if (devServer?.pid) killProcessTree(devServer.pid);
  }
}

run().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
