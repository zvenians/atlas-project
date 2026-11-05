import test from 'node:test';
import assert from 'node:assert/strict';
import { createSimulation } from '../src/core/simulation.js';
import { createShipment, transitionShipment, parseAndValidateShipmentsCsv, exportShipmentsCsv } from '../src/core/shipments.js';

const fixture = [{ id: 'V-1', x: 100, y: 100, speed: 2 }];

test('same seed yields identical positions after equal ticks', () => {
  const a = createSimulation({ seed: 77, vehicles: fixture });
  const b = createSimulation({ seed: 77, vehicles: fixture });
  for (let i = 0; i < 5; i++) { a.step(); b.step(); }
  assert.deepEqual(a.snapshot().vehicles, b.snapshot().vehicles);
});

test('pause prevents automatic advance; step works; reset replays', () => {
  const sim = createSimulation({ seed: 77, vehicles: fixture });
  sim.pause();
  sim.advance();
  assert.equal(sim.snapshot().tick, 0);
  sim.step();
  const afterOne = sim.snapshot();
  assert.equal(afterOne.tick, 1);
  sim.reset();
  assert.equal(sim.snapshot().tick, 0);
  sim.step();
  assert.deepEqual(sim.snapshot().vehicles, afterOne.vehicles);
});

test('shipment validates input and enforces transitions', () => {
  assert.throws(() => createShipment({ id: '', origin: 'A', destination: 'B', weightKg: 10 }));
  const s0 = createShipment({ id: 'SHP-1', origin: 'Kariangau', destination: 'Samarinda', weightKg: 1200 });
  assert.throws(() => transitionShipment(s0, 'DELIVERED'));
  const s1 = transitionShipment(s0, 'READY', '2026-04-19T00:00:00Z');
  assert.equal(s1.status, 'READY');
  assert.equal(s1.history.length, 1);
});

test('simulation supports setSpeed and setScenario', () => {
  const sim = createSimulation({ seed: 77, vehicles: fixture });
  sim.setSpeed(2);
  sim.setScenario('TRAFFIC_DELAY');
  sim.step();
  const snap = sim.snapshot();
  assert.equal(snap.speedMultiplier, 2);
  assert.equal(snap.scenario, 'TRAFFIC_DELAY');
  assert.equal(snap.events[0].scenario, 'TRAFFIC_DELAY');
});

test('csv parsing and formula injection export sanitization', () => {
  const rawCsv = 'id,origin,destination,weightKg,status\n=SHP-101,+Kariangau,-Samarinda,500,READY\nSHP-101,Dup,Dup,100,DRAFT\nBAD,Row,OnlyThreeCols';
  const parsed = parseAndValidateShipmentsCsv(rawCsv);
  assert.equal(parsed.length, 1);
  assert.equal(parsed[0].id, 'SHP-101');
  assert.equal(parsed[0].origin, 'Kariangau');
  assert.equal(parsed[0].status, 'READY');

  const malicious = [{ id: '=CMD()', origin: '+A', destination: '-B', weightKg: 10, status: 'DRAFT' }];
  const exported = exportShipmentsCsv(malicious);
  assert.ok(exported.includes("'=CMD()"));
  assert.ok(exported.includes("'+A"));
});

test('simulation bridge contract emits immutable snapshots for all controls', () => {
  const seen = [];
  const sim = createSimulation({ seed: 77, vehicles: fixture });
  const unsub = sim.subscribe(s => seen.push({ tick: s.tick, status: s.status, speed: s.speedMultiplier, scenario: s.scenario }));
  assert.equal(sim.getSnapshot().status, 'PAUSED');
  sim.play(); sim.step(); sim.setSpeed(4); sim.setScenario('SIGNAL_LOSS'); sim.pause(); sim.reset();
  unsub();
  assert.deepEqual(seen.map(s => s.status), ['RUNNING', 'RUNNING', 'RUNNING', 'RUNNING', 'PAUSED', 'PAUSED']);
  assert.equal(seen.at(-1).tick, 0);
});

test('invalid prototype speed and scenario are rejected', () => {
  const sim = createSimulation({ seed: 77, vehicles: fixture });
  assert.throws(() => sim.setSpeed(5), RangeError);
  assert.throws(() => sim.setScenario('NONEXISTENT'), RangeError);
});

test('B-P0-03: csv parser handles RFC-4180 quoted commas, multiline fields, escaped quotes, and unicode', () => {
  const csv = [
    '\uFEFFid,origin,destination,weightKg,status',
    '"SHP-201","Kariangau Terminal, Gate 2","Balikpapan, Depot ""A""",1450.5,READY',
    '"SHP-202","Pelabuhan Semayang\nDermaga Utara","Sepinggan Cargo, Blok Timur",820,IN_TRANSIT'
  ].join('\r\n');
  const parsed = parseAndValidateShipmentsCsv(csv);
  assert.equal(parsed.length, 2);
  assert.deepEqual(parsed[0], {
    id: 'SHP-201',
    origin: 'Kariangau Terminal, Gate 2',
    destination: 'Balikpapan, Depot "A"',
    weightKg: 1450.5,
    status: 'READY',
    history: []
  });
  assert.equal(parsed[1].id, 'SHP-202');
  assert.equal(parsed[1].origin, 'Pelabuhan Semayang Dermaga Utara');
  assert.equal(parsed[1].destination, 'Sepinggan Cargo, Blok Timur');
  assert.equal(parsed[1].weightKg, 820);
  assert.equal(parsed[1].status, 'IN_TRANSIT');
});

test('B-P0-03: csv parser strips stacked/whitespace formula prefixes, rejects malformed weights, and enforces size limits', () => {
  const adversarialCsv = [
    'id,origin,destination,weightKg,status',
    '"==SHP-301","\t+Kariangau"," -Sepinggan",900,READY',
    'SHP-BAD-WEIGHT,Origin,Dest,500abc,READY',
    'SHP-UNCLOSED,"Origin without closing quote,Dest,100,READY'
  ].join('\n');
  const parsed = parseAndValidateShipmentsCsv(adversarialCsv);
  assert.equal(parsed.length, 1);
  assert.equal(parsed[0].id, 'SHP-301');
  assert.equal(parsed[0].origin, 'Kariangau');
  assert.equal(parsed[0].destination, 'Sepinggan');

  const exported = exportShipmentsCsv([{ id: '\t=CMD', origin: 'Kariangau, Gate 2', destination: 'A"B', weightKg: 100, status: 'READY' }]);
  assert.match(exported, /"'\t=CMD"/);
  assert.match(exported, /"Kariangau, Gate 2"/);
  assert.match(exported, /"A""B"/);

  const oversized = 'id,origin,destination,weightKg\n' + 'S-1,A,B,100\n'.repeat(1005);
  assert.throws(() => parseAndValidateShipmentsCsv(oversized), RangeError);
});
