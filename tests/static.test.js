import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Script } from 'node:vm';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const bridge = readFileSync(new URL('../src/legacy-integration.js', import.meta.url), 'utf8');

test('single HTML document, no duplicate ids, no blocking fake alerts', () => {
  for (const tag of [/<!doctype/gi, /<html\b/gi, /<head\b/gi, /<body\b/gi, /<\/body>/gi, /<\/html>/gi]) {
    assert.equal([...html.matchAll(tag)].length, 1, String(tag));
  }
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  assert.equal(new Set(ids).size, ids.length, 'duplicate DOM id');
  assert.doesNotMatch(html, /\balert\s*\(/);
});

test('all legacy operation panels remain available at opt-in legacy route', () => {
  for (const id of [
    'atlas-legacy-workspace', 'sec-overview', 'sec-shipments', 'sec-dispatch',
    'sec-fleet', 'sec-pwa', 'sec-alerts', 'sec-analytics', 'sig-canvas',
    'modal-new-shipment', 'modal-csv-import'
  ]) assert.ok(html.includes('id="' + id + '"'), id);
  assert.match(html, /#legacy/);
});

test('all inline browser scripts can be parsed', () => {
  let n = 0;
  for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    if (/\bsrc=/.test(match[1]) || !match[2].trim()) continue;
    assert.doesNotThrow(() => new Script(match[2], { filename: 'inline-' + (++n) + '.js' }));
  }
  assert.ok(n >= 3);
});

test('bridge uses scoped map selector and subscribed engine contract', () => {
  assert.doesNotMatch(bridge, /document\.querySelector\('svg'\)/);
  assert.match(bridge, /sim\.subscribe\(render\)/);
  assert.match(bridge, /speedMultiplier/);
  assert.match(bridge, /\$\(['"]#?svg-map['"]\)/,
    'normalized svg-map selectors must target the specific map');
  assert.match(bridge, /const\s+\$\s*=\s*\(id\)\s*=>/,
    'map selector helper must remain defined');
});

test('B-P0-02: camera and simulation controls have one authoritative bridge', () => {
  assert.doesNotMatch(html, /function\s+resetOrbit\s*\(\s*\)\s*\{\s*\}/,
    'do not retain an empty inline no-op');
  for (const handler of ['setCamMode', 'resetOrbit', 'toggleSimPlay', 'resetSim']) {
    assert.match(bridge, new RegExp('window\\.' + handler + '\\s*=\\s*function'),
      handler + ' must be implemented by the canonical module');
  }
  assert.match(bridge, /atlasLegacyNotice/, 'unavailable GIS controls need honest notices');
  assert.match(bridge, /window\.ATLAS_V21\.sim/, 'simulation UI must read canonical state');
});

test('B-P0-04: canvas animation loops and legacy timers gate on visibility and clean up on pagehide', () => {
  assert.match(html, /cancelAnimationFrame/, 'canvas loops must support cancelAnimationFrame when view is hidden');
  assert.match(html, /__atlasCanvasLoops/, 'actual renderer owns lifecycle controller');
  assert.match(html, /scheduledFrame\s*=\s*requestAnimationFrame\(render\)/,
    'each visible canvas must track its actual requestAnimationFrame ID');
  assert.doesNotMatch(bridge, /window\.__atlasCanvasLoops\s*=/,
    'legacy bridge must not overwrite the authoritative canvas controller');
  assert.match(html, /visibilitychange/, 'canvas loops must pause when document is hidden');
  assert.match(bridge, /pauseAnimations/, 'legacy SVG SMIL animations must pause when legacy map is hidden');
  assert.match(bridge, /pageshow.*startLocalSimulationTicker/,
    'simulation ticker must resume when restored from bfcache');
  assert.match(bridge, /stopLocalSimulationTicker\(\)/,
    'pagehide must stop simulation ticker without leaking intervals');
  });
