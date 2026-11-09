# ATLAS — HERMES REAL-WORLD VISUAL FIDELITY LOCK v4.2

**FOR GEMINI 3.8 HIGH IN GOOGLE ANTIGRAVITY**

**Mode:** IMPLEMENT / VERIFY / EVIDENCE / COMMIT / VERIFY REMOTE CI. This is not a brainstorm, redesign or spec-only request.

**Project:** ATLAS Real-Time Logistics Command Center. Target: geographically credible interactive Kariangau–Balikpapan demo for 20 logistics vehicles.

**Repository:** `zvenians/atlas-project`  
**Existing feature branch:** `feat/atlas-true-3d-visual-upgrade`  
**Existing Draft PR:** `https://github.com/zvenians/atlas-project/pull/4`  
**Verified reference HEAD:** `1c8f9b19aa4a182f5e8eebcba1e64319d840069c` (Nov 9, 2026)  
**Visual system:** Dark Enterprise Editorial, teal/copper in UI, authentic road/vehicle material colors in 3D. EN default and ID support must be preserved.

## Priority statement

**v4.1.2 fixed legibility, not geographical fidelity.** The current Follow and Chase modes render a separate three-dimensional scene with a **200m straight road** independent of the real road curvature. The contextual mini-map is a decorative SVG path with a dot moved by a separate formula. A GLB **CesiumMilkTruck** demo asset is visible, but does not satisfy the final heavy-truck photorealism target. Four additional vehicle classes remain procedural. Existing tests can return fallback bounding boxes. A claimed 80 draw calls / 5,064 triangles measures a view, not the overall geospatial experience.

**The objective is to replace apparent realism with route-derived realism, vehicle realism, and honest proof.** A cinematic mock road that is not geo-synchronized will not pass.

## 0 — Mandatory document ingestion

Read **all** files from this ZIP before editing:

- `00_START_HERE.md`
- `01_GEMINI_38_HIGH_MASTER_PROMPT.md`
- `02_WIREFRAME_AND_CAMERA_CONTRACT.md`
- `03_ROUTE_AND_ASSET_SPEC.md`
- `04_QA_AND_RELEASE_GATES.md`
- `05_SOURCES_AND_LICENSES.md`
- all seven `wireframes/*` PNGs and SVGs
- `reference_evidence/*` baseline screenshots.

Read user-provided `anti-slop` and `ui-main` guidance if present in repository or provided assets. Use components appropriately, but do **not** introduce an unrelated UI framework or change existing S01/S02 visual design.

**If a wireframe conflicts with a proven source datum or technical constraint, preserve data truth and annotate the variance. Wireframes are schematic composition contracts, NOT literal road geometry, textures or vehicle designs.**

## 1 — Reverify repository and local safety

Check the current working directory, remote, branch, staged/unstaged/untracked state, merge base, local-only commits, latest feature HEAD, PR, and test scripts:

```powershell
pwd
git rev-parse --show-toplevel
git remote -v
git branch --show-current
git status --short
git log -6 --oneline
git fetch origin
git rev-parse HEAD
git rev-parse origin/feat/atlas-true-3d-visual-upgrade
```

Protect local work. Do not run `reset --hard`, `clean -fd`, force push, or overwrite modified files. Resolve divergent state without data loss; use a safe worktree when necessary. Confirm PR #4 and last remote CI; do not open a duplicate PR.

Inspect runtime paths and tests: `src/3d/engine.js`, `src/3d/bootstrap.js`, `src/3d/routes.js`, `src/3d/vehicles.js`, `src/core/simulation.js`, `src/legacy-integration.js`, `index.html`, `tests/3d-evidence.mjs`, `tests/browser-smoke.mjs`, `tests/qa-evidence.mjs`, plus source registry.

## 2 — Root-cause baseline (verify code and capture browser evidence)

Independently verify, not blindly trust, these v4.1.2 findings:

**F1** `engine._initTrackingScene()` builds a static `PlaneGeometry(14, 200)` road, straight guardrails and generic warehouses. Geometry does not follow the actual route at different curvatures.

**F2** `_updateTrackingScene()` scrolls a dashed road group using traveled meters, updates wheels and uses fixed camera positions. The scene can look animated while road and surroundings stay generic.

**F3** `_updateContextMiniMap()` positions a dot along a fixed SVG path using `cx=15+progress*125` and `cy=44-sin(progress*pi)*18-progress*8`. The path is not a projected version of actual WGS84 route data.

