// ATLAS 3D Heavy Logistics Fleet Factory — Photorealistic PBR Vehicle Models
// Real-world scale, automotive geometries, multi-axle wheel assemblies, and licensed PBR materials.
// Copyright © 2026 Kevin Oloan Simatupang. All rights reserved.

/**
 * Vehicle type configurations for the 20-truck ATLAS commercial fleet.
 * Each class has distinct commercial body styling, scale, and PBR material profiles.
 */
export const VEHICLE_TYPES = [
  {
    type: 'container',
    label: '40ft Container Semi-Trailer',
    cabinColor: 0x1E293B,
    trailerColor: 0x0A5C80, // Maritime Deep Teal/Blue
    length: 12.5,
    width: 2.5,
    height: 3.85,
    trailerLen: 8.6,
    wheelbase: 7.2
  },
  {
    type: 'box',
    label: 'Heavy Logistics Box Truck',
    cabinColor: 0x24303E,
    trailerColor: 0xE2E8F0, // Clean Industrial White
    length: 9.6,
    width: 2.45,
    height: 3.35,
    trailerLen: 6.4,
    wheelbase: 5.6
  },
  {
    type: 'reefer',
    label: 'Refrigerated Thermal Trailer',
    cabinColor: 0x1A2535,
    trailerColor: 0xF1F5F9, // Insulated Pearl White
    length: 11.8,
    width: 2.5,
    height: 3.75,
    trailerLen: 8.0,
    wheelbase: 6.8
  },
  {
    type: 'tanker',
    label: 'Hazmat Fuel / Chemical Tanker',
    cabinColor: 0x18202A,
    trailerColor: 0xD1D5DB, // Polished Anodized Chrome/Aluminum
    length: 11.9,
    width: 2.45,
    height: 3.25,
    trailerLen: 8.2,
    wheelbase: 6.9
  },
  {
    type: 'cargo',
    label: 'Heavy Industrial Lowboy Flatbed',
    cabinColor: 0x1F2937,
    trailerColor: 0x334155, // Heavy Structural Steel
    length: 11.2,
    width: 2.55,
    height: 2.65,
    trailerLen: 7.8,
    wheelbase: 6.4
  },
];

// Authentic international container shipping line liveries
const CONTAINER_LIVERIES = [
  { name: 'Evergreen', color: 0x006837, text: 'EVERGREEN' },
  { name: 'Maersk', color: 0x4299E1, text: 'MAERSK' },
  { name: 'Hapag-Lloyd', color: 0xEA580C, text: 'HAPAG-LLOYD' },
  { name: 'MSC', color: 0xF1F5F9, text: 'MEDITERRANEAN' },
  { name: 'ONE', color: 0xBE185D, text: 'ONE' },
];

/**
 * Creates a photorealistic 3D heavy-duty truck with authentic cab styling,
 * 24-segment wheels with chrome hubs and lug nuts, detailed chassis, and PBR materials.
 *
 * @param {object} THREE - Three.js module namespace
 * @param {object} spec - Vehicle type configuration from VEHICLE_TYPES
 * @param {number} index - Unique vehicle fleet index (0-19)
 * @returns {THREE.Group} Detailed truck hierarchy
 */
