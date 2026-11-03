import { createSimulation } from './core/simulation.js';
import { createShipment, transitionShipment } from './core/shipments.js';

// v2.1 progressive enhancement: preserve legacy page while replacing selected demo-only handlers.
const $ = (id) => document.getElementById(id);
const sim = createSimulation({
  seed: 77,
  vehicles: Array.from({ length: 20 }, (_, i) => ({
    id: i + 1, x: 150 + (i * 37) % 700, y: 80 + (i * 53) % 350, speed: 2
  }))
});
let shipments = [];
let nextId = 1;
const notice = document.createElement('div');
notice.setAttribute('role', 'status');
notice.setAttribute('aria-live', 'polite');
notice.className = 'fixed bottom-4 right-4 z-50 bg-slate-900 border border-teal text-teal p-3 rounded-lg text-xs max-w-xs shadow-xl';
notice.textContent = 'v2.1 demo engine ready — simulation is local, not live GPS.';
document.body.appendChild(notice);
function notify(message) { notice.textContent = message; }
function render(snapshot) {
  for (const v of snapshot.vehicles) {
    const dot = $('veh-' + v.id);
    if (dot) { dot.setAttribute('cx', v.x); dot.setAttribute('cy', v.y); }
  }
  const badge = $('atlas-sim-status');
  if (badge) badge.textContent = 'SIM: ' + snapshot.status + ' · TICK ' + snapshot.tick;
}
const statusBadge = document.createElement('span');
statusBadge.id = 'atlas-sim-status';
statusBadge.className = 'text-xs font-mono text-teal';
$('btn-pause')?.parentElement?.appendChild(statusBadge);
render(sim.snapshot());
window.setSimState = (state) => {
  if (state === 'RUNNING') sim.play();
  else if (state === 'PAUSED') sim.pause();
  render(sim.snapshot());
  notify('Simulation ' + sim.snapshot().status + ' (local demo)');
};
window.stepSim = () => { render(sim.step()); notify('Advanced one deterministic simulation tick'); };
setInterval(() => render(sim.advance()), 1000);
window.changeScenario = (scenario) => {
  sim.reset();
  render(sim.snapshot());
  notify('Scenario ' + scenario + ' selected. Preset effects are not implemented yet.');
};
window.changeRole = (role) => {
  notify('UI preview role: ' + role + '. This is NOT server authorization.');
};
function appendShipmentRow(shipment) {
  const row = document.createElement('tr');
  row.dataset.shipmentId = shipment.id;
  const values = [shipment.id, shipment.origin + ' → ' + shipment.destination, shipment.weightKg.toLocaleString('en-US') + ' kg', 'UNASSIGNED', shipment.status];
  for (const value of values) {
    const td = document.createElement('td');
    td.className = 'p-3';
    td.textContent = value;
    row.appendChild(td);
  }
  const actions = document.createElement('td');
  actions.className = 'p-3';
  const button = document.createElement('button');
  button.className = 'text-copper underline';
  button.textContent = 'Mark Ready';
  button.addEventListener('click', () => {
    const idx = shipments.findIndex(s => s.id === shipment.id);
    if (idx < 0 || shipments[idx].status !== 'DRAFT') return;
    shipments[idx] = transitionShipment(shipments[idx], 'READY');
    row.children[4].textContent = 'READY';
    button.disabled = true;
    button.textContent = 'Ready';
    notify(shipment.id + ' transitioned to READY');
  });
  actions.appendChild(button);
  row.appendChild(actions);
  $('shipment-tbody')?.appendChild(row);
}
window.saveNewShipment = () => {
  const fields = document.querySelectorAll('#modal-new-shipment input');
  const origin = fields[0]?.value.trim();
  const destination = fields[1]?.value.trim();
  const cargo = fields[2]?.value.trim() || '';
  const match = cargo.match(/([\\d,]+)\\s*kg/i);
  const weightKg = match ? Number(match[1].replaceAll(',', '')) : NaN;
  try {
    const shipment = createShipment({ id: 'SHP-DEMO-' + String(nextId).padStart(4, '0'), origin, destination, weightKg });
    nextId++;
    shipments.push(shipment);
    appendShipmentRow(shipment);
    window.closeModal('modal-new-shipment');
    notify(shipment.id + ' created in this browser session (not persisted)');
  } catch {
    notify('Invalid shipment: provide origin, destination, and cargo weight in kg.');
  }
};
// Explicitly prevent fake successful import until a validated CSV pipeline is available.
window.processCsvImport = () => notify('CSV import unavailable: actual parser and validation are pending.');
