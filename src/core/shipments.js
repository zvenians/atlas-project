export const SHIPMENT_STATUS = Object.freeze(['DRAFT', 'READY', 'ASSIGNED', 'IN_TRANSIT', 'DELIVERED']);
const transitions = { DRAFT: ['READY'], READY: ['ASSIGNED'], ASSIGNED: ['IN_TRANSIT'], IN_TRANSIT: ['DELIVERED'] };

export function createShipment({ id, origin, destination, weightKg }) {
  if (!id?.trim() || !origin?.trim() || !destination?.trim() || !Number.isFinite(weightKg) || weightKg <= 0) {
    throw new Error('Invalid shipment');
  }
  return { id: id.trim(), origin: origin.trim(), destination: destination.trim(), weightKg, status: 'DRAFT', history: [] };
}

export function transitionShipment(shipment, nextStatus, at = new Date().toISOString()) {
  if (!transitions[shipment.status]?.includes(nextStatus)) {
    throw new Error(`Invalid transition: ${shipment.status} -> ${nextStatus}`);
  }
  return { ...shipment, status: nextStatus, history: [...shipment.history, { from: shipment.status, to: nextStatus, at }] };
}

export function parseAndValidateShipmentsCsv(csvText) {
  if (!csvText || typeof csvText !== 'string') return [];
  const lines = csvText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) return [];
  let startIdx = 0;
  if (lines[0].toLowerCase().includes('id') || lines[0].toLowerCase().includes('origin')) startIdx = 1;
  const validShipments = [];
  const seenIds = new Set();
  for (let i = startIdx; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.trim().replace(/^['"]|['"]$/g, ''));
    if (cols.length < 4) continue;
    let [id, origin, destination, weightStr, status] = cols;
    id = id ? id.replace(/^[=\+\-@]/, '') : '';
    origin = origin ? origin.replace(/^[=\+\-@]/, '') : '';
    destination = destination ? destination.replace(/^[=\+\-@]/, '') : '';
    const weightKg = parseFloat(weightStr);
    if (!id || seenIds.has(id) || !origin || !destination || isNaN(weightKg) || weightKg <= 0) continue;
    seenIds.add(id);
    validShipments.push({ id, origin, destination, weightKg, status: status && SHIPMENT_STATUS.includes(status) ? status : 'DRAFT', history: [] });
  }
  return validShipments;
}

export function exportShipmentsCsv(shipments) {
  const sanitize = (val) => {
    if (val === null || val === undefined) return '';
    let str = String(val);
    if (/^[=\+\-@]/.test(str)) str = "'" + str;
    if (str.includes(',') || str.includes('"') || str.includes('\n')) str = '"' + str.replace(/"/g, '""') + '"';
    return str;
  };
  const headers = ['id', 'origin', 'destination', 'weightKg', 'status'];
  const rows = (shipments || []).map(s => [sanitize(s.id), sanitize(s.origin), sanitize(s.destination), sanitize(s.weightKg), sanitize(s.status)].join(','));
  return [headers.join(','), ...rows].join('\n');
}
