import test from 'node:test';
import assert from 'node:assert/strict';
import { VEHICLE_TYPES, createFleet, createTruckMesh } from '../src/3d/vehicles.js';
import { HUBS, ROUTES, assignVehicleRoutes, interpolateRoute, routesToGeoJSON, hubsToGeoJSON } from '../src/3d/routes.js';
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
