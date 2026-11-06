// ATLAS 3D Vehicle Factory — procedural Three.js truck geometries
// Copyright © 2026 Kevin Oloan Simatupang. All rights reserved.

/**
 * Vehicle type configurations for the 20-truck ATLAS fleet.
 * Each type has distinct geometry proportions, colors, and features.
 */
export const VEHICLE_TYPES = [
  { type: 'container',  label: 'Container Truck',  cabinColor: 0x1A2230, trailerColor: 0x2DD4BF, length: 12, width: 2.5, height: 3.8, trailerLen: 8 },
  { type: 'box',        label: 'Box Truck',        cabinColor: 0x1A2230, trailerColor: 0xD99B66, length: 9,  width: 2.4, height: 3.2, trailerLen: 6 },
  { type: 'reefer',     label: 'Reefer Truck',     cabinColor: 0x1A2230, trailerColor: 0x38BDF8, length: 11, width: 2.5, height: 3.6, trailerLen: 7.5 },
  { type: 'tanker',     label: 'Tanker Truck',     cabinColor: 0x1A2230, trailerColor: 0x94A3B8, length: 11, width: 2.4, height: 3.0, trailerLen: 7 },
  { type: 'cargo',      label: 'Cargo Flatbed',    cabinColor: 0x1A2230, trailerColor: 0x334155, length: 10, width: 2.5, height: 2.4, trailerLen: 7 },
];

/**
 * Create a single procedural 3D truck mesh group.
 * @param {object} THREE - Three.js namespace
 * @param {object} spec - Vehicle type spec from VEHICLE_TYPES
 * @param {number} index - Unique vehicle index (0-19) for color variation
 * @returns {THREE.Group} Truck mesh group
 */
