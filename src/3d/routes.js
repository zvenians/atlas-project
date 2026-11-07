// ATLAS 3D Verified Road Route System — Real OSM Corridors for Kariangau–Balikpapan
// Provenance: OpenStreetMap (ODbL) via OSRM Driving Router
// Retrieval Date: 2026-11-06T23:25:00Z
// Copyright © 2026 Kevin Oloan Simatupang. All rights reserved.

/**
 * 10 Verified Logistics Hubs around Balikpapan & Kariangau Port District.
 * Coordinates in WGS84 [longitude, latitude].
 */
export const HUBS = {
  kariangau: { name: "Kariangau Logistics Hub", coords: [116.79,-1.185], type: "port", road: "Jl. Projakal" },
  km13: { name: "KM 13 Freight Terminal", coords: [116.85,-1.168], type: "depot", road: "Jl. Soekarno-Hatta KM 13" },
  somber: { name: "Somber Industrial Zone", coords: [116.82,-1.215], type: "industrial", road: "Jl. Semoi" },
  mtHaryono: { name: "MT Haryono Hub", coords: [116.865,-1.24], type: "hub", road: "Jl. MT Haryono" },
  semayang: { name: "Semayang Port Terminal", coords: [116.815,-1.278], type: "port", road: "Jl. Yos Sudarso" },
  sepinggan: { name: "Sepinggan Airport Hub", coords: [116.894,-1.268], type: "airport", road: "Jl. Marsma Iswahyudi" },
  batuAmpar: { name: "Batu Ampar Container Park", coords: [116.845,-1.23], type: "depot", road: "Jl. Pattimura" },
  manggar: { name: "Manggar Logistics Hub", coords: [116.94,-1.22], type: "depot", road: "Jl. Mulawarman" },
  kebunSayur: { name: "Kebun Sayur Depot", coords: [116.825,-1.268], type: "depot", road: "Jl. Letjen Suprapto" },
  kampungBaru: { name: "Kampung Baru Pier", coords: [116.818,-1.258], type: "port", road: "Jl. Wolter Monginsidi" }
};

/**
 * 10 Verified Strategic Road Corridors connecting logistics hubs.
 * Geometry derived directly from surveyed OpenStreetMap highway alignments.
 */
