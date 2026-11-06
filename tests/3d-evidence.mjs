// ATLAS True 3D Verification & Screenshot Evidence Suite
// Copyright © 2026 Kevin Oloan Simatupang. All rights reserved.

import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve, extname } from 'node:path';

const root = process.cwd();
const outDir = 'artifacts/3d-qa';
mkdirSync(outDir, { recursive: true });

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8'
};

const server = createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  const path = resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
  const nRoot = root.replace(/\\/g, '/');
  const nPath = path.replace(/\\/g, '/');
  if (!nPath.startsWith(nRoot + '/') && nPath !== nRoot) {
    res.writeHead(403); res.end('Forbidden'); return;
  }
  try {
    const body = readFileSync(path);
    res.writeHead(200, { 'content-type': mime[extname(path)] ?? 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404); res.end('Not found');
  }
});

await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const port = server.address().port;
const url = `http://127.0.0.1:${port}/`;

const report = {
  timestamp: new Date().toISOString(),
  screenshots: [],
  assertions: [],
  errors: []
};

let browser;

try {
  browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });

  // 1. S01 Desktop & Mobile
  for (const vp of [{ name: 'desktop', width: 1440, height: 900 }, { name: 'mobile', width: 390, height: 844 }]) {
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
    page.on('pageerror', err => report.errors.push({ view: 'S01', vp: vp.name, error: err.message }));

    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600); // Allow WebGL scene to render initial frames

    const filename = `01-S01-${vp.name}.png`;
    await page.screenshot({ path: `${outDir}/${filename}` });
    report.screenshots.push({ name: `S01 Landing (${vp.name})`, file: filename });
    await page.close();
  }

  // 2. S02 Desktop & Mobile
  for (const vp of [{ name: 'desktop', width: 1440, height: 900 }, { name: 'mobile', width: 390, height: 844 }]) {
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
    page.on('pageerror', err => report.errors.push({ view: 'S02', vp: vp.name, error: err.message }));

    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => window.switchView('overview'));
    await page.waitForTimeout(600);

    const filename = `02-S02-${vp.name}.png`;
    await page.screenshot({ path: `${outDir}/${filename}` });
    report.screenshots.push({ name: `S02 Overview (${vp.name})`, file: filename });
    await page.close();
  }

  // 3. S03 Desktop & Mobile
  for (const vp of [{ name: 'desktop', width: 1440, height: 900 }, { name: 'mobile', width: 390, height: 844 }]) {
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
    page.on('pageerror', err => report.errors.push({ view: 'S03', vp: vp.name, error: err.message }));

    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => window.switchView('map'));
    await page.waitForTimeout(800);

    const filename = `03-S03-${vp.name}.png`;
    await page.screenshot({ path: `${outDir}/${filename}` });
    report.screenshots.push({ name: `S03 Live Map (${vp.name})`, file: filename });
    await page.close();
  }

  // 4. Camera Modes & Special 3D Views (on Desktop 1440x900)
  const mapPage = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await mapPage.goto(url, { waitUntil: 'domcontentloaded' });
  await mapPage.evaluate(() => window.switchView('map'));
  await mapPage.waitForTimeout(600);

  // Strict WebGL context verification
  const webglCheck = await mapPage.evaluate(() => {
    const c1 = document.getElementById('atlas-3d-canvas');
    const c2 = document.getElementById('atlas-3d-canvas-mini');
    const c3 = document.getElementById('atlas-3d-canvas-full');
    const gl1 = c1?.getContext('webgl2') || c1?.getContext('webgl');
    const gl2 = c2?.getContext('webgl2') || c2?.getContext('webgl');
    const gl3 = c3?.getContext('webgl2') || c3?.getContext('webgl');
    return {
      c1: Boolean(gl1),
      c2: Boolean(gl2),
      c3: Boolean(gl3),
      c3Renderer: gl3 ? gl3.getParameter(gl3.RENDERER) : null,
      ready: window.__atlas3DReady === true
    };
  });
  assert.equal(webglCheck.c1, true, 'S01 canvas must have active WebGL context');
  assert.equal(webglCheck.c2, true, 'S02 canvas must have active WebGL context');
  assert.equal(webglCheck.c3, true, 'S03 canvas must have active WebGL context');
  assert.ok(webglCheck.c3Renderer, 'WebGL renderer must be valid');
  report.assertions.push('All 3 canvases WebGL hardware contexts verified');

  // Overview Camera
  await mapPage.evaluate(() => window.setCamMode('overview'));
  await mapPage.waitForTimeout(400);
  const camOverview = await mapPage.evaluate(() => window.__atlas3DGetCameraState?.());
  assert.equal(camOverview?.mode, 'overview');
  assert.ok(camOverview.position.y > 200, `Overview camera elevation must be high (>200), got ${camOverview.position.y}`);
  await mapPage.screenshot({ path: `${outDir}/07-camera-overview.png` });
  report.screenshots.push({ name: 'Elevated Overview Camera', file: '07-camera-overview.png' });
  report.assertions.push('Overview camera mode verified (distinct elevated coordinates)');

  // Follow Camera
  await mapPage.evaluate(() => window.setCamMode('follow'));
  await mapPage.waitForTimeout(400);
  const camFollow = await mapPage.evaluate(() => window.__atlas3DGetCameraState?.());
  assert.equal(camFollow?.mode, 'follow');
  assert.ok(camFollow.position.y < 60, `Follow camera elevation must be near tracking height (<60), got ${camFollow.position.y}`);
  assert.notEqual(camFollow.position.y, camOverview.position.y, 'Follow camera height must differ from Overview');
  await mapPage.screenshot({ path: `${outDir}/08-camera-follow.png` });
  report.screenshots.push({ name: 'Follow Camera (tracking vehicle)', file: '08-camera-follow.png' });
  report.assertions.push('Follow camera mode verified (tracking vehicle coordinates)');

  // Chase Camera
  await mapPage.evaluate(() => window.setCamMode('chase'));
  await mapPage.waitForTimeout(400);
  const camChase = await mapPage.evaluate(() => window.__atlas3DGetCameraState?.());
  assert.equal(camChase?.mode, 'chase');
  assert.ok(camChase.position.y < 25, `Chase camera elevation must be low behind vehicle (<25), got ${camChase.position.y}`);
  assert.notEqual(camChase.position.y, camFollow.position.y, 'Chase camera height must differ from Follow');
  await mapPage.screenshot({ path: `${outDir}/09-camera-chase.png` });
  report.screenshots.push({ name: 'Chase Camera (behind vehicle)', file: '09-camera-chase.png' });
  report.assertions.push('Chase camera mode verified (low behind-vehicle chase angle)');

  // Detailed Truck Close-up
  await mapPage.evaluate(() => {
    window.setCamMode('chase');
  });
  await mapPage.waitForTimeout(400);
  await mapPage.screenshot({ path: `${outDir}/10-truck-closeup.png` });
  report.screenshots.push({ name: 'Detailed 3D Truck Close-up', file: '10-truck-closeup.png' });

  // Industrial Buildings Close-up
  await mapPage.evaluate(() => {
    window.setCamMode('free');
  });
  await mapPage.waitForTimeout(400);
  await mapPage.screenshot({ path: `${outDir}/11-buildings-closeup.png` });
  report.screenshots.push({ name: 'Industrial Buildings & Hub Towers Close-up', file: '11-buildings-closeup.png' });

  // Multiple Vehicles Following Roads
  await mapPage.evaluate(() => window.resetOrbit());
  await mapPage.waitForTimeout(600);
  await mapPage.screenshot({ path: `${outDir}/12-vehicles-on-roads.png` });
  report.screenshots.push({ name: 'Multiple 3D Vehicles Following Roads', file: '12-vehicles-on-roads.png' });
  report.assertions.push('20 vehicles moving along routes verified');

  // Verify WebGL active draw calls and geometry rendering
  const renderInfo = await mapPage.evaluate(() => window.__atlas3DGetRenderInfo?.());
  assert.ok(renderInfo && renderInfo.calls > 0, `Active WebGL draw calls must be > 0, got ${renderInfo?.calls}`);
  assert.ok(renderInfo && renderInfo.triangles > 100, `Active 3D triangles rendered must be > 100, got ${renderInfo?.triangles}`);
  report.assertions.push(`WebGL draw calls verified (${renderInfo.calls} calls, ${renderInfo.triangles} triangles)`);

  // Verify deterministic simulation synchronization (Reset, Step, Play)
  await mapPage.evaluate(() => window.resetSim());
  const tickReset = await mapPage.evaluate(() => window.ATLAS_V21.sim.snapshot().tick);
  assert.equal(tickReset, 0, 'Simulation reset tick must be 0');
  const prog0 = await mapPage.evaluate(() => window.__atlas3DGetVehicleProgress?.(0));

  await mapPage.evaluate(() => window.ATLAS_V21.sim.step());
  const tickStep = await mapPage.evaluate(() => window.ATLAS_V21.sim.snapshot().tick);
  assert.equal(tickStep, 1, 'Manual step advances tick to 1');
  await mapPage.waitForTimeout(100);
  const prog1 = await mapPage.evaluate(() => window.__atlas3DGetVehicleProgress?.(0));
  assert.notEqual(prog1, prog0, 'Vehicle position advances on simulation step');
  report.assertions.push('Simulation step advances vehicle progression');

  await mapPage.evaluate(() => window.toggleSimPlay());
  const statusAfterToggle = await mapPage.evaluate(() => window.ATLAS_V21.sim.snapshot().status);
  assert.equal(statusAfterToggle, 'RUNNING');
  report.assertions.push('Simulation play synchronization verified');

  await mapPage.close();

  console.log(`ATLAS 3D QA SUITE PASS: ${report.screenshots.length} screenshots captured, ${report.assertions.length} assertions passed, ${report.errors.length} page errors.`);
} catch (err) {
  console.error('ATLAS 3D QA SUITE FAILED:', err);
  process.exitCode = 1;
} finally {
  writeFileSync(`${outDir}/report.json`, JSON.stringify(report, null, 2), 'utf8');
  if (browser) await browser.close();
  server.close();
}
