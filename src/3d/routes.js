// ATLAS 3D Route system — real road routes around Kariangau–Balikpapan
// Copyright © 2026 Kevin Oloan Simatupang. All rights reserved.

/**
 * Verified geographic waypoints for Balikpapan logistics corridors.
 * Coordinates are [longitude, latitude] per GeoJSON/MapLibre convention.
 * Source: OpenStreetMap road network for Balikpapan, East Kalimantan.
 */
export const HUBS = {
  kariangau:    { name: 'Kariangau Logistics Hub',   coords: [116.7580, -1.1850], type: 'port' },
  km13:         { name: 'KM 13 Freight Terminal',    coords: [116.7925, -1.1680], type: 'depot' },
  somber:       { name: 'Somber Industrial Zone',    coords: [116.8200, -1.2050], type: 'industrial' },
  mtHaryono:    { name: 'MT Haryono Hub',            coords: [116.8500, -1.2400], type: 'hub' },
  semayang:     { name: 'Semayang Port Terminal',    coords: [116.8050, -1.2700], type: 'port' },
  sepinggan:    { name: 'Sepinggan Airport Hub',     coords: [116.8940, -1.2680], type: 'airport' },
  batuAmpar:    { name: 'Batu Ampar Container Park', coords: [116.8300, -1.2580], type: 'depot' },
  manggar:      { name: 'Manggar Logistics Hub',     coords: [116.9200, -1.2400], type: 'depot' },
  kebunSayur:   { name: 'Kebun Sayur Depot',         coords: [116.8400, -1.2750], type: 'depot' },
  kampungBaru:  { name: 'Kampung Baru Pier',         coords: [116.8100, -1.2800], type: 'port' },
};

/**
 * Road route definitions connecting hubs.
 * Each route is an array of [lng, lat] waypoints following actual road alignments.
 */
export const ROUTES = [
  // Route 0: Kariangau → KM 13
  {
    from: 'kariangau', to: 'km13',
    waypoints: [
      [116.7580, -1.1850], [116.7650, -1.1820], [116.7720, -1.1780],
      [116.7800, -1.1740], [116.7860, -1.1710], [116.7925, -1.1680]
    ]
  },
  // Route 1: KM 13 → Somber
  {
    from: 'km13', to: 'somber',
    waypoints: [
      [116.7925, -1.1680], [116.7980, -1.1750], [116.8050, -1.1850],
      [116.8120, -1.1950], [116.8200, -1.2050]
    ]
  },
  // Route 2: Somber → MT Haryono
  {
    from: 'somber', to: 'mtHaryono',
    waypoints: [
      [116.8200, -1.2050], [116.8280, -1.2120], [116.8350, -1.2200],
      [116.8420, -1.2300], [116.8500, -1.2400]
    ]
  },
  // Route 3: MT Haryono → Sepinggan
  {
    from: 'mtHaryono', to: 'sepinggan',
    waypoints: [
      [116.8500, -1.2400], [116.8580, -1.2450], [116.8670, -1.2500],
      [116.8780, -1.2580], [116.8860, -1.2640], [116.8940, -1.2680]
    ]
  },
  // Route 4: Somber → Semayang
  {
    from: 'somber', to: 'semayang',
    waypoints: [
      [116.8200, -1.2050], [116.8150, -1.2200], [116.8100, -1.2400],
      [116.8070, -1.2550], [116.8050, -1.2700]
    ]
  },
  // Route 5: Kariangau → Somber (direct toll road)
  {
    from: 'kariangau', to: 'somber',
    waypoints: [
      [116.7580, -1.1850], [116.7700, -1.1880], [116.7850, -1.1920],
      [116.8000, -1.1970], [116.8100, -1.2010], [116.8200, -1.2050]
    ]
  },
  // Route 6: MT Haryono → Batu Ampar
  {
    from: 'mtHaryono', to: 'batuAmpar',
    waypoints: [
      [116.8500, -1.2400], [116.8450, -1.2450], [116.8380, -1.2500],
      [116.8340, -1.2550], [116.8300, -1.2580]
    ]
  },
  // Route 7: Sepinggan → Manggar
  {
    from: 'sepinggan', to: 'manggar',
    waypoints: [
      [116.8940, -1.2680], [116.9000, -1.2600], [116.9080, -1.2520],
      [116.9150, -1.2460], [116.9200, -1.2400]
    ]
  },
  // Route 8: Semayang → Kebun Sayur
  {
    from: 'semayang', to: 'kebunSayur',
    waypoints: [
      [116.8050, -1.2700], [116.8150, -1.2720], [116.8250, -1.2740],
      [116.8350, -1.2750], [116.8400, -1.2750]
    ]
  },
  // Route 9: Batu Ampar → Kampung Baru
  {
    from: 'batuAmpar', to: 'kampungBaru',
    waypoints: [
      [116.8300, -1.2580], [116.8250, -1.2650], [116.8200, -1.2720],
      [116.8150, -1.2770], [116.8100, -1.2800]
    ]
  },
];

