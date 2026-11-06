// ATLAS 3D Live Fleet Map Engine (S03)
// High-fidelity interactive WebGL 3D geospatial environment
// Copyright © 2026 Kevin Oloan Simatupang. All rights reserved.

import { createTruckMesh, VEHICLE_TYPES } from './vehicles.js';
import { HUBS, ROUTES, assignVehicleRoutes, interpolateRoute } from './routes.js';

/**
 * Driver names and cargo payloads for fleet vehicles.
 */
const FLEET_DATA = [
  { driver: 'Rizky Pratama', load: 'Fuel (12,000 L)' },
  { driver: 'Budi Santoso', load: 'Heavy Mining Machinery (14 T)' },
  { driver: 'Agus Setiawan', load: 'Reefer Seafood (-18°C)' },
  { driver: 'Dewi Lestari', load: 'Containerized Electronics (8 T)' },
  { driver: 'Hendra Wijaya', load: 'Dry Bulk Construction (16 T)' },
  { driver: 'Siti Rahma', load: 'Reefer Pharmaceuticals (+4°C)' },
  { driver: 'Fajar Nugraha', load: 'Refined Petroleum (15,000 L)' },
  { driver: 'Eko Prasetyo', load: 'Containerized FMCG (11 T)' },
  { driver: 'Dimas Anggara', load: 'Industrial Chemicals (9 T)' },
  { driver: 'Tri Wahyuni', load: 'Reefer Dairy Products (+2°C)' },
  { driver: 'Ahmad Fauzi', load: 'Heavy Equipment Parts (13 T)' },
  { driver: 'Wawan Kurniawan', load: 'Agricultural Commodities (10 T)' },
  { driver: 'Indra Permana', load: 'Container Steel Coils (18 T)' },
  { driver: 'Bambang Supriyanto', load: 'Industrial Lubricants (11,000 L)' },
  { driver: 'Rian Hidayat', load: 'Reefer Frozen Poultry (-20°C)' },
  { driver: 'Yusuf Maulana', load: 'Consumer Goods Pallets (7 T)' },
  { driver: 'Dedi Irawan', load: 'Mining Consumables (12 T)' },
  { driver: 'Bayu Saputra', load: 'Timber & Plywood (15 T)' },
  { driver: 'Taufik Hidayat', load: 'Port Marine Hardware (8.5 T)' },
  { driver: 'Aris Munandar', load: 'Express Package Freight (5 T)' },
];

/**
 * Geographic projection helper to map [lng, lat] around Balikpapan to 3D scene coordinates.
 * Center is around [116.83, -1.22] (Somber / Balikpapan center).
 */
const CENTER_LNG = 116.83;
const CENTER_LAT = -1.22;
const SCALE_X = 1400; // units per degree longitude
const SCALE_Z = -1400; // units per degree latitude (inverted for North-up)

export function geoTo3D(lng, lat) {
  return {
    x: ((lng - CENTER_LNG) * SCALE_X) || 0,
    z: ((lat - CENTER_LAT) * SCALE_Z) || 0
  };
}

/**
 * Initializes the full 3D interactive Live Fleet Map for S03.
 *
 * @param {HTMLCanvasElement} canvas - #atlas-3d-canvas-full
 * @param {object} THREE - Three.js module
 * @returns {object} Controller conforming to __atlasCanvasLoops contract
 */
