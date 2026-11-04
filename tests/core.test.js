import test from 'node:test';
import assert from 'node:assert/strict';
import { createSimulation } from '../src/core/simulation.js';
import { createShipment, transitionShipment, parseAndValidateShipmentsCsv, exportShipmentsCsv } from '../src/core/shipments.js';

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

test('simulation supports setSpeed and setScenario', () => {
  const sim = createSimulation({ seed: 77, vehicles: [{ id: 'V-1', x: 10, y: 20 }] });
  sim.setSpeed(2);
  assert.equal(sim.snapshot().speedMultiplier, 2);
  sim.setScenario('TRAFFIC_DELAY');
  assert.equal(sim.snapshot().scenario, 'TRAFFIC_DELAY');
});

test('csv parsing and formula injection export sanitization', () => {
  const csv = `id,origin,destination,weightKg\nS-1,JKT,SUB,500\n=CMD,A,B,100\nS-1,JKT,SUB,200`;
  const parsed = parseAndValidateShipmentsCsv(csv);
  assert.equal(parsed.length, 2);
  const exported = exportShipmentsCsv([{ id: '=CMD', origin: 'A', destination: 'B', weightKg: 100, status: 'DRAFT' }]);
  assert.match(exported, /'=CMD/);
});

test('simulation bridge contract emits immutable snapshots for all controls', () => {
  const sim = createSimulation({ seed: 77, vehicles: [{ id: 'V-1', x: 10, y: 20, speed: 2 }] });
  const seen = [];
  const unsubscribe = sim.subscribe(s => seen.push(s));
  assert.deepEqual(sim.getSnapshot(), sim.snapshot());
  sim.play(); sim.step(); sim.setSpeed(2); sim.setScenario('TRAFFIC_DELAY'); sim.pause(); sim.reset();
  assert.equal(seen.length, 6);
  assert.equal(sim.snapshot().tick, 0);
  assert.equal(sim.snapshot().status, 'PAUSED');
  seen[1].vehicles[0].x = 123456;
  assert.notEqual(sim.snapshot().vehicles[0].x, 123456);
  unsubscribe(); sim.play();
  assert.equal(seen.length, 6);
});

test('invalid prototype speed and scenario are rejected', () => {
  const sim = createSimulation();
  assert.throws(() => sim.setSpeed(5), RangeError);
  assert.throws(() => sim.setScenario('NONEXISTENT'), RangeError);
});