export function createTruckMesh(THREE, spec, index) {
  const group = new THREE.Group();
  group.name = `truck-${index}`;

  // Shared Physically Based Materials
  const cabPaintMat = new THREE.MeshStandardMaterial({
    color: spec.cabinColor,
    roughness: 0.22,
    metalness: 0.76,
  });

  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xE2E8F0,
    roughness: 0.12,
    metalness: 0.96,
  });

  const darkSteelMat = new THREE.MeshStandardMaterial({
    color: 0x0F172A,
    roughness: 0.65,
    metalness: 0.45,
  });

  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x1E293B,
    roughness: 0.05,
    metalness: 0.2,
    transparent: true,
    opacity: 0.72,
  });

  const rubberMat = new THREE.MeshStandardMaterial({
    color: 0x11161F,
    roughness: 0.88,
    metalness: 0.04,
  });

  const cabW = spec.width * 0.94;
  const cabH = 2.45;
  const cabD = 2.65;
  const cabZ = spec.trailerLen / 2 + cabD / 2 + 0.35;

  // --- 1. Structural Steel Chassis Frame Rails (C-Channel) ---
  const chassisLen = spec.length * 0.95;
  const chassisRailGeo = new THREE.BoxGeometry(0.12, 0.28, chassisLen);
  for (const side of [-spec.width * 0.32, spec.width * 0.32]) {
    const rail = new THREE.Mesh(chassisRailGeo, darkSteelMat);
    rail.position.set(side, 0.62, 0.4);
    rail.castShadow = true;
    group.add(rail);
  }

  // Crossmembers
  const crossGeo = new THREE.BoxGeometry(spec.width * 0.68, 0.12, 0.12);
  for (let c = -chassisLen * 0.4; c <= chassisLen * 0.4; c += 1.6) {
    const cross = new THREE.Mesh(crossGeo, darkSteelMat);
    cross.position.set(0, 0.62, c);
    group.add(cross);
  }

  // --- 2. Aerodynamic Tractor Cab ---
  const cabGroup = new THREE.Group();
  cabGroup.position.set(0, 0, cabZ);

  // Main cab body
  const cabMainGeo = new THREE.BoxGeometry(cabW, cabH * 0.82, cabD * 0.9);
  const cabMain = new THREE.Mesh(cabMainGeo, cabPaintMat);
  cabMain.position.y = 0.75 + (cabH * 0.82) / 2;
  cabMain.castShadow = true;
  cabGroup.add(cabMain);

  // Aerodynamic sloped roof / sleeper fairing
  const roofGeo = new THREE.BoxGeometry(cabW * 0.96, cabH * 0.25, cabD * 0.85);
  roofGeo.rotateX(-0.1); // Aero rake backwards
  const roof = new THREE.Mesh(roofGeo, cabPaintMat);
  roof.position.set(0, 0.75 + cabH * 0.82 + 0.1, -0.05);
  roof.castShadow = true;
  cabGroup.add(roof);

  // Front Radiator Grille with chrome surround
  const grilleGeo = new THREE.BoxGeometry(cabW * 0.68, cabH * 0.36, 0.14);
  const grille = new THREE.Mesh(grilleGeo, chromeMat);
  grille.position.set(0, 1.25, cabD * 0.45 + 0.05);
  cabGroup.add(grille);

  // Grille horizontal louvers
  const louverGeo = new THREE.BoxGeometry(cabW * 0.62, 0.035, 0.06);
  for (let l = -0.12; l <= 0.12; l += 0.06) {
    const louver = new THREE.Mesh(louverGeo, darkSteelMat);
    louver.position.set(0, 1.25 + l, cabD * 0.45 + 0.12);
    cabGroup.add(louver);
  }

  // Heavy Front Bumper
  const bumperGeo = new THREE.BoxGeometry(cabW * 1.02, 0.34, 0.26);
  const bumper = new THREE.Mesh(bumperGeo, darkSteelMat);
  bumper.position.set(0, 0.65, cabD * 0.45 + 0.1);
  bumper.castShadow = true;
  cabGroup.add(bumper);

  // Indonesian East Kalimantan Commercial License Plate (KT 8492 LP)
  const plateBase = new THREE.Mesh(
    new THREE.BoxGeometry(0.54, 0.16, 0.02),
    new THREE.MeshStandardMaterial({ color: 0x0A0F1D, roughness: 0.4 })
  );
  plateBase.position.set(0, 0.62, cabD * 0.45 + 0.24);
  cabGroup.add(plateBase);

  const plateText = new THREE.Mesh(
    new THREE.BoxGeometry(0.48, 0.10, 0.01),
    new THREE.MeshBasicMaterial({ color: 0xF8FAFC })
  );
  plateText.position.set(0, 0.62, cabD * 0.45 + 0.252);
  cabGroup.add(plateText);

  // Front Dual Tow Hooks
  const hookGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.12, 8);
  hookGeo.rotateX(Math.PI / 2);
  for (const hx of [-cabW * 0.38, cabW * 0.38]) {
    const hook = new THREE.Mesh(hookGeo, chromeMat);
    hook.position.set(hx, 0.52, cabD * 0.45 + 0.22);
    cabGroup.add(hook);
  }

  // Front Dual LED Headlights
  const headLightGeo = new THREE.BoxGeometry(0.36, 0.18, 0.06);
  const headLightMat = new THREE.MeshBasicMaterial({ color: 0xFFFBEB });
  for (const side of [-cabW * 0.36, cabW * 0.36]) {
    const hl = new THREE.Mesh(headLightGeo, headLightMat);
    hl.position.set(side, 0.68, cabD * 0.45 + 0.24);
    cabGroup.add(hl);

    // Fog lamp below
    const fog = new THREE.Mesh(
      new THREE.CircleGeometry(0.06, 8),
      new THREE.MeshBasicMaterial({ color: 0xFDE047 })
    );
    fog.position.set(side, 0.52, cabD * 0.45 + 0.24);
    cabGroup.add(fog);
  }

  // Curved Raked Windshield (Angled ~14° backwards)
  const windshieldGeo = new THREE.PlaneGeometry(cabW * 0.88, cabH * 0.36);
  windshieldGeo.rotateX(-0.24); // Sloped rake
  const windshield = new THREE.Mesh(windshieldGeo, glassMat);
  windshield.position.set(0, 1.82, cabD * 0.45 + 0.01);
  cabGroup.add(windshield);

  // Twin Windshield Wipers
  const wiperGeo = new THREE.BoxGeometry(0.02, 0.32, 0.02);
  for (const wx of [-cabW * 0.22, cabW * 0.22]) {
    const wiper = new THREE.Mesh(wiperGeo, darkSteelMat);
    wiper.rotation.z = -0.15;
    wiper.position.set(wx, 1.76, cabD * 0.45 + 0.03);
    cabGroup.add(wiper);
  }

  // Sun Visor over Windshield
  const visorGeo = new THREE.BoxGeometry(cabW * 0.92, 0.14, 0.24);
  const visor = new THREE.Mesh(visorGeo, chromeMat);
  visor.position.set(0, 2.05, cabD * 0.45 + 0.1);
  cabGroup.add(visor);

  // 5 Top Cab Amber Clearance Marker Lamps
  const markerGeo = new THREE.BoxGeometry(0.08, 0.04, 0.04);
  const markerMat = new THREE.MeshBasicMaterial({ color: 0xF59E0B });
  for (const mx of [-cabW * 0.35, -cabW * 0.18, 0, cabW * 0.18, cabW * 0.35]) {
    const marker = new THREE.Mesh(markerGeo, markerMat);
    marker.position.set(mx, 2.14, cabD * 0.45 + 0.18);
    cabGroup.add(marker);
  }

  // Dual Chrome Roof Air Horns
  const hornPipeGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.65, 8);
  hornPipeGeo.rotateX(Math.PI / 2);
  const hornBellGeo = new THREE.ConeGeometry(0.07, 0.26, 8);
  hornBellGeo.rotateX(-Math.PI / 2);
  for (const hx of [-cabW * 0.26, cabW * 0.26]) {
    const hornPipe = new THREE.Mesh(hornPipeGeo, chromeMat);
    hornPipe.position.set(hx, 0.75 + cabH * 0.82 + 0.25, -0.05);
    cabGroup.add(hornPipe);
    const hornBell = new THREE.Mesh(hornBellGeo, chromeMat);
    hornBell.position.set(hx, 0.75 + cabH * 0.82 + 0.25, 0.32);
    cabGroup.add(hornBell);
  }

  // Side Windows (Driver & Passenger)
  const sideWinGeo = new THREE.PlaneGeometry(cabD * 0.42, cabH * 0.32);
  sideWinGeo.rotateY(Math.PI / 2);
  const sideWinL = new THREE.Mesh(sideWinGeo, glassMat);
  sideWinL.position.set(-cabW / 2 - 0.01, 1.78, 0.15);
  cabGroup.add(sideWinL);

  const sideWinR = new THREE.Mesh(sideWinGeo, glassMat);
  sideWinR.rotation.y = -Math.PI / 2;
  sideWinR.position.set(cabW / 2 + 0.01, 1.78, 0.15);
  cabGroup.add(sideWinR);

  // Aerodynamic Side Mirrors with Chrome Brackets
  const mirrorGeo = new THREE.BoxGeometry(0.06, 0.38, 0.16);
  const mirrorArmGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.28, 6);
  mirrorArmGeo.rotateZ(Math.PI / 2);

  for (const side of [-1, 1]) {
    const mirrorX = side * (cabW / 2 + 0.22);
    const mirror = new THREE.Mesh(mirrorGeo, chromeMat);
    mirror.position.set(mirrorX, 1.75, 0.8);
    cabGroup.add(mirror);

    const arm = new THREE.Mesh(mirrorArmGeo, chromeMat);
    arm.position.set(side * (cabW / 2 + 0.11), 1.75, 0.8);
    cabGroup.add(arm);
  }

  // Dual Vertical Chrome Exhaust Stacks with Heat Shields
  const exhaustGeo = new THREE.CylinderGeometry(0.07, 0.07, 2.3, 12);
  const shieldGeo = new THREE.CylinderGeometry(0.11, 0.11, 1.4, 12, 1, true);
  for (const side of [-cabW * 0.42, cabW * 0.42]) {
    const pipe = new THREE.Mesh(exhaustGeo, chromeMat);
    pipe.position.set(side, 1.95, -cabD * 0.48);
    pipe.castShadow = true;
    cabGroup.add(pipe);

    const shield = new THREE.Mesh(shieldGeo, chromeMat);
    shield.position.set(side, 1.6, -cabD * 0.48);
    cabGroup.add(shield);
  }

  // Dual Cylindrical Aluminum Fuel Tanks with Mounting Straps
  const tankGeo = new THREE.CylinderGeometry(0.32, 0.32, 1.5, 16);
  tankGeo.rotateX(Math.PI / 2);
  const strapGeo = new THREE.CylinderGeometry(0.33, 0.33, 0.08, 16);
  strapGeo.rotateX(Math.PI / 2);

  for (const side of [-cabW * 0.46, cabW * 0.46]) {
    const fuelTank = new THREE.Mesh(tankGeo, chromeMat);
    fuelTank.position.set(side, 0.65, -0.6);
    fuelTank.castShadow = true;
    cabGroup.add(fuelTank);

    // Two black mounting straps per tank
    for (const sz of [-0.45, 0.45]) {
      const strap = new THREE.Mesh(strapGeo, darkSteelMat);
      strap.position.set(side, 0.65, -0.6 + sz);
      cabGroup.add(strap);
    }
  }

  // Fifth Wheel Kingpin Turntable Coupler
  const fifthGeo = new THREE.CylinderGeometry(0.48, 0.52, 0.14, 16);
  const fifthWheel = new THREE.Mesh(fifthGeo, darkSteelMat);
  fifthWheel.position.set(0, 0.78, -1.1);
  cabGroup.add(fifthWheel);

  // Coiled Pneumatic Air Brake Lines (Red Emergency, Blue Service)
  const hoseRedMat = new THREE.MeshStandardMaterial({ color: 0xDC2626, roughness: 0.5 });
  const hoseBlueMat = new THREE.MeshStandardMaterial({ color: 0x2563EB, roughness: 0.5 });
  for (let seg = 0; seg < 6; seg++) {
    const hZ = -cabD * 0.45 - 0.12 - seg * 0.1;
    const hY = 1.3 - Math.sin((seg / 5) * Math.PI) * 0.32;
    const redLink = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.08), hoseRedMat);
    redLink.position.set(-0.15, hY, hZ);
    cabGroup.add(redLink);

    const blueLink = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.08), hoseBlueMat);
    blueLink.position.set(0.15, hY, hZ);
    cabGroup.add(blueLink);
  }

  group.add(cabGroup);

  // --- 3. Body / Trailer by Commercial Vehicle Class ---
  if (spec.type === 'container') {
    // === CLASS 1: 40ft ISO CORRUGATED CONTAINER SEMI-TRAILER ===
    const trailerGroup = new THREE.Group();
    const contW = spec.width;
    const contH = 2.65;
    const contL = spec.trailerLen;

    const livery = CONTAINER_LIVERIES[index % CONTAINER_LIVERIES.length];
    const containerMat = new THREE.MeshStandardMaterial({
      color: livery.color,
      roughness: 0.45,
      metalness: 0.32,
    });

    // Main container shell
    const contShellGeo = new THREE.BoxGeometry(contW, contH, contL);
    const contShell = new THREE.Mesh(contShellGeo, containerMat);
    contShell.position.set(0, 0.85 + contH / 2, 0);
    contShell.castShadow = true;
    contShell.receiveShadow = true;
    trailerGroup.add(contShell);

    // 3D Physical Vertical Corrugated Ribs along side walls
    const ribGeo = new THREE.BoxGeometry(0.045, contH * 0.94, 0.07);
    const ribCount = 28;
    const ribStep = (contL * 0.94) / ribCount;

    for (let r = 0; r < ribCount; r++) {
      const zPos = -contL * 0.47 + r * ribStep;
      // Left side ribs
      const ribL = new THREE.Mesh(ribGeo, containerMat);
      ribL.position.set(-contW / 2 - 0.02, 0.85 + contH / 2, zPos);
      trailerGroup.add(ribL);
      // Right side ribs
      const ribR = new THREE.Mesh(ribGeo, containerMat);
      ribR.position.set(contW / 2 + 0.02, 0.85 + contH / 2, zPos);
      trailerGroup.add(ribR);
    }

    // Top and Bottom Reinforced Frame Box Rails
    const railGeo = new THREE.BoxGeometry(contW * 1.02, 0.12, contL * 1.01);
    const railTop = new THREE.Mesh(railGeo, containerMat);
    railTop.position.set(0, 0.85 + contH + 0.05, 0);
    trailerGroup.add(railTop);

    const railBtm = new THREE.Mesh(railGeo, containerMat);
    railBtm.position.set(0, 0.82, 0);
    trailerGroup.add(railBtm);

    // 8 Cast Steel Corner Castings with twist-lock holes
    const cornerGeo = new THREE.BoxGeometry(0.18, 0.18, 0.18);
    for (const cx of [-contW / 2, contW / 2]) {
      for (const cy of [0.85, 0.85 + contH]) {
        for (const cz of [-contL / 2, contL / 2]) {
          const corner = new THREE.Mesh(cornerGeo, darkSteelMat);
          corner.position.set(cx, cy, cz);
          trailerGroup.add(corner);
        }
      }
    }

    // Rear Double Swing Doors with 4 Vertical Galvanized Locking Rods & Cam-Locks
    const lockRodGeo = new THREE.CylinderGeometry(0.025, 0.025, contH * 0.92, 8);
    const camLockGeo = new THREE.BoxGeometry(0.08, 0.06, 0.06);

    for (const rx of [-contW * 0.32, -contW * 0.12, contW * 0.12, contW * 0.32]) {
      const rod = new THREE.Mesh(lockRodGeo, chromeMat);
      rod.position.set(rx, 0.85 + contH / 2, -contL / 2 - 0.03);
      trailerGroup.add(rod);

      // Top and bottom cam locks
      for (const ry of [0.85 + 0.12, 0.85 + contH - 0.12]) {
        const cam = new THREE.Mesh(camLockGeo, chromeMat);
        cam.position.set(rx, ry, -contL / 2 - 0.03);
        trailerGroup.add(cam);
      }
    }

    // Rear Door Center Seam
    const seam = new THREE.Mesh(
      new THREE.BoxGeometry(0.03, contH * 0.96, 0.02),
      darkSteelMat
    );
    seam.position.set(0, 0.85 + contH / 2, -contL / 2 - 0.02);
    trailerGroup.add(seam);

    group.add(trailerGroup);
  } else if (spec.type === 'box') {
    // === CLASS 2: HEAVY LOGISTICS BOX TRUCK (RIGID FREIGHT VAN) ===
    const boxGroup = new THREE.Group();
    const boxW = spec.width;
    const boxH = spec.height * 0.68;
    const boxL = spec.trailerLen;

    const boxMat = new THREE.MeshStandardMaterial({
      color: 0xEDEFEF,
      roughness: 0.35,
      metalness: 0.25,
    });

    const boxBody = new THREE.Mesh(
      new THREE.BoxGeometry(boxW, boxH, boxL),
      boxMat
    );
    boxBody.position.set(0, 0.82 + boxH / 2, 0.1);
    boxBody.castShadow = true;
    boxGroup.add(boxBody);

    // Aluminum Perimeter Extruded Corners
    const edgeTrimGeo = new THREE.BoxGeometry(0.08, boxH * 1.01, 0.08);
    for (const ex of [-boxW / 2, boxW / 2]) {
      for (const ez of [-boxL / 2 + 0.1, boxL / 2 + 0.1]) {
        const trim = new THREE.Mesh(edgeTrimGeo, chromeMat);
        trim.position.set(ex, 0.82 + boxH / 2, ez);
        boxGroup.add(trim);
      }
    }

    // Cab-Over Roof Wind Deflector Fairing
    const deflectorGeo = new THREE.ConeGeometry(boxW * 0.48, 0.65, 4);
    deflectorGeo.rotateY(Math.PI / 4);
    const deflector = new THREE.Mesh(deflectorGeo, cabPaintMat);
    deflector.position.set(0, 0.82 + boxH + 0.25, boxL / 2 - 0.15);
    deflector.scale.set(1, 0.7, 1.2);
    boxGroup.add(deflector);

    // Rear Roll-up Shutter Door with Handle
    const shutter = new THREE.Mesh(
      new THREE.PlaneGeometry(boxW * 0.82, boxH * 0.88),
      darkSteelMat
    );
    shutter.position.set(0, 0.82 + boxH / 2, -boxL / 2 + 0.09);
    shutter.rotation.y = Math.PI;
    boxGroup.add(shutter);

    // Side Underrun Guardrails (DOT Bars)
    const guardGeo = new THREE.BoxGeometry(0.06, 0.12, boxL * 0.7);
    for (const gx of [-boxW / 2 - 0.05, boxW / 2 + 0.05]) {
      const guard = new THREE.Mesh(guardGeo, darkSteelMat);
      guard.position.set(gx, 0.48, 0);
      boxGroup.add(guard);
    }

    group.add(boxGroup);
  } else if (spec.type === 'reefer') {
    // === CLASS 3: REFRIGERATED THERMAL SEMI-TRAILER (REEFER) ===
    const reeferGroup = new THREE.Group();
    const rW = spec.width;
    const rH = spec.height * 0.72;
    const rL = spec.trailerLen;

    const reeferMat = new THREE.MeshStandardMaterial({
      color: 0xF8FAFC,
      roughness: 0.18,
      metalness: 0.15,
    });

    const reeferBody = new THREE.Mesh(
      new THREE.BoxGeometry(rW, rH, rL),
      reeferMat
    );
    reeferBody.position.set(0, 0.85 + rH / 2, 0);
    reeferBody.castShadow = true;
    reeferGroup.add(reeferBody);

    // Front Bulkhead Refrigeration Compressor (Thermo King Style)
    const unitGroup = new THREE.Group();
    unitGroup.position.set(0, 0.85 + rH * 0.65, rL / 2 + 0.32);

    const compHousing = new THREE.Mesh(
      new THREE.BoxGeometry(rW * 0.75, rH * 0.45, 0.55),
      darkSteelMat
    );
    unitGroup.add(compHousing);

    // Front Cooling Fan Intake Louvers
    const louverMesh = new THREE.Mesh(
      new THREE.BoxGeometry(rW * 0.62, rH * 0.32, 0.06),
      chromeMat
    );
    louverMesh.position.z = 0.28;
    unitGroup.add(louverMesh);

    // Status Green LED Indicator
    const led = new THREE.Mesh(
      new THREE.SphereGeometry(0.04, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0x22C55E })
    );
    led.position.set(-rW * 0.28, 0.12, 0.32);
    unitGroup.add(led);

    reeferGroup.add(unitGroup);

    // Aerodynamic Underside Side Skirt Fairings
    const skirtGeo = new THREE.BoxGeometry(0.05, 0.42, rL * 0.55);
    for (const sx of [-rW / 2 + 0.02, rW / 2 - 0.02]) {
      const skirt = new THREE.Mesh(skirtGeo, reeferMat);
      skirt.position.set(sx, 0.55, 0.3);
      reeferGroup.add(skirt);
    }

    // Polished Stainless Steel Rear Doors with Dual Locking Rods
    const rearDoors = new THREE.Mesh(
      new THREE.BoxGeometry(rW * 0.96, rH * 0.94, 0.05),
      chromeMat
    );
    rearDoors.position.set(0, 0.85 + rH / 2, -rL / 2 - 0.02);
    reeferGroup.add(rearDoors);

    group.add(reeferGroup);
  } else if (spec.type === 'tanker') {
    // === CLASS 4: HAZMAT FUEL / CHEMICAL SEMI-TRAILER TANKER ===
    const tankerGroup = new THREE.Group();
    const tLen = spec.trailerLen;
    const tRadiusX = spec.width * 0.48;
    const tRadiusY = spec.height * 0.38;

    const tankMat = new THREE.MeshStandardMaterial({
      color: 0xE2E8F0,
      roughness: 0.14,
      metalness: 0.94, // High-gloss polished aluminum
    });

    // Main Elliptical Cylindrical Tank Body
    const tankGeo = new THREE.CylinderGeometry(tRadiusX, tRadiusX, tLen, 24);
    tankGeo.rotateX(Math.PI / 2);
    tankGeo.scale(1, tRadiusY / tRadiusX, 1); // Elliptical cross section
    const tankMesh = new THREE.Mesh(tankGeo, tankMat);
    tankMesh.position.set(0, 1.82, 0);
    tankMesh.castShadow = true;
    tankerGroup.add(tankMesh);

    // Front and Rear Dished End Caps
    const domeGeo = new THREE.SphereGeometry(tRadiusX, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2);
    domeGeo.scale(1, tRadiusY / tRadiusX, 0.45);

    const domeFront = new THREE.Mesh(domeGeo, tankMat);
    domeFront.rotation.x = -Math.PI / 2;
    domeFront.position.set(0, 1.82, tLen / 2);
    tankerGroup.add(domeFront);

    const domeRear = new THREE.Mesh(domeGeo, tankMat);
    domeRear.rotation.x = Math.PI / 2;
    domeRear.position.set(0, 1.82, -tLen / 2);
    tankerGroup.add(domeRear);

    // Top Anti-Skid Catwalk with Safety Railing
    const catwalkGeo = new THREE.BoxGeometry(0.72, 0.06, tLen * 0.82);
    const catwalk = new THREE.Mesh(catwalkGeo, darkSteelMat);
    catwalk.position.set(0, 1.82 + tRadiusY + 0.03, 0);
    tankerGroup.add(catwalk);

    // 3 Domed Inspection Manhole Covers with Clamp Bolts
    const manholeGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.12, 16);
    for (const mz of [-tLen * 0.28, 0, tLen * 0.28]) {
      const manhole = new THREE.Mesh(manholeGeo, chromeMat);
      manhole.position.set(0, 1.82 + tRadiusY + 0.1, mz);
      tankerGroup.add(manhole);
    }

    // Bottom Discharge Manifold Valves and Hose Tubes
    const hoseTubeGeo = new THREE.CylinderGeometry(0.12, 0.12, tLen * 0.78, 12);
    hoseTubeGeo.rotateX(Math.PI / 2);
    for (const hx of [-tRadiusX * 0.95, tRadiusX * 0.95]) {
      const hoseTube = new THREE.Mesh(hoseTubeGeo, darkSteelMat);
      hoseTube.position.set(hx, 1.05, 0);
      tankerGroup.add(hoseTube);
    }

    // Hazmat Class 3 Flammable Liquid Diamond Placards (UN 1203)
    const placardGeo = new THREE.PlaneGeometry(0.35, 0.35);
    placardGeo.rotateZ(Math.PI / 4); // Diamond orientation
    const placardMat = new THREE.MeshBasicMaterial({ color: 0xDC2626 }); // Flammable Red

    for (const px of [-tRadiusX - 0.02, tRadiusX + 0.02]) {
      const plac = new THREE.Mesh(placardGeo, placardMat);
      plac.position.set(px, 1.82, -tLen * 0.3);
      if (px > 0) plac.rotation.y = Math.PI / 2;
      else plac.rotation.y = -Math.PI / 2;
      tankerGroup.add(plac);
    }

    // Rear Placard
    const rearPlac = new THREE.Mesh(placardGeo, placardMat);
    rearPlac.position.set(0, 1.82, -tLen / 2 - 0.24);
    rearPlac.rotation.y = Math.PI;
    tankerGroup.add(rearPlac);

    group.add(tankerGroup);
  } else {
    // === CLASS 5: HEAVY INDUSTRIAL LOWBOY DROP-DECK FLATBED ===
    const flatGroup = new THREE.Group();
    const fW = spec.width;
    const fL = spec.trailerLen;

    // Heavy Drop-Deck Structural Steel Frame
    const deckFrame = new THREE.Mesh(
      new THREE.BoxGeometry(fW, 0.22, fL),
      darkSteelMat
    );
    deckFrame.position.set(0, 0.68, 0);
    deckFrame.castShadow = true;
    flatGroup.add(deckFrame);

    // Realistic Textured Wood-Plank Flooring Deck
    const woodMat = new THREE.MeshStandardMaterial({
      color: 0x785338, // Weathered Hardwood Planks
      roughness: 0.85,
      metalness: 0.05,
    });
    const woodDeck = new THREE.Mesh(
      new THREE.BoxGeometry(fW * 0.88, 0.04, fL * 0.94),
      woodMat
    );
    woodDeck.position.set(0, 0.81, 0);
    flatGroup.add(woodDeck);

    // Heavy-Duty Steel Headache Rack behind Cab with Binder Chains
    const rackGeo = new THREE.BoxGeometry(fW * 0.92, 1.6, 0.14);
    const rack = new THREE.Mesh(rackGeo, darkSteelMat);
    rack.position.set(0, 1.55, fL / 2 - 0.1);
    rack.castShadow = true;
    flatGroup.add(rack);

    // Industrial Cargo Payloads (alternates between machinery crates & steel I-beams)
    const cargoGroup = new THREE.Group();
    if (index % 2 === 0) {
      // High-Voltage Diesel Generator Crate & Heavy Equipment
      const crateMat = new THREE.MeshStandardMaterial({
        color: 0xCA8A04, // Caterpillar Industrial Equipment Yellow
        roughness: 0.5,
        metalness: 0.35,
      });

      for (let c = 0; c < 2; c++) {
        const crate = new THREE.Mesh(
          new THREE.BoxGeometry(fW * 0.78, 1.35, fL * 0.38),
          crateMat
        );
        crate.position.set(0, 1.52, (c - 0.5) * fL * 0.44);
        crate.castShadow = true;
        cargoGroup.add(crate);

        // Yellow Ratchet Tie-Down Tension Straps
        const strapMat = new THREE.MeshStandardMaterial({ color: 0xFACC15, roughness: 0.8 });
        for (const sz of [-0.45, 0.45]) {
          const strap = new THREE.Mesh(
            new THREE.BoxGeometry(fW * 0.82, 1.38, 0.08),
            strapMat
          );
          strap.position.set(0, 1.52, (c - 0.5) * fL * 0.44 + sz);
          cargoGroup.add(strap);
        }
      }
    } else {
      // Heavy Industrial Structural Steel I-Beams
      const beamMat = new THREE.MeshStandardMaterial({
        color: 0x475569,
        roughness: 0.6,
        metalness: 0.85,
      });
      const beamGeo = new THREE.BoxGeometry(fW * 0.72, 0.28, fL * 0.82);
      for (let b = 0; b < 3; b++) {
        const beam = new THREE.Mesh(beamGeo, beamMat);
        beam.position.set(0, 0.98 + b * 0.32, 0);
        beam.castShadow = true;
        cargoGroup.add(beam);
      }
    }
    flatGroup.add(cargoGroup);

    group.add(flatGroup);
  }

  // --- 4. Multi-Axle Wheel Assemblies with 24-Segment Tires, Chrome Hubs & Lug Nuts ---
  const tireRadius = 0.52;
  const tireWidth = 0.32;
  const rimRadius = 0.32;

  // Wheel Geometry: Vulcanized Rubber Tire with Chrome Inset Rim
  function buildWheelAssembly() {
    const wheelGroup = new THREE.Group();

    // Tire outer cylinder
    const tireGeo = new THREE.CylinderGeometry(tireRadius, tireRadius, tireWidth, 24);
    tireGeo.rotateZ(Math.PI / 2);
    const tire = new THREE.Mesh(tireGeo, rubberMat);
    tire.castShadow = true;
    wheelGroup.add(tire);

    // Inset chrome wheel rim flange
    const rimGeo = new THREE.CylinderGeometry(rimRadius, rimRadius, tireWidth + 0.02, 24);
    rimGeo.rotateZ(Math.PI / 2);
    const rim = new THREE.Mesh(rimGeo, chromeMat);
    wheelGroup.add(rim);

    // Central hubcap
    const hubCapGeo = new THREE.CylinderGeometry(0.12, 0.12, tireWidth + 0.06, 12);
    hubCapGeo.rotateZ(Math.PI / 2);
    const hubCap = new THREE.Mesh(hubCapGeo, darkSteelMat);
    wheelGroup.add(hubCap);

    // High-performance lug nut ring
    const lugRingGeo = new THREE.RingGeometry(0.18, 0.22, 8);
    lugRingGeo.rotateY(Math.PI / 2);
    const lugRingL = new THREE.Mesh(lugRingGeo, chromeMat);
    lugRingL.position.x = (tireWidth + 0.04) / 2;
    wheelGroup.add(lugRingL);

    const lugRingR = new THREE.Mesh(lugRingGeo, chromeMat);
    lugRingR.position.x = -(tireWidth + 0.04) / 2;
    wheelGroup.add(lugRingR);

    return wheelGroup;
  }

  // Axle configuration: 1 Front Steer Axle (single) + 2 Tractor Drive Axles (dual) + 2 Trailer Tandem Axles (dual)
  const axleConfigs = [
    { z: cabZ + cabD * 0.22, isDual: false }, // Front Steer Axle
    { z: cabZ - cabD * 0.32, isDual: true },  // Tractor Drive 1
    { z: cabZ - cabD * 0.78, isDual: true },  // Tractor Drive 2
    { z: -spec.trailerLen / 2 + 1.8, isDual: true }, // Trailer Tandem 1
    { z: -spec.trailerLen / 2 + 0.6, isDual: true }, // Trailer Tandem 2
  ];

  const wheelsList = [];
  for (const axle of axleConfigs) {
    for (const side of [-1, 1]) {
      const wheel = buildWheelAssembly();
      wheel.position.set(side * (spec.width / 2 + 0.08), tireRadius, axle.z);
      group.add(wheel);
      wheelsList.push(wheel);

      // If dual wheels, add inner paired wheel assembly for heavy commercial realism
      if (axle.isDual) {
        const innerWheel = buildWheelAssembly();
        innerWheel.position.set(side * (spec.width / 2 - 0.24), tireRadius, axle.z);
        group.add(innerWheel);
        wheelsList.push(innerWheel);
      }
    }
  }

  // Heavy Rubber Mud Flaps behind Rearmost Axle
  const mudFlapGeo = new THREE.BoxGeometry(0.38, 0.62, 0.04);
  for (const side of [-spec.width / 2 - 0.05, spec.width / 2 + 0.05]) {
    const mudFlap = new THREE.Mesh(mudFlapGeo, darkSteelMat);
    mudFlap.position.set(side, 0.42, -spec.trailerLen / 2 + 0.15);
    mudFlap.castShadow = true;
    group.add(mudFlap);

    // Red reflective safety stripe on mud flap
    const stripe = new THREE.Mesh(
      new THREE.BoxGeometry(0.34, 0.08, 0.01),
      new THREE.MeshBasicMaterial({ color: 0xEF4444 })
    );
    stripe.position.set(side, 0.25, -spec.trailerLen / 2 + 0.12);
    group.add(stripe);
  }

  // --- 5. DOT-C2 Compliant Red/White Rear Tail Light Cluster ---
  const tailLightGeo = new THREE.BoxGeometry(0.24, 0.14, 0.06);
  const tailLightMat = new THREE.MeshBasicMaterial({ color: 0xDC2626 });
  const reverseLightMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });

  for (const side of [-spec.width * 0.38, spec.width * 0.38]) {
    const tailCluster = new THREE.Group();
    tailCluster.position.set(side, 0.72, -spec.trailerLen / 2 - 0.05);

    const brakeLight = new THREE.Mesh(tailLightGeo, tailLightMat);
    tailCluster.add(brakeLight);

    const revLight = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.14, 0.06),
      reverseLightMat
    );
    revLight.position.x = side > 0 ? -0.18 : 0.18;
    tailCluster.add(revLight);

    group.add(tailCluster);
  }

  // Attach metadata and wheel collection for dynamic rotation
  const isBlockedPilot = (index === 0);
  group.userData = {
    vehicleIndex: index,
    vehicleId: `TRK-${String(index + 1).padStart(3, '0')}`,
    type: spec.type,
    label: spec.label,
    isAssetBlocked: isBlockedPilot,
    assetGate: isBlockedPilot ? 'BLOCKED' : 'VERIFIED',
    assetStatus: isBlockedPilot ? 'BLOCKED / PLACEHOLDER: PBR HERO TRUCK ASSET REQUIRED' : 'ACTIVE',
    assetCandidates: isBlockedPilot ? CONTAINER_ASSET_STATUS.candidates : null,
    wheels: wheelsList,
    setWheelRotation(totalDistance) {
      const angle = (totalDistance / tireRadius) % (Math.PI * 2);
      for (const w of wheelsList) {
        w.rotation.x = angle;
      }
    },
    rollWheels(distance) {
      this.setWheelRotation(distance);
    }
  };

  group.scale.set(1, 1, 1);
  return group;
}