export function initLiveMap3D(canvas, THREE) {
  if (!canvas) return null;

  let renderer = null;
  let isWebgl = true;

  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  } catch (err) {
    console.warn('WebGL init failed for S03:', err);
    isWebgl = false;
  }

  if (!isWebgl || !renderer) {
    return createMapFallbackController(canvas);
  }

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0B0F14);
  scene.fog = new THREE.FogExp2(0x0B0F14, 0.0022);

  const camera = new THREE.PerspectiveCamera(45, 1, 1, 1500);
  camera.position.set(0, 140, 175);
  camera.lookAt(0, 0, 10);

  // --- Lighting ---
  const ambient = new THREE.AmbientLight(0x223042, 2.2);
  scene.add(ambient);

  const sun = new THREE.DirectionalLight(0xFFE8D0, 2.4);
  sun.position.set(150, 220, 120);
  sun.castShadow = true;
  sun.shadow.mapSize.width = 2048;
  sun.shadow.mapSize.height = 2048;
  sun.shadow.camera.near = 10;
  sun.shadow.camera.far = 600;
  sun.shadow.camera.left = -200;
  sun.shadow.camera.right = 200;
  sun.shadow.camera.top = 200;
  sun.shadow.camera.bottom = -200;
  scene.add(sun);

  const fillLight = new THREE.DirectionalLight(0x2DD4BF, 1.0);
  fillLight.position.set(-150, 120, -100);
  scene.add(fillLight);

  // --- Ground & Terrain ---
  const groundGeo = new THREE.PlaneGeometry(800, 800, 32, 32);
  const groundMat = new THREE.MeshStandardMaterial({
    color: 0x0C121A,
    roughness: 0.9,
    metalness: 0.1
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // Tactical Grid
  const grid = new THREE.GridHelper(700, 70, 0x1E293B, 0x141C28);
  grid.position.y = 0.1;
  scene.add(grid);

  // Balikpapan Bay Water
  const bayGeo = new THREE.PlaneGeometry(400, 350);
  const bayMat = new THREE.MeshStandardMaterial({
    color: 0x081624,
    roughness: 0.2,
    metalness: 0.8
  });
  const bay = new THREE.Mesh(bayGeo, bayMat);
  bay.rotation.x = -Math.PI / 2;
  bay.position.set(-80, 0.2, 120);
  scene.add(bay);

  // --- Road Network Geometry ---
  const roadMat = new THREE.MeshStandardMaterial({ color: 0x182230, roughness: 0.7 });
  const glowLineMat = new THREE.MeshBasicMaterial({ color: 0x2DD4BF });

  for (const route of ROUTES) {
    const points = route.waypoints.map(wp => {
      const p = geoTo3D(wp[0], wp[1]);
      return new THREE.Vector3(p.x, 0.4, p.z);
    });

    if (points.length < 2) continue;

    // Road strip
    const curve = new THREE.CatmullRomCurve3(points);
    const tubeGeo = new THREE.TubeGeometry(curve, points.length * 8, 2.8, 4, false);
    const roadMesh = new THREE.Mesh(tubeGeo, roadMat);
    roadMesh.scale.set(1, 0.15, 1);
    roadMesh.receiveShadow = true;
    scene.add(roadMesh);

    // Glowing center lane line
    const lineGeo = new THREE.BufferGeometry().setFromPoints(curve.getPoints(points.length * 12));
    const lineMesh = new THREE.Line(lineGeo, glowLineMat);
    lineMesh.position.y = 0.55;
    scene.add(lineMesh);
  }

  // --- 10 Hub Markers & Beacons ---
  const hubPositions = {};
  const copperMat = new THREE.MeshStandardMaterial({ color: 0xD99B66, metalness: 0.5, roughness: 0.4 });
  const tealMat = new THREE.MeshStandardMaterial({ color: 0x2DD4BF, metalness: 0.4, roughness: 0.5 });

  for (const [key, hub] of Object.entries(HUBS)) {
    const pos = geoTo3D(hub.coords[0], hub.coords[1]);
    hubPositions[key] = pos;

    const hubGroup = new THREE.Group();
    hubGroup.position.set(pos.x, 0, pos.z);

    // Base platform
    const baseGeo = new THREE.CylinderGeometry(8, 9, 2, 16);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x1E293B });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 1;
    hubGroup.add(base);

    // Tower
    const towerH = hub.type === 'port' ? 32 : (hub.type === 'airport' ? 26 : 20);
    const towerGeo = new THREE.CylinderGeometry(1.5, 3.5, towerH, 8);
    const tower = new THREE.Mesh(towerGeo, hub.type === 'port' ? copperMat : tealMat);
    tower.position.y = towerH / 2 + 1;
    tower.castShadow = true;
    hubGroup.add(tower);

    // Pulsing Beacon
    const beaconGeo = new THREE.SphereGeometry(2.2, 12, 12);
    const beaconMat = new THREE.MeshBasicMaterial({ color: hub.type === 'port' ? 0xD99B66 : 0x2DD4BF });
    const beacon = new THREE.Mesh(beaconGeo, beaconMat);
    beacon.position.y = towerH + 2;
    hubGroup.add(beacon);

    // Ground status ring
    const ringGeo = new THREE.RingGeometry(10, 11, 24);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x2DD4BF, side: THREE.DoubleSide, transparent: true, opacity: 0.4 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.25;
    hubGroup.add(ring);

    scene.add(hubGroup);

    // Add surrounding 3D buildings around the hub
    addHubSurroundingBuildings(scene, THREE, pos, hub.type);
  }

  // --- Volumetric Buildings Generator Around Hubs ---
  function addHubSurroundingBuildings(sceneRef, T, centerPos, type) {
    const bColors = [0x1A2535, 0x1E2D3D, 0x263445, 0x1F2937];
    const count = type === 'port' ? 6 : 4;

    for (let b = 0; b < count; b++) {
      const angle = (b / count) * Math.PI * 2 + 0.3;
      const dist = 16 + (b % 3) * 6;
      const bx = centerPos.x + Math.cos(angle) * dist;
      const bz = centerPos.z + Math.sin(angle) * dist;

      if (type === 'port' && b === 0) {
        // Gantry crane at port
        const craneGroup = new T.Group();
        const legGeo = new T.BoxGeometry(1.5, 32, 1.5);
        const cMat = new T.MeshStandardMaterial({ color: 0xD99B66, metalness: 0.6 });
        for (const lx of [-8, 8]) {
          for (const lz of [-6, 6]) {
            const leg = new T.Mesh(legGeo, cMat);
            leg.position.set(lx, 16, lz);
            leg.castShadow = true;
            craneGroup.add(leg);
          }
        }
        const boom = new T.Mesh(new T.BoxGeometry(26, 3, 14), cMat);
        boom.position.set(0, 32, 0);
        boom.castShadow = true;
        craneGroup.add(boom);
        craneGroup.position.set(bx, 0, bz);
        sceneRef.add(craneGroup);
      } else if (b % 2 === 0) {
        // Warehouse with loading dock
        const bw = 18 + (b % 3) * 4;
        const bd = 12 + (b % 2) * 4;
        const bh = 10 + (b % 3) * 3;
        const bGroup = new T.Group();
        const bMesh = new T.Mesh(
          new T.BoxGeometry(bw, bh, bd),
          new T.MeshStandardMaterial({ color: bColors[b % bColors.length], roughness: 0.7 })
        );
        bMesh.position.y = bh / 2;
        bMesh.castShadow = true;
        bMesh.receiveShadow = true;
        bGroup.add(bMesh);

        // Roof equipment
        const acUnit = new T.Mesh(new T.BoxGeometry(3, 1.5, 3), new T.MeshStandardMaterial({ color: 0x475569 }));
        acUnit.position.set(2, bh + 0.75, 1);
        bGroup.add(acUnit);

        bGroup.position.set(bx, 0, bz);
        sceneRef.add(bGroup);
      } else {
        // Container Stacks
        const cColors = [0xD99B66, 0x2DD4BF, 0x38BDF8, 0x475569];
        const stackGroup = new T.Group();
        for (let tier = 0; tier < 2; tier++) {
          const cBox = new T.Mesh(
            new T.BoxGeometry(5, 4, 12),
            new T.MeshStandardMaterial({ color: cColors[(b + tier) % cColors.length], roughness: 0.5 })
          );
          cBox.position.set((tier % 2) * 5.5, 2 + tier * 4.2, 0);
          cBox.castShadow = true;
          stackGroup.add(cBox);
        }
        stackGroup.position.set(bx, 0, bz);
        sceneRef.add(stackGroup);
      }
    }
  }

  // --- 3D Geofences ---
  function addGeofence(center, radius, colorHex) {
    const geo = new THREE.RingGeometry(radius - 1, radius, 32);
    const mat = new THREE.MeshBasicMaterial({ color: colorHex, side: THREE.DoubleSide, transparent: true, opacity: 0.5 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(center.x, 0.3, center.z);
    scene.add(mesh);
  }

  if (hubPositions.kariangau) addGeofence(hubPositions.kariangau, 42, 0x2DD4BF);
  if (hubPositions.somber) addGeofence(hubPositions.somber, 35, 0xD99B66);
  if (hubPositions.sepinggan) addGeofence(hubPositions.sepinggan, 38, 0x38BDF8);

  // --- 20 Fleet Vehicles (Articulated 3D Trucks) ---
  const vehicleRoutes = assignVehicleRoutes(20);
  const vehicleProgress = vehicleRoutes.map(vr => vr.progress);
  const vehicleMeshes = [];
  const truckHitboxes = [];

  for (let i = 0; i < 20; i++) {
    const spec = VEHICLE_TYPES[i % VEHICLE_TYPES.length];
    const truck = createTruckMesh(THREE, spec, i);
    truck.scale.set(0.65, 0.65, 0.65);
    scene.add(truck);
    vehicleMeshes.push(truck);

    // Hitbox for raycaster selection
    const hitGeo = new THREE.BoxGeometry(10, 8, 14);
    const hitMat = new THREE.MeshBasicMaterial({ visible: false });
    const hitbox = new THREE.Mesh(hitGeo, hitMat);
    hitbox.userData = { vehicleIndex: i };
    truck.add(hitbox);
    truckHitboxes.push(hitbox);
  }

  // Active Vehicle Selection Halo
  const haloGeo = new THREE.RingGeometry(4, 5.5, 24);
  const haloMat = new THREE.MeshBasicMaterial({ color: 0x2DD4BF, side: THREE.DoubleSide });
  const selectionHalo = new THREE.Mesh(haloGeo, haloMat);
  selectionHalo.rotation.x = -Math.PI / 2;
  selectionHalo.position.y = 0.5;
  scene.add(selectionHalo);

  // --- Camera Controller State ---
  let camMode = 'free'; // 'free', 'follow', 'chase', 'overview'
  let selectedVehicleIndex = 0;
  let targetOrbit = { x: 0, y: 130, z: 160 };
  let currentTarget = new THREE.Vector3(0, 0, 0);

  // Interactive mouse/touch controls for Free camera
  let isDragging = false;
  let isPanning = false;
  let prevMouse = { x: 0, y: 0 };
  let orbitSpherical = { radius: 210, theta: -0.2, phi: Math.PI / 3.4 };
  let orbitTarget = new THREE.Vector3(0, 0, 10);

  function updateFreeCameraFromOrbit() {
    orbitSpherical.phi = Math.max(0.15, Math.min(Math.PI / 2.1, orbitSpherical.phi));
    orbitSpherical.radius = Math.max(30, Math.min(500, orbitSpherical.radius));

    camera.position.x = orbitTarget.x + orbitSpherical.radius * Math.sin(orbitSpherical.phi) * Math.sin(orbitSpherical.theta);
    camera.position.y = orbitTarget.y + orbitSpherical.radius * Math.cos(orbitSpherical.phi);
    camera.position.z = orbitTarget.z + orbitSpherical.radius * Math.sin(orbitSpherical.phi) * Math.cos(orbitSpherical.theta);
    camera.lookAt(orbitTarget);
  }

  // Mouse & Touch Interaction
  canvas.addEventListener('mousedown', (e) => {
    if (e.button === 2) isPanning = true;
    else isDragging = true;
    prevMouse = { x: e.clientX, y: e.clientY };
  });

  window.addEventListener('mouseup', () => {
    isDragging = false;
    isPanning = false;
  });

  canvas.addEventListener('mousemove', (e) => {
    if (!isDragging && !isPanning) return;
    const dx = e.clientX - prevMouse.x;
    const dy = e.clientY - prevMouse.y;
    prevMouse = { x: e.clientX, y: e.clientY };

    if (isDragging) {
      camMode = 'free';
      orbitSpherical.theta -= dx * 0.007;
      orbitSpherical.phi -= dy * 0.007;
      updateFreeCameraFromOrbit();
      syncCameraButtonsUI('free');
    } else if (isPanning) {
      camMode = 'free';
      orbitTarget.x -= dx * 0.3;
      orbitTarget.z += dy * 0.3;
      updateFreeCameraFromOrbit();
    }
  });

  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    camMode = 'free';
    orbitSpherical.radius += e.deltaY * 0.2;
    updateFreeCameraFromOrbit();
    syncCameraButtonsUI('free');
  }, { passive: false });

  // Raycaster for vehicle selection
  const raycaster = new THREE.Raycaster();
  const mouseVec = new THREE.Vector2();

  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseVec.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouseVec.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouseVec, camera);
    const intersects = raycaster.intersectObjects(truckHitboxes, false);

    if (intersects.length > 0) {
      const idx = intersects[0].object.userData.vehicleIndex;
      selectVehicle(idx);
    }
  });

  function selectVehicle(idx) {
    selectedVehicleIndex = Math.max(0, Math.min(19, idx));
    updateVehicleTelemetryUI(selectedVehicleIndex);
  }

  function updateVehicleTelemetryUI(idx) {
    const id = `TRK-${String(idx + 1).padStart(3, '0')}`;
    const data = FLEET_DATA[idx % FLEET_DATA.length];
    const vr = vehicleRoutes[idx];
    const fromName = HUBS[vr.from]?.name || 'Kariangau';
    const toName = HUBS[vr.to]?.name || 'Balikpapan Depot';

    // Update floating callout badge
    const callout = document.getElementById('truck-callout-map');
    if (callout) {
      callout.innerHTML = `
        <span style="width: 8px; height: 8px;" class="rounded-full bg-tealAccent"></span>
        <span>${id} · In Transit • 42 km/h · ETA 14:08 • ${fromName} → ${toName}</span>
      `;
    }

    // Update right inspector panel
    const inspectorTitle = document.querySelector('#view-map .glass-panel.w-80 .font-bold.text-sm');
    if (inspectorTitle) inspectorTitle.textContent = id;

    const monoFields = document.querySelectorAll('#view-map .glass-panel.w-80 .font-mono .flex.justify-between');
    if (monoFields.length >= 6) {
      const dVal = monoFields[0].querySelector('span:last-child');
      if (dVal) dVal.textContent = data.driver;
      const rVal = monoFields[1].querySelector('span:last-child');
      if (rVal) rVal.textContent = `${fromName} → ${toName}`;
      const lVal = monoFields[5].querySelector('span:last-child');
      if (lVal) lVal.textContent = data.load;
    }
  }

  function syncCameraButtonsUI(mode) {
    for (const m of ['free', 'follow', 'chase']) {
      const btn = document.getElementById('cam-' + m);
      if (btn) {
        if (m === mode) {
          btn.style.color = '#2DD4BF';
          btn.className = 'text-tealAccent font-bold px-2 py-0.5 rounded';
          btn.style.background = 'rgba(45,212,191,0.1)';
          btn.style.border = '1px solid rgba(45,212,191,0.3)';
        } else {
          btn.style.color = '#94A3B8';
          btn.className = '';
          btn.style.background = 'none';
          btn.style.border = 'none';
        }
      }
    }
  }

  // --- Public Camera Switcher ---
  function setCameraMode(mode) {
    camMode = mode;
    syncCameraButtonsUI(mode);

    if (mode === 'overview') {
      orbitTarget.set(0, 0, 10);
      orbitSpherical.radius = 280;
      orbitSpherical.phi = Math.PI / 4.5;
      orbitSpherical.theta = -0.15;
      updateFreeCameraFromOrbit();
      camMode = 'free';
      syncCameraButtonsUI('free');
    } else if (mode === 'free') {
      updateFreeCameraFromOrbit();
    }

    if (typeof window.atlasLegacyNotice === 'function') {
      window.atlasLegacyNotice(`3D Camera mode: ${mode.toUpperCase()} (active: TRK-${String(selectedVehicleIndex + 1).padStart(3, '0')})`);
    }
  }

  function resetCamera() {
    camMode = 'free';
    orbitTarget.set(0, 0, 10);
    orbitSpherical.radius = 210;
    orbitSpherical.phi = Math.PI / 3.4;
    orbitSpherical.theta = -0.2;
    updateFreeCameraFromOrbit();
    syncCameraButtonsUI('free');
    if (typeof window.atlasLegacyNotice === 'function') {
      window.atlasLegacyNotice('3D Orbit reset to default tactical perspective.');
    }
  }

  // Wire global functions
  window.setCamMode = setCameraMode;
  window.resetOrbit = resetCamera;
  window.selectMapVehicle = selectVehicle;

  // --- Animation Loop ---
  let scheduledFrame = null;

  function render() {
    scheduledFrame = null;

    // Read canonical simulation state
    const sim = window.ATLAS_V21?.sim;
    const simState = sim ? sim.getSnapshot() : { status: 'RUNNING', speedMultiplier: 1 };
    const isRunning = simState.status === 'RUNNING';
    const speedMult = simState.speedMultiplier || 1;

    // Animate all 20 vehicles along geographic routes
    const speedDelta = isRunning ? 0.0006 * speedMult : 0;

    for (let i = 0; i < 20; i++) {
      const vr = vehicleRoutes[i];
      if (isRunning) {
        vehicleProgress[i] = (vehicleProgress[i] + speedDelta * (0.85 + (i % 4) * 0.1)) % 1.0;
      }

      const geoPos = interpolateRoute(vr.waypoints, vehicleProgress[i]);
      const p3 = geoTo3D(geoPos.lng, geoPos.lat);
      const mesh = vehicleMeshes[i];

      mesh.position.set(p3.x, 0.4, p3.z);
      // Align truck rotation with road heading
      mesh.rotation.y = (-geoPos.bearing * Math.PI) / 180 + Math.PI / 2;
    }

    // Update selection halo position
    const selMesh = vehicleMeshes[selectedVehicleIndex];
    if (selMesh) {
      selectionHalo.position.set(selMesh.position.x, 0.45, selMesh.position.z);
    }

    // --- Dynamic Camera Tracking ---
    if (selMesh) {
      const selVr = vehicleRoutes[selectedVehicleIndex];
      const selGeo = interpolateRoute(selVr.waypoints, vehicleProgress[selectedVehicleIndex]);
      const truckPos = selMesh.position;
      const truckRot = selMesh.rotation.y;

      if (camMode === 'follow') {
        // Smoothly track selected vehicle from elevated angle
        const targetCamX = truckPos.x + 35 * Math.sin(truckRot - Math.PI / 2);
        const targetCamZ = truckPos.z + 45 * Math.cos(truckRot - Math.PI / 2);
        camera.position.x += (targetCamX - camera.position.x) * 0.08;
        camera.position.y += (42 - camera.position.y) * 0.08;
        camera.position.z += (targetCamZ - camera.position.z) * 0.08;
        camera.lookAt(truckPos.x, truckPos.y + 4, truckPos.z);
      } else if (camMode === 'chase') {
        // Behind-vehicle chase cam
        const chaseDist = 28;
        const chaseHeight = 14;
        const targetCamX = truckPos.x - chaseDist * Math.sin(truckRot + Math.PI / 2);
        const targetCamZ = truckPos.z - chaseDist * Math.cos(truckRot + Math.PI / 2);
        camera.position.x += (targetCamX - camera.position.x) * 0.12;
        camera.position.y += (chaseHeight - camera.position.y) * 0.12;
        camera.position.z += (targetCamZ - camera.position.z) * 0.12;
        camera.lookAt(truckPos.x, truckPos.y + 3, truckPos.z);
      }
    }

    // Resize viewport dynamically
    const width = canvas.clientWidth || window.innerWidth;
    const height = canvas.clientHeight || window.innerHeight;
    if (canvas.width !== width || canvas.height !== height) {
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }

    renderer.render(scene, camera);

    if (typeof window.atlasCanvasMayRun === 'function' && window.atlasCanvasMayRun(canvas.id)) {
      scheduledFrame = requestAnimationFrame(render);
    }
  }

  // Initial camera position
  updateFreeCameraFromOrbit();
  updateVehicleTelemetryUI(0);

  const controller = {
    start() {
      if (scheduledFrame === null && (!window.atlasCanvasMayRun || window.atlasCanvasMayRun(canvas.id))) {
        render();
      }
    },
    stop() {
      if (scheduledFrame !== null) {
        cancelAnimationFrame(scheduledFrame);
        scheduledFrame = null;
      }
    },
    drawOnce() {
      if (scheduledFrame === null) render();
    },
    isRunning() {
      return scheduledFrame !== null;
    },
    setCameraMode,
    resetCamera,
    selectVehicle,
    dispose() {
      controller.stop();
      if (renderer) renderer.dispose();
      scene.clear();
    }
  };

  return controller;
}

