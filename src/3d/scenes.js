// ATLAS 3D Scenes — Three.js WebGL renderers for S01 Landing and S02 Overview
// High-fidelity digital twin scenes with realistic PBR materials, asphalt roads, and articulated fleet
// Copyright © 2026 Kevin Oloan Simatupang. All rights reserved.

import { createTruckMesh, VEHICLE_TYPES } from './vehicles.js';

/**
 * Creates a high-fidelity 3D WebGL scene for S01 Landing.
 * Renders realistic industrial warehouses, gantry cranes, container stacks,
 * fuel tanks, illuminated asphalt highway, and articulated 3D commercial trucks.
 *
 * @param {HTMLCanvasElement} canvas
 * @param {object} THREE - Three.js module
 * @returns {object} Controller with { start, stop, drawOnce, isRunning, dispose }
 */
export function initLanding3DScene(canvas, THREE) {
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
    console.warn('WebGL init failed for S01, using fallback:', err);
    isWebgl = false;
  }

  if (!isWebgl || !renderer) {
    return createFallbackController(canvas, 'S01 Landing 3D');
  }

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x090D12);
  scene.fog = new THREE.FogExp2(0x090D12, 0.003);

  const camera = new THREE.PerspectiveCamera(42, 1, 1, 1000);
  camera.position.set(0, 110, 210);
  camera.lookAt(0, 0, 10);

  // --- Natural Environmental Lighting ---
  const ambient = new THREE.AmbientLight(0x202E3F, 2.4);
  scene.add(ambient);

  const keyLight = new THREE.DirectionalLight(0xFFF0DD, 2.6); // Warm sunlight key
  keyLight.position.set(130, 190, 100);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.width = 1024;
  keyLight.shadow.mapSize.height = 1024;
  scene.add(keyLight);

  const tealFill = new THREE.DirectionalLight(0x2DD4BF, 0.9); // Cool teal sky fill
  tealFill.position.set(-140, 100, -80);
  scene.add(tealFill);

  // --- Ground & Water ---
  const groundGeo = new THREE.PlaneGeometry(600, 600, 16, 16);
  const groundMat = new THREE.MeshStandardMaterial({
    color: 0x141C26,
    roughness: 0.9,
    metalness: 0.1
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // Balikpapan Bay coastal water strip
  const waterGeo = new THREE.PlaneGeometry(600, 160);
  const waterMat = new THREE.MeshStandardMaterial({
    color: 0x071626,
    roughness: 0.2,
    metalness: 0.8
  });
  const water = new THREE.Mesh(waterGeo, waterMat);
  water.rotation.x = -Math.PI / 2;
  water.position.set(0, 0.2, -180);
  scene.add(water);

  // --- Realistic Multi-Lane Asphalt Highway ---
  const roadGeo = new THREE.PlaneGeometry(500, 18);
  const roadMat = new THREE.MeshStandardMaterial({
    color: 0x1E242B, // Authentic dark asphalt
    roughness: 0.88,
    metalness: 0.12
  });
  const road = new THREE.Mesh(roadGeo, roadMat);
  road.rotation.x = -Math.PI / 2;
  road.position.set(0, 0.3, -10);
  road.receiveShadow = true;
  scene.add(road);

  // Solid white outer shoulder edge lines
  const shoulderMat = new THREE.MeshBasicMaterial({ color: 0xE2E8F0 });
  const edgeGeo = new THREE.PlaneGeometry(500, 0.5);
  const edge1 = new THREE.Mesh(edgeGeo, shoulderMat);
  edge1.rotation.x = -Math.PI / 2;
  edge1.position.set(0, 0.35, -18.2);
  scene.add(edge1);

  const edge2 = new THREE.Mesh(edgeGeo, shoulderMat);
  edge2.rotation.x = -Math.PI / 2;
  edge2.position.set(0, 0.35, -1.8);
  scene.add(edge2);

  // Dashed yellow centerline divider
  const centerMat = new THREE.MeshBasicMaterial({ color: 0xF59E0B });
  for (let s = -240; s < 250; s += 20) {
    const dash = new THREE.Mesh(new THREE.PlaneGeometry(12, 0.5), centerMat);
    dash.rotation.x = -Math.PI / 2;
    dash.position.set(s, 0.35, -10);
    scene.add(dash);
  }

  // --- Volumetric High-Bay Logistics Warehouses ---
  function addWarehouse(x, z, w, h, d, color = 0x1E293B) {
    const group = new THREE.Group();

    // Main hall structure
    const geo = new THREE.BoxGeometry(w, h, d);
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.72, metalness: 0.28 });
    const building = new THREE.Mesh(geo, mat);
    building.position.y = h / 2;
    building.castShadow = true;
    building.receiveShadow = true;
    group.add(building);

    // Pitched roof
    const roofGeo = new THREE.ConeGeometry(w * 0.72, h * 0.3, 4);
    roofGeo.rotateY(Math.PI / 4);
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x2A374A, roughness: 0.55, metalness: 0.35 });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = h + (h * 0.15);
    roof.scale.set(1, 1, d / w);
    roof.castShadow = true;
    group.add(roof);

    // Loading dock doors with rubber seals and bumpers
    const dockCount = 3;
    const dockW = w * 0.22;
    const dockH = h * 0.45;
    for (let b = 0; b < dockCount; b++) {
      const bx = (b - 1) * (w * 0.28);

      // Black rubber dock seal
      const seal = new THREE.Mesh(
        new THREE.BoxGeometry(dockW + 0.6, dockH + 0.4, 0.6),
        new THREE.MeshStandardMaterial({ color: 0x090D12, roughness: 0.9 })
      );
      seal.position.set(bx, dockH / 2, d / 2 + 0.3);
      group.add(seal);

      // Roll-up sectional door
      const door = new THREE.Mesh(
        new THREE.BoxGeometry(dockW, dockH, 0.4),
        new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.6, metalness: 0.4 })
      );
      door.position.set(bx, dockH / 2, d / 2 + 0.5);
      group.add(door);

      // Yellow safety dock bumpers
      for (const bumpX of [-dockW / 2 + 0.2, dockW / 2 - 0.2]) {
        const bump = new THREE.Mesh(
          new THREE.BoxGeometry(0.5, 1.2, 0.8),
          new THREE.MeshStandardMaterial({ color: 0xEAB308 })
        );
        bump.position.set(bx + bumpX, 0.6, d / 2 + 0.8);
        group.add(bump);
      }
    }

    // Rooftop HVAC chillers
    const hvac = new THREE.Mesh(
      new THREE.BoxGeometry(w * 0.15, 2, d * 0.18),
      new THREE.MeshStandardMaterial({ color: 0x64748B, roughness: 0.5, metalness: 0.5 })
    );
    hvac.position.set(w * 0.2, h + 1, 0);
    group.add(hvac);

    group.position.set(x, 0, z);
    scene.add(group);
    return group;
  }

  addWarehouse(-110, -70, 75, 26, 50, 0x1A2535);
  addWarehouse(-190, -60, 60, 22, 45, 0x1E293B);
  addWarehouse(-130, 70, 80, 28, 55, 0x16202E);

  // --- STS Gantry Cranes (Port Gantry System) ---
  function addGantryCrane(x, z) {
    const group = new THREE.Group();
    const craneMat = new THREE.MeshStandardMaterial({ color: 0xD97706, metalness: 0.65, roughness: 0.35 });
    const steelDark = new THREE.MeshStandardMaterial({ color: 0x1E293B, metalness: 0.5, roughness: 0.5 });

    // Portal legs (4 heavy columns)
    const legGeo = new THREE.BoxGeometry(2.5, 48, 2.5);
    for (const lx of [-14, 14]) {
      for (const lz of [-10, 10]) {
        const leg = new THREE.Mesh(legGeo, craneMat);
        leg.position.set(lx, 24, lz);
        leg.castShadow = true;
        group.add(leg);
      }
    }

    // Cross brace ties
    const braceGeo = new THREE.BoxGeometry(28, 2, 2);
    const brace1 = new THREE.Mesh(braceGeo, craneMat);
    brace1.position.set(0, 16, -10);
    group.add(brace1);
    const brace2 = new THREE.Mesh(braceGeo, craneMat);
    brace2.position.set(0, 16, 10);
    group.add(brace2);

    // Top horizontal boom girder
    const girderGeo = new THREE.BoxGeometry(44, 4.5, 24);
    const girder = new THREE.Mesh(girderGeo, craneMat);
    girder.position.set(0, 48, 0);
    girder.castShadow = true;
    group.add(girder);

    // Overhead hoist trolley
    const trolleyGeo = new THREE.BoxGeometry(7, 3, 7);
    const trolley = new THREE.Mesh(trolleyGeo, steelDark);
    trolley.position.set(4, 45, 0);
    group.add(trolley);

    // Spreader bar & suspended container
    const spreader = new THREE.Mesh(
      new THREE.BoxGeometry(4.5, 1, 14),
      new THREE.MeshStandardMaterial({ color: 0xF59E0B, metalness: 0.6 })
    );
    spreader.position.set(4, 38, 0);
    spreader.castShadow = true;
    group.add(spreader);

    const suspendedContainer = new THREE.Mesh(
      new THREE.BoxGeometry(6, 6, 16),
      new THREE.MeshStandardMaterial({ color: 0x0284C7, roughness: 0.4, metalness: 0.3 }) // Maersk Blue
    );
    suspendedContainer.position.set(4, 34, 0);
    suspendedContainer.castShadow = true;
    group.add(suspendedContainer);

    group.position.set(x, 0, z);
    scene.add(group);
  }

  addGantryCrane(40, -85);
  addGantryCrane(85, -85);
  addGantryCrane(130, -85);

  // --- Petroleum & Chemical Storage Tanks ---
  for (let fk = 0; fk < 3; fk++) {
    const tankGeo = new THREE.CylinderGeometry(14, 14, 22, 24);
    const tankMat = new THREE.MeshStandardMaterial({ color: 0xE2E8F0, metalness: 0.75, roughness: 0.25 });
    const tank = new THREE.Mesh(tankGeo, tankMat);
    tank.position.set(-160 + fk * 36, 11, 40);
    tank.castShadow = true;
    scene.add(tank);

    // Dome cap
    const domeGeo = new THREE.SphereGeometry(14, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2);
    const dome = new THREE.Mesh(domeGeo, tankMat);
    dome.position.set(-160 + fk * 36, 22, 40);
    scene.add(dome);
  }

  // --- Multi-Tier Container Stacks with Authentic Carrier Liveries ---
  const containerColors = [0x0284C7, 0x15803D, 0xEA580C, 0xBE185D, 0x475569];
  const cGeo = new THREE.BoxGeometry(7, 7, 18);
  for (let cx = 0; cx < 4; cx++) {
    for (let cz = 0; cz < 5; cz++) {
      const heightLevels = 1 + ((cx + cz) % 3);
      for (let ch = 0; ch < heightLevels; ch++) {
        const cMat = new THREE.MeshStandardMaterial({
          color: containerColors[(cx * 3 + cz * 2 + ch) % containerColors.length],
          roughness: 0.5,
          metalness: 0.35
        });
        const cMesh = new THREE.Mesh(cGeo, cMat);
        cMesh.position.set(30 + cx * 9, 3.5 + ch * 7.2, -30 + cz * 21);
        cMesh.castShadow = true;
        cMesh.receiveShadow = true;
        scene.add(cMesh);
      }
    }
  }

  // --- High-Fidelity 3D Fleet Trucks on Highway ---
  const trucks = [];
  const truckSpecs = [VEHICLE_TYPES[0], VEHICLE_TYPES[1], VEHICLE_TYPES[2], VEHICLE_TYPES[3]];
  for (let i = 0; i < 4; i++) {
    const truck = createTruckMesh(THREE, truckSpecs[i % truckSpecs.length], i);
    truck.scale.set(1.3, 1.3, 1.3);
    scene.add(truck);
    trucks.push({
      mesh: truck,
      speed: 0.6 + i * 0.15,
      pos: -220 + i * 110,
      lane: i % 2 === 0 ? -13.5 : -6.5
    });
  }

  // --- Animation Loop ---
  let scheduledFrame = null;
  let t = 0;

  function render() {
    scheduledFrame = null;
    t += 0.015;

    // Smooth subtle camera orbital motion
    camera.position.x = Math.sin(t * 0.12) * 45;
    camera.position.z = 185 + Math.cos(t * 0.12) * 25;
    camera.position.y = 95 + Math.sin(t * 0.08) * 12;
    camera.lookAt(0, 5, 0);

    // Animate trucks along highway synchronized with canonical simulation
    const sim = window.ATLAS_V21?.sim;
    const simState = sim ? sim.getSnapshot() : { status: 'RUNNING', speedMultiplier: 1 };
    const isRunning = simState.status === 'RUNNING';
    const speedMult = simState.speedMultiplier || 1;

    if (isRunning) {
      for (const trk of trucks) {
        trk.pos += trk.speed * speedMult;
        if (trk.pos > 250) trk.pos = -250;
        trk.mesh.position.set(trk.pos, 0.45, trk.lane);
        trk.mesh.rotation.y = Math.PI / 2; // Face positive X along road

        // Dynamic rolling wheels
        trk.mesh.userData.rollWheels?.(trk.speed * speedMult * 0.8);
      }
    }

    // Resize viewport dynamically
    const width = canvas.clientWidth || 800;
    const height = canvas.clientHeight || 500;
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
    getRenderInfo() {
      return {
        calls: renderer ? renderer.info.render.calls : 0,
        triangles: renderer ? renderer.info.render.triangles : 0
      };
    },
    dispose() {
      controller.stop();
      if (renderer) renderer.dispose();
      scene.clear();
    }
  };

  return controller;
}

