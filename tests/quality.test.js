import test from 'node:test';
import assert from 'node:assert/strict';
import { createAdaptiveQualityController } from '../src/3d/quality.js';

test('adaptive quality downgrades only after sustained slow frames', () => {
  const quality = createAdaptiveQualityController({ initial: 'high', downgradeAfter: 3 });
  quality.sample(30);
  quality.sample(30);
  assert.equal(quality.level, 'high');
  quality.sample(30);
  assert.equal(quality.level, 'balanced');
});

test('adaptive quality recovers after sustained fast frames', () => {
  const quality = createAdaptiveQualityController({ initial: 'balanced', upgradeAfter: 3 });
  quality.sample(8);
  quality.sample(8);
  assert.equal(quality.level, 'balanced');
  quality.sample(8);
  assert.equal(quality.level, 'high');
});

test('invalid or missing frame samples do not change quality', () => {
  const quality = createAdaptiveQualityController({ initial: 'low' });
  quality.sample(NaN);
  quality.sample(0);
  assert.equal(quality.level, 'low');
});
