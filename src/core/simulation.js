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
      elapsedMs: state.tick const KARIANGAU_TO_DEPOT = [
  [116.8165, -1.1965],
  [116.8352, -1.2335],
  [116.8615, -1.2462],
  [116.8984, -1.2665]
];

function interpolateRoute(waypoints, progress) {
  if (!waypoints || waypoints.length === 0) return [116.8482, -1.2335];
  if (progress <= 0) return waypoints[0];
  if (progress >= 1) return waypoints[waypoints.length - 1];
  const totalSegs = waypoints.length - 1;
  const scaledP = progress * totalSegs;
  const idx = Math.min(Math.floor(scaledP), totalSegs - 1);
  const t = scaledP - idx;
  const p1 = waypoints[idx];
  const p2 = waypoints[idx + 1];
  return [
    Number((p1[0] + (p2[0] - p1[0]) * t).toFixed(6)),
    Number((p1[1] + (p2[1] - p1[1]) * t).toFixed(6))
  ];
}

export function createSimulation({ seed = 77, vehicles = [], tickMs = 1000 } = {}) {
  if (!Number.isInteger(seed) || !Number.isFinite(tickMs) || tickMs <= 0) throw new Error('Invalid simulation config');

  let rng = seed >>> 0;
  const nextRandom = () => {
    rng = (rng * 1664525 + 1013904223) >>> 0;
    return rng / 4294967296;
  };

  const listeners = new Set();

  const initVehicles = (vList) => {
    return vList.map(v => {
      let coords = v.coordinates;
      if (!coords) {
        if (v.route === 'KARIANGAU_TO_DEPOT') {
          coords = interpolateRoute(KARIANGAU_TO_DEPOT, v.progress || 0);
        } else if (v.waypoints) {
          coords = interpolateRoute(v.waypoints, v.progress || 0);
        } else {
          coords = [116.8482, -1.2335];
        }
      }
      return { ...v, coordinates: coords };
    });
  };

  let state = {
    seed,
    tick: 0,
    status: 'PAUSED',
    speedMultiplier: 1,
    scenario: 'NORMAL_DELIVERY',
    virtualTimeMs: 0,
    vehicles: initVehicles(structuredClone(vehicles)),
    events: []
  };

  const snapshot = () => structuredClone(state);

  const notify = (snap) => {
    const s = snap || snapshot();
    listeners.forEach(fn => {
      try { fn(s); } catch (e) { console.error(e); }
    });
  };

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

      const nextX = Number(((vehicle.x ?? 0) + (rX - 0.5) * effectiveSpeed).toFixed(4));
      const nextY = Number(((vehicle.y ?? 0) + (rY - 0.5) * effectiveSpeed).toFixed(4));

      let nextProgress = vehicle.progress;
      let nextCoords = vehicle.coordinates;

      if (vehicle.route === 'KARIANGAU_TO_DEPOT' || vehicle.waypoints) {
        const waypoints = vehicle.waypoints || KARIANGAU_TO_DEPOT;
        const currP = typeof vehicle.progress === 'number' ? vehicle.progress : 0;
        nextProgress = Math.min(1, currP + 0.05 * effectiveSpeed);
        nextCoords = interpolateRoute(waypoints, nextProgress);
      } else if (typeof vehicle.progress === 'number') {
        nextProgress = Math.min(1, vehicle.progress + 0.05 * effectiveSpeed);
      }

      return {
        ...vehicle,
        x: nextX,
        y: nextY,
        progress: nextProgress,
        coordinates: nextCoords,
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

    const s = snapshot();
    notify(s);
    return s;
  };

  return {
    snapshot,
    subscribe(listener) {
      if (typeof listener === 'function') {
        listeners.add(listener);
      }
      return () => {
        listeners.delete(listener);
      };
    },
    play() {
      state.status = 'RUNNING';
      const s = snapshot();
      notify(s);
      return s;
    },
    pause() {
      state.status = 'PAUSED';
      const s = snapshot();
      notify(s);
      return s;
    },
    step,
    advance() {
      return state.status === 'RUNNING' ? step() : snapshot();
    },
    setSpeed(multiplier) {
      state.speedMultiplier = Number(multiplier) || 1;
      const s = snapshot();
      notify(s);
      return s;
    },
    setScenario(scenarioCode) {
      state.scenario = scenarioCode || 'NORMAL_DELIVERY';
      const s = snapshot();
      notify(s);
      return s;
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
        vehicles: initVehicles(structuredClone(vehicles)),
        events: []
      };
      const s = snapshot();
      notify(s);
      return s;
    }
  };
} return snapshot(); },
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