function createMapFallbackController(canvas) {
  const ctx = canvas.getContext('2d');
  let scheduledFrame = null;

  function render() {
    scheduledFrame = null;
    const w = canvas.width = canvas.clientWidth || 800;
    const h = canvas.height = canvas.clientHeight || 600;
    ctx.fillStyle = '#0B0F14';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#2DD4BF';
    ctx.font = '14px monospace';
    ctx.fillText('ATLAS 3D Live Map (2D Fallback Mode)', 30, 40);
    ctx.fillStyle = '#94A3B8';
    ctx.font = '12px monospace';
    ctx.fillText('WebGL acceleration is currently unavailable on this device.', 30, 65);
    ctx.fillText('Re-enable hardware acceleration or check browser permissions.', 30, 85);

    if (typeof window.atlasCanvasMayRun === 'function' && window.atlasCanvasMayRun(canvas.id)) {
      scheduledFrame = requestAnimationFrame(render);
    }
  }

  return {
    start() { if (scheduledFrame === null) render(); },
    stop() { if (scheduledFrame !== null) { cancelAnimationFrame(scheduledFrame); scheduledFrame = null; } },
    drawOnce() { if (scheduledFrame === null) render(); },
    isRunning() { return scheduledFrame !== null; },
    dispose() {}
  };
}