export const ROUTES = [
  // Route 0: Jalan Projakal & Tol Balikpapan-Samarinda Corridor (14.43 km)
  {
    id: 0,
    from: "kariangau",
    to: "km13",
    name: "Jalan Projakal & Tol Balikpapan-Samarinda Corridor",
    distanceKm: 14.43,
    waypoints: [[116.79021,-1.18504],[116.79201,-1.18065],[116.79579,-1.17509],[116.80139,-1.17512],[116.80501,-1.17385],[116.80848,-1.17166],[116.80968,-1.1663],[116.80987,-1.16241],[116.81668,-1.16124],[116.8251,-1.15792],[116.83525,-1.15891],[116.84273,-1.1569],[116.8513,-1.16163],[116.85415,-1.16105],[116.85331,-1.16383],[116.85217,-1.16687],[116.85222,-1.17016],[116.85093,-1.17186],[116.84898,-1.17531],[116.84492,-1.17611],[116.84185,-1.1748],[116.84218,-1.17167],[116.84525,-1.17071],[116.84733,-1.16929],[116.84962,-1.16952]]
  },
  // Route 1: Jalan Soekarno-Hatta Strategic Freight Corridor (6.71 km)
  {
    id: 1,
    from: "km13",
    to: "somber",
    name: "Jalan Soekarno-Hatta Strategic Freight Corridor",
    distanceKm: 6.71,
    waypoints: [[116.84962,-1.16952],[116.84749,-1.17039],[116.84695,-1.16914],[116.84583,-1.16956],[116.84461,-1.17098],[116.84238,-1.17159],[116.84196,-1.1726],[116.84192,-1.17563],[116.83983,-1.17844],[116.83944,-1.18027],[116.83826,-1.18168],[116.83678,-1.18444],[116.83584,-1.18618],[116.83534,-1.18925],[116.8332,-1.19124],[116.83209,-1.19409],[116.83014,-1.1958],[116.82806,-1.19689],[116.82677,-1.19963],[116.8248,-1.2018],[116.82384,-1.20329],[116.82357,-1.20507],[116.82331,-1.20717],[116.82124,-1.21087],[116.8208,-1.21226]]
  },
  // Route 2: Jalan MT Haryono Cross-City Logistics Arterial (16.82 km)
  {
    id: 2,
    from: "somber",
    to: "mtHaryono",
    name: "Jalan MT Haryono Cross-City Logistics Arterial",
    distanceKm: 16.82,
    waypoints: [[116.8208,-1.21226],[116.82351,-1.20602],[116.8248,-1.2018],[116.82933,-1.19628],[116.83349,-1.19074],[116.83609,-1.18506],[116.83957,-1.18018],[116.84413,-1.17626],[116.84965,-1.17498],[116.85321,-1.17874],[116.85232,-1.18532],[116.853,-1.18967],[116.85749,-1.19535],[116.8548,-1.19983],[116.85839,-1.20348],[116.86246,-1.20902],[116.85863,-1.21319],[116.85992,-1.21676],[116.86215,-1.221],[116.86652,-1.22392],[116.86926,-1.22717],[116.87424,-1.23056],[116.87466,-1.23574],[116.87076,-1.23936],[116.86499,-1.24001]]
  },
  // Route 3: Jalan Syarifuddin Yoes Airport Link (7.68 km)
  {
    id: 3,
    from: "mtHaryono",
    to: "sepinggan",
    name: "Jalan Syarifuddin Yoes Airport Link",
    distanceKm: 7.68,
    waypoints: [[116.86499,-1.24001],[116.86481,-1.23957],[116.86618,-1.24173],[116.86963,-1.23942],[116.87238,-1.2396],[116.87378,-1.24016],[116.87752,-1.24175],[116.88041,-1.24206],[116.88781,-1.24221],[116.89033,-1.24504],[116.88988,-1.24657],[116.89004,-1.24874],[116.89121,-1.24947],[116.89391,-1.2509],[116.89669,-1.2522],[116.89894,-1.25245],[116.90066,-1.25438],[116.90331,-1.25624],[116.90394,-1.25798],[116.90146,-1.259],[116.89849,-1.26027],[116.89518,-1.26103],[116.892,-1.26249],[116.89123,-1.26412],[116.8913,-1.26452]]
  },
  // Route 4: Coastal Highway to Pelabuhan Semayang Port (23.63 km)
  {
    id: 4,
    from: "somber",
    to: "semayang",
    name: "Coastal Highway to Pelabuhan Semayang Port",
    distanceKm: 23.63,
    waypoints: [[116.8208,-1.21226],[116.82364,-1.20393],[116.82888,-1.1965],[116.83548,-1.18912],[116.8393,-1.18036],[116.84586,-1.17557],[116.85286,-1.17764],[116.8515,-1.18637],[116.85633,-1.19439],[116.85515,-1.20113],[116.86203,-1.2069],[116.85788,-1.21393],[116.85361,-1.217],[116.84976,-1.21812],[116.84709,-1.22109],[116.84449,-1.22503],[116.8398,-1.22985],[116.83953,-1.23605],[116.83931,-1.24062],[116.83834,-1.2541],[116.83955,-1.26205],[116.83811,-1.27231],[116.83044,-1.27723],[116.8214,-1.27878],[116.81507,-1.27798]]
  },
  // Route 5: Kariangau Inter-Bay Industrial Corridor (17.67 km)
  {
    id: 5,
    from: "kariangau",
    to: "somber",
    name: "Kariangau Inter-Bay Industrial Corridor",
    distanceKm: 17.67,
    waypoints: [[116.79021,-1.18504],[116.79247,-1.18006],[116.79827,-1.17496],[116.80413,-1.17393],[116.80848,-1.17166],[116.80966,-1.16525],[116.81106,-1.16072],[116.82169,-1.16035],[116.83385,-1.15944],[116.84325,-1.15698],[116.85248,-1.16131],[116.85355,-1.1626],[116.85218,-1.1666],[116.85224,-1.1703],[116.85059,-1.17265],[116.84657,-1.17546],[116.84165,-1.17654],[116.83874,-1.1806],[116.83609,-1.18506],[116.83406,-1.18998],[116.83101,-1.19516],[116.8267,-1.19834],[116.82395,-1.20305],[116.82338,-1.20693],[116.8208,-1.21226]]
  },
  // Route 6: Batu Ampar Container Interchange Arterial (7.77 km)
  {
    id: 6,
    from: "mtHaryono",
    to: "batuAmpar",
    name: "Batu Ampar Container Interchange Arterial",
    distanceKm: 7.77,
    waypoints: [[116.86499,-1.24001],[116.86496,-1.23969],[116.86963,-1.23942],[116.87332,-1.23991],[116.87488,-1.23491],[116.87462,-1.23102],[116.8706,-1.22776],[116.86824,-1.22652],[116.86672,-1.2242],[116.86419,-1.22245],[116.86185,-1.22079],[116.86056,-1.21769],[116.85909,-1.21597],[116.85645,-1.21481],[116.85457,-1.2168],[116.85342,-1.21698],[116.85252,-1.21667],[116.85007,-1.21778],[116.8491,-1.21931],[116.84806,-1.2204],[116.84688,-1.22131],[116.84639,-1.22284],[116.84452,-1.22461],[116.84542,-1.22751],[116.845,-1.23]]
  },
  // Route 7: Jalan Mulawarman Eastern Freight Corridor (11.59 km)
  {
    id: 7,
    from: "sepinggan",
    to: "manggar",
    name: "Jalan Mulawarman Eastern Freight Corridor",
    distanceKm: 11.59,
    waypoints: [[116.8913,-1.26452],[116.89109,-1.26292],[116.88789,-1.26179],[116.89243,-1.26242],[116.89661,-1.26011],[116.90235,-1.25851],[116.90678,-1.25807],[116.91174,-1.25751],[116.91635,-1.25938],[116.92245,-1.25674],[116.92748,-1.25433],[116.93027,-1.25221],[116.93417,-1.24945],[116.93697,-1.2474],[116.94172,-1.24394],[116.94548,-1.24121],[116.94847,-1.239],[116.95222,-1.2363],[116.94919,-1.23214],[116.94854,-1.23014],[116.94724,-1.2279],[116.94551,-1.22475],[116.94252,-1.22234],[116.94004,-1.22101],[116.93996,-1.21997]]
  },
  // Route 8: Harbor Downtown Distribution Route (1.98 km)
  {
    id: 8,
    from: "semayang",
    to: "kebunSayur",
    name: "Harbor Downtown Distribution Route",
    distanceKm: 1.98,
    waypoints: [[116.81507,-1.27798],[116.81455,-1.27699],[116.81592,-1.27668],[116.81689,-1.27625],[116.8177,-1.27564],[116.81859,-1.27516],[116.81913,-1.27472],[116.82104,-1.27422],[116.82131,-1.2728],[116.82145,-1.27205],[116.82157,-1.27125],[116.82168,-1.27097],[116.82174,-1.27071],[116.82197,-1.27043],[116.82186,-1.27007],[116.82172,-1.26984],[116.82205,-1.26928],[116.82263,-1.26885],[116.82291,-1.26862],[116.82299,-1.26801],[116.82323,-1.26778],[116.82366,-1.26793],[116.82409,-1.26815],[116.82448,-1.26814],[116.82497,-1.268]]
  },
  // Route 9: West Balikpapan Maritime Connector (6.41 km)
  {
    id: 9,
    from: "batuAmpar",
    to: "kampungBaru",
    name: "West Balikpapan Maritime Connector",
    distanceKm: 6.41,
    waypoints: [[116.845,-1.23],[116.84557,-1.22796],[116.84441,-1.22693],[116.84203,-1.22706],[116.84027,-1.22779],[116.83983,-1.23034],[116.8405,-1.23314],[116.83987,-1.23487],[116.83953,-1.23578],[116.83978,-1.23656],[116.84037,-1.23781],[116.83987,-1.23996],[116.83816,-1.24113],[116.83516,-1.24196],[116.8343,-1.24161],[116.83217,-1.24188],[116.83383,-1.2425],[116.83395,-1.24544],[116.83219,-1.24607],[116.83046,-1.24764],[116.82866,-1.25047],[116.82788,-1.25208],[116.82299,-1.25311],[116.81878,-1.256],[116.81813,-1.258]]
  }
];

