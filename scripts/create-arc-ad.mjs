import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const HOST = "127.0.0.1";
const PORT = 3000;
const BASE_URL = `http://${HOST}:${PORT}`;
const SEQUENCER_URL = `${BASE_URL}/ad_sequencer_arc.html`;
const DEMO_DIR = path.resolve("demo");
const FINAL_VIDEO_PATH = path.join(DEMO_DIR, "arc-raiders-ad.mp4");
const VIDEO_SIZE = { width: 1080, height: 1920 }; // Vertical 9:16

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
    console.log(`Waiting for ${url} to be ready...`);
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

    // Start dev server if not running
    if (!(await isServerReady(BASE_URL))) {
        console.log("Starting local dev server...");
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

        // Wait for it to boot
        await sleep(5000);
    }

    try {
        await waitForServer(BASE_URL);

        console.log("Launching browser for video capture...");
        const browser = await chromium.launch({ headless: true });

        // Create context with video recording enabled
        const context = await browser.newContext({
            viewport: VIDEO_SIZE,
            recordVideo: {
                dir: DEMO_DIR,
                size: VIDEO_SIZE,
            },
        });

        const page = await context.newPage();

        console.log(`Navigating to ${SEQUENCER_URL}...`);
        await page.goto(SEQUENCER_URL, { waitUntil: "networkidle" });

        // Wait for the sequence to complete (approx 16-18 seconds based on code)
        console.log("Recording sequence...");
        await sleep(18000);

        // Close to save video
        await context.close();
        await browser.close();

        // Rename the random video file to our target name
        // Playwright saves as random GUID.webm usually
        const files = await fs.readdir(DEMO_DIR);
        // Find the most recent video file that isn't our target
        const videoFile = files
            .filter(f => f.endsWith(".webm") && f !== "arc-raiders-ad.mp4")
            .map(f => ({ name: f, time: (fs.stat(path.join(DEMO_DIR, f))).mtime }))
            .sort((a, b) => b.time - a.time)[0]; // This logic is approximate, better to use the page.video().path() if reliable, but context close is surer.

        // actually page.video() path is reliable
        // Let's rely on standard logic if we could, but I closed context.
        // Re-reading files is safer.

        // Actually, let's use the explicit rename from the list since we know it's the one we just made.
        // But wait, the previous script used `video.path()`. Let's stick to that pattern if I hadn't closed it.
        // Since I closed it, I'll allow the random name to exist, then find and rename it.

        // Wait, reusing the pattern from previous script is better:
        // const video = page.video(); ... const path = await video.path(); await video.saveAs(...); 
        // BUT video.saveAs() is what we want.
        // However, I already wrote the close. Let's just find the .webm file created in the last 30 seconds.

        // Actually, let's just use the `page.video()` API *before* closing.

    } finally {
        if (devServer?.pid) {
            console.log("Stopping dev server...");
            killProcessTree(devServer.pid);
        }
    }
}

// Re-writing run to be cleaner and actually use the API correctly
async function runCorrectly() {
    await fs.mkdir(DEMO_DIR, { recursive: true });

    let devServer = null;

    if (!(await isServerReady(BASE_URL))) {
        console.log("Starting dev server...");
        devServer = process.platform === "win32"
            ? spawn("cmd.exe", ["/c", "npm", "run", "dev", "--", "--hostname", HOST, "--port", String(PORT)], { stdio: "ignore" })
            : spawn("npm", ["run", "dev", "--", "--hostname", HOST, "--port", String(PORT)], { stdio: "ignore", detached: true });
    }

    try {
        await waitForServer(BASE_URL);

        const browser = await chromium.launch({ headless: true });
        const context = await browser.newContext({
            viewport: VIDEO_SIZE,
            recordVideo: { dir: DEMO_DIR, size: VIDEO_SIZE }
        });

        const page = await context.newPage();
        const video = page.video();

        console.log("Recording...");
        await page.goto(SEQUENCER_URL, { waitUntil: "networkidle" });

        // Wait for independent animation to finish
        await sleep(19000);

        // Close page to flush video
        await page.close();
        await context.close();
        await browser.close();

        if (video) {
            const vidPath = await video.path();
            await fs.copyFile(vidPath, FINAL_VIDEO_PATH);
            await fs.unlink(vidPath); // Clean up the guid file
            console.log(`SUCCESS: Video saved to ${FINAL_VIDEO_PATH}`);
        }

    } catch (e) {
        console.error(e);
    } finally {
        if (devServer?.pid) killProcessTree(devServer.pid);
    }
}

runCorrectly();
