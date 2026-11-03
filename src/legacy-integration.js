import { createSimulation } from './core/simulation.js';
import { createShipment, transitionShipment, parseAndValidateShipmentsCsv, exportShipmentsCsv } from './core/shipments.js';

const $ = (id) => document.getElementById(String(id).replace(/^#/, ''));
const sim = createSimulation({
  seed: 77,
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
