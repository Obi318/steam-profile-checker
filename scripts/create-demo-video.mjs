import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const HOST = "127.0.0.1";
const PORT = 3000;
const BASE_URL = `http://${HOST}:${PORT}`;
const MARKETING_URL = `${BASE_URL}/marketing`;
const DEMO_DIR = path.resolve("demo");
const FINAL_VIDEO_PATH = path.join(DEMO_DIR, "steam-checker-demo.webm");
const VIDEO_SIZE = { width: 3840, height: 2160 };
const PROFILE_URL = "https://steamcommunity.com/id/datguylorik11";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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

  let devServer = null;

  if (!(await isServerReady(BASE_URL))) {
    devServer =
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
  }

  try {
    await waitForServer(BASE_URL);

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: VIDEO_SIZE,
      recordVideo: {
        dir: DEMO_DIR,
        size: VIDEO_SIZE,
      },
    });

    const page = await context.newPage();
    const video = page.video();

    await page.goto(MARKETING_URL, { waitUntil: "networkidle" });
    await page.evaluate(() => {
      document.body.style.zoom = "0.86";
      window.scrollTo(0, 0);
    });
    await sleep(2200);

    const input = page.getByPlaceholder("Paste profile URL, SteamID64, or vanity name...");
    await input.click();
    await input.press("ControlOrMeta+a");
    await input.press("Backspace");
    await input.type(PROFILE_URL, { delay: 22 });
    await sleep(600);

    const resultButton = page.getByRole("button", { name: "Result" });
    await resultButton.hover();
    await sleep(650);
    await resultButton.click();

    await page.locator("text=Trust Verdict").first().waitFor({ timeout: 120000 });
    await sleep(2800);

    await page.mouse.wheel(0, 550);
    await sleep(1800);
    await page.mouse.wheel(0, 650);
    await sleep(2000);
    await page.mouse.wheel(0, 650);
    await sleep(2000);
    await page.mouse.wheel(0, 550);
    await sleep(2200);
    await page.mouse.wheel(0, -1500);
    await sleep(1800);

    await context.close();
    await browser.close();

    if (!video) {
      throw new Error("No video handle returned by Playwright.");
    }

    const generatedVideoPath = await video.path();
    await fs.copyFile(generatedVideoPath, FINAL_VIDEO_PATH);

    console.log(`Saved demo video: ${FINAL_VIDEO_PATH}`);
  } finally {
    if (devServer?.pid) killProcessTree(devServer.pid);
  }
}

run().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
