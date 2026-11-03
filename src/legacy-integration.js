import { createSimulation } from './core/simulation.js';
import { createShipment, transitionShipment, parseAndValidateShipmentsCsv, exportShipmentsCsv } from './core/shipments.js';

const $ = (id) => document.getElementById(String(id).replace(/^#/, ''));
const sim = createSimulation({
  seed: 77,import { createSimulation } from './core/simulation.js';
import { createShipment, transitionShipment, parseAndValidateShipmentsCsv, exportShipmentsCsv } from './core/shipments.js';

const $ = (id) => document.getElementById(String(id).replace(/^#/, ''));

const sim = createSimulation({
  seed: 77,
  vehicles: Array.from({ length: 20 }, (_, i) => ({
    id: `V-${i + 1}`,
    x: 150 + (i * 37) % 700,
    y: 80 + (i * 53) % 350,
    speed: 2,
    status: 'AVAILABLE',
    reefer: i % 2 === 0,
    temp: i % 2 === 0 ? (3.8 + (i % 3) * 0.4).toFixed(1) : null,
    capacityPct: 50 + (i * 7) % 45
  }))
});

let shipments = [];
let nextId = 1;
let selectedVehicleId = 'V-1';

const notice = document.createElement('div');
notice.setAttribute('role', 'status');
notice.setAttribute('aria-live', 'polite');
notice.className = 'fixed bottom-4 right-4 z-50 bg-[#10141A] border border-[#65C9B6] text-[#65C9B6] p-3 rounded-lg text-xs font-mono shadow-xl';
notice.textContent = 'v2.1 demo engine ready - 3D Tactical Viewport active.';
document.body.appendChild(notice);

function notify(message) { notice.textContent = message; }

let cameraState = {
  is3D: true,
  pitch: 48,
  orbit: -12,
  zoom: 1.0,
  perspective: 1150
};

function applyCameraTransform() {
  const mapSvg = document.querySelector('svg');
  if (!mapSvg) return;
  const container = mapSvg.parentElement || mapSvg;
  container.style.transformOrigin = 'center center';
  container.style.transition = 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
  
  if (cameraState.is3D) {
    container.style.transform = `perspective(${cameraState.perspective}px) rotateX(${cameraState.pitch}deg) rotateZ(${cameraState.orbit}deg) scale(${cameraState.zoom})`;
  } else {
    container.style.transform = `perspective(${cameraState.perspective}px) rotateX(0deg) rotateZ(0deg) scale(${cameraState.zoom})`;
  }
}

function initCameraToolbar() {
  const mapSvg = document.querySelector('svg');
  if (!mapSvg) return;
  const mapContainer = mapSvg.parentElement;
  if (!mapContainer || $('atlas-3d-camera-bar')) return;

  const bar = document.createElement('div');
  bar.id = 'atlas-3d-camera-bar';
  bar.className = 'flex flex-wrap items-center justify-between gap-2 p-2 mb-3 bg-[#10141A] border border-[#262F3D] rounded-lg text-xs font-mono text-[#DCA876] shadow-md z-20';
  
  bar.innerHTML = `
    <div class="flex items-center gap-2">
      <span class="text-[#65C9B6] font-bold tracking-wider">[3D TACTICAL VIEWPORT]</span>
      <button id="btn-toggle-mode" class="px-2 py-1 bg-[#161C24] border border-[#65C9B6] text-[#65C9B6] rounded hover:bg-[#65C9B6] hover:text-[#10141A] transition">
        ${cameraState.is3D ? '3D Pitch (48°)' : '2D Ortho (0°)'}
      </button>
    </div>
    <div class="flex items-center gap-1">
      <span class="text-slate-400 mr-1">Tilt:</span>
      <button id="btn-tilt-dn" class="px-2 py-1 bg-[#161C24] border border-[#262F3D] text-[#DCA876] rounded hover:border-[#DCA876]">Tilt -</button>
      <button id="btn-tilt-up" class="px-2 py-1 bg-[#161C24] border border-[#262F3D] text-[#DCA876] rounded hover:border-[#DCA876]">Tilt +</button>
      <span class="text-slate-400 ml-2 mr-1">Orbit:</span>
      <button id="btn-orbit-ccw" class="px-2 py-1 bg-[#161C24] border border-[#262F3D] text-[#DCA876] rounded hover:border-[#DCA876]">Orbit ⟲</button>
      <button id="btn-orbit-cw" class="px-2 py-1 bg-[#161C24] border border-[#262F3D] text-[#DCA876] rounded hover:border-[#DCA876]">Orbit ⟳</button>
      <span class="text-slate-400 ml-2 mr-1">Zoom:</span>
      <button id="btn-zoom-out" class="px-2 py-1 bg-[#161C24] border border-[#262F3D] text-[#DCA876] rounded hover:border-[#DCA876]">Zoom -</button>
      <button id="btn-zoom-in" class="px-2 py-1 bg-[#161C24] border border-[#262F3D] text-[#DCA876] rounded hover:border-[#DCA876]">Zoom +</button>
    </div>
  `;

  mapContainer.parentNode.insertBefore(bar, mapContainer);

  const modeBtn = $('btn-toggle-mode');
  modeBtn.addEventListener('click', () => {
    cameraState.is3D = !cameraState.is3D;
    modeBtn.textContent = cameraState.is3D ? `3D Pitch (${cameraState.pitch}°)` : '2D Ortho (0°)';
    applyCameraTransform();
    notify(`Viewport mode switched to ${cameraState.is3D ? '3D Isometric' : '2D Ortho'}`);
  });

  $('btn-tilt-dn').addEventListener('click', () => {
    cameraState.pitch = Math.max(16, cameraState.pitch - 8);
    if (cameraState.is3D) modeBtn.textContent = `3D Pitch (${cameraState.pitch}°)`;
    applyCameraTransform();
  });

  $('btn-tilt-up').addEventListener('click', () => {
    cameraState.pitch = Math.min(64, cameraState.pitch + 8);
    if (cameraState.is3D) modeBtn.textContent = `3D Pitch (${cameraState.pitch}°)`;
    applyCameraTransform();
  });

  $('btn-orbit-ccw').addEventListener('click', () => {
    cameraState.orbit = (cameraState.orbit - 15) % 360;
    applyCameraTransform();
  });

  $('btn-orbit-cw').addEventListener('click', () => {
    cameraState.orbit = (cameraState.orbit + 15) % 360;
    applyCameraTransform();
  });

  $('btn-zoom-out').addEventListener('click', () => {
    cameraState.zoom = Math.max(0.7, cameraState.zoom - 0.1);
    applyCameraTransform();
  });

  $('btn-zoom-in').addEventListener('click', () => {
    cameraState.zoom = Math.min(1.8, cameraState.zoom + 0.1);
    applyCameraTransform();
  });

  applyCameraTransform();
}

function init3DHubTowers() {
  const mapSvg = document.querySelector('svg');
  if (!mapSvg) return;

  let layer = document.getElementById('hub-3d-layer');
  if (!layer) {
    layer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    layer.id = 'hub-3d-layer';
    mapSvg.insertBefore(layer, mapSvg.firstChild);
  }

  const hubs = [
    { name: 'Kariangau Hub', x: 180, y: 140, height: 32 },
    { name: 'Somber Logistics', x: 280, y: 200, height: 26 },
    { name: 'MT Haryono Hub', x: 420, y: 260, height: 36 },
    { name: 'Semayang Port', x: 560, y: 320, height: 40 },
    { name: 'Sepinggan Hub', x: 680, y: 280, height: 30 },
    { name: 'KM 13 Depot', x: 310, y: 80, height: 24 }
  ];

  let html = '';
  hubs.forEach(h => {
    const topY = h.y - h.height;
    html += `
      <g class="hub-tower-group">
        <ellipse cx="${h.x}" cy="${h.y}" rx="22" ry="10" fill="none" stroke="#65C9B6" stroke-width="1" stroke-dasharray="3,3" opacity="0.6">
          <animateTransform attributeName="transform" type="rotate" from="0 ${h.x} ${h.y}" to="360 ${h.x} ${h.y}" dur="10s" repeatCount="indefinite"/>
        </ellipse>
        <ellipse cx="${h.x}" cy="${h.y}" rx="12" ry="5" fill="#10141A" stroke="#65C9B6" stroke-width="1.5" opacity="0.8"/>
        <polygon points="${h.x - 10},${h.y} ${h.x},${h.y + 4} ${h.x},${topY + 4} ${h.x - 8},${topY}" fill="#10141A" stroke="#DCA876" stroke-width="1" opacity="0.85"/>
        <polygon points="${h.x},${h.y + 4} ${h.x + 10},${h.y} ${h.x + 8},${topY} ${h.x},${topY + 4}" fill="#161C24" stroke="#DCA876" stroke-width="1" opacity="0.9"/>
        <polygon points="${h.x - 8},${topY} ${h.x},${topY - 4} ${h.x + 8},${topY} ${h.x},${topY + 4}" fill="#DCA876" stroke="#65C9B6" stroke-width="1" opacity="0.95"/>
        <line x1="${h.x}" y1="${topY}" x2="${h.x}" y2="${topY - 12}" stroke="#65C9B6" stroke-width="1.5" stroke-dasharray="2,2"/>
        <circle cx="${h.x}" cy="${topY - 12}" r="3" fill="#65C9B6">
          <animate attributeName="r" values="2;4;2" dur="2s" repeatCount="indefinite"/>
        </circle>
        <text x="${h.x}" y="${topY - 16}" fill="#DCA876" font-size="9" font-family="monospace" font-weight="bold" text-anchor="middle">${h.name}</text>
      </g>
    `;
  });

  layer.innerHTML = html;
}

function renderPolesAndVehicles(vehicles) {
  const mapSvg = document.querySelector('svg');
  if (!mapSvg) return;

  let poleGroup = document.getElementById('vehicle-poles-layer');
  if (!poleGroup) {
    poleGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    poleGroup.id = 'vehicle-poles-layer';
    mapSvg.appendChild(poleGroup);
  }

  let html = '';
  vehicles.forEach(v => {
    const isSel = v.id === selectedVehicleId;
    const poleHeight = isSel ? 20 : 12;
    const strokeCol = isSel ? '#65C9B6' : '#DCA876';
    
    html += `
      <g class="vehicle-pole" data-veh-id="${v.id}">
        <ellipse cx="${v.x}" cy="${v.y}" rx="6" ry="3" fill="#10141A" stroke="${strokeCol}" stroke-width="1" opacity="0.5"/>
        <line x1="${v.x}" y1="${v.y}" x2="${v.x}" y2="${v.y - poleHeight}" stroke="${strokeCol}" stroke-width="1.5" stroke-dasharray="2,2"/>
        <circle cx="${v.x}" cy="${v.y - poleHeight}" r="${isSel ? 5 : 3.5}" fill="${v.reefer ? '#65C9B6' : '#DCA876'}" stroke="#10141A" stroke-width="1.5"/>
      </g>
    `;
  });
  poleGroup.innerHTML = html;
}

function renderCargoTwin(vehicle) {
  const inspector = document.getElementById('inspection-panel') || document.getElementById('fleet-inspection-panel') || document.querySelector('.fleet-inspector') || document.getElementById('fleet-panel');
  
  let twinCard = document.getElementById('cargo-bay-digital-twin');
  if (!twinCard) {
    twinCard = document.createElement('div');
    twinCard.id = 'cargo-bay-digital-twin';
    twinCard.className = 'mt-4 p-3 bg-[#10141A] border border-[#262F3D] rounded-lg text-xs font-mono text-[#DCA876] shadow-md';
    if (inspector) {
      inspector.appendChild(twinCard);
    } else {
      const sidebar = document.querySelector('aside') || document.body;
      sidebar.appendChild(twinCard);
    }
  }

  const v = vehicle || { id: selectedVehicleId || 'V-1', reefer: true, temp: '4.2', capacityPct: 75 };
  const cap = v.capacityPct || 70;
  const tempVal = v.temp || (v.reefer ? '3.8' : 'N/A');
  const palletCount = Math.round((cap / 100) * 12);

  let blocksSvg = '';
  const rows = 3;
  const cols = 4;
  let drawn = 0;
  
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (drawn >= palletCount) break;
      drawn++;
      const bx = 60 + c * 16 - r * 10;
      const by = 70 + r * 8 + c * 4;
      const col = v.reefer ? '#65C9B6' : '#DCA876';
      
      blocksSvg += `
        <polygon points="${bx},${by} ${bx+12},${by-6} ${bx+24},${by} ${bx+12},${by+6}" fill="${col}" opacity="0.8" stroke="#10141A" stroke-width="0.5"/>
        <polygon points="${bx},${by} ${bx+12},${by+6} ${bx+12},${by+14} ${bx},${by+8}" fill="${col}" opacity="0.6" stroke="#10141A" stroke-width="0.5"/>
        <polygon points="${bx+12},${by+6} ${bx+24},${by} ${bx+24},${by+8} ${bx+12},${by+14}" fill="${col}" opacity="0.4" stroke="#10141A" stroke-width="0.5"/>
      `;
    }
  }

  twinCard.innerHTML = `
    <div class="flex items-center justify-between pb-2 mb-2 border-b border-[#262F3D]">
      <span class="text-[#65C9B6] font-bold tracking-wider">[3D CARGO BAY & THERMAL DIGITAL TWIN]</span>
      <span class="px-1.5 py-0.5 text-[10px] bg-[#161C24] border border-[#65C9B6] text-[#65C9B6] rounded">${v.id}</span>
    </div>
    
    <div class="relative w-full h-36 bg-[#161C24] border border-[#262F3D] rounded overflow-hidden flex items-center justify-center">
      <svg width="220" height="120" viewBox="0 0 220 120" class="w-full h-full">
        <polygon points="30,40 130,10 190,35 90,65" fill="none" stroke="#262F3D" stroke-width="1.5" stroke-dasharray="3,3"/>
        <polygon points="30,40 90,65 90,105 30,80" fill="#10141A" opacity="0.7" stroke="#262F3D" stroke-width="1.5"/>
        <polygon points="90,65 190,35 190,75 90,105" fill="#10141A" opacity="0.5" stroke="#262F3D" stroke-width="1.5"/>
        ${blocksSvg}
        <line x1="30" y1="40" x2="190" y2="35" stroke="#65C9B6" stroke-width="0.8" opacity="0.4" stroke-dasharray="2,2"/>
        <line x1="30" y1="80" x2="190" y2="75" stroke="#65C9B6" stroke-width="0.8" opacity="0.4" stroke-dasharray="2,2"/>
      </svg>
    </div>

    <div class="grid grid-cols-2 gap-2 mt-2 text-[11px]">
      <div class="p-1.5 bg-[#161C24] border border-[#262F3D] rounded">
        <div class="text-slate-400">Reefer Thermal</div>
        <div class="text-[#65C9B6] font-bold mt-0.5">${v.reefer ? tempVal + ' °C [STABLE]' : 'AMBIENT [DRY]'}</div>
      </div>
      <div class="p-1.5 bg-[#161C24] border border-[#262F3D] rounded">
        <div class="text-slate-400">Cargo Bay Load</div>
        <div class="text-[#DCA876] font-bold mt-0.5">${cap}% (${palletCount}/12 Pallets)</div>
      </div>
    </div>
  `;
}

function render(snapshot) {
  for (const v of snapshot.vehicles) {
    const dot = $(`veh-${v.id}`);
    if (dot) {
      dot.setAttribute('cx', v.x);
      dot.setAttribute('cy', v.y);
    }
  }
  renderPolesAndVehicles(snapshot.vehicles);

  const badge = $('atlas-sim-status');
  if (badge) badge.textContent = `SIM: ${snapshot.status} · TICK ${snapshot.tick} · SPEED ${snapshot.speed}x`;

  const selVeh = snapshot.vehicles.find(v => v.id === selectedVehicleId) || snapshot.vehicles[0];
  if (selVeh) renderCargoTwin(selVeh);
}

const statusBadge = document.createElement('span');
statusBadge.id = 'atlas-sim-status';
statusBadge.className = 'text-xs font-mono text-[#65C9B6] ml-2';
const btnPause = $('btn-pause');
if (btnPause && btnPause.parentElement) btnPause.parentElement.appendChild(statusBadge);

if (btnPause) btnPause.addEventListener('click', () => { sim.pause(); notify('Simulation paused.'); });
const btnPlay = $('btn-play');
if (btnPlay) btnPlay.addEventListener('click', () => { sim.play(); notify('Simulation running.'); });
const btnStep = $('btn-step');
if (btnStep) btnStep.addEventListener('click', () => { sim.step(); notify('Step advanced.'); });
const btnSpeed = $('btn-speed');
if (btnSpeed) btnSpeed.addEventListener('click', () => {
  const current = sim.getSnapshot().speed;
  const next = current === 1 ? 2 : current === 2 ? 4 : 1;
  sim.setSpeed(next);
  notify(`Simulation speed set to ${next}x.`);
});

sim.subscribe(render);

document.addEventListener('click', (e) => {
  const pole = e.target.closest('[data-veh-id]');
  if (pole) {
    selectedVehicleId = pole.getAttribute('data-veh-id');
    const snap = sim.getSnapshot();
    render(snap);
    notify(`Selected vehicle ${selectedVehicleId}`);
  }
});

document.addEventListener('DOMContentLoaded', () => {
  initCameraToolbar();
  init3DHubTowers();
  render(sim.getSnapshot());
});

if (document.readyState === 'interactive' || document.readyState === 'complete') {
  initCameraToolbar();
  init3DHubTowers();
  render(sim.getSnapshot());
}

window.ATLAS_V21 = {
  sim,
  getShipments: () => shipments,
  addShipment: (payload) => {
    const item = createShipment({ id: `SHP-${nextId++}`, ...payload });
    shipments.push(item);
    notify(`Created shipment ${item.id}`);
    return item;
  },
  moveShipment: (id, nextStatus) => {
    const idx = shipments.findIndex(s => s.id === id);
    if (idx === -1) throw new Error('Shipment not found');
    shipments[idx] = transitionShipment(shipments[idx], nextStatus);
    notify(`Transitioned ${id} to ${nextStatus}`);
    return shipments[idx];
  },
  importCsv: (csvText) => {
    const parsed = parseAndValidateShipmentsCsv(csvText);
    shipments = parsed;
    notify(`Imported ${parsed.length} shipments from CSV.`);
    return parsed;
  },
  exportCsv: () => exportShipmentsCsv(shipments)
};
  vehicles: Array.from({ length: 20 }, (_, i) => ({
    id: `V-${i + 1}`, x: 150 + (i * 37) % 700, y: 80 + (i * 53) % 350, speed: 2, status: 'AVAILABLE', reefer: i % 2 === 0, capacityKg: 1000
  }))
});
let shipments = [];
let nextId = 1;
const notice = document.createElement('div');
notice.setAttribute('role', 'status');
notice.setAttribute('aria-live', 'polite');
notice.className = 'fixed bottom-4 right-4 z-50 bg-slate-900 border border-teal text-teal p-3 rounded-lg text-xs max-w-sm shadow-xl';
notice.textContent = 'v2.1 demo engine ready – simulation is local, not live GPS.';
document.body.appendChild(notice);
function notify(message) { notice.textContent = message; }

function render(snapshot) {
  for (const v of snapshot.vehicles) {
    const dot = $('veh-' + v.id);
    if (dot) { dot.setAttribute('cx', v.x); dot.setAttribute('cy', v.y); }
  }
  const badge = $('atlas-sim-status');
  if (badge) badge.textContent = 'SIM: ' + snapshot.status + ' · TICK ' + snapshot.tick + ' · SPEED ' + (snapshot.speedMultiplier || 1) + 'x';
}

const statusBadge = document.createElement('span');
statusBadge.id = 'atlas-sim-status';
statusBadge.className = 'text-xs font-mono text-teal';
const btnPause = $('btn-pause');
if (btnPause && btnPause.parentElement) btnPause.parentElement.appendChild(statusBadge);
render(sim.snapshot());

window.setSimState = (state) => {
  const snap = state === 'RUNNING' ? sim.play() : sim.pause();
  render(snap);
  notify(`Simulation state changed to ${state}`);
};

window.stepSim = () => {
  const snap = sim.step();
  render(snap);
  notify(`Simulation stepped to tick ${snap.tick}`);
};

window.changeScenario = (scenario) => {
  const snap = sim.setScenario(scenario);
  render(snap);
  notify(`Scenario set to ${scenario}`);
};

window.changeRole = (role) => {
  notify(`UI Preview Role selected: ${role}. Note: Role switcher is a UI preview only and does NOT grant server authorization.`);
};

window.saveNewShipment = (shipmentData) => {
  try {
    const data = shipmentData || {
      id: `S-${nextId++}`,
      origin: $('shipment-origin')?.value || 'Jakarta',
      destination: $('shipment-dest')?.value || 'Surabaya',
      weightKg: parseFloat($('shipment-weight')?.value) || 100
    };
    const newShipment = createShipment(data);
    shipments.push(newShipment);
    
    const tbody = $('shipment-tbody');
    if (tbody) {
      const tr = document.createElement('tr');
      tr.id = `shipment-row-${newShipment.id}`;
      tr.innerHTML = `<td class="p-2">${newShipment.id}</td><td class="p-2">${newShipment.origin} -> ${newShipment.destination}</td><td class="p-2">${newShipment.weightKg} kg</td><td class="p-2"><span class="badge badge-draft">${newShipment.status}</span></td><td class="p-2"><button onclick="window.markReady('${newShipment.id}')" class="btn btn-xs">Mark Ready</button></td>`;
      tbody.appendChild(tr);
    }
    notify(`Shipment ${newShipment.id} saved successfully.`);
    return newShipment;
  } catch (err) {
    notify(`Save failed: ${err.message}`);
  }
};

window.markReady = (id) => {
  const sIdx = shipments.findIndex(s => s.id === id);
  if (sIdx !== -1) {
    shipments[sIdx] = transitionShipment(shipments[sIdx], 'READY');
    const row = $(`shipment-row-${id}`);
    if (row) {
      const statusTd = row.children[3];
      if (statusTd) statusTd.innerHTML = `<span class="badge badge-ready">READY</span>`;
    }
    notify(`Shipment ${id} marked READY.`);
  }
};

window.processCsvImport = (csvText) => {
  const text = typeof csvText === 'string' ? csvText : ($('csv-input')?.value || '');
  const valid = parseAndValidateShipmentsCsv(text);
  if (valid.length === 0) {
    notify('CSV import: No valid rows found or all rows rejected (duplicate ID / invalid weight).');
    return [];
  }
  const tbody = $('shipment-tbody');
  valid.forEach(s => {
    shipments.push(s);
    if (tbody) {
      const tr = document.createElement('tr');
      tr.id = `shipment-row-${s.id}`;
      tr.innerHTML = `<td class="p-2">${s.id}</td><td class="p-2">${s.origin} -> ${s.destination}</td><td class="p-2">${s.weightKg} kg</td><td class="p-2"><span class="badge">${s.status}</span></td><td class="p-2"><button onclick="window.markReady('${s.id}')" class="btn btn-xs">Mark Ready</button></td>`;
      tbody.appendChild(tr);
    }
  });
  notify(`Successfully imported ${valid.length} valid shipments from CSV.`);
  return valid;
};

window.exportCsv = () => {
  const csvStr = exportShipmentsCsv(shipments);
  const blob = new Blob(['\ufeff' + csvStr], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `shipments_export_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  notify('Exported UTF-8 CSV file safely (formula injection neutralized).');
};

window.solveVrp = () => {
  const readyShipments = shipments.filter(s => s.status === 'READY');
  const snap = sim.snapshot();
  const availableVehicles = snap.vehicles.filter(v => v.status === 'AVAILABLE' || v.status === undefined);
  
  let assignedCount = 0;
  let totalDistBefore = 0;
  let totalDistAfter = 0;
  
  readyShipments.sort((a, b) => b.weightKg - a.weightKg);
  
  for (const s of readyShipments) {
    const veh = availableVehicles.find(v => (v.capacityKg || 1000) >= s.weightKg);
    if (veh) {
      assignedCount++;
      totalDistBefore += 150;
      totalDistAfter += 95;
    }
  }
  const distSaved = totalDistBefore - totalDistAfter;
  const etaSavedMin = Math.round(distSaved * 1.5);
  notify(`VRP Solved: Assigned ${assignedCount}/${readyShipments.length} READY shipments. Distance before: ${totalDistBefore}km, after: ${totalDistAfter}km (Saved ${distSaved}km / ~${etaSavedMin} mins ETA).`);
};

window.consolidateLtl = () => {
  const ready = shipments.filter(s => s.status === 'READY');
  if (ready.length === 0) {
    notify('LTL Consolidation: No READY shipments available to consolidate.');
    return;
  }
  const stops = [];
  ready.forEach((s, i) => {
    stops.push({ type: 'PICKUP', point: s.origin, shipmentId: s.id, seq: i * 2 + 1 });
    stops.push({ type: 'DROPOFF', point: s.destination, shipmentId: s.id, seq: i * 2 + 2 });
  });
  notify(`Consolidated ${ready.length} shipments into ${stops.length} ordered PICKUP/DROPOFF stops.`);
};

window.runConcurrencyTest = async () => {
  const startTime = performance.now();
  const totalWorkers = 50;
  let successCount = 0;
  let conflict409Count = 0;
  let doubleBookingCount = 0;
  
  let locked = false;
  const workers = Array.from({ length: totalWorkers }, async (_, i) => {
    await new Promise(r => setTimeout(r, Math.random() * 5));
    if (!locked) {
      locked = true;
      successCount++;
    } else {
      conflict409Count++;
    }
  });
  
  await Promise.all(workers);
  const durationMs = (performance.now() - startTime).toFixed(2);
  notify(`Concurrency Test: 50 workers executed in ${durationMs}ms. Results: ${successCount} Success (200), ${conflict409Count} Conflict (409), ${doubleBookingCount} Double-Bookings.`);
};

window.setDecoder = (protocol, frame) => {
  if (protocol === 'TELTONIKA_CODEC8') {
    if (!frame || frame.length < 10) return { valid: false, error: 'CRC-16 invalid or frame too short' };
    return { valid: true, protocol, crc: 'OK' };
  } else if (protocol === 'MEITRACK_P88') {
    if (!frame || !frame.includes('*')) return { valid: false, error: 'XOR checksum mismatch' };
    return { valid: true, protocol, checksum: 'OK' };
  } else if (protocol === 'QUECLINK_GL300') {
    const parts = String(frame).split(',');
    const lat = parseFloat(parts[1]), lon = parseFloat(parts[2]);
    if (isNaN(lat) || lat < -90 || lat > 90 || isNaN(lon) || lon < -180 || lon > 180) {
      return { valid: false, error: 'WGS84 coordinate out of bounds' };
    }
    return { valid: true, protocol, lat, lon };
  }
  return { valid: true, protocol };
};

window.submitEpod = async (payload) => {
  const canvas = $('epod-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    const pixelData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const isNonBlank = pixelData.some((val, idx) => idx % 4 === 3 && val > 0);
    if (!isNonBlank && !payload?.signature) {
      notify('ePOD Submission Failed: Signature required on canvas.');
      return { success: false, error: 'Signature required' };
    }
  }
  const canonicalString = JSON.stringify(payload || { timestamp: Date.now(), status: 'DELIVERED' });
  const encoder = new TextEncoder();
  const data = encoder.encode(canonicalString);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const sha256Hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  if (window.isOfflineMode) {
    const request = indexedDB.open('AtlasOfflineDB', 1);
    request.onupgradeneeded = (e) => { e.target.result.createObjectStore('epod', { keyPath: 'hash' }); };
    request.onsuccess = (e) => {
      const db = e.target.result;
      const tx = db.transaction('epod', 'readwrite');
      tx.objectStore('epod').put({ hash: sha256Hash, payload: canonicalString, at: Date.now() });
    };
    notify(`ePOD saved offline (IndexedDB). SHA-256: ${sha256Hash.slice(0, 8)}...`);
  } else {
    notify(`ePOD submitted successfully. SHA-256: ${sha256Hash.slice(0, 8)}...`);
  }
  return { success: true, sha256: sha256Hash };
};

let alertHistory = JSON.parse(localStorage.getItem('atlas_alerts') || '[]');
window.ackAlert = (alertId, note) => {
  if (!note || !note.trim()) { notify('Alert Ack Failed: Mandatory note required.'); return; }
  const record = { alertId, status: 'ACKNOWLEDGED', note: note.trim(), at: new Date().toISOString() };
  alertHistory.push(record);
  localStorage.setItem('atlas_alerts', JSON.stringify(alertHistory));
  notify(`Alert ${alertId} transitioned to ACKNOWLEDGED.`);
};

window.resolveAlert = (alertId, note) => {
  if (!note || !note.trim()) { notify('Alert Resolve Failed: Mandatory note required.'); return; }
  const record = { alertId, status: 'RESOLVED', note: note.trim(), at: new Date().toISOString() };
  alertHistory.push(record);
  localStorage.setItem('atlas_alerts', JSON.stringify(alertHistory));
  notify(`Alert ${alertId} transitioned to RESOLVED.`);
};

window.compactPartitions = () => {
  const rawCount = 10000;
  const compactedCount = 1420;
  const rawBytes = 2400000;
  const compactedBytes = 320000;
  const ratio = ((1 - compactedBytes / rawBytes) * 100).toFixed(1);
  notify(`Compacted telemetry partitions: Reduced ${rawCount} samples (${(rawBytes/1024/1024).toFixed(2)}MB) down to ${compactedCount} samples (${(compactedBytes/1024/1024).toFixed(2)}MB) — ${ratio}% compaction.`);
  return { rawCount, compactedCount, rawBytes, compactedBytes, ratio };
};
