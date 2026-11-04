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
  assert.match(bridge, /\$\('svg-map'\)/);
});
