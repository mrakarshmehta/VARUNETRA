/**
 * VARUNETRA — Autonomous Terrain Validation Screenshot Capturer
 * Captures high-resolution visual proof of Copernicus GLO-30 DSM integration:
 * 1. Real elevation layer & contours
 * 2. Terrain Inspector with active Patna locations (Saidpur, Rajendra Nagar, PMCH...)
 * 3. Synthetic vs Real Copernicus quantitative comparison
 * 4. 6-stage causality chain: REAL DEM -> terrain features -> drainage -> depth -> road impact -> routing
 * 5. 3D City view with compact "Terrain Source: Copernicus GLO-30" panel & 3D low points
 * 6. Flood + terrain coupling on 2D GIS Map
 */

const path = require('path');
const fs = require('fs');

let chromium;
try {
  chromium = require('playwright').chromium;
} catch (e) {
  chromium = require(path.resolve(__dirname, '../frontend/node_modules/playwright')).chromium;
}

const ARTIFACT_DIR = 'C:/Users/AKARSH RAJ/.gemini/antigravity-ide/brain/53fe959f-7173-45b4-a926-709a29c43ceb';
const LOCAL_DIR = path.resolve(__dirname, '..', 'docs', 'terrain-proof');

async function captureProof() {
  console.log('🚀 Starting VARUNETRA Real Terrain Visual Proof Capturer...');

  fs.mkdirSync(LOCAL_DIR, { recursive: true });
  if (fs.existsSync(ARTIFACT_DIR)) {
    fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  }

  let browser;
  try {
    browser = await chromium.launch({ channel: 'msedge', headless: true });
  } catch (e) {
    browser = await chromium.launch({ headless: true });
  }

  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
  });

  const BASE_URL = 'http://localhost:5173';

  console.log('Connecting to', BASE_URL);
  try {
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 15000 });
  } catch (e) {
    await page.goto(BASE_URL, { waitUntil: 'load', timeout: 15000 });
  }
  await page.waitForTimeout(2500);

  // Helper to save screenshot both locally and to artifact directory
  async function saveScreenshot(filename, description) {
    const localPath = path.join(LOCAL_DIR, filename);
    await page.screenshot({ path: localPath });
    console.log(`📸 [Saved] ${description} -> ${localPath}`);

    try {
      const artPath = path.join(ARTIFACT_DIR, filename);
      fs.copyFileSync(localPath, artPath);
      console.log(`   Artifact mirrored: ${artPath}`);
    } catch (err) {
      console.warn('   Artifact mirror warning:', err.message);
    }
  }

  // 1. Switch to 2D Operations View first & capture GIS map with terrain coupling
  console.log('\n--- Capturing 2D Operations View ---');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const opBtn = btns.find(b => b.textContent && b.textContent.includes('2D Operations'));
    if (opBtn) opBtn.click();
  });
  await page.waitForTimeout(2000);
  await saveScreenshot('06_2d_operations_flood_terrain_coupling.png', '2D Operations Flood + Terrain Coupling');

  // 2. Switch to Terrain Module
  console.log('\n--- Switching to Terrain Intelligence Module ---');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button, a'));
    const terrainBtn = btns.find(b => b.textContent && b.textContent.includes('Terrain'));
    if (terrainBtn) terrainBtn.click();
  });
  await page.waitForTimeout(2000);

  // A. Terrain Inspector Tab with Saidpur Sump
  console.log('Inspecting Saidpur Canal Sump...');
  await page.evaluate(() => {
    // Click Saidpur hotspot in preset list
    const items = Array.from(document.querySelectorAll('*'));
    const saidpur = items.find(el => el.textContent && el.textContent.includes('Saidpur Canal Trunk Invert') && el.tagName === 'DIV');
    if (saidpur) saidpur.click();
  });
  await page.waitForTimeout(1500);
  await saveScreenshot('01_real_terrain_inspector_saidpur.png', 'Terrain Inspector — Saidpur Canal Trunk Sump (52.08m MSL)');

  // Also inspect PMCH high ground ridge
  console.log('Inspecting PMCH Ganga Ridge...');
  await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('*'));
    const pmch = items.find(el => el.textContent && el.textContent.includes('PMCH Ganga Ridge Embankment') && el.tagName === 'DIV');
    if (pmch) pmch.click();
  });
  await page.waitForTimeout(1500);
  await saveScreenshot('01b_real_terrain_inspector_pmch_ridge.png', 'Terrain Inspector — PMCH Ganga Ridge High Ground (54.86m MSL)');

  // Reset back to Saidpur
  await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('*'));
    const saidpur = items.find(el => el.textContent && el.textContent.includes('Saidpur Canal Trunk Invert') && el.tagName === 'DIV');
    if (saidpur) saidpur.click();
  });
  await page.waitForTimeout(1000);

  // B. Synthetic vs Copernicus Comparison Tab
  console.log('Opening Synthetic vs Copernicus Tab...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const compBtn = btns.find(b => b.textContent && b.textContent.includes('Synthetic vs Copernicus'));
    if (compBtn) compBtn.click();
  });
  await page.waitForTimeout(1500);
  await saveScreenshot('02_synthetic_vs_copernicus_comparison.png', 'Synthetic Pilot vs Real Copernicus GLO-30 DSM Comparison');

  // C. Terrain -> Routing Causality Chain Tab
  console.log('Opening Terrain -> Routing Chain Tab...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const causeBtn = btns.find(b => b.textContent && b.textContent.includes('Terrain → Routing Chain'));
    if (causeBtn) causeBtn.click();
  });
  await page.waitForTimeout(1500);
  await saveScreenshot('03_terrain_routing_causality_chain.png', '6-Stage Causality Chain: REAL DEM -> Drainage -> Flood Depth -> Road Impact -> Routing');

  // D. GIS Layers & Contours Tab
  console.log('Opening GIS Layers & Contours Tab...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const layersBtn = btns.find(b => b.textContent && b.textContent.includes('GIS Layers & Contours'));
    if (layersBtn) layersBtn.click();
  });
  await page.waitForTimeout(1500);
  await saveScreenshot('04_terrain_gis_layers_contours.png', 'Real Elevation Layer, 5m Contours & Hypsometric Bands');

  // 3. Switch to 3D City View (CesiumJS)
  console.log('\n--- Switching to 3D City View ---');
  await page.evaluate(() => {
    // Click "2D GIS View" button inside terrain module header to return to main map view
    const allBtns = Array.from(document.querySelectorAll('button, a'));
    const mapBtn = allBtns.find(b => b.textContent && (b.textContent.includes('2D GIS View') || b.textContent.includes('Overview')));
    if (mapBtn) mapBtn.click();
  });
  await page.waitForTimeout(1500);

  // Now click "3D CITY" segmented toggle button
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const city3dBtn = btns.find(b => b.textContent && b.textContent.includes('3D CITY'));
    if (city3dBtn) city3dBtn.click();
  });
  console.log('Waiting for 3D City digital twin scene to load...');
  await page.waitForTimeout(7000); // Allow CesiumJS to render terrain, HUD, and entities
  await saveScreenshot('05_3d_city_terrain_source_hud.png', '3D City Digital Twin with Copernicus GLO-30 Terrain Source HUD & 3D Low Points');

  console.log('\n✅ All visual proof screenshots captured successfully!');
  await browser.close();
}

captureProof().catch(err => {
  console.error('Fatal error capturing screenshots:', err);
  process.exit(1);
});
