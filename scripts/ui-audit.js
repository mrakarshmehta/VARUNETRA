/**
 * VARUNETRA Automated Overflow & Layout Auditor
 * Runs headlessly via Playwright (using system MSEdge/Chromium)
 * Audits 1440x900, 1920x1080, and 1024x768 across all operational modules.
 */

const path = require('path');
const fs = require('fs');

let chromium;
try {
  chromium = require('playwright').chromium;
} catch (e) {
  chromium = require(path.resolve(__dirname, '../frontend/node_modules/playwright')).chromium;
}

const RESOLUTIONS = [
  { width: 1440, height: 900, name: '1440x900' },
  { width: 1920, height: 1080, name: '1920x1080' },
  { width: 1024, height: 768, name: '1024x768' },
];

const MODULES = [
  { id: 'overview', name: '01-overview' },
  { id: 'nowcast', name: '02-nowcast' },
  { id: 'rainfall', name: '03-rainfall' },
  { id: 'drainage', name: '04-drainage' },
  { id: 'terrain', name: '04b-terrain' },
  { id: 'routing', name: '05-routing' },
  { id: 'sos', name: '06-sos' },
  { id: 'shelters', name: '07-shelters' },
  { id: 'pumps', name: '08-pumps' },
  { id: 'relief', name: '09-relief' },
  { id: 'damage', name: '10-damage' },
  { id: 'ml', name: '11-ml-center' },
  { id: 'citizen', name: '12-citizen-portal' },
  { id: 'reports', name: '13-reports' },
];