**F4** `getScreenBoundingBox()` returns predefined percentages if model/camera is unavailable. This can falsely pass visibility/overlap tests.

**F5** `getRenderInfo()` reports last rendered Three.js scene, not necessarily all MapLibre tile/map/Three.js work; 80 calls should NOT be described as total platform optimization.

**F6** Only a demo Cesium GLB is used for certain trucks. Other classes remain procedural; an authentic-looking freight carrier remains unproven.

**F7** Some screenshots previously named 'five classes' or 'before vs after' do not prove what their captions claim.

**F8** Source claims about Esri World Imagery, OSM tiles, routing coverage and redistribution require exact rights/limits review.

Create a brief root-cause table with source lines, observable behavior, and test gaps in `docs/v42/BASELINE.md`. Capture a dedicated baseline. Record current screenshot IDs and SHA; do not edit historical screenshots.

## 3 — CHECKPOINT A: single authoritative route state (P0)

Create/reuse one `RouteSample` contract that provides **the same state to MapLibre, Follow, Chase, minimap, telemetry and wheels**:

```ts
// Contract illustration only; fit existing project structure.
type RouteSample = {
  routeId: string;
  source: { provider: string; urlOrFile: string; license: string; obtainedAt: string; verified: boolean };
  tick: number;
  distanceMeters: number;        // Arc length along real polyline
  lngLat: [number, number];       // WGS84 [longitude, latitude]
  headingDegrees: number;        // Geographic tangent (north = 0, clockwise)
  speedMetersPerSecond: number;   // Derived from actual Δdistance / Δsimulated time
  routeLengthMeters: number;
  isApproximate: boolean;
}
```

Sample by **arc length**, not by waypoint index, arbitrary per-frame increments or an unrelated SVG interpolation. Extract nearby points to estimate tangent robustly at a defined sample interval and at route boundaries. Handle loops, route end, pause, reset, speed change and reversals explicitly.

Compare selected truck's center on regional map, local tracking scene and inset: all must represent the **same route ID + distance along route + geographic point + heading + tick**. No separately animated travel position.

**A-gate:** 10 fixed samples at curves and intersections yield matching positions/headings across modes (within mathematical projection tolerance) and no route jumps. Record route IDs and provenance. Source accuracy is separate from coordinate conversion accuracy; do not claim meter-accurate real road matching without supporting data.

## 4 — CHECKPOINT B: real-road Follow and Chase (P0)

Replace the generic straight tracking corridor with a geometrically accurate local strip **derived from the authoritative route polyline**.

Recommended implementation (adapt to existing architecture):

1. Select a route window centered on vehicle distance `s`, with sufficient back/forward distance for Follow and Chase.
2. Resample route positions in equal arc-length intervals (e.g. ~2–5 m; adaptive for sharp curves). Preserve actual road curvature.
3. Convert WGS84 samples into an ENU/local metric frame anchored to the selected truck (or a rigorously derived Mercator-local meter transform), maintaining consistent X/Z axes and right-handed transform.
4. Compute tangents and lateral normals and extrude **road ribbon vertices**, UVs, road-edge lines and lane markings along those samples. Avoid ribbon twist, self-intersections, cusps and gaps. Handle sharp bends and junctions intentionally.
5. Read lane/width information from authorized map data where possible. When unknown, use an explicitly labeled **illustrative width** with no claim of verified road classification; do not invent barriers or signs as real Balikpapan infrastructure.
6. Add only provenance-backed nearby objects at plausible positions (warehouse, pole, trees, port equipment where validated). Generic objects are permitted only if labeled representative/demo, never as the actual named facility.
7. Place the loaded truck model from the same route sample, with its long axis aligned to tangent; ground wheels at correct height. Update environment only when route sample changes or when active road window requires rebuilding; do not recreate every frame.
8. For curves, make the geometry visibly bend around the truck. The camera must adapt to tangent changes and remain outside geometry/obstructions.
9. Existing MapLibre Free/Overview view must remain a real interactive map. Keep a visible indication that Follow/Chase is a route-derived local 3D reconstruction, with distinguishable source/approximation metadata.

**No fake motion:** scrolling straight lane-dashes on a fixed plane, while truck stays in the center, is insufficient. The *world geometry and tangent itself* must visibly change with route position.