/**
 * Creates a tactical 3D WebGL scene for S02 Overview.
 * Displays the Kariangau logistics port zone with 3D buildings,
 * geofences, and moving fleet vehicles linked to the canonical simulation.
 *
 * @param {HTMLCanvasElement} canvas
 * @param {object} THREE - Three.js module
 * @returns {object} Controller
 */
export function initOverview3DScene(canvas, THREE) {
  if (!canvas) return null;

  let renderer = null;
  let isWebgl = true;

  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  } catch (err) {
    console.warn('WebGL init failed for S02:', err);
    isWebgl = false;
  }

  if (!isWebgl || !renderer) {
    return createFallbackController(canvas, 'S02 Tactical 3D');
  }

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0C121A);

  const camera = new THREE.PerspectiveCamera(38, 1, 1, 1000);
  camera.position.set(0, 95, 140);
  camera.lookAt(0, 0, 0);

  // Lighting
  scene.add(new THREE.AmbientLight(0x263445, 2.2));
  const dirLight = new THREE.DirectionalLight(0xFFE0C2, 2.2);
  dirLight.position.set(60, 100, 50);
  scene.add(dirLight);

  // Ground plane with satellite basemap texture
  const groundGeo = new THREE.PlaneGeometry(260, 208, 1, 1);
  const groundMat = new THREE.MeshStandardMaterial({
    color: 0x1A232E,
    roughness: 0.9,
    metalness: 0.1
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

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
    () => {}
  );

  // Tactical Boundary Ring
  const ringGeo = new THREE.RingGeometry(55, 57, 32);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0xEF4444, side: THREE.DoubleSide, transparent: true, opacity: 0.65 });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.25;
  scene.add(ring);

  // Hub Towers with beacons
  const hubCoords = [
    { x: -40, z: -30, h: 22, name: 'Kariangau' },
    { x: 30, z: -20, h: 18, name: 'Somber' },
    { x: -10, z: 25, h: 26, name: 'MT Haryono' },
  ];
  for (const h of hubCoords) {
    const towerGeo = new THREE.CylinderGeometry(2, 4, h.h, 8);
    const towerMat = new THREE.MeshStandardMaterial({ color: 0x263142, metalness: 0.6 });
    const tower = new THREE.Mesh(towerGeo, towerMat);
    tower.position.set(h.x, h.h / 2, h.z);
    scene.add(tower);

    const beaconGeo = new THREE.SphereGeometry(2.5, 8, 8);
    const beaconMat = new THREE.MeshBasicMaterial({ color: 0x2DD4BF });
    const beacon = new THREE.Mesh(beaconGeo, beaconMat);
    beacon.position.set(h.x, h.h + 2, h.z);
    scene.add(beacon);
  }

  // High-Fidelity Mini Trucks
  const miniTrucks = [];
  for (let i = 0; i < 6; i++) {
    const mesh = createTruckMesh(THREE, VEHICLE_TYPES[i % VEHICLE_TYPES.length], i);
    mesh.scale.set(0.95, 0.95, 0.95);
    scene.add(mesh);
    miniTrucks.push({
      mesh,
      angle: (i / 6) * Math.PI * 2,
      radius: 35 + (i % 3) * 12,
      speed: 0.012 + (i % 2) * 0.006
    });
  }

  let scheduledFrame = null;

  function render() {
    scheduledFrame = null;

    // Rotate trucks around hub paths synchronized with simulation state
    const sim = window.ATLAS_V21?.sim;
    const simState = sim ? sim.getSnapshot() : { status: 'RUNNING', speedMultiplier: 1 };
    const isRunning = simState.status === 'RUNNING';
    const speedMult = simState.speedMultiplier || 1;

    if (isRunning) {
      for (const t of miniTrucks) {
        t.angle += t.speed * speedMult;
        const x = Math.cos(t.angle) * t.radius;
        const z = Math.sin(t.angle) * t.radius;
        t.mesh.position.set(x, 0.45, z);
        t.mesh.rotation.y = -t.angle; // Tangent to circle

        // Roll wheels
        t.mesh.userData.rollWheels?.(t.speed * speedMult * 35);
      }
    }

    const width = canvas.clientWidth || 400;
    const height = canvas.clientHeight || 250;
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
    getRenderInfo() {
      return {
        calls: renderer ? renderer.info.render.calls : 0,
        triangles: renderer ? renderer.info.render.triangles : 0
      };
    },
    dispose() {
      controller.stop();
      if (renderer) renderer.dispose();
      scene.clear();
    }
  };

  return controller;
}

function createFallbackController(canvas, name) {
  const ctx = canvas.getContext('2d');
  let scheduledFrame = null;

  function render() {
    scheduledFrame = null;
    const w = canvas.width = canvas.clientWidth || 300;
    const h = canvas.height = canvas.clientHeight || 200;
    ctx.fillStyle = '#0B0F14';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#2DD4BF';
    ctx.font = '12px monospace';
    ctx.fillText(name + ' (Fallback)', 15, 25);
    ctx.fillStyle = '#94A3B8';
    ctx.font = '11px monospace';
    ctx.fillText('WebGL hardware unavailable', 15, 45);

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
