import test from 'node:test';
import assert from 'node:assert/strict';
import { VEHICLE_TYPES, createFleet, createTruckMesh } from '../src/3d/vehicles.js';
import { HUBS, ROUTES, assignVehicleRoutes, interpolateRoute, routesToGeoJSON, hubsToGeoJSON, ROUTE_METADATA, computeCumulativeDistances, getRouteSample, transformToLocalFrame, getRouteWindow } from '../src/3d/routes.js';
import { geoTo3D } from '../src/3d/map3d.js';
import * as THREE from '../src/vendor/three.module.js';

test('3D Vehicles: 5 distinct vehicle classes configured with realistic dimensions', () => {
  assert.equal(VEHICLE_TYPES.length, 5);
  const types = VEHICLE_TYPES.map(v => v.type);
  assert.deepEqual(types, ['container', 'box', 'reefer', 'tanker', 'cargo']);
  for (const vt of VEHICLE_TYPES) {
    assert.ok(vt.length > 0 && vt.width > 0 && vt.height > 0);
    assert.ok(vt.cabinColor !== undefined && vt.trailerColor !== undefined);
  }
});

test('3D Vehicles: createFleet generates exactly 20 articulated 3D truck models', () => {
  const fleet = createFleet(THREE);
  assert.equal(fleet.length, 20);
  fleet.forEach((mesh, idx) => {
    assert.equal(mesh.userData.vehicleIndex || mesh.userData.index, idx);
    assert.equal(mesh.userData.vehicleId, `TRK-${String(idx + 1).padStart(3, '0')}`);
    // Check that meshes contain cabin, wheels, and lights
    assert.ok(mesh.children.length >= 8, `Truck ${idx} must have at least 8 child meshes`);
  });
});

test('3D Routes: verified 10 Balikpapan hubs and 10 connected road corridors', () => {
  assert.equal(Object.keys(HUBS).length, 10);
  assert.ok(HUBS.kariangau && HUBS.somber && HUBS.sepinggan && HUBS.semayang && HUBS.km13);

  for (const [key, hub] of Object.entries(HUBS)) {
    assert.ok(hub.name && hub.type);
    assert.equal(hub.coords.length, 2);
    // Verified Balikpapan geographic bounding box: lng ~116.7 - 117.0, lat ~ -1.35 - -1.10
    assert.ok(hub.coords[0] >= 116.7 && hub.coords[0] <= 117.0, `${key} lng out of bounds: ${hub.coords[0]}`);
    assert.ok(hub.coords[1] >= -1.35 && hub.coords[1] <= -1.10, `${key} lat out of bounds: ${hub.coords[1]}`);
  }

  assert.equal(ROUTES.length, 10);
  for (const r of ROUTES) {
    assert.ok(r.from && r.to);
    assert.ok(r.waypoints.length >= 2, 'Route must have at least 2 waypoints');
  }
});

test('3D Routes: assignVehicleRoutes distributes 20 vehicles with round-trip paths', () => {
  const assignments = assignVehicleRoutes(20);
  assert.equal(assignments.length, 20);
  for (let i = 0; i < 20; i++) {
    const a = assignments[i];
    assert.equal(a.vehicleIndex, i);
    assert.ok(a.waypoints.length >= 3, 'Round-trip path must have waypoints');
    assert.ok(a.progress >= 0 && a.progress <= 1, 'Initial progress must be in [0, 1]');
  }
});

test('3D Routes: interpolateRoute calculates smooth position and valid bearing heading', () => {
  const waypoints = [
    [116.7580, -1.1850],
    [116.7800, -1.1740],
    [116.8200, -1.2050]
  ];
  const p0 = interpolateRoute(waypoints, 0);
  assert.equal(p0.lng, 116.7580);
  assert.equal(p0.lat, -1.1850);

  const pMid = interpolateRoute(waypoints, 0.5);
  assert.ok(pMid.lng > 116.7580 && pMid.lng < 116.8200);
  assert.ok(pMid.bearing >= 0 && pMid.bearing <= 360);
});

test('3D Geospatial Projection: geoTo3D projects Balikpapan coordinates to 3D space', () => {
  const pCenter = geoTo3D(116.83, -1.22);
  assert.equal(pCenter.x, 0);
  assert.equal(pCenter.z, 0);

  const pKariangau = geoTo3D(116.7580, -1.1850);
  assert.ok(pKariangau.x < 0, 'Kariangau is West of center (negative X)');
  assert.ok(pKariangau.z < 0, 'Kariangau is North of center (negative Z)');
});

test('3D GeoJSON: routesToGeoJSON and hubsToGeoJSON produce valid RFC-7946 features', () => {
  const rGeo = routesToGeoJSON();
  assert.equal(rGeo.type, 'FeatureCollection');
  assert.equal(rGeo.features.length, 10);
  assert.equal(rGeo.features[0].geometry.type, 'LineString');

  const hGeo = hubsToGeoJSON();
  assert.equal(hGeo.type, 'FeatureCollection');
  assert.equal(hGeo.features.length, 10);
  assert.equal(hGeo.features[0].geometry.type, 'Point');
});