export function createTruckMesh(THREE, spec, index) {
  const group = new THREE.Group();
  group.name = `truck-${index}`;

  // --- Cabin ---
  const cabinW = spec.width;
  const cabinH = 2.2;
  const cabinD = 2.5;
  const cabinGeo = new THREE.BoxGeometry(cabinW, cabinH, cabinD);
  const cabinMat = new THREE.MeshLambertMaterial({ color: spec.cabinColor });
  const cabin = new THREE.Mesh(cabinGeo, cabinMat);
  cabin.position.set(0, cabinH / 2 + 0.6, spec.trailerLen / 2 + cabinD / 2 + 0.2);
  cabin.castShadow = true;
  group.add(cabin);

  // --- Windshield ---
  const windGeo = new THREE.PlaneGeometry(cabinW * 0.8, cabinH * 0.5);
  const windMat = new THREE.MeshLambertMaterial({ color: 0x4A6580, transparent: true, opacity: 0.7 });
  const windshield = new THREE.Mesh(windGeo, windMat);
  windshield.position.set(0, cabinH * 0.6 + 0.6, cabin.position.z + cabinD / 2 + 0.01);
  group.add(windshield);

  // --- Trailer / cargo body ---
  if (spec.type === 'tanker') {
    // Cylindrical tank
    const tankGeo = new THREE.CylinderGeometry(spec.width * 0.45, spec.width * 0.45, spec.trailerLen, 12);
    tankGeo.rotateX(Math.PI / 2);
    const tankMat = new THREE.MeshLambertMaterial({ color: spec.trailerColor });
    const tank = new THREE.Mesh(tankGeo, tankMat);
    tank.position.set(0, spec.height * 0.4 + 0.6, 0);
    tank.castShadow = true;
    group.add(tank);
    // Tank end caps visible color
    const capGeo = new THREE.CircleGeometry(spec.width * 0.45, 12);
    const capMat = new THREE.MeshLambertMaterial({ color: 0x64748B });
    const cap1 = new THREE.Mesh(capGeo, capMat);
    cap1.position.set(0, spec.height * 0.4 + 0.6, spec.trailerLen / 2 + 0.01);
    group.add(cap1);
    const cap2 = new THREE.Mesh(capGeo, capMat);
    cap2.position.set(0, spec.height * 0.4 + 0.6, -spec.trailerLen / 2 - 0.01);
    cap2.rotation.y = Math.PI;
    group.add(cap2);
  } else if (spec.type === 'cargo') {
    // Flatbed platform
    const flatGeo = new THREE.BoxGeometry(spec.width, 0.3, spec.trailerLen);
    const flatMat = new THREE.MeshLambertMaterial({ color: spec.trailerColor });
    const flat = new THREE.Mesh(flatGeo, flatMat);
    flat.position.set(0, 0.75, 0);
    flat.castShadow = true;
    group.add(flat);
    // Cargo crates on flatbed
    const crateColors = [0xD99B66, 0x2DD4BF, 0x334155, 0x38BDF8];
    for (let c = 0; c < 3; c++) {
      const crateGeo = new THREE.BoxGeometry(spec.width * 0.8, 1.2, spec.trailerLen * 0.25);
      const crateMat = new THREE.MeshLambertMaterial({ color: crateColors[(index + c) % crateColors.length] });
      const crate = new THREE.Mesh(crateGeo, crateMat);
      crate.position.set(0, 1.5, (c - 1) * spec.trailerLen * 0.3);
      crate.castShadow = true;
      group.add(crate);
    }
  } else {
    // Box / container / reefer — rectangular trailer
    const variation = 1.0 + (index % 3) * 0.05;
    const trailerH = spec.height * 0.7 * variation;
    const trailerGeo = new THREE.BoxGeometry(spec.width, trailerH, spec.trailerLen);
    const hueShift = (index * 0.05) % 0.15;
    const color = new THREE.Color(spec.trailerColor);
    color.offsetHSL(hueShift, 0, 0);
    const trailerMat = new THREE.MeshLambertMaterial({ color });
    const trailer = new THREE.Mesh(trailerGeo, trailerMat);
    trailer.position.set(0, trailerH / 2 + 0.6, 0);
    trailer.castShadow = true;
    group.add(trailer);

    if (spec.type === 'reefer') {
      // Reefer unit on front wall
      const unitGeo = new THREE.BoxGeometry(spec.width * 0.6, 0.6, 0.4);
      const unitMat = new THREE.MeshLambertMaterial({ color: 0xE2E8F0 });
      const unit = new THREE.Mesh(unitGeo, unitMat);
      unit.position.set(0, trailerH + 0.6, spec.trailerLen / 2 + 0.2);
      group.add(unit);
    }
  }

  // --- Wheels (4 axles) ---
  const wheelGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 8);
  wheelGeo.rotateZ(Math.PI / 2);
  const wheelMat = new THREE.MeshLambertMaterial({ color: 0x1E293B });
  const wheelPositions = [
    // Front axle
    { x: spec.width / 2 + 0.15, z: spec.trailerLen / 2 + cabinD * 0.3 },
    { x: -spec.width / 2 - 0.15, z: spec.trailerLen / 2 + cabinD * 0.3 },
    // Mid axle
    { x: spec.width / 2 + 0.15, z: 0 },
    { x: -spec.width / 2 - 0.15, z: 0 },
    // Rear axle 1
    { x: spec.width / 2 + 0.15, z: -spec.trailerLen / 2 + 1 },
    { x: -spec.width / 2 - 0.15, z: -spec.trailerLen / 2 + 1 },
    // Rear axle 2
    { x: spec.width / 2 + 0.15, z: -spec.trailerLen / 2 + 2.2 },
    { x: -spec.width / 2 - 0.15, z: -spec.trailerLen / 2 + 2.2 },
  ];
  for (const wp of wheelPositions) {
    const wheel = new THREE.Mesh(wheelGeo, wheelMat);
    wheel.position.set(wp.x, 0.4, wp.z);
    group.add(wheel);
  }

  // --- Headlights ---
  const lightGeo = new THREE.CircleGeometry(0.15, 8);
  const lightMat = new THREE.MeshBasicMaterial({ color: 0xFFFFCC });
  for (const side of [-0.8, 0.8]) {
    const light = new THREE.Mesh(lightGeo, lightMat);
    light.position.set(side, 1.5, cabin.position.z + cabinD / 2 + 0.02);
    group.add(light);
  }

  // --- Taillights ---
  const tailMat = new THREE.MeshBasicMaterial({ color: 0xFF3333 });
  for (const side of [-0.8, 0.8]) {
    const tail = new THREE.Mesh(lightGeo, tailMat);
    tail.position.set(side, 1.2, -spec.trailerLen / 2 - 0.02);
    tail.rotation.y = Math.PI;
    group.add(tail);
  }

  // Scale to realistic meters for MapLibre
  group.scale.set(1, 1, 1);
  return group;
}

/**
 * Create the full 20-vehicle fleet.
 * @param {object} THREE - Three.js namespace
 * @returns {THREE.Group[]} Array of 20 truck mesh groups
 */
export function createFleet(THREE) {
  const fleet = [];
  for (let i = 0; i < 20; i++) {
    const typeSpec = VEHICLE_TYPES[i % VEHICLE_TYPES.length];
    const mesh = createTruckMesh(THREE, typeSpec, i);
    mesh.userData = {
      vehicleId: `TRK-${String(i + 1).padStart(3, '0')}`,
      type: typeSpec.type,
      label: typeSpec.label,
      index: i
    };
    fleet.push(mesh);
  }
  return fleet;
}