async function runAudit() {
  console.log('🚀 Starting VARUNETRA Automated Overflow & Layout Audit...');

  let browser;
  try {
    browser = await chromium.launch({ channel: 'msedge', headless: true });
  } catch (e) {
    browser = await chromium.launch({ headless: true });
  }

  const BASE_URL = process.env.AUDIT_URL || 'http://localhost:5173';
  const outBase = path.resolve(__dirname, '..', 'docs', 'ui-audit');

  let totalViolations = 0;
  const violationLog = [];

  for (const res of RESOLUTIONS) {
    const resDir = path.join(outBase, res.name);
    fs.mkdirSync(resDir, { recursive: true });

    console.log(`\n📐 Testing Resolution: ${res.name} (${res.width}x${res.height})`);

    const page = await browser.newPage({
      viewport: { width: res.width, height: res.height },
    });

    try {
      await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 15000 });
    } catch (e) {
      await page.goto(BASE_URL, { waitUntil: 'load', timeout: 15000 });
    }
    await page.waitForTimeout(2000);

    for (const mod of MODULES) {
      // Switch module if not overview
      if (mod.id === 'citizen') {
        // Switch to citizen role
        await page.evaluate(() => {
          // Find button containing COMMAND / role or trigger directly
          const btns = Array.from(document.querySelectorAll('button'));
          const roleBtn = btns.find(b => b.textContent && (b.textContent.includes('COMMAND') || b.textContent.includes('INCIDENT') || b.textContent.includes('DISPATCH') || b.textContent.includes('CITIZEN')));
          if (roleBtn) roleBtn.click();
        });
        await page.waitForTimeout(300);
        await page.evaluate(() => {
          const btns = Array.from(document.querySelectorAll('button'));
          const citizenBtn = btns.find(b => b.textContent && b.textContent.includes('Citizen'));
          if (citizenBtn) citizenBtn.click();
        });
        await page.waitForTimeout(600);
      } else if (mod.id !== 'overview') {
        const button = page.locator(`button[data-module="${mod.id}"], [data-testid="nav-${mod.id}"]`);
        if (await button.count() > 0) {
          await button.first().click();
          await page.waitForTimeout(600);
        } else {
          // Fallback to evaluating JS
          await page.evaluate((mId) => {
            const el = document.querySelector(`[data-module="${mId}"]`);
            if (el) el.click();
          }, mod.id);
          await page.waitForTimeout(600);
        }
      }

      // Check 1: Document Root Horizontal Overflow
      const docOverflow = await page.evaluate(() => {
        const root = document.documentElement;
        return {
          scrollWidth: root.scrollWidth,
          clientWidth: root.clientWidth,
          hasOverflow: root.scrollWidth > root.clientWidth + 1, // 1px subpixel tolerance
        };
      });

      if (docOverflow.hasOverflow) {
        const msg = `[${res.name}] [${mod.name}] Document horizontal overflow: scrollWidth=${docOverflow.scrollWidth} > clientWidth=${docOverflow.clientWidth}`;
        violationLog.push(msg);
        console.error(`  ❌ ${msg}`);
        totalViolations++;
      }

      // Check 2: Button text wrapping audit
      const buttonWrapping = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const wrapped = [];
        for (const btn of buttons) {
          if (!btn.offsetParent) continue; // skip hidden
          const style = window.getComputedStyle(btn);
          const text = btn.innerText?.trim();
          if (!text || text.length === 0) continue;
          const rect = btn.getBoundingClientRect();
          const lineHeight = parseFloat(style.lineHeight) || parseFloat(style.fontSize) * 1.2;
          // If height is more than 2.3x line-height and it has text, button has wrapped lines
          if (rect.height > lineHeight * 2.3 && style.whiteSpace !== 'nowrap') {
            wrapped.push({
              text: text.slice(0, 30),
              height: rect.height,
              lineHeight,
            });
          }
        }
        return wrapped;
      });

      if (buttonWrapping.length > 0) {
        buttonWrapping.forEach((w) => {
          const msg = `[${res.name}] [${mod.name}] Button text wrapped: "${w.text}" (height: ${w.height}px)`;
          violationLog.push(msg);
          console.error(`  ❌ ${msg}`);
          totalViolations++;
        });
      }

      // Check 3: Check visible element overflow without scroll / ellipsis
      const elementOverflows = await page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('*'));
        const overflowing = [];
        for (const el of elements) {
          if (!el.offsetParent) continue;
          const tag = el.tagName.toLowerCase();
          if (['svg', 'path', 'canvas', 'map'].includes(tag)) continue;
          if (el.classList.contains('leaflet-container') || el.classList.contains('cesium-widget')) continue;

          const style = window.getComputedStyle(el);
          const overflowX = style.overflowX;
          if (overflowX === 'auto' || overflowX === 'scroll' || overflowX === 'hidden') continue;

          if (el.scrollWidth > el.clientWidth + 4 && el.clientWidth > 0) {
            // Check if it's text without ellipsis
            if (style.textOverflow !== 'ellipsis' && el.children.length === 0) {
              overflowing.push({
                tag,
                class: el.className?.slice ? el.className.slice(0, 40) : '',
                scrollWidth: el.scrollWidth,
                clientWidth: el.clientWidth,
              });
            }
          }
        }
        return overflowing.slice(0, 5); // limit output
      });

      if (elementOverflows.length > 0) {
        elementOverflows.forEach((e) => {
          const msg = `[${res.name}] [${mod.name}] Element overflow without ellipsis: <${e.tag} class="${e.class}"> (${e.scrollWidth}px > ${e.clientWidth}px)`;
          violationLog.push(msg);
          console.error(`  ⚠️ ${msg}`);
        });
      }

      // Capture screenshot
      const screenPath = path.join(resDir, `${mod.name}.png`);
      await page.screenshot({ path: screenPath });
      console.log(`  📸 Saved: docs/ui-audit/${res.name}/${mod.name}.png`);
    }

    // Also capture /dev/primitives
    try {
      await page.evaluate(() => {
        window.location.hash = 'dev/primitives';
        window.dispatchEvent(new HashChangeEvent('hashchange'));
      });
      await page.waitForTimeout(800);
      const primPath = path.join(resDir, `00-dev-primitives.png`);
      await page.screenshot({ path: primPath });
      console.log(`  📸 Saved: docs/ui-audit/${res.name}/00-dev-primitives.png`);
    } catch (e) {
      // Ignore if route not active
    }

    await page.close();
  }

  await browser.close();

  console.log('\n======================================================');
  console.log(`Audit Summary: ${totalViolations} blocking violations found.`);
  if (totalViolations > 0) {
    console.log('Violation Log:');
    violationLog.forEach((v) => console.log(' - ' + v));
  } else {
    console.log('✅ ALL RESOLUTIONS CLEAN! Zero page overflow, zero wrapping buttons.');
  }
  console.log('======================================================\n');

  if (totalViolations > 0) {
    process.exit(1);
  }
}

runAudit().catch((err) => {
  console.error('Audit fatal error:', err);
  process.exit(1);
});