Do not create another independent simulation clock. Do not load incompatible Three.js versions or add a new renderer without technical justification; preserve WebGL context lifecycle and dispose inactive local road geometry.

**B-gate:** show at least one straight segment, two distinct actual curves, an intersection or junction, and a route end/turn case. From 3 different simulated ticks, screenshot camera/road alignment, road curvature, real route ID, coordinates and projected vehicle position. Compare the geometric road centerline against source GeoJSON.

## 5 — CHECKPOINT C: geographic inset, no made-up SVG (P0)

The contextual map currently displays a geometric SVG unrelated to the real geographic road. Replace it with one of:

- **Preferred:** a permitted, resource-budgeted MapLibre mini-map with proper attribution, consistent projection and location overlay, if legal and performant.
- **Alternative:** a lightweight GeoJSON-derived static/vector preview projected from the SAME `RouteSample` data: draw the actual route polyline from real coordinates into inset SVG/canvas, with progress marker at the correct cumulative distance. Label **GEO-DERIVED ROUTE DIAGRAM**, not “live map”, if it is not a full basemap.

Use same `routeId`, vehicle selection and progress. When the route or selected truck changes, inset updates. When source is unavailable, show explicit empty/error state; never fall back to an invented sinusoidal line while still claiming geographic accuracy.

**C-gate:** map marker matches source geometry across 10 route samples and visually tracks real bends. Provide a boundary case where route spans differently oriented segments. Verify geographic attribution.

## 6 — CHECKPOINT D: one REAL heavy-duty hero truck asset (P0/P1)

Do not confuse loading `CesiumMilkTruck.glb` with commercial photorealism. It remains a **technical placeholder**, never the final hero unless owner explicitly accepts its quality. Research legal source choices; use source list in `05_SOURCES_AND_LICENSES.md`.

Before integration, obtain actual model details: creator, exact page URL, download URL, license name and URL, commercial usage, distribution and derivative rights, attribution, source file checksum, file format, texture list and real dimensions. Do not assume freely viewable = reusable.

Choose the best legally available real heavy commercial asset. Require credible truck cab, multi-axle wheel configuration, correct freight body, physically plausible material maps (base-color/metallic/roughness/normal) and high-quality silhouette; no toy proportions or giant low-poly cubes. If no suitable asset exists within free/authorized rights, mark **BLOCKED: QUALITY ASSET**, show candidates and seek owner approval. **No unauthorized purchase, scraping, watermark removal or license bypass.**

**POC before scaling:** load one selected asset in development studio, active geospatial scene, and route-derived Follow/Chase on desktop and mobile. Validate orientation, wheels, geometry, texture loading, real-world scale, environmental light, lack of z-fighting, motion and performance. All modes must use the same asset identity/materials, not a white GLB on desktop and dark procedural body on mobile.

**D-gate:** source registration complete, actual GLB loaded and visible in all scenes, close-ups from 5 useful angles, correct route curvature alignment, desktop/mobile parity, and **owner visual review pending** until explicitly approved.

## 7 — CHECKPOINT E: five classes and 20 trucks (conditional expansion)

**Do NOT preempt D-gate.** Once the hero is accepted, introduce the four other credible classes: container semi-trailer, box freight, reefer, tanker, flatbed/lowboy. Each must have its own recognizable real-world geometry and documented license. The same model with five paint colors does not qualify.

- Preserve 20 fleet IDs, deterministic simulation, active selection, telemetry, and routing.
- Reuse loaded GLB geometry, textures and materials where possible; minimize duplicate texture uploads.
- Set realistic wheel behavior, cab/trailer articulation on turns where asset hierarchy supports it.
- Each class should pass studio + live road + desktop/mobile inspection. If some remain procedural, mark the stage PARTIAL and list which IDs and classes are missing, rather than claiming five real models.

## 8 — CHECKPOINT F: UI / camera quality / responsive behavior

Follow all specs in `02_WIREFRAME_AND_CAMERA_CONTRACT.md` and the matching `wireframes/*.png/.svg` files. Those images specify layout, not exact geographic road shapes.

