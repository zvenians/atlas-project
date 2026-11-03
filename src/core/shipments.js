// Pure shipment transitions with explicit validation.
export const SHIPMENT_STATUS = Object.freeze(['DRAFT', 'READY', 'ASSIGNED', 'IN_TRANSIT', 'DELIVERED']);
const transitions = { DRAFT: ['READY'], READY: ['ASSIGNED'], ASSIGNED: ['IN_TRANSIT'], IN_TRANSIT: ['DELIVERED'], DELIVERED: [] };
export function createShipment({ id, origin, destination, weightKg }) {
  if (!id?.trim() || !origin?.trim() || !destination?.trim() || !Number.isFinite(weightKg) || weightKg <= 0) throw new Error('Invalid shipment');
  return { id: id.trim(), origin: origin.trim(), destination: destination.trim(), weightKg, status: 'DRAFT', history: [] };
}
export function transitionShipment(shipment, nextStatus, at = new Date().toISOString()) {
  if (!transitions[shipment.status]?.includes(nextStatus)) throw new Error(`Invalid transition: ${shipment.status} -> ${nextStatus}`);
  return { ...shipment, status: nextStatus, history: [...shipment.history, { from: shipment.status, to: nextStatus, at }] };
}
