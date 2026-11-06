// ATLAS 3D Scenes — Three.js WebGL renderers for S01 Landing and S02 Overview
// Copyright © 2026 Kevin Oloan Simatupang. All rights reserved.

import { createTruckMesh, VEHICLE_TYPES } from './vehicles.js';

/**
 * Creates a high-fidelity 3D WebGL scene for S01 Landing.
 * Renders realistic industrial warehouses, gantry cranes, container stacks,
 * fuel tanks, illuminated roadways, and articulated 3D trucks.
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
  scene.background = new THREE.Color(0x0B0F14);
  scene.fog = new THREE.FogExp2(0x0B0F14, 0.0035);

  const camera = new THREE.PerspectiveCamera(42, 1, 1, 1000);
  camera.position.set(0, 110, 210);
  camera.lookAt(0, 0, 10);

  // --- Lighting ---
  const ambient = new THREE.AmbientLight(0x1A2535, 2.2);
  scene.add(ambient);

  const keyLight = new THREE.DirectionalLight(0xFFE4C4, 2.5); // Warm copper-ish key
  keyLight.position.set(120, 180, 100);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.width = 1024;
  keyLight.shadow.mapSize.height = 1024;
  scene.add(keyLight);

  const tealFill = new THREE.DirectionalLight(0x2DD4BF, 1.2); // Cool teal fill
  tealFill.position.set(-140, 100, -80);
  scene.add(tealFill);

  // --- Ground & Water ---
  const groundGeo = new THREE.PlaneGeometry(600, 600, 24, 24);
  const groundMat = new THREE.MeshStandardMaterial({
    color: 0x0D131C,
    roughness: 0.85,
    metalness: 0.2
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // Grid overlay
  const grid = new THREE.GridHelper(500, 50, 0x1E293B, 0x131C28);
  grid.position.y = 0.1;
  scene.add(grid);

  // Balikpapan Bay water strip
  const waterGeo = new THREE.PlaneGeometry(600, 160);
  const waterMat = new THREE.MeshStandardMaterial({
    color: 0x061524,
    roughness: 0.15,
    metalness: 0.85
  });
  const water = new THREE.Mesh(waterGeo, waterMat);
  water.rotation.x = -Math.PI / 2;
  water.position.set(0, 0.2, -180);
  scene.add(water);

  // --- Highway Corridor (Glowing Teal Road) ---
  const roadGeo = new THREE.PlaneGeometry(500, 16);
  const roadMat = new THREE.MeshStandardMaterial({
    color: 0x141C24,
    roughness: 0.6
  });
  const road = new THREE.Mesh(roadGeo, roadMat);
  road.rotation.x = -Math.PI / 2;
  road.position.set(0, 0.3, -10);
  scene.add(road);

  // Glowing road edges
  const edgeGeo = new THREE.PlaneGeometry(500, 0.8);
  const edgeMat = new THREE.MeshBasicMaterial({ color: 0x2DD4BF });
  const edge1 = new THREE.Mesh(edgeGeo, edgeMat);
  edge1.rotation.x = -Math.PI / 2;
  edge1.position.set(0, 0.35, -18);
  scene.add(edge1);
  const edge2 = new THREE.Mesh(edgeGeo, edgeMat);
  edge2.rotation.x = -Math.PI / 2;
  edge2.position.set(0, 0.35, -2);
  scene.add(edge2);

  // --- Volumetric Warehouses ---
  function addWarehouse(x, z, w, h, d, color = 0x1E293B) {
    const group = new THREE.Group();
    // Main hall
    const geo = new THREE.BoxGeometry(w, h, d);
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.7, metalness: 0.3 });
    const building = new THREE.Mesh(geo, mat);
    building.position.y = h / 2;
    building.castShadow = true;
    building.receiveShadow = true;
    group.add(building);

    // Pitched roof
    const roofGeo = new THREE.ConeGeometry(w * 0.72, h * 0.3, 4);
    roofGeo.rotateY(Math.PI / 4);
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x263142, roughness: 0.5 });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = h + (h * 0.15);
    roof.scale.set(1, 1, d / w);
    roof.castShadow = true;
    group.add(roof);

    // Loading bay docks
    for (let b = 0; b < 3; b++) {
      const bayGeo = new THREE.BoxGeometry(w * 0.22, h * 0.45, 1.5);
      const bayMat = new THREE.MeshStandardMaterial({ color: 0x0F172A });
      const bay = new THREE.Mesh(bayGeo, bayMat);
      bay.position.set((b - 1) * (w * 0.28), h * 0.225, d / 2 + 0.8);
      group.add(bay);
    }

    group.position.set(x, 0, z);
    scene.add(group);
    return group;
  }

  addWarehouse(-110, -70, 75, 26, 50, 0x1A2535);
  addWarehouse(-190, -60, 60, 22, 45, 0x1E293B);
  addWarehouse(-130, 70, 80, 28, 55, 0x16202E);

  // --- Gantry Cranes (Copper #D99B66) ---
  function addGantryCrane(x, z) {
    const group = new THREE.Group();
    const copperMat = new THREE.MeshStandardMaterial({ color: 0xD99B66, metalness: 0.6, roughness: 0.4 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x1E293B });

    // Legs
    const legGeo = new THREE.BoxGeometry(2.5, 48, 2.5);
    for (const lx of [-14, 14]) {
      for (const lz of [-10, 10]) {
        const leg = new THREE.Mesh(legGeo, copperMat);
        leg.position.set(lx, 24, lz);
        leg.castShadow = true;
        group.add(leg);
      }
    }

    // Top horizontal girder
    const girderGeo = new THREE.BoxGeometry(40, 4.5, 24);
    const girder = new THREE.Mesh(girderGeo, copperMat);
    girder.position.set(0, 48, 0);
    girder.castShadow = true;
    group.add(girder);

    // Overhead hoist trolley & suspended container
    const trolleyGeo = new THREE.BoxGeometry(6, 3, 6);
    const trolley = new THREE.Mesh(trolleyGeo, darkMat);
    trolley.position.set(2, 45, 0);
    group.add(trolley);

    const suspendedContainer = new THREE.Mesh(
      new THREE.BoxGeometry(6, 6, 16),
      new THREE.MeshStandardMaterial({ color: 0x2DD4BF, roughness: 0.4 })
    );
    suspendedContainer.position.set(2, 32, 0);
    suspendedContainer.castShadow = true;
    group.add(suspendedContainer);

    group.position.set(x, 0, z);
    scene.add(group);
  }

  addGantryCrane(40, -85);
  addGantryCrane(85, -85);
  addGantryCrane(130, -85);

  // --- Fuel Storage Tanks ---
  for (let fk = 0; fk < 3; fk++) {
    const tankGeo = new THREE.CylinderGeometry(14, 14, 22, 24);
    const tankMat = new THREE.MeshStandardMaterial({ color: 0xCBD5E1, metalness: 0.6, roughness: 0.3 });
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

  // --- Container Stacks ---
  const containerColors = [0xD99B66, 0x2DD4BF, 0x334155, 0x38BDF8, 0xE2E8F0];
  const cGeo = new THREE.BoxGeometry(7, 7, 18);
  for (let cx = 0; cx < 4; cx++) {
    for (let cz = 0; cz < 5; cz++) {
      const heightLevels = 1 + ((cx + cz) % 3);
      for (let ch = 0; ch < heightLevels; ch++) {
        const cMat = new THREE.MeshStandardMaterial({
          color: containerColors[(cx * 3 + cz * 2 + ch) % containerColors.length],
          roughness: 0.5,
          metalness: 0.2
        });
        const cMesh = new THREE.Mesh(cGeo, cMat);
        cMesh.position.set(30 + cx * 9, 3.5 + ch * 7.2, -30 + cz * 21);
        cMesh.castShadow = true;
        cMesh.receiveShadow = true;
        scene.add(cMesh);
      }
    }
  }

  // --- 3D Fleet Trucks on Highway ---
  const trucks = [];
  const truckSpecs = [VEHICLE_TYPES[0], VEHICLE_TYPES[1], VEHICLE_TYPES[2], VEHICLE_TYPES[3]];
  for (let i = 0; i < 4; i++) {
    const truck = createTruckMesh(THREE, truckSpecs[i % truckSpecs.length], i);
    truck.scale.set(1.4, 1.4, 1.4);
    scene.add(truck);
    trucks.push({
      mesh: truck,
      speed: 0.6 + i * 0.15,
      pos: -220 + i * 110,
      lane: i % 2 === 0 ? -13 : -7
    });
  }

  // --- Animation Loop ---
  let scheduledFrame = null;
  let t = 0;

  function render() {
    scheduledFrame = null;
    t += 0.015;

    // Camera orbital motion
    const camRadius = 220;
    camera.position.x = Math.sin(t * 0.12) * 50;
    camera.position.z = 180 + Math.cos(t * 0.12) * 30;
    camera.position.y = 95 + Math.sin(t * 0.08) * 15;
    camera.lookAt(0, 5, 0);

    // Animate trucks along highway
    for (const trk of trucks) {
      trk.pos += trk.speed;
      if (trk.pos > 250) trk.pos = -250;
      trk.mesh.position.set(trk.pos, 0.4, trk.lane);
      trk.mesh.rotation.y = Math.PI / 2; // Face positive X along road
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
  scene.background = new THREE.Color(0x0E141D);

  const camera = new THREE.PerspectiveCamera(38, 1, 1, 1000);
  camera.position.set(0, 95, 140);
  camera.lookAt(0, 0, 0);

  // Lighting
  scene.add(new THREE.AmbientLight(0x243242, 2.0));
  const dirLight = new THREE.DirectionalLight(0xD99B66, 2.0);
  dirLight.position.set(60, 100, 50);
  scene.add(dirLight);

  // Tactical Grid
  const grid = new THREE.GridHelper(260, 26, 0x2DD4BF, 0x1E293B);
  grid.position.y = 0;
  scene.add(grid);

  // Geofence Ring
  const ringGeo = new THREE.RingGeometry(55, 57, 32);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0xEF4444, side: THREE.DoubleSide, transparent: true, opacity: 0.6 });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.2;
  scene.add(ring);

  // Hub Towers
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

  // Mini Trucks
  const miniTrucks = [];
  for (let i = 0; i < 6; i++) {
    const mesh = createTruckMesh(THREE, VEHICLE_TYPES[i % VEHICLE_TYPES.length], i);
    mesh.scale.set(0.9, 0.9, 0.9);
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

    // Rotate trucks around hub paths
    for (const t of miniTrucks) {
      t.angle += t.speed;
      const x = Math.cos(t.angle) * t.radius;
      const z = Math.sin(t.angle) * t.radius;
      t.mesh.position.set(x, 0.4, z);
      t.mesh.rotation.y = -t.angle; // Tangent to circle
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
    dispose() {
      controller.stop();
      if (renderer) renderer.dispose();
      scene.clear();
    }
  };

  return controller;
}

/**
 * Fallback controller for devices without WebGL.
 */
function createFallbackController(canvas, label) {
  const ctx = canvas.getContext('2d');
  let scheduledFrame = null;

  function render() {
    scheduledFrame = null;
    const w = canvas.width = canvas.clientWidth || 400;
    const h = canvas.height = canvas.clientHeight || 250;
    ctx.fillStyle = '#0B0F14';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#2DD4BF';
    ctx.font = '12px monospace';
    ctx.fillText(`${label} (2D Fallback Active)`, 20, 30);
    ctx.fillStyle = '#94A3B8';
    ctx.fillText('WebGL hardware acceleration unavailable.', 20, 50);

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
