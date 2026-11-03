// ATLAS deterministic simulation engine. No UI or network dependencies.
export function createSimulation({ seed = 77, vehicles = [], tickMs = 1000 } = {}) {
  if (!Number.isInteger(seed) || !Number.isFinite(tickMs) || tickMs <= 0) throw new Error('Invalid simulation configuration');
  let state = { seed, tick: 0, status: 'PAUSED', vehicles: structuredClone(vehicles), events: [] };
  let rng = seed >>> 0;
  const nextRandom = () => { rng = (Math.imul(1664525, rng) + 1013904223) >>> 0; return rng / 4294967296; };
  const snapshot = () => structuredClone(state);
  const step = () => {
    state.tick++;
    state.vehicles = state.vehicles.map(vehicle => ({
      ...vehicle,
      x: Number((vehicle.x + (nextRandom() - 0.5) * (vehicle.speed ?? 1)).toFixed(4)),
      y: Number((vehicle.y + (nextRandom() - 0.5) * (vehicle.speed ?? 1)).toFixed(4))
    }));
    state.events.push({ type: 'SIM_TICK', tick: state.tick, elapsedMs: state.tick * tickMs });
    return snapshot();
  };
  return {
    snapshot,
    play() { state.status = 'RUNNING'; return snapshot(); },
    pause() { state.status = 'PAUSED'; return snapshot(); },
    step,
    advance() { return state.status === 'RUNNING' ? step() : snapshot(); },
    reset() { rng = seed >>> 0; state = { seed, tick: 0, status: 'PAUSED', vehicles: structuredClone(vehicles), events: [] }; return snapshot(); }
  };
}