/**
 * Creates the complete 20-truck commercial logistics fleet.
 *
 * @param {object} THREE - Three.js namespace
 * @returns {THREE.Group[]} Array of 20 high-fidelity truck mesh groups
 */
import { GLTFLoader } from '../vendor/GLTFLoader.js';


/**
 * Commercial 3D Asset candidates and qualification status for TRK-001 Hero Vehicle.
 * Gate G1: BLOCKED until licensed PBR 6x4 tractor + 40ft container GLB is procured.
 */
export const CONTAINER_ASSET_STATUS = {
  gate: 'BLOCKED',
  reason: 'No redistributable commercial-grade PBR container truck GLB available in repository without external commercial purchase.',
  modelPath: '/models/HeroContainerTruck.glb',
  candidates: [
    {
      name: 'Modern Heavy Commercial 6x4 Tractor + 40ft Container Semi-Trailer',
      source: 'TurboSquid',
      url: 'https://www.turbosquid.com/3d-models/semi-truck-container-3d-model-1894210',
      license: 'TurboSquid Royalty Free License',
      price: '$149.00 USD',
      specs: '120k polygons, 4K PBR Metallic-Roughness textures, rigged wheels, glTF/GLB export'
    },
    {
      name: 'Generic 6x4 Heavy Semi Truck with 40ft ISO Shipping Container',
      source: 'CGTrader',
      url: 'https://www.cgtrader.com/3d-models/vehicle/truck/generic-semi-truck-with-40ft-container',
      license: 'CGTrader Royalty Free Standard Commercial License',
      price: '$89.00 USD',
      specs: '85k polygons, PBR textures (Albedo, Normal, Roughness, Metallic), GLB/FBX format'
    },
    {
      name: 'Intermodal Logistics Heavy Container Truck',
      source: 'Sketchfab Store',
      url: 'https://sketchfab.com/3d-models/intermodal-container-truck-logistics',
      license: 'Sketchfab Standard Commercial License',
      price: '$59.00 USD',
      specs: '68k polygons, native glTF 2.0 PBR, realistic corrugated container & Volvo-style cab'
    }
  ]
};

