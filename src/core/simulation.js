// ATLAS deterministic simulation engine. No UI or network dependencies.
export function createSimulation({ seed = 77, vehicles = [], tickMs = 1000 } = {}) {
  if (!Number.isInteger(seed) || !Number.isFinite(tickMs) || tickMs <= 0) throw new Error('Invalid simulation config');
  
  let state = {
    seed,
    tick: 0,
    status: 'PAUSED',
    speedMultiplier: 1,
    scenario: 'NORMAL_DELIVERY',
    virtualTimeMs: 0,
    vehicles: structuredClone(vehicles),
    events: []
  };
  
  let rng = seed >>> 0;
  const nextRandom = () => { rng = (Math.imul(1664525, rng) + 1013904223) >>> 0; return rng / 4294967296; };
  const snapshot = () => structuredClone(state);

  const step = () => {
    state.tick++;
    state.virtualTimeMs += tickMs * (state.speedMultiplier ?? 1);

    let scenarioSpeedMult = 1;
    if (state.scenario === 'TRAFFIC_DELAY') scenarioSpeedMult = 0.5;
    if (state.scenario === 'VEHICLE_STOP') scenarioSpeedMult = 0;

    state.vehicles = state.vehicles.map(vehicle => {
      const rX = nextRandom();
      const rY = nextRandom();
      const effectiveSpeed = (vehicle.speed ?? 1) * (state.speedMultiplier ?? 1) * scenarioSpeedMult;
      
      const nextX = Number((vehicle.x + (rX - 0.5) * effectiveSpeed).toFixed(4));
      const nextY = Number((vehicle.y + (rY - 0.5) * effectiveSpeed).toFixed(4));

      return {
        ...vehicle,
        x: nextX,
        y: nextY,
        signalStatus: state.scenario === 'SIGNAL_LOSS' ? 'LOST' : 'ONLINE',
        dwell: state.scenario === 'VEHICLE_STOP',
        routeStatus: state.scenario === 'ROUTE_DEVIATION' ? 'DEVIATED' : 'ON_ROUTE'
      };
    });

    state.events.push({
      type: 'SIM_TICK',
      tick: state.tick,
      elapsedMs: state.tick * tickMs,
      virtualTimeMs: state.virtualTimeMs,
      scenario: state.scenario,
      speedMultiplier: state.speedMultiplier
    });

    return snapshot();
  };

  return {
    snapshot,
    play() { state.status = 'RUNNING'; return snapshot(); },
    pause() { state.status = 'PAUSED'; return snapshot(); },
    step,
    advance() { return state.status === 'RUNNING' ? step() : snapshot(); },
    setSpeed(multiplier) {
      state.speedMultiplier = Number(multiplier) || 1;
      return snapshot();
    },
    setScenario(scenarioCode) {
      state.scenario = scenarioCode || 'NORMAL_DELIVERY';
      return snapshot();
    },
    reset() {
      rng = seed >>> 0;
      state = {
        seed,
        tick: 0,
        status: 'PAUSED',
        speedMultiplier: 1,
        scenario: 'NORMAL_DELIVERY',
        virtualTimeMs: 0,
        vehicles: structuredClone(vehicles),
        events: []
      };
      return snapshot();
    }
  };
}
