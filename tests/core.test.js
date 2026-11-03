import test from 'node:test';
import assert from 'node:assert/strict';
import { createSimulation } from '../src/core/simulation.js';
import { createShipment, transitionShipment } from '../src/core/shipments.js';
test('same seed yields identical positions after equal ticks', () => {
  const options = { seed: 77, vehicles: [{ id: 'V-1', x: 10, y: 20, speed: 2 }] };
  const a = createSimulation(options), b = createSimulation(options);
  for (let i = 0; i < 20; i++) assert.deepEqual(a.step(), b.step());
});
test('pause prevents automatic advance; step works; reset replays', () => {
  const sim = createSimulation({ vehicles: [{ id: 'V-1', x: 1, y: 2 }] });
  assert.equal(sim.advance().tick, 0);
  const first = sim.step().vehicles;
  sim.play(); assert.equal(sim.advance().tick, 2);
  sim.pause(); assert.equal(sim.advance().tick, 2);
  sim.reset(); assert.deepEqual(sim.step().vehicles, first);
});
test('shipment validates input and enforces transitions', () => {
  assert.throws(() => createShipment({ id: '', origin: 'A', destination: 'B', weightKg: 2 }));
  const draft = createShipment({ id: 'S-1', origin: 'A', destination: 'B', weightKg: 2 });
  assert.throws(() => transitionShipment(draft, 'DELIVERED'));
  const ready = transitionShipment(draft, 'READY', '2026-01-01T00:00:00Z');
  assert.equal(ready.status, 'READY'); assert.equal(draft.status, 'DRAFT');
  assert.equal(ready.history.length, 1);
});