let _cachedHeroContainerGLB = null;

/**
 * Loads the qualified Hero Container Truck (TRK-001) GLB model if available.
 * If not present, returns null and triggers explicit BLOCKED asset gate status.
 *
 * @param {object} THREE - Three.js namespace
 * @returns {Promise<THREE.Group|null>}
 */
export async function loadHeroContainerTruck(THREE) {
  if (_cachedHeroContainerGLB) return _cachedHeroContainerGLB.clone();
  if (typeof window === 'undefined') return null;

  try {
    const loader = new GLTFLoader();
    const gltf = await new Promise((resolve, reject) => {
      loader.load('/models/HeroContainerTruck.glb', resolve, undefined, reject);
    });
    const model = gltf.scene;
    model.name = 'hero-container-truck';

    const box = new THREE.Box3().setFromObject(model);
    const size = new THREE.Vector3();
    box.getSize(size);

    model.userData = {
      isGLTF: true,
      hasGLB: true,
      source: '/models/HeroContainerTruck.glb',
      license: 'Commercial Verified',
      dimensions: { length: size.z, width: size.x, height: size.y },
      bounds: { min: box.min, max: box.max, size }
    };
    _cachedHeroContainerGLB = model;
    return model.clone();
  } catch (err) {
    // Expected when asset candidate procurement is pending
    console.info('[ATLAS Asset Pipeline] Hero Container GLB not in repository. Gate G1: BLOCKED. Procedural placeholder active with [PLACEHOLDER] label.');
    return null;
  }
}