/**
 * Assigns round-trip routes to the 20-truck commercial fleet.
 * Each vehicle travels continuously along its assigned corridor.
 * @param {number} count - Total fleet size (default 20)
 * @returns {Array<object>} Vehicle route assignments
 */
export function assignVehicleRoutes(count = 20) {
  const assignments = [];
  for (let i = 0; i < count; i++) {
    const routeIdx = i % ROUTES.length;
    const route = ROUTES[routeIdx];
    const forward = route.waypoints;
    const reverse = [...route.waypoints].reverse().slice(1);
    const roundTrip = [...forward, ...reverse];
    
    // Calculate total route distance in meters for accurate wheel physics
    let totalMeters = 0;
    for (let s = 0; s < roundTrip.length - 1; s++) {
      const p0 = roundTrip[s];
      const p1 = roundTrip[s + 1];
      const dLng = (p1[0] - p0[0]) * 111320 * Math.cos((p0[1] + p1[1]) * Math.PI / 360);
      const dLat = (p1[1] - p0[1]) * 111320;
      totalMeters += Math.hypot(dLng, dLat);
    }

    assignments.push({
      vehicleIndex: i,
      routeIndex: routeIdx,
      from: route.from,
      to: route.to,
      name: route.name,
      waypoints: roundTrip,
      totalDistanceMeters: Math.round(totalMeters),
      progress: (i * 0.05) % 1.0, // Stagger initial start positions across route
    });
  }
  return assignments;
}

