# ATLAS v4.2 — Baseline Root-Cause Audit

**Date:** 2026-11-09  
**Git Baseline Reference:** `1c8f9b19aa4a182f5e8eebcba1e64319d840069c`  
**Target:** Real-World Visual & Route-Derived Fidelity Lock v4.2

---

## 1. Verified Technical Findings (F1 – F8)

| ID | Location | Observable Behavior in v4.1.2 | True Defect & Impact | Test / QA Gap |
| :--- | :--- | :--- | :--- | :--- |
| **F1** | `src/3d/engine.js:1400-1430` | `_initTrackingScene()` builds a flat `PlaneGeometry(14, 200)` with straight fog lines and guardrails at fixed $X = \pm 5.5, \pm 7.6$. | The 3D road corridor in Follow and Chase is completely straight, regardless of whether the actual road bends, turns, or enters an intersection. | Tests checked screen bounding box size, but never validated if 3D road vertices deviated from a straight line on curves. |
| **F2** | `src/3d/engine.js:1560-1575` | `_updateTrackingScene()` animates motion by scrolling a dashed line group (`offset = -((travelMeters) % 12)`) on a static plane. | The vehicle appears to drive on an endless straight conveyor belt; real road curvature is absent. | Tests checked monotonically advancing tick, but not geometric world curvature or camera yaw rotation matching road tangent. |
| **F3** | `src/3d/engine.js:1613-1614` | `_updateContextMiniMap()` calculates dot position using `cx = 15 + prog * 125`, `cy = 44 - sin(prog * pi) * 18 - prog * 8` against an illustrative SVG wave. | The mini-map path and dot movement are synthetic mathematical approximations rather than true projections of the WGS84 route waypoints. | Inset test verified dot moved, but did not assert geographic coordinate projection accuracy against source GeoJSON. |
| **F4** | `src/3d/engine.js:1640-1650` | `getScreenBoundingBox()` returns fabricated percentage coordinates (`minX = width * 0.42`, `width = width * 0.16`) when cam/truck/THREE is missing. | If an asset fails to load or camera is detached, tests would falsely pass with fake bounding box dimensions. | Tests could pass even if 3D model was completely absent from scene. |
| **F5** | `src/3d/engine.js:1320-1335` | `getRenderInfo()` reports `renderer.info.render` from the last Three.js render pass (80 calls in tracking scene). | 80 draw calls was labeled as "total digital twin optimization", omitting MapLibre GL JS satellite tile compositing overhead. | Metric reporting did not separate Three.js tracking scene stats from full MapLibre geospatial canvas metrics. |
| **F6** | `models/CesiumMilkTruck.glb` | Exactly 1 vehicle (TRK-004) uses an authentic GLB model; remaining 19 trucks use procedural geometries. | `CesiumMilkTruck.glb` is a standard test sample asset, not a modern commercial heavy-duty logistics freight tractor. | Visual QA lacked commercial heavy freight truck qualification. |
| **F7** | `artifacts/3d-qa/` | Captions such as "20-comparison-v3-vs-v4.png" or "11-fleet-five-classes-lineup.png" claim production photorealism. | High-altitude views show satellite tiles and procedural trucks; close-ups show the Cesium sample asset. | Visual claims exceeded what was verifiably rendered. |
| **F8** | `REALISM_SOURCE_REGISTER.md` | Esri World Imagery & OpenStreetMap data usage claims. | ArcGIS tile endpoint redistribution terms and OSM attribution require explicit legal categorization (demo/educational use vs production). | Legal source registration needed explicit status breakdown. |

---

## 2. Action Plan for v4.2 Remediation

1. **CHECKPOINT A:** Construct single authoritative `RouteSample` contract linking tick $\to$ arc-length $s \to$ WGS84 $[lng, lat] \to$ tangent/heading $\to$ metric local frame.
2. **CHECKPOINT B:** Replace static straight plane with dynamic route-derived **3D Road Ribbon Extrusion** that curves according to actual route waypoints in Follow and Chase modes.
3. **CHECKPOINT C:** Replace synthetic sinusoidal mini-map SVG with **true GeoJSON projected route diagram** and live vehicle projection.
4. **CHECKPOINT D:** Remove fake BBox fallback values in `getScreenBoundingBox()`. Document asset provenance and qualify heavy-duty freight truck integration.
5. **CHECKPOINT E & F:** Maintain responsive non-occlusion contracts (WF-01 to WF-06) across Desktop (1440×900) and Mobile (390×844, 360×800, 768×1024).
6. **CHECKPOINT G:** Upgrade automated test suite with route curvature verification, wrong-route negative controls, real asset failure detection, and separate per-view performance metrics.