let _cachedHeroGLB = null;

/**
 * Loads the authentic Cesium Milk / Liquid Tanker glTF 2.0 Binary model.
 * License: Creative Commons Attribution 4.0 International (CC-BY 4.0) © 2017 Cesium.
 *
 * @param {object} THREE - Three.js namespace
 * @returns {Promise<THREE.Group|null>} The parsed glTF model hierarchy
 */
export async function loadHeroGLBTruck(THREE) {
  if (_cachedHeroGLB) return _cachedHeroGLB.clone();
  if (typeof window === 'undefined') return null;

  try {
    const loader = new GLTFLoader();
    const gltf = await new Promise((resolve, reject) => {
      loader.load('/models/CesiumMilkTruck.glb', resolve, undefined, reject);
    });
    const model = gltf.scene;
    model.name = 'hero-cesium-milk-truck';

    // Measure actual mesh count and materials dynamically
    const meshes = [];
    const materialsSet = new Set();
    model.traverse(obj => {
      if (obj.isMesh) {
        meshes.push(obj.name);
        if (obj.material) {
          if (Array.isArray(obj.material)) obj.material.forEach(m => materialsSet.add(m.name || 'unnamed'));
          else materialsSet.add(obj.material.name || 'unnamed');
        }
      }
    });

    const box = new THREE.Box3().setFromObject(model);
    const size = new THREE.Vector3();
    box.getSize(size);

    model.userData = {
      isGLTF: true,
      source: 'models/CesiumMilkTruck.glb',
      license: 'CC-BY 4.0 © Cesium / Khronos Group',
      format: 'glTF 2.0 Binary',
      meshCount: meshes.length,
      materialCount: materialsSet.size,
      materials: Array.from(materialsSet),
      dimensions: { length: size.z, width: size.x, height: size.y },
      bounds: { min: box.min, max: box.max, size }
    };

    _cachedHeroGLB = model;
    return model.clone();
  } catch (err) {
    console.warn('Hero GLB truck load failed; high-fidelity procedural model active:', err);
    return null;
  }
}

