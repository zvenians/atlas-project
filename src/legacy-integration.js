import { createSimulation } from './core/simulation.js';
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
notice.textContent = 'Local simulated tactical prototype ready (not verified 3D GIS).';
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
  const mapSvg = $('svg-map');
  if (!mapSvg) return;
  // Transform the SVG *inside* the clipping map box, never the box itself.
  const container = mapSvg;
  container.style.transformOrigin = 'center center';
  container.style.transition = 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
  
  if (cameraState.is3D) {
    container.style.transform = `perspective(${cameraState.perspective}px) rotateX(${cameraState.pitch}deg) rotateZ(${cameraState.orbit}deg) scale(${cameraState.zoom})`;
  } else {
    container.style.transform = `perspective(${cameraState.perspective}px) rotateX(0deg) rotateZ(0deg) scale(${cameraState.zoom})`;
  }
}

function initCameraToolbar() {
  const mapSvg = $('svg-map');
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
    <div class="flex flex-wrap items-center gap-1" style="min-width:0;max-width:100%">
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
  const mapSvg = $('svg-map');
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
  const mapSvg = $('svg-map');
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
      const sidebar = $('sec-fleet') || $('atlas-legacy-workspace');
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
    const dot = $(`veh-${String(v.id).replace(/^V-/, '')}`);
    if (dot) {
      dot.setAttribute('cx', v.x);
      dot.setAttribute('cy', v.y);
    }
  }
  renderPolesAndVehicles(snapshot.vehicles);

  const badge = $('atlas-sim-status');
  if (badge) badge.textContent = `SIM: ${snapshot.status} · TICK ${snapshot.tick} · SPEED ${snapshot.speedMultiplier}x`;

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
  const current = sim.getSnapshot().speedMultiplier;
  const next = current === 1 ? 2 : current === 2 ? 4 : 1;
  sim.setSpeed(next);
  notify(`Simulation speed set to ${next}x.`);
});

sim.subscribe(render);
// Browser-local prototype clock; persistent server sandbox is a later stage.
const intervalId = window.setInterval(() => sim.advance(), 1000);
window.addEventListener('pagehide', () => window.clearInterval(intervalId), { once: true });

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
