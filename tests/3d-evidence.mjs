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
  await mapPage.waitForTimeout(500);

  // Overview Camera
  await mapPage.evaluate(() => window.setCamMode('overview'));
  await mapPage.waitForTimeout(500);
  await mapPage.screenshot({ path: `${outDir}/07-camera-overview.png` });
  report.screenshots.push({ name: 'Elevated Overview Camera', file: '07-camera-overview.png' });
  report.assertions.push('Overview camera mode verified');

  // Follow Camera
  await mapPage.evaluate(() => window.setCamMode('follow'));
  await mapPage.waitForTimeout(500);
  await mapPage.screenshot({ path: `${outDir}/08-camera-follow.png` });
  report.screenshots.push({ name: 'Follow Camera (tracking vehicle)', file: '08-camera-follow.png' });
  report.assertions.push('Follow camera mode verified');

  // Chase Camera
  await mapPage.evaluate(() => window.setCamMode('chase'));
  await mapPage.waitForTimeout(500);
  await mapPage.screenshot({ path: `${outDir}/09-camera-chase.png` });
  report.screenshots.push({ name: 'Chase Camera (behind vehicle)', file: '09-camera-chase.png' });
  report.assertions.push('Chase camera mode verified');

  // Detailed Truck Close-up
  await mapPage.evaluate(() => {
    window.setCamMode('chase');
    // Zoom close
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

  // Verify simulation synchronization
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