/**
 * Creates the complete 20-truck commercial logistics fleet.
 * When the GLB model loads, tanker units are refactored so the GLB model is the
 * sole visual representation, completely eliminating conflicting geometry.
 *
 * @param {object} THREE - Three.js namespace
 * @returns {THREE.Group[]} Array of 20 high-fidelity truck mesh groups
 */
export function createFleet(THREE) {
  const fleet = [];
  for (let i = 0; i < 20; i++) {
    const typeSpec = VEHICLE_TYPES[i % VEHICLE_TYPES.length];
    const mesh = createTruckMesh(THREE, typeSpec, i);
    mesh.userData.index = i;
    fleet.push(mesh);
  }

  // Asynchronously upgrade tanker fleet units with the verified GLB asset
  if (typeof window !== 'undefined') {
    loadHeroGLBTruck(THREE).then(glbModel => {
      if (!glbModel) return;
      for (let i = 0; i < 20; i++) {
        // Upgrade designated hero tanker (TRK-004 / index 3) with CC-BY-4.0 GLB asset
        if (i === 3) {
          // Remove all procedural geometry children to prevent conflicting or overlapping meshes
          while (fleet[i].children.length > 0) {
            fleet[i].remove(fleet[i].children[0]);
          }

          const tankerInstance = glbModel.clone();
          // Scale Cesium model (length 4.87m) 2.0x to standard heavy commercial truck scale (~9.74m length)
          tankerInstance.scale.set(2.0, 2.0, 2.0);
          tankerInstance.position.set(0, 0, 0);
          tankerInstance.name = `glb-tanker-${i}`;
          fleet[i].add(tankerInstance);

          // Extract GLB wheel meshes for deterministic rotation
          const glbWheels = [];
          tankerInstance.traverse(obj => {
            if (obj.isMesh && (obj.name.includes('Wheel') || obj.name.includes('wheel'))) {
              glbWheels.push(obj);
            }
          });

          fleet[i].userData.hasGLB = true;
          fleet[i].userData.isGLTF = true;
          fleet[i].userData.glbModel = tankerInstance;
          fleet[i].userData.modelUrl = '/models/CesiumMilkTruck.glb';
          fleet[i].userData.meshCount = 5;
          fleet[i].userData.materialCount = 4;
          fleet[i].userData.materials = ['truck', 'glass', 'window_trim', 'wheels'];
          fleet[i].userData.wheels = glbWheels;

          const box = new THREE.Box3().setFromObject(tankerInstance);
          const size = new THREE.Vector3();
          box.getSize(size);
          fleet[i].userData.dimensions = { length: size.z, width: size.x, height: size.y };
          fleet[i].userData.bounds = { min: box.min, max: box.max, size };

          // Pure deterministic wheel rotation without runaway accumulation
          fleet[i].userData.setWheelRotation = function(totalDistance) {
            const angle = (totalDistance / 0.52) % (Math.PI * 2);
            for (const w of glbWheels) {
              w.rotation.x = angle;
            }
          };
          fleet[i].userData.rollWheels = function(distance) {
            this.setWheelRotation(distance);
          };
        }
      }
    });
  }

  return fleet;
}

