/**
 * VARUNETRA Backup Demo Video Recorder
 * Uses Playwright's native recordVideo to record the complete 15-stage scenario
 * Output: docs/demo-video/varunetra_scenario_demo.webm
 */

const path = require('path');
const fs = require('fs');

let chromium;
try {
  chromium = require('playwright').chromium;
} catch (e) {
  chromium = require(path.resolve(__dirname, '../frontend/node_modules/playwright')).chromium;
}

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';
const VIDEO_DIR = path.resolve(__dirname, '../docs/demo-video');
fs.mkdirSync(VIDEO_DIR, { recursive: true });

async function recordScenario() {
  console.log('🎬 Starting VARUNETRA Full Demo Scenario Video Recording...\n');

  // Reset to clean baseline first
  try {
    const http = require('http');
    await new Promise((resolve) => {
      const req = http.request(
        {
          hostname: 'localhost',
          port: 8000,
          path: '/api/demo/scenario/reset',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        },
        (res) => {
          res.on('data', () => {});
          res.on('end', resolve);
        }
      );
      req.on('error', resolve);
      req.end();
    });
  } catch (e) {}

  let browser;
  try {
    browser = await chromium.launch({ channel: 'msedge', headless: true });
  } catch (e) {
    browser = await chromium.launch({ headless: true });
  }

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: {
      dir: VIDEO_DIR,
      size: { width: 1440, height: 900 },
    },
  });

  const page = await context.newPage();

  console.log('▶ Navigating to Baseline...');
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000); // 2s baseline view

  console.log('▶ Starting Emergency Scenario...');
  const startBtn = page.locator('button:has-text("START EMERGENCY SCENARIO")').first();
  await startBtn.click();
  await page.waitForTimeout(2000); // 2s started view

  console.log('▶ Inspecting Situation Board...');
  const sitBtn = page.locator('button:has-text("Situation Board")').first();
  if (await sitBtn.isVisible()) {
    await sitBtn.click();
    await page.waitForTimeout(2500); // Show situation board
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);
  }

  console.log('▶ Stepping through all stages...');
  const stepBtn = page.locator('button:has-text("Step")').first();

  for (let s = 3; s <= 15; s++) {
    // If outcome modal has already opened, we've reached completion
    const autoOutcomeBtn = page.locator('button:has-text("Close Summary")').first();
    if (await autoOutcomeBtn.isVisible()) {
      break;
    }

    if (await stepBtn.isVisible()) {
      await stepBtn.click().catch(() => {});
      // Pause slightly longer on key narrative phases for clear video playback
      if ([4, 6, 8, 9, 11, 12, 14, 15].includes(s)) {
        await page.waitForTimeout(1400);
      } else {
        await page.waitForTimeout(900);
      }
    }
  }

  console.log('▶ Viewing Outcome Debrief Modal...');
  await page.waitForTimeout(2500); // View outcome summary modal

  console.log('▶ Exiting and saving video...');
  const videoObj = page.video();
  await page.close();
  await context.close();
  await browser.close();

  if (videoObj) {
    const videoPath = await videoObj.path();
    const finalDest = path.join(VIDEO_DIR, 'varunetra_scenario_demo.webm');
    fs.copyFileSync(videoPath, finalDest);
    console.log(`\n✅ Backup demo video saved successfully to: ${finalDest}\n`);
  }
}

recordScenario().catch(console.error);