/**
 * Distance-based geographic route interpolation along verified waypoints.
 * Ensures vehicles travel at realistic, uniform physical speed without corner warping.
 *
 * @param {Array<Array<number>>} waypoints - Polyline coordinates [[lng, lat], ...]
 * @param {number} progress - Normalized progress in range [0, 1]
 * @returns {{ lng: number, lat: number, bearing: number, travelMeters: number }}
 */
export function interpolateRoute(waypoints, progress) {
  const t = ((progress % 1) + 1) % 1; // Normalize to [0, 1)
  const n = waypoints ? waypoints.length : 0;
  if (n <= 0) return { lng: 116.83, lat: -1.22, bearing: 0, travelMeters: 0 };
  if (n === 1) return { lng: waypoints[0][0], lat: waypoints[0][1], bearing: 0, travelMeters: 0 };

  // Calculate cumulative segment distances
  const distances = [0];
  let totalDist = 0;
  for (let i = 0; i < n - 1; i++) {
    const p0 = waypoints[i];
    const p1 = waypoints[i + 1];
    const dLng = (p1[0] - p0[0]) * 111320 * Math.cos((p0[1] + p1[1]) * Math.PI / 360);
    const dLat = (p1[1] - p0[1]) * 111320;
    const segDist = Math.hypot(dLng, dLat);
    totalDist += segDist;
    distances.push(totalDist);
  }

  if (totalDist === 0) return { lng: waypoints[0][0], lat: waypoints[0][1], bearing: 0, travelMeters: 0 };

  if (t === 0) {
    const dLng = waypoints[1][0] - waypoints[0][0];
    const dLat = waypoints[1][1] - waypoints[0][1];
    const bearing = (Math.atan2(dLng, dLat) * 180 / Math.PI + 360) % 360;
    return { lng: waypoints[0][0], lat: waypoints[0][1], bearing, travelMeters: 0 };
  }

  const targetDist = t * totalDist;
  let segIdx = 0;
  for (let i = 0; i < n - 1; i++) {
    if (targetDist <= distances[i + 1]) {
      segIdx = i;
      break;
    }
  }

  const segStartDist = distances[segIdx];
  const segLength = distances[segIdx + 1] - segStartDist;
  const segT = segLength > 0 ? (targetDist - segStartDist) / segLength : 0;

  const p0 = waypoints[segIdx];
  const p1 = waypoints[segIdx + 1];
  const lng = p0[0] + (p1[0] - p0[0]) * segT;
  const lat = p0[1] + (p1[1] - p0[1]) * segT;

  const dLng = p1[0] - p0[0];
  const dLat = p1[1] - p0[1];
  const bearing = (Math.atan2(dLng, dLat) * 180 / Math.PI + 360) % 360;

  return { lng, lat, bearing, travelMeters: targetDist };
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
      properties: { id: i, from: r.from, to: r.to, name: r.name, distanceKm: r.distanceKm },
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
      properties: { id: key, name: hub.name, type: hub.type, road: hub.road },
      geometry: {
        type: 'Point',
        coordinates: hub.coords,
      },
    })),
  };
}
