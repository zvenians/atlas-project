# ATLAS True 3D Geospatial Visual Upgrade

**Project:** ATLAS — Real-Time Logistics Command Center  
**Branch:** `feat/atlas-true-3d-visual-upgrade`  
**Base Branch:** `fix/atlas-p0-stabilization`  
**Owner:** Kevin Oloan Simatupang  
**Scope:** True WebGL 3D Upgrade for S01 Landing, S02 Overview, and S03 Live Map  

---

## 1. Executive Summary

This upgrade replaces procedural Canvas2D pseudo-3D approximations with genuine, hardware-accelerated WebGL 3D rendering powered by Three.js and MapLibre GL. The upgrade preserves the established ATLAS dark enterprise aesthetic (Obsidian `#0B0F14`, Copper `#D99B66`, Teal `#2DD4BF`), the existing S01–S03 composition, the canonical simulation bridge (`window.ATLAS_V21.sim`), and the preserved legacy operations workspace (`/#legacy`).

---

## 2. 3D Geospatial Engine Architecture

### 2.1 Geographic Coordinate System & Roads
- **Geographic Bounding Box:** Centered on Kariangau–Balikpapan, East Kalimantan, Indonesia (`[116.8300, -1.2200]`).
- **10 Verified Logistics Hubs:**
  1. Kariangau Logistics Hub (`[116.7580, -1.1850]`)
  2. KM 13 Freight Terminal (`[116.7925, -1.1680]`)
  3. Somber Industrial Zone (`[116.8200, -1.2050]`)
  4. MT Haryono Hub (`[116.8500, -1.2400]`)
  5. Semayang Port Terminal (`[116.8050, -1.2700]`)
  6. Sepinggan Airport Hub (`[116.8940, -1.2680]`)
  7. Batu Ampar Container Park (`[116.8300, -1.2580]`)
  8. Manggar Logistics Hub (`[116.9200, -1.2400]`)
  9. Kebun Sayur Depot (`[116.8400, -1.2750]`)
  10. Kampung Baru Pier (`[116.8100, -1.2800]`)
- **10 Connected Road Corridors:**
  Road routes follow verified waypoint corridors connecting the hubs with continuous Catmull-Rom road geometries and glowing teal centerline guidance lines.
- **Geofence Boundaries:**
  Dashed geofence boundaries for Kariangau Port Zone, Somber Industrial Zone, and Sepinggan Airport Zone.

### 2.2 Volumetric 3D Buildings & Infrastructure
- **Industrial Warehouses:** Corrugated metal surface materials, pitched gabled roofs, loading bay roll-up doors, and rooftop AC equipment.
- **Gantry Cranes:** High-tensile copper lattice towers with overhead hoist trolleys, steel cable hoists, and suspended 40ft shipping containers.
- **Fuel Storage Tanks:** Cylindrical storage tanks with spherical dome caps and metallic industrial finishes.
- **Container Stacks:** 2-to-3 tier container stacks in alternating industrial color schemes (Teal `#2DD4BF`, Copper `#D99B66`, Slate `#334155`, Sky Blue `#38BDF8`).

### 2.3 20 Articulated 3D Fleet Vehicles
- **5 Realistic Vehicle Classes:**
  1. *Container Truck:* Heavy 3-axle prime mover with 40ft intermodal container.
  2. *Box Truck:* Medium-duty urban freight delivery truck.
  3. *Reefer Truck:* Temperature-controlled refrigerated body with front refrigeration condenser.
  4. *Fuel Tanker:* Cylindrical liquid bulk tank with safety end caps.
  5. *Cargo Flatbed:* Heavy-duty flatbed with secured palletized crates.
- **Geometric Details:**
  Each vehicle features a metallic cabin, tinted windshield, 4 axles with 8 cylinder wheels/tires, headlights casting forward illumination, and red taillights.
- **Movement Physics:**
  Vehicles move along continuous road curves with distance interpolation, gradual cornering rotation, and road tangent heading calculation.

---

## 3. Interactive Cinematic Camera System

Five fully functional camera modes:
- **Free Camera:** Full 3D pan, zoom, tilt, and orbit via mouse drag, right-drag pan, and scroll zoom.
- **Follow Camera:** Elevates and tracks the active vehicle at a stable tactical angle.
- **Chase Camera:** Positions directly behind the active truck, dynamically rotating as the truck maneuvers road bends.
- **Overview Camera:** Elevated high-altitude operational command view of the entire Balikpapan bay corridor.
- **Reset Orbit:** Instant restoration of default tactical angle (`pitch: 52°`, `orbit: -18°`).

---

## 4. Simulation Engine Synchronization

The 3D visualization is directly bound to the canonical ATLAS simulation engine (`window.ATLAS_V21.sim`):
- **Play / Pause:** Halts or resumes vehicle progression smoothly.
- **Speed Multipliers:** 1x, 2x, 4x speed scaling.
- **Reset:** Replays simulation from initial tick and resets vehicle positions.
- **Step:** Increments simulation state deterministically.
- **Vehicle Selection:** Clicking any truck in 3D selects the vehicle, activates a teal selection beacon, and updates the floating telemetry badge and inspector card.

---

## 5. Screen Integration

- **S01 — Executive Landing (`atlas-3d-canvas`):**
  Full-screen Three.js WebGL scene with realistic warehouses, gantry cranes, container yard, fuel tanks, and articulated moving trucks.
- **S02 — Operations Overview (`atlas-3d-canvas-mini`):**
  Tactical 3D digital twin of Kariangau Port zone showing hub beacons and active vehicles.
- **S03 — Live Fleet Map (`atlas-3d-canvas-full`):**
  Full interactive 3D command center with road network, 20 vehicles, 3D extruded buildings, and active camera controls.

---

## 6. Verification and Testing Gates

- `npm run check`: 11/11 source and test files pass Node syntax checks.
- `npm test`: 22/22 unit and structural assertions pass (including 7 new 3D test suites).
- `node tests/browser-smoke.mjs`: 18/18 Chromium checks pass on both desktop (1440×900) and mobile (390×844) viewports with zero uncaught exceptions.
- `node tests/qa-evidence.mjs`: 12 responsive screenshots and 21 legacy tab navigations pass without horizontal overflow.
- `node tests/3d-evidence.mjs`: 12 True 3D screenshots captured across S01, S02, S03, overview, follow, chase, truck close-up, buildings close-up, and multi-vehicle routing.

---

Copyright © 2026 Kevin Oloan Simatupang. All rights reserved.
