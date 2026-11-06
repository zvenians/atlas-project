// ATLAS 3D Live Fleet Map Engine (S03)
// High-fidelity interactive WebGL 3D geospatial digital twin
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
 * Features real Esri World Imagery satellite basemap, asphalt highways with
 * painted road markings, volumetric port cranes, warehouses, container yards,
 * and high-fidelity PBR commercial trucks.
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
  scene.background = new THREE.Color(0x080C11);
  scene.fog = new THREE.FogExp2(0x080C11, 0.0018);

  const camera = new THREE.PerspectiveCamera(45, 1, 1, 1500);
  camera.position.set(0, 140, 175);
  camera.lookAt(0, 0, 10);

  // --- Natural Geospatial Lighting ---
  const ambient = new THREE.AmbientLight(0x243447, 2.2);
  scene.add(ambient);

  const sun = new THREE.DirectionalLight(0xFFF2E0, 2.6);
  sun.position.set(160, 240, 120);
  sun.castShadow = true;
  sun.shadow.mapSize.width = 2048;
  sun.shadow.mapSize.height = 2048;
  sun.shadow.camera.near = 10;
  sun.shadow.camera.far = 700;
  sun.shadow.camera.left = -250;
  sun.shadow.camera.right = 250;
  sun.shadow.camera.top = 250;
  sun.shadow.camera.bottom = -250;
  scene.add(sun);

  const fillLight = new THREE.DirectionalLight(0x2DD4BF, 0.85);
  fillLight.position.set(-160, 120, -120);
  scene.add(fillLight);

  // --- Real Geographic Satellite Ground Plane (Esri World Imagery) ---
  // Aspect ratio 1280x1024 = 1.25, ground size 850 x 680
  const groundGeo = new THREE.PlaneGeometry(850, 680, 1, 1);
  const groundMat = new THREE.MeshStandardMaterial({
    color: 0x18202A,
    roughness: 0.92,
    metalness: 0.08
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // Load verified local satellite texture covering Balikpapan & Kariangau
  const texLoader = new THREE.TextureLoader();
  texLoader.load(
    '/assets/satellite-balikpapan.jpg',
    (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace || 'srgb';
      groundMat.map = tex;
      groundMat.color.setHex(0xFFFFFF);
      groundMat.needsUpdate = true;
    },
    undefined,
    () => {
      console.warn('Satellite basemap fallback active');
    }
  );

  // Subtle tactical perimeter border frame
  const frameGeo = new THREE.RingGeometry(440, 442, 64);
  const frameMat = new THREE.MeshBasicMaterial({ color: 0x2DD4BF, transparent: true, opacity: 0.15, side: THREE.DoubleSide });
  const frame = new THREE.Mesh(frameGeo, frameMat);
  frame.rotation.x = -Math.PI / 2;
  frame.position.y = 0.15;
  scene.add(frame);

  // --- Realistic Asphalt Road Network ---
  const roadMat = new THREE.MeshStandardMaterial({
    color: 0x1E242B, // Dark heavy-duty asphalt
    roughness: 0.88,
    metalness: 0.12
  });
  const shoulderMat = new THREE.MeshBasicMaterial({ color: 0xE2E8F0 }); // Bright white solid road edge lines
  const centerDashedMat = new THREE.MeshBasicMaterial({ color: 0xF59E0B }); // Highway yellow centerline divider

  for (const route of ROUTES) {
    const points = route.waypoints.map(wp => {
      const p = geoTo3D(wp[0], wp[1]);
      return new THREE.Vector3(p.x, 0.35, p.z);
    });

    if (points.length < 2) continue;

    const curve = new THREE.CatmullRomCurve3(points);

    // Main asphalt road deck (flattened tube)
    const tubeGeo = new THREE.TubeGeometry(curve, points.length * 10, 3.4, 4, false);
    const roadMesh = new THREE.Mesh(tubeGeo, roadMat);
    roadMesh.scale.set(1, 0.08, 1);
    roadMesh.receiveShadow = true;
    scene.add(roadMesh);

    // Left and Right solid white shoulder boundary markings
    const densePoints = curve.getPoints(points.length * 14);
    const leftPoints = [];
    const rightPoints = [];

    for (let k = 0; k < densePoints.length; k++) {
      const pt = densePoints[k];
      const tangent = curve.getTangent(k / (densePoints.length - 1)).normalize();
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
      const offset = 2.9;
      leftPoints.push(new THREE.Vector3(pt.x + normal.x * offset, 0.42, pt.z + normal.z * offset));
      rightPoints.push(new THREE.Vector3(pt.x - normal.x * offset, 0.42, pt.z - normal.z * offset));
    }

    const leftGeo = new THREE.BufferGeometry().setFromPoints(leftPoints);
    const rightGeo = new THREE.BufferGeometry().setFromPoints(rightPoints);
    scene.add(new THREE.Line(leftGeo, shoulderMat));
    scene.add(new THREE.Line(rightGeo, shoulderMat));

    // Center divider stripe (dashed highway yellow line)
    const centerGeo = new THREE.BufferGeometry().setFromPoints(densePoints.map(p => new THREE.Vector3(p.x, 0.44, p.z)));
    scene.add(new THREE.Line(centerGeo, centerDashedMat));
  }

  // --- Volumetric Port Infrastructure, Warehouses & Hubs ---
  const hubPositions = {};
  const copperMat = new THREE.MeshStandardMaterial({ color: 0xD99B66, metalness: 0.6, roughness: 0.35 });
  const tealMat = new THREE.MeshStandardMaterial({ color: 0x2DD4BF, metalness: 0.5, roughness: 0.4 });

  for (const [key, hub] of Object.entries(HUBS)) {
    const pos = geoTo3D(hub.coords[0], hub.coords[1]);
    hubPositions[key] = pos;

    const hubGroup = new THREE.Group();
    hubGroup.position.set(pos.x, 0, pos.z);

    // Base concrete pad
    const baseGeo = new THREE.CylinderGeometry(8, 9, 1.8, 16);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x1E293B, roughness: 0.8 });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 0.9;
    hubGroup.add(base);

    // Radar / VTS Communications Tower
    const towerH = hub.type === 'port' ? 34 : (hub.type === 'airport' ? 28 : 22);
    const towerGeo = new THREE.CylinderGeometry(1.6, 3.8, towerH, 8);
    const tower = new THREE.Mesh(towerGeo, hub.type === 'port' ? copperMat : tealMat);
    tower.position.y = towerH / 2 + 1;
    tower.castShadow = true;
    hubGroup.add(tower);

    // Rotating Radar / Pulsing Beacon
    const beaconGeo = new THREE.SphereGeometry(2.4, 12, 12);
    const beaconMat = new THREE.MeshBasicMaterial({ color: hub.type === 'port' ? 0xD99B66 : 0x2DD4BF });
    const beacon = new THREE.Mesh(beaconGeo, beaconMat);
    beacon.position.y = towerH + 2;
    hubGroup.add(beacon);

    // Ground status boundary ring
    const ringGeo = new THREE.RingGeometry(11, 12.2, 24);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x2DD4BF, side: THREE.DoubleSide, transparent: true, opacity: 0.45 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.25;
    hubGroup.add(ring);

    scene.add(hubGroup);

    // Add high-fidelity surrounding infrastructure
    buildHubInfrastructure(scene, THREE, pos, hub.type, key);
  }

  // --- High-Fidelity Industrial Infrastructure Builder ---
  function buildHubInfrastructure(sceneRef, T, centerPos, type, hubKey) {
    if (type === 'port') {
      // 1. Ship-to-Shore (STS) Gantry Cranes along port berths
      for (const cx of [-22, 22]) {
        const crane = createSTSCrane(T, 0xD97706);
        crane.position.set(centerPos.x + cx, 0, centerPos.z - 26);
        sceneRef.add(crane);
      }

      // 2. Multi-tier Container Yard Block (Maersk Blue, Evergreen Green, Hapag-Lloyd Orange, ONE Magenta)
      const containerYard = createContainerYardBlock(T);
      containerYard.position.set(centerPos.x + 28, 0, centerPos.z + 18);
      sceneRef.add(containerYard);

      // 3. Multi-dock Port Logistics Warehouse
      const warehouse = createModernWarehouse(T, 36, 14, 24, 0x1E293B);
      warehouse.position.set(centerPos.x - 28, 0, centerPos.z + 20);
      sceneRef.add(warehouse);

      // 4. Industrial Petroleum & Chemical Tank Farm
      const tankFarm = createFuelTankCluster(T);
      tankFarm.position.set(centerPos.x - 38, 0, centerPos.z - 18);
      sceneRef.add(tankFarm);
    } else if (type === 'airport') {
      // Air cargo freight terminal
      const cargoWarehouse = createModernWarehouse(T, 42, 12, 28, 0x182433);
      cargoWarehouse.position.set(centerPos.x - 20, 0, centerPos.z + 18);
      sceneRef.add(cargoWarehouse);

      // Apron container block
      const yard = createContainerYardBlock(T);
      yard.position.set(centerPos.x + 24, 0, centerPos.z + 15);
      sceneRef.add(yard);
    } else {
      // Inland logistics hub / depot
      const inlandWh = createModernWarehouse(T, 28, 11, 20, 0x1E2A38);
      inlandWh.position.set(centerPos.x + 18, 0, centerPos.z + 16);
      sceneRef.add(inlandWh);

      const yard = createContainerYardBlock(T);
      yard.position.set(centerPos.x - 20, 0, centerPos.z + 14);
      sceneRef.add(yard);
    }
  }

  // --- STS Gantry Crane Builder ---
  function createSTSCrane(T, colorHex = 0xD97706) {
    const group = new T.Group();
    const craneMat = new T.MeshStandardMaterial({ color: colorHex, metalness: 0.65, roughness: 0.35 });
    const steelDark = new T.MeshStandardMaterial({ color: 0x1E293B, metalness: 0.5, roughness: 0.5 });

    // Portal frame legs (4 vertical columns)
    const legGeo = new T.BoxGeometry(1.6, 36, 1.6);
    for (const lx of [-10, 10]) {
      for (const lz of [-7, 7]) {
        const leg = new T.Mesh(legGeo, craneMat);
        leg.position.set(lx, 18, lz);
        leg.castShadow = true;
        group.add(leg);
      }
    }

    // Horizontal sill beams & diagonal cross braces
    const braceGeo = new T.BoxGeometry(22, 1.4, 1.4);
    const braceLow = new T.Mesh(braceGeo, craneMat);
    braceLow.position.set(0, 12, -7);
    group.add(braceLow);
    const braceLow2 = new T.Mesh(braceGeo, craneMat);
    braceLow2.position.set(0, 12, 7);
    group.add(braceLow2);

    // Boom girder structure (extends seaside and landside)
    const boomGeo = new T.BoxGeometry(38, 3.2, 15);
    const boom = new T.Mesh(boomGeo, craneMat);
    boom.position.set(0, 36, 0);
    boom.castShadow = true;
    group.add(boom);

    // Hoist trolley carriage
    const trolleyGeo = new T.BoxGeometry(6, 2.4, 6);
    const trolley = new T.Mesh(trolleyGeo, steelDark);
    trolley.position.set(4, 34, 0);
    group.add(trolley);

    // Hoist cables
    const cableGeo = new T.CylinderGeometry(0.06, 0.06, 12, 6);
    for (const cx of [-2, 2]) {
      for (const cz of [-2, 2]) {
        const cable = new T.Mesh(cableGeo, steelDark);
        cable.position.set(4 + cx, 27, cz);
        group.add(cable);
      }
    }

    // Spreader bar
    const spreaderGeo = new T.BoxGeometry(3.6, 0.8, 12);
    const spreaderMat = new T.MeshStandardMaterial({ color: 0xF59E0B, metalness: 0.5 });
    const spreader = new T.Mesh(spreaderGeo, spreaderMat);
    spreader.position.set(4, 21, 0);
    spreader.castShadow = true;
    group.add(spreader);

    // Suspended 40ft ISO shipping container
    const cGeo = new T.BoxGeometry(4.8, 4.2, 12.2);
    const cMat = new T.MeshStandardMaterial({ color: 0x0284C7, roughness: 0.4, metalness: 0.3 }); // Maersk Blue
    const cont = new T.Mesh(cGeo, cMat);
    cont.position.set(4, 18.5, 0);
    cont.castShadow = true;
    group.add(cont);

    // Glass operator cabin
    const cabGeo = new T.BoxGeometry(2.4, 2.6, 3);
    const cabMat = new T.MeshStandardMaterial({ color: 0x93C5FD, roughness: 0.1, metalness: 0.9, transparent: true, opacity: 0.8 });
    const cab = new T.Mesh(cabGeo, cabMat);
    cab.position.set(4, 32.5, 5);
    group.add(cab);

    return group;
  }

  // --- Modern Industrial Warehouse Builder ---
  function createModernWarehouse(T, bw, bh, bd, colorHex = 0x1E293B) {
    const group = new T.Group();

    // Main hall structure
    const bodyGeo = new T.BoxGeometry(bw, bh, bd);
    const bodyMat = new T.MeshStandardMaterial({ color: colorHex, roughness: 0.72, metalness: 0.28 });
    const body = new T.Mesh(bodyGeo, bodyMat);
    body.position.y = bh / 2;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // Gabled roof with overhang
    const roofGeo = new T.ConeGeometry(bw * 0.74, bh * 0.28, 4);
    roofGeo.rotateY(Math.PI / 4);
    const roofMat = new T.MeshStandardMaterial({ color: 0x2A374A, roughness: 0.55, metalness: 0.35 });
    const roof = new T.Mesh(roofGeo, roofMat);
    roof.position.y = bh + (bh * 0.14);
    roof.scale.set(1, 1, bd / bw);
    roof.castShadow = true;
    group.add(roof);

    // Loading dock doors with rubber seals and roll-up shutters
    const numDocks = 3;
    const dockSpacing = bw / (numDocks + 1);
    const dockW = bw * 0.20;
    const dockH = bh * 0.45;

    for (let d = 0; d < numDocks; d++) {
      const dx = -bw / 2 + dockSpacing * (d + 1);

      // Black rubber compression seal
      const sealGeo = new T.BoxGeometry(dockW + 0.8, dockH + 0.6, 0.6);
      const sealMat = new T.MeshStandardMaterial({ color: 0x090D12, roughness: 0.9 });
      const seal = new T.Mesh(sealGeo, sealMat);
      seal.position.set(dx, dockH / 2, bd / 2 + 0.3);
      group.add(seal);

      // Metal roll-up sectional door
      const doorGeo = new T.BoxGeometry(dockW, dockH, 0.4);
      const doorMat = new T.MeshStandardMaterial({ color: 0x475569, roughness: 0.6, metalness: 0.4 });
      const door = new T.Mesh(doorGeo, doorMat);
      door.position.set(dx, dockH / 2, bd / 2 + 0.5);
      group.add(door);

      // Yellow dock bumper blocks
      for (const bx of [-dockW / 2 + 0.3, dockW / 2 - 0.3]) {
        const bump = new T.Mesh(new T.BoxGeometry(0.5, 1.2, 0.8), new T.MeshStandardMaterial({ color: 0xEAB308 }));
        bump.position.set(dx + bx, 0.6, bd / 2 + 0.8);
        group.add(bump);
      }
    }

    // Rooftop HVAC industrial condenser chillers
    for (let h = 0; h < 2; h++) {
      const hvacGeo = new T.BoxGeometry(3.5, 1.8, 3.5);
      const hvacMat = new T.MeshStandardMaterial({ color: 0x64748B, roughness: 0.5, metalness: 0.5 });
      const hvac = new T.Mesh(hvacGeo, hvacMat);
      hvac.position.set(-bw * 0.25 + h * (bw * 0.5), bh + 1.2, 0);
      group.add(hvac);
    }

    return group;
  }

  // --- Multi-Tier Container Yard Block ---
  function createContainerYardBlock(T) {
    const group = new T.Group();
    // Authentic carrier colors: Maersk Light Blue, Evergreen Green, Hapag-Lloyd Orange, ONE Magenta, MSC Grey
    const cPalette = [0x0284C7, 0x15803D, 0xEA580C, 0xBE185D, 0x475569];
    const cW = 4.8;
    const cH = 4.2;
    const cL = 12.2;

    for (let col = 0; col < 3; col++) {
      for (let row = 0; row < 2; row++) {
        const tiers = 1 + ((col + row) % 2); // 1 to 2 tiers high
        for (let tier = 0; tier < tiers; tier++) {
          const colorHex = cPalette[(col * 2 + row * 3 + tier) % cPalette.length];
          const cMat = new T.MeshStandardMaterial({ color: colorHex, roughness: 0.5, metalness: 0.35 });
          const cont = new T.Mesh(new T.BoxGeometry(cW, cH, cL), cMat);
          cont.position.set(col * (cW + 0.8), cH / 2 + tier * cH, row * (cL + 1.2));
          cont.castShadow = true;
          cont.receiveShadow = true;
          group.add(cont);

          // Modeled corner castings (silver steel cubes at corners)
          const cornerMat = new T.MeshStandardMaterial({ color: 0xCBD5E1, metalness: 0.8 });
          for (const kx of [-cW / 2 + 0.2, cW / 2 - 0.2]) {
            for (const kz of [-cL / 2 + 0.2, cL / 2 - 0.2]) {
              const casting = new T.Mesh(new T.BoxGeometry(0.4, 0.4, 0.4), cornerMat);
              casting.position.set(col * (cW + 0.8) + kx, cH / 2 + tier * cH + cH / 2 - 0.2, row * (cL + 1.2) + kz);
              group.add(casting);
            }
          }
        }
      }
    }

    return group;
  }

  // --- Petroleum & Hazardous Chemical Tank Cluster ---
  function createFuelTankCluster(T) {
    const group = new T.Group();
    const tankMat = new T.MeshStandardMaterial({ color: 0xE2E8F0, metalness: 0.75, roughness: 0.25 });
    const bermMat = new T.MeshStandardMaterial({ color: 0x334155, roughness: 0.9 });

    // Concrete containment dike berm wall around tanks
    const berm = new T.Mesh(new T.BoxGeometry(28, 1.4, 24), bermMat);
    berm.position.set(0, 0.7, 0);
    group.add(berm);

    // 2 Cylindrical storage tanks with spherical dome caps
    for (let i = 0; i < 2; i++) {
      const tx = -6 + i * 12;
      const tRadius = 5.2;
      const tHeight = 11;

      const cylGeo = new T.CylinderGeometry(tRadius, tRadius, tHeight, 20);
      const cyl = new T.Mesh(cylGeo, tankMat);
      cyl.position.set(tx, 0.7 + tHeight / 2, 0);
      cyl.castShadow = true;
      group.add(cyl);

      const domeGeo = new T.SphereGeometry(tRadius, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2);
      const dome = new T.Mesh(domeGeo, tankMat);
      dome.position.set(tx, 0.7 + tHeight, 0);
      dome.castShadow = true;
      group.add(dome);
    }

    return group;
  }

  // --- 3D Geofences ---
  function addGeofence(center, radius, colorHex) {
    const geo = new THREE.RingGeometry(radius - 1, radius, 32);
    const mat = new THREE.MeshBasicMaterial({ color: colorHex, side: THREE.DoubleSide, transparent: true, opacity: 0.5 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(center.x, 0.38, center.z);
    scene.add(mesh);
  }

  if (hubPositions.kariangau) addGeofence(hubPositions.kariangau, 42, 0x2DD4BF);
  if (hubPositions.somber) addGeofence(hubPositions.somber, 35, 0xD99B66);
  if (hubPositions.sepinggan) addGeofence(hubPositions.sepinggan, 38, 0x38BDF8);

  // --- 20 Fleet Vehicles (High-Fidelity Articulated 3D Trucks) ---
  const vehicleRoutes = assignVehicleRoutes(20);
  const initialProgress = vehicleRoutes.map(vr => vr.progress);
  const vehicleProgress = [...initialProgress];
  let lastTick = -1;
  const vehicleMeshes = [];
  const truckHitboxes = [];

  for (let i = 0; i < 20; i++) {
    const spec = VEHICLE_TYPES[i % VEHICLE_TYPES.length];
    const truck = createTruckMesh(THREE, spec, i);
    truck.scale.set(1.15, 1.15, 1.15); // Authentic heavy commercial truck scale
    scene.add(truck);
    vehicleMeshes.push(truck);

    // Hitbox for raycaster selection
    const hitGeo = new THREE.BoxGeometry(16, 10, 24);
    const hitMat = new THREE.MeshBasicMaterial({ visible: false });
    const hitbox = new THREE.Mesh(hitGeo, hitMat);
    hitbox.userData = { vehicleIndex: i };
    truck.add(hitbox);
    truckHitboxes.push(hitbox);
  }

  // Active Vehicle Selection Halo
  const haloGeo = new THREE.RingGeometry(5.5, 7.5, 28);
  const haloMat = new THREE.MeshBasicMaterial({ color: 0x2DD4BF, side: THREE.DoubleSide, transparent: true, opacity: 0.85 });
  const selectionHalo = new THREE.Mesh(haloGeo, haloMat);
  selectionHalo.rotation.x = -Math.PI / 2;
  selectionHalo.position.y = 0.55;
  scene.add(selectionHalo);

  // --- Camera Controller State ---
  let camMode = 'free'; // 'free', 'follow', 'chase', 'overview'
  let selectedVehicleIndex = 0;

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
    for (const m of ['free', 'follow', 'chase', 'overview']) {
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

    const selMesh = vehicleMeshes[selectedVehicleIndex];
    const truckPos = selMesh ? selMesh.position : new THREE.Vector3(0, 0, 0);
    const truckRot = selMesh ? selMesh.rotation.y : 0;

    if (mode === 'overview') {
      orbitTarget.set(0, 0, 0);
      orbitSpherical.radius = 280;
      orbitSpherical.phi = Math.PI / 4.5;
      orbitSpherical.theta = -0.15;
      camera.position.set(0, 240, 180);
      camera.lookAt(0, 0, 0);
    } else if (mode === 'follow') {
      const targetCamX = truckPos.x + 35 * Math.sin(truckRot - Math.PI / 2);
      const targetCamZ = truckPos.z + 45 * Math.cos(truckRot - Math.PI / 2);
      camera.position.set(targetCamX, 42, targetCamZ);
      camera.lookAt(truckPos.x, truckPos.y + 4, truckPos.z);
    } else if (mode === 'chase') {
      const chaseDist = 28;
      const chaseHeight = 14;
      const targetCamX = truckPos.x - chaseDist * Math.sin(truckRot + Math.PI / 2);
      const targetCamZ = truckPos.z - chaseDist * Math.cos(truckRot + Math.PI / 2);
      camera.position.set(targetCamX, chaseHeight, targetCamZ);
      camera.lookAt(truckPos.x, truckPos.y + 3, truckPos.z);
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
    const simState = sim ? sim.getSnapshot() : { status: 'RUNNING', speedMultiplier: 1, tick: 0, scenario: 'NORMAL_DELIVERY' };
    const isRunning = simState.status === 'RUNNING';
    const speedMult = simState.speedMultiplier || 1;
    const currentTick = simState.tick || 0;
    const scenario = simState.scenario || 'NORMAL_DELIVERY';

    // Synchronize tick state changes
    if (currentTick !== lastTick) {
      if (currentTick === 0) {
        for (let i = 0; i < 20; i++) {
          vehicleProgress[i] = initialProgress[i];
        }
      } else if (!isRunning) {
        // Discrete manual step advance
        const stepRate = scenario === 'VEHICLE_STOP' ? 0 : (scenario === 'TRAFFIC_DELAY' ? 0.004 : 0.008);
        for (let i = 0; i < 20; i++) {
          vehicleProgress[i] = (vehicleProgress[i] + stepRate * speedMult * (0.85 + (i % 4) * 0.1)) % 1.0;
          vehicleMeshes[i].userData.rollWheels?.(stepRate * 120);
        }
      }
      lastTick = currentTick;
    }

    // Continuous motion when simulation is actively running
    if (isRunning && scenario !== 'VEHICLE_STOP') {
      const scenarioFactor = scenario === 'TRAFFIC_DELAY' ? 0.5 : 1.0;
      const speedDelta = 0.0006 * speedMult * scenarioFactor;
      for (let i = 0; i < 20; i++) {
        vehicleProgress[i] = (vehicleProgress[i] + speedDelta * (0.85 + (i % 4) * 0.1)) % 1.0;
        vehicleMeshes[i].userData.rollWheels?.(speedDelta * 140);
      }
    }

    // Position each vehicle along its geographic route
    for (let i = 0; i < 20; i++) {
      const vr = vehicleRoutes[i];
      const geoPos = interpolateRoute(vr.waypoints, vehicleProgress[i]);
      const p3 = geoTo3D(geoPos.lng, geoPos.lat);
      const mesh = vehicleMeshes[i];

      mesh.position.set(p3.x, 0.45, p3.z);
      mesh.rotation.y = (-geoPos.bearing * Math.PI) / 180 + Math.PI / 2;
    }

    // Update selection halo position
    const selMesh = vehicleMeshes[selectedVehicleIndex];
    if (selMesh) {
      selectionHalo.position.set(selMesh.position.x, 0.5, selMesh.position.z);
    }

    // --- Dynamic Camera Tracking ---
    if (selMesh) {
      const truckPos = selMesh.position;
      const truckRot = selMesh.rotation.y;

      if (camMode === 'follow') {
        const targetCamX = truckPos.x + 35 * Math.sin(truckRot - Math.PI / 2);
        const targetCamZ = truckPos.z + 45 * Math.cos(truckRot - Math.PI / 2);
        camera.position.x += (targetCamX - camera.position.x) * 0.1;
        camera.position.y += (42 - camera.position.y) * 0.1;
        camera.position.z += (targetCamZ - camera.position.z) * 0.1;
        camera.lookAt(truckPos.x, truckPos.y + 4, truckPos.z);
      } else if (camMode === 'chase') {
        const chaseDist = 28;
        const chaseHeight = 14;
        const targetCamX = truckPos.x - chaseDist * Math.sin(truckRot + Math.PI / 2);
        const targetCamZ = truckPos.z - chaseDist * Math.cos(truckRot + Math.PI / 2);
        camera.position.x += (targetCamX - camera.position.x) * 0.15;
        camera.position.y += (chaseHeight - camera.position.y) * 0.15;
        camera.position.z += (targetCamZ - camera.position.z) * 0.15;
        camera.lookAt(truckPos.x, truckPos.y + 3, truckPos.z);
      } else if (camMode === 'overview') {
        camera.position.set(0, 240, 180);
        camera.lookAt(0, 0, 0);
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
    getCameraState() {
      return {
        mode: camMode,
        position: { x: Number(camera.position.x.toFixed(2)), y: Number(camera.position.y.toFixed(2)), z: Number(camera.position.z.toFixed(2)) },
        target: { x: Number(orbitTarget.x.toFixed(2)), y: Number(orbitTarget.y.toFixed(2)), z: Number(orbitTarget.z.toFixed(2)) },
        selectedVehicle: selectedVehicleIndex
      };
    },
    getRenderInfo() {
      return {
        calls: renderer.info.render.calls,
        triangles: renderer.info.render.triangles,
        frame: renderer.info.render.frame
      };
    },
    getVehicleProgress(index) {
      return vehicleProgress[index ?? selectedVehicleIndex];
    },
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