test('3D Route Metadata: ODbL license, OSM provider and valid Balikpapan bounds', () => {
  assert.ok(ROUTE_METADATA.provider.includes('OpenStreetMap'));
  assert.ok(ROUTE_METADATA.license.includes('ODbL'));
  assert.equal(ROUTE_METADATA.corridorCount, 10);
  assert.equal(ROUTE_METADATA.hubCount, 10);
  assert.ok(ROUTE_METADATA.geographicBounds.minLng < ROUTE_METADATA.geographicBounds.maxLng);
  assert.ok(ROUTE_METADATA.geographicBounds.minLat < ROUTE_METADATA.geographicBounds.maxLat);
});

test('3D Arc-Length Math: computeCumulativeDistances is strictly monotonic', () => {
  const waypoints = ROUTES[0].waypoints;
  const { distances, totalDistance } = computeCumulativeDistances(waypoints);
  assert.equal(distances[0], 0);
  assert.equal(distances.length, waypoints.length);
  for (let i = 1; i < distances.length; i++) {
    assert.ok(distances[i] > distances[i - 1], `Distance at ${i} must be greater than ${i-1}`);
  }
  assert.equal(distances[distances.length - 1], totalDistance);
  assert.ok(totalDistance > 10000, 'Route 0 is > 10km');
});

test('3D Single Authoritative Route Sample: getRouteSample contract & tangent/normal orthogonality', () => {
  const waypoints = ROUTES[0].waypoints;
  const s0 = getRouteSample(waypoints, 0);
  assert.equal(s0.distanceMeters, 0);
  assert.equal(s0.progress, 0);
  assert.equal(s0.lng, waypoints[0][0]);
  assert.equal(s0.lat, waypoints[0][1]);
  assert.ok(s0.headingDegrees >= 0 && s0.headingDegrees <= 360);

  // Tangent unit length
  const tanLen = Math.hypot(s0.tangent[0], s0.tangent[1]);
  assert.ok(Math.abs(tanLen - 1) < 0.001, 'Tangent must be a unit vector');

  // Normal orthogonality: dot product tangent . normal == 0
  const dot = s0.tangent[0] * s0.normal[0] + s0.tangent[1] * s0.normal[1];
  assert.ok(Math.abs(dot) < 0.001, 'Normal must be orthogonal to tangent');

  // Arbitrary distance sample
  const sMid = getRouteSample(waypoints, 2500, { isDistance: true });
  assert.equal(sMid.distanceMeters, 2500);
  assert.ok(sMid.progress > 0 && sMid.progress < 1);
  assert.ok(sMid.speedMetersPerSecond > 0);
});

test('3D Metric Frame: transformToLocalFrame origin and axis orientation', () => {
  const origin = [116.8200, -1.2200];
  const heading = 45; // 45 degrees NE

  // Origin projects to (0, 0)
  const atOrigin = transformToLocalFrame(origin, origin, heading);
  assert.equal(Math.round(atOrigin.x * 1000), 0);
  assert.equal(Math.round(atOrigin.z * 1000), 0);

  // Point ahead along heading (distance ~ 100m)
  // At heading 45 deg, dEast = 100 * sin(45) = 70.71m, dNorth = 100 * cos(45) = 70.71m
  const cosLat = Math.cos(origin[1] * Math.PI / 180);
  const ptAhead = [
    origin[0] + (70.7107 / (111320 * cosLat)),
    origin[1] + (70.7107 / 111320)
  ];
  const atAhead = transformToLocalFrame(ptAhead, origin, heading);
  assert.ok(Math.abs(atAhead.x) < 0.1, `Lateral offset must be ~0, got ${atAhead.x}`);
  assert.ok(Math.abs(atAhead.z - 100) < 0.2, `Forward offset must be ~100m, got ${atAhead.z}`);

  // Point to the right lateral normal (heading + 90 = 135 deg SE, distance ~ 50m)
  const ptRight = [
    origin[0] + (50 * Math.cos(45 * Math.PI / 180) / (111320 * cosLat)),
    origin[1] - (50 * Math.sin(45 * Math.PI / 180) / 111320)
  ];
  const atRight = transformToLocalFrame(ptRight, origin, heading);
  assert.ok(Math.abs(atRight.x - 50) < 0.2, `Right lateral offset must be ~50m, got ${atRight.x}`);
  assert.ok(Math.abs(atRight.z) < 0.1, `Forward offset must be ~0, got ${atRight.z}`);
});

test('3D Route Window: getRouteWindow samples curved vs straight geometry', () => {
  const waypoints = ROUTES[0].waypoints;

  // Window at known curved bend on Route 0 (cum ~ 1276m)
  const winCurve = getRouteWindow(waypoints, 1276, 50, 100, 5);
  assert.ok(winCurve.samples.length > 20, 'Curved window must have multiple samples');
  assert.equal(winCurve.samples.find(s => Math.abs(s.sLocal) < 0.001)?.x, 0, 'Center sample x is 0');
  
  // Verify that road curves (lateral displacement |x| exceeds 15m along the window)
  const maxLateralCurve = Math.max(...winCurve.samples.map(s => Math.abs(s.x)));
  assert.ok(maxLateralCurve > 15, `Road must visibly curve: expected max lateral > 15m, got ${maxLateralCurve}m`);

  // Window at straight corridor (cum ~ 5000m)
  const winStraight = getRouteWindow(waypoints, 5000, 50, 100, 5);
  const maxLateralStraight = Math.max(...winStraight.samples.map(s => Math.abs(s.x)));
  assert.ok(maxLateralStraight < 5.0, `Straight road must have low lateral displacement, got ${maxLateralStraight}m`);
});
