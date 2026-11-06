export const SHIPMENT_STATUS = Object.freeze(['DRAFT', 'READY', 'ASSIGNED', 'IN_TRANSIT', 'DELIVERED']);
export const MAX_CSV_CHARS = 262144;
export const MAX_CSV_ROWS = 1000;

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

function tokenizeCsvRecords(csvText) {
  const cleanText = csvText.replace(/^\uFEFF/, '');
  const records = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  let fieldQuoted = false;
  let rowInvalid = false;

  for (let i = 0; i < cleanText.length; i++) {
    const ch = cleanText[i];
    if (inQuotes) {
      if (ch === '"') {
        if (cleanText[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      if (field.trim().length === 0) {
        inQuotes = true;
        fieldQuoted = true;
        field = '';
      } else {
        rowInvalid = true;
        field += ch;
      }
    } else if (ch === ',') {
      row.push(fieldQuoted ? field : field.trim());
      field = '';
      fieldQuoted = false;
    } else if (ch === '\r' || ch === '\n') {
      if (ch === '\r' && cleanText[i + 1] === '\n') i++;
      row.push(fieldQuoted ? field : field.trim());
      if (row.some(cell => cell.length > 0)) {
        records.push({ cols: row, invalid: rowInvalid });
        if (records.length > MAX_CSV_ROWS + 1) {
          throw new RangeError(`CSV exceeds maximum row limit (${MAX_CSV_ROWS})`);
        }
      }
      row = [];
      field = '';
      fieldQuoted = false;
      rowInvalid = false;
    } else {
      field += ch;
    }
  }

  if (inQuotes) {
    rowInvalid = true;
  }
  if (field.length > 0 || row.length > 0) {
    row.push(fieldQuoted ? field : field.trim());
    if (row.some(cell => cell.length > 0)) {
      records.push({ cols: row, invalid: rowInvalid });
      if (records.length > MAX_CSV_ROWS + 1) {
        throw new RangeError(`CSV exceeds maximum row limit (${MAX_CSV_ROWS})`);
      }
    }
  }

  return records;
}

function sanitizeImportedText(raw) {
  if (!raw || typeof raw !== 'string') return '';
  return raw
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^(')(.*)\1$/, '$2')
    .replace(/^[\s\u0000-\u001F]*[=+\-@|]+[\s\u0000-\u001F]*/g, '')
    .trim();
}

export function parseAndValidateShipmentsCsv(csvText) {
  if (!csvText || typeof csvText !== 'string') return [];
  if (csvText.length > MAX_CSV_CHARS) {
    throw new RangeError(`CSV exceeds maximum character size (${MAX_CSV_CHARS})`);
  }

  const records = tokenizeCsvRecords(csvText);
  if (records.length === 0) return [];

  let startIdx = 0;
  const firstCols = records[0].cols.map(c => c.toLowerCase());
  if (firstCols.some(c => c.includes('id') || c.includes('origin'))) {
    startIdx = 1;
  }
  if (records.length - startIdx > MAX_CSV_ROWS) {
    throw new RangeError(`CSV exceeds maximum data rows (${MAX_CSV_ROWS})`);
  }

  const validShipments = [];
  const seenIds = new Set();

  for (let i = startIdx; i < records.length; i++) {
    const { cols, invalid } = records[i];
    if (invalid || cols.length < 4) continue;

    let [rawId, rawOrigin, rawDestination, rawWeight, rawStatus] = cols;
    const id = sanitizeImportedText(rawId);
    const origin = sanitizeImportedText(rawOrigin);
    const destination = sanitizeImportedText(rawDestination);
    const weightClean = String(rawWeight ?? '').trim();

    if (!/^[+]?\d+(\.\d+)?$/.test(weightClean)) continue;
    const weightKg = Number(weightClean);
    if (!id || seenIds.has(id) || !origin || !destination || !Number.isFinite(weightKg) || weightKg <= 0) continue;

    seenIds.add(id);
    const statusNorm = sanitizeImportedText(rawStatus).toUpperCase();
    validShipments.push({
      id,
      origin,
      destination,
      weightKg,
      status: statusNorm && SHIPMENT_STATUS.includes(statusNorm) ? statusNorm : 'DRAFT',
      history: []
    });
  }
  return validShipments;
}

export function exportShipmentsCsv(shipments) {
  const sanitize = (val) => {
    if (val === null || val === undefined) return '';
    let str = String(val);
    if (/^[\s\u0000-\u001F]*[=+\-@|]/.test(str)) {
      str = "'" + str;
    }
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r') || str.includes('\t')) {
      str = '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  };
  const headers = ['id', 'origin', 'destination', 'weightKg', 'status'];
  const rows = (shipments || []).map(s => [
    sanitize(s.id),
    sanitize(s.origin),
    sanitize(s.destination),
    sanitize(s.weightKg),
    sanitize(s.status)
  ].join(','));
  return [headers.join(','), ...rows].join('\n');
}