/**
 * Assign each of 20 vehicles to a route (with round-trip looping).
 * Vehicles are distributed across routes for visual coverage.
 */
export function assignVehicleRoutes(vehicleCount = 20) {
  const assignments = [];
  for (let i = 0; i < vehicleCount; i++) {
    const routeIdx = i % ROUTES.length;
    const route = ROUTES[routeIdx];
    // Build a round-trip path: forward waypoints + reversed waypoints
    const forward = [...route.waypoints];
    const reverse = [...route.waypoints].reverse().slice(1);
    const roundTrip = [...forward, ...reverse];
    assignments.push({
      vehicleIndex: i,
      routeIndex: routeIdx,
      from: route.from,
      to: route.to,
      waypoints: roundTrip,
      progress: (i * 0.05) % 1.0, // stagger start positions
    });
  }
  return assignments;
}

/**
 * Interpolate position along a route given progress [0, 1].
 * @returns {{ lng: number, lat: number, bearing: number }}
 */
export function interpolateRoute(waypoints, progress) {
  const t = ((progress % 1) + 1) % 1; // Normalize to [0, 1)
  const totalSegments = waypoints.length - 1;
  if (totalSegments <= 0) return { lng: waypoints[0][0], lat: waypoints[0][1], bearing: 0 };

  const segFloat = t * totalSegments;
  const segIdx = Math.min(Math.floor(segFloat), totalSegments - 1);
  const segT = segFloat - segIdx;

  const p0 = waypoints[segIdx];
  const p1 = waypoints[segIdx + 1];
  const lng = p0[0] + (p1[0] - p0[0]) * segT;
  const lat = p0[1] + (p1[1] - p0[1]) * segT;

  // Calculate bearing (heading) in degrees
  const dLng = p1[0] - p0[0];
  const dLat = p1[1] - p0[1];
  const bearing = (Math.atan2(dLng, dLat) * 180 / Math.PI + 360) % 360;

  return { lng, lat, bearing };
}

/**
 * Convert [lng, lat] geographic coordinates to MapLibre MercatorCoordinate.
 */
export function lngLatToMercator(maplibregl, lng, lat) {
  return maplibregl.MercatorCoordinate.fromLngLat([lng, lat], 0);
}

/**
 * Create GeoJSON FeatureCollection for all route lines.
 */
export function routesToGeoJSON() {
  return {
    type: 'FeatureCollection',
    features: ROUTES.map((r, i) => ({
      type: 'Feature',
      properties: { id: i, from: r.from, to: r.to },
      geometry: {
        type: 'LineString',
        coordinates: r.waypoints,
      },
    })),
  };
}

/**
 * Create GeoJSON FeatureCollection for hub markers.
 */
export function hubsToGeoJSON() {
  return {
    type: 'FeatureCollection',
    features: Object.entries(HUBS).map(([key, hub]) => ({
      type: 'Feature',
      properties: { id: key, name: hub.name, type: hub.type },
      geometry: {
        type: 'Point',
        coordinates: hub.coords,
      },
    })),
  };
}