- Preserve S01/S02 function and visual system; change only defects impacting S03 or shared runtime.
- Follow/Chase camera operates in meters relative to real vehicle/world tangent, not per-frame artificial movement.
- Camera smooth with bounded acceleration, no instant teleports across curves, no sky clipping or truck occlusion.
- Desktop: inspector on right, truck fully visible; place status badges outside model screen bounds.
- Mobile: collapsed sheet approx 88px, expanded <=55% screen height; truck visible in safe region; meaningful tap targets >=44px; Exit Follow always reachable; pinch/pan/manual takeover works.
- Vehicle selector, inspector, inset and main map synchronize IDs, status and simulated clock.
- Avoid repeated cards or promotional labels in 3D space; adhere to anti-slop and ui-main where available.
- Never create fake telemetry: compute motion-derived speed; if approximate, label as simulated.

## 9 — CHECKPOINT G: QA must fail for actual defects

Run tests described in `04_QA_AND_RELEASE_GATES.md`, add targeted tests using available Node/Playwright framework and actual browser screenshots.

Critical fixes:

1. **Remove fake `getScreenBoundingBox()` fallback values.** Return a typed unavailable result or `null` when model/camera isn't ready, and fail tests requiring real bounds. Compute from actual object world bounds + camera matrix; reject NaN/out-of-view/behind-camera points.
2. Test that the real route local geometry changes direction with source tangents, not just that animation frames hash differently.
3. Test the actual GLB asset loaded (URL, mesh hierarchy), visible within screen bounds and correctly grounded on live road, not just an inspection studio.
4. Negative controls should remove the actual 3D layer, block the real model request, disturb route sampler or set zero movement (isolated tests); original tests must detect and fail. No invented layer names as proof.
5. Test inset source against same route polyline and truck point; deliberately feed wrong route and ensure test fails.
6. Collect **per-view** draw calls/triangles, frame-time p50/p95, screenshot resolutions and GPU renderer identity/acceleration status when observable. Distinguish MapLibre + Three.js total complexity from Three.js partial stats. **Do not call 80 draw calls 'total ATLAS'** merely because local tracking scene is active.
7. Record visual truth manually where automated recognition is insufficient. Owner photorealism approval cannot be self-asserted.

QA screenshots must cover first and last frames of real curves, a junction/turn, route switch, same truck in desktop/mobile, working inset, no occlusion, no frame reset, and at least one genuine **side-by-side before/after** comparison using untouched baseline and new screenshot.

## 10 — Repository and release policy

- Preserve feature branch, update **existing Draft PR #4 only**.
- Implement each checkpoint in a focused, reviewable commit once its automated gates pass.
- Run `npm.cmd run check`, `npm.cmd test`, `node tests/browser-smoke.mjs`, `node tests/qa-evidence.mjs`, `node tests/3d-evidence.mjs` on Windows (or equivalent `npm` on Linux). Run new v4.2 tests.
- After push, independently inspect **both Push and Pull Request** GitHub Actions for exact HEAD SHA; do not claim success until remote CI completes.
- Preview deployment only; do not merge or deploy production. If CI fails, fix real issue; do not weaken tests or erase source evidence.
- Keep release gates **FAIL/BLOCKED/NOT VERIFIED/PENDING VISUAL REVIEW** when any proof is missing.

## 11 — Delivery and verified final report

Provide one `docs/v42/VERIFIED_RESULTS.md` report with:

1. Baseline SHA, updated SHA, changed files, test commands and outputs.
2. Route data provenance, route sample IDs, geometry alignment proof, tangent/curvature error metrics.
3. List of scene components replaced vs preserved, and screenshots of 3 real curves.
4. Minimap method, source attribution and consistency checks.
5. Real heavy-truck asset names/licenses/hashes, tested visual shots, classes still procedural.
6. Desktop/mobile interaction table with physical screen bbox/occlusion evidence.
7. Frame-time p50/p95 and draw calls measured **per view**, method/environment, hardware status.
8. CI links for exact new commit, Draft PR link and preview link.
9. 10 acceptance gates from `04_QA_AND_RELEASE_GATES.md` with statuses and evidence URLs.
10. Explicit notes for all issues unresolved or owner signoff pending.

**Begin implementation immediately. Do not end with another plan. Execute route truth first, then a genuine heavy-truck POC, then UI/QA, and finally optional fleet expansion. If a required external asset/data license cannot be obtained, do all independent safe work and describe the blocker.**

**HERMES PRINCIPLE: REAL ROUTE → REAL CURVE → REAL TRUCK → REAL CAMERA → REAL BROWSER PROOF.**
