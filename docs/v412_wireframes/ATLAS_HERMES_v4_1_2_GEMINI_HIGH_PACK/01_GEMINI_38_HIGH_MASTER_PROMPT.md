# ATLAS — HERMES VISUAL INTEGRITY LOCK v4.1.2
## Targeted implementation contract for Gemini 3.8 High · Google Antigravity

> **EXECUTE, DO NOT RE-SPECIFY.** Use the attached wireframes and actual Chromium before-images as authoritative context. This task corrects **S03 Live Fleet Map visual integrity**. It is not a website redesign, not a new 3D engine, and not the v4.2 marketplace-asset expansion.

**Role:** Principal Geospatial Frontend Engineer + MapLibre/Three.js Integration Specialist + Senior Product Designer + Visual QA Engineer.

**Repo:** `https://github.com/zvenians/atlas-project`  
**Branch:** `feat/atlas-true-3d-visual-upgrade`  
**Existing PR:** `https://github.com/zvenians/atlas-project/pull/4`  
**Last externally verified HEAD:** `baaaefda0fecd0e7c68dbbb5030c95d4d962194e` (fetch and confirm; do not assume still current)  
**Starting state:** v4.1.1 push and PR CI green; visual quality still NOT approved.

### Files you MUST inspect before writing code

- `src/3d/engine.js`: `_updateCameraTracking`, `setCameraMode`, `_updateVehicleTelemetryUI`, GLB/map custom layer, model measurements.
- `src/3d/vehicles.js`: `createFleet`, Cesium glTF, model hierarchy, wheel animation.
- `src/3d/routes.js`, `src/3d/osm-corridors.json`: actual demo corridors.
- `src/3d/bootstrap.js`, `src/legacy-integration.js`: active S03 path and duplicate UI handlers.
- `index.html`: S03 DOM, layers, inspector, camera controls, footer, simulation bar, mobile behavior.
- `tests/3d-evidence.mjs`, `tests/browser-smoke.mjs`, `tests/qa-evidence.mjs`, `.github/workflows/ci.yml`.
- `docs/REALISM_SOURCE_REGISTER.md`, the previously approved visual design tokens in `ATLAS_Wireframe_Design_Lock_v3.0` **if present locally**, and the attached `02_WIREFRAME_CONTRACT.md`.

### Actual before-images, NOT examples of desired output

Read all three, visually:

- `evidence_before/BEFORE_follow_ci_v411.png`
- `evidence_before/BEFORE_chase_ci_v411.png`
- `evidence_before/BEFORE_mobile_ci_v411.png`

Observed defects in these screens:

1. Follow/Chase contain gray, strongly blurred, stretched ground imagery at high map zoom; they do not offer believable close-range terrain or road context.
2. Vehicle `TRK-004` is tiny, clipped/partly obstructed by an information banner; camera tracking changes geographic center, but the actual visual subject remains poor.
3. Mobile inspector/notification controls obstruct a large fraction of the map; toolbar and navigation compete with the content.
4. Five vehicle classes still do not have convincing close-up GLB models. **Do not claim this is solved under v4.1.2.**
5. Some simulated telemetry values (such as speed/ETA) are heuristics; clearly label them and keep them consistent with actual movement.
6. Model studio screenshots are now visible, but studio success **does not** prove live-map realism.

## 0 — ABSOLUTE SUCCESS DEFINITION

The S03 Live Fleet Map must have a coherent, professional **Dark Enterprise Editorial** UI and genuinely useful vehicle tracking on desktop and mobile. At least the current licensed `TRK-004` GLB must become recognizable **in the actual geographic/tracking experience**, not only in a separate studio scene. Provide readable geographic context and accurate attribution. Do not overstate the visual fidelity of the demo model.

**Primary output of v4.1.2:** functional visual framing + robust map/3D compositing + usable mobile S03. **Not:** buying assets, generating more procedural trucks, or claiming photorealistic five-class fleet.

All acceptance is **fail-closed**: code and green CI do not substitute for real visual inspection. If licensing/imagery coverage makes a true near-road chase impossible, use the explicit alternative layout below and report what remains unfulfilled.

## 1 — MANDATORY DESIGN LOCK

Treat attached SVGs as layout and hierarchy specifications, not source geometry. **Do not copy the simplistic illustrated trucks or schematically drawn roads into the product.** Implement real components and actual map/3D model rendering.

| Wireframe | File | Purpose |
|---|---|---|
| WF-01 | `wireframes/01_S03_DESKTOP_OVERVIEW.svg` | Operational regional map + selected route + inspector |
| WF-02 | `wireframes/02_S03_DESKTOP_FOLLOW.svg` | Actual selected 3D truck visually dominant and unobstructed |
| WF-03 | `wireframes/03_S03_DESKTOP_CHASE.svg` | Behind/overhead 3D subject with real geographic context |
| WF-04 | `wireframes/04_S03_MOBILE_COLLAPSED.svg` | Default mobile: map dominant, collapsed selected-vehicle sheet |
| WF-05 | `wireframes/05_S03_MOBILE_TRACKING.svg` | Mobile tracking: map visible, half-height sheet and Exit Follow |
| WF-06/07 | `wireframes/06_S01_CONTINUITY_GUIDE.svg` and `wireframes/07_S02_CONTINUITY_GUIDE.svg` | Continuity reference only; **do not expand scope to redesign S01/S02** |

**Design tokens:** Obsidian `#10141A`, sidebar `#151B22`, panel `#1C252D`, raised `#28333B`, primary text `#F5F1E9`, supporting `#B6C0C4`, copper primary `#DCA876`, teal status `#65C9B6`, risk coral `#FF8584`. These are initial tokens subject to accessibility contrast checks. Avoid neon/glassmorphism, gratuitous glow, generic stacked cards, emojis used as nav icons, and template AI patterns.

**Desktop @1440×900 target:** navigation ~222–248 px; header 64 px; usable map viewport ~824–850 px wide / ~650 px tall; docked inspector ~328–360 px; simulation controls 68–72 px tall; attribution unobstructed. Preserve map focus area between toolbar, inspector and bottom controls.

**Mobile @390×844 target:** top app header 60–64 px; 44 px minimum touch controls; map should remain the dominant surface when sheet collapsed; bottom sheet initially ~88–110 px and expandable; simulation controls anchored above the OS safe area. No desktop inspector floated in the middle of the screen. Expanded sheet max ~50–55% of viewport and scrolls internally. Always provide a visible collapse control and an `Exit follow` action. Preserve attribution.

## 2 — P0: REAL 3D VEHICLE COMPOSITION ON LIVE MAP

### 2.1 Prove physical geometry and transform once

Before camera tuning, instrument the **live S03** GLB object:

- selected vehicle ID and GLB source URL;
- model load status and actual mesh/material counts;
- parent scene membership and `visible` through all ancestors;
- meter-to-Mercator transform and absolute world location;
- actual model bounding box in meters and near-plane/far-plane status;
- screen-space projected 2D bounding rectangle via the current map-camera projection;
- actual map camera projection and truck orientation quaternion;
- elapsed virtual ticks and geographic movement between two frames;
- distinguish loaded GLB *in studio* from loaded GLB *in live custom layer*.

**Do not artificially scale a 10-meter truck to 100 meters simply to make it look larger.** Fix camera distance, framing and rendering, or use the technically justified dual-view fallback described in §3.

### 2.2 Live-map proof gate

For selected `TRK-004`, the default desktop Follow evidence must show the recognizable vehicle with an unobstructed visible silhouette. As a **visual design target**, aim for vehicle projected bbox width **≥180 px at 1440 px viewport** and height **≥70 px** in high-detail mode, **provided** this can be achieved with physically correct scale and permitted geospatial rendering. This is not license to distort geometry. Mobile high-detail follow target: subject width **≥100 px on a 390 px screen**, when feasible.

Vehicle centroid should lie within the map's safe visual content region (not beneath inspector, toolbar, callout, toast, or simulation bar). For desktop, target central-left canvas area; for mobile, place subject above the collapsed sheet with sufficient negative space.

Place callout **beside or above** the actual projected model bbox, not at arbitrary `map.project(position).y - 75`. Use collision-aware label positioning with edge clamping, occlusion checks, low-frequency updates and a 'hide labels' action. Callout never covers the truck cabin or roof.

### 2.3 Accurate headings and selection

- Rotate 3D truck so its forward vector matches road bearing in actual MapLibre Mercator axes; prove cardinal directions and bends.
- Keep model upright, grounded and correctly scaled; no clipping beneath road/terrain.
- Selecting vehicle changes inspector, selected route, callout, camera target, and accessible name **consistently**.
- Never hard-code the selection to TRK-004 outside development proof/demo preset. All 20 should remain selectable.
- Avoid double notifications from `src/legacy-integration.js` and `src/3d/engine.js`.
- Stop/mute camera takeover after explicit manual pan/zoom/rotate, showing an obvious `Exit Follow / Return to Operator` state.

## 3 — P0: FIX THE BLURRY CHASE/FOLLOW MAP PROBLEM

**Do not solve this by increasing zoom beyond available satellite native resolution.** For many providers, requesting a high map zoom simply magnifies lower-resolution raster imagery, which becomes gray/blurry at ground level.

First measure and report: requested zoom, actual imagery native maximum zoom, tile pixel dimensions, tile error status, the rights to use that provider at this scale and the output resolution. Check against a physical screenshot. Do not use the presence of loaded tiles as proof of high detail.

### Option A (preferred when technically viable)

Keep **MapLibre + Three.js custom layer** as the unified rendering surface, but choose an authorized basemap at a usable native resolution and a camera elevation/pitch that produces clearly recognizable road/vehicle imagery without upscaling artifacts. Render 3D truck at real scale. Keep clear spatial context, ground contact, and geographic alignment. Measure actual vehicle screen bbox.

### Option B (mandatory fallback if imagery detail is insufficient)

Present **two explicitly distinct, synchronized views**:

1. Main high-detail licensed GLB vehicle + physically credible *representative* road-surface/industrial 3D context, geo-aligned with the authoritative simulation and route. The local scene is labeled **SIMULATED 3D VIEW** and is not presented as photorealistic captured geography.
2. A compact live MapLibre geographic inset for the actual Balikpapan corridor, selected route and current geographic position, with provider attribution.

**Do not fake the city at ground level by stretching satellite imagery onto an arbitrary plane.** Do not replicate the old custom WebGL-context conflict. Implement only the minimum additional local viewport when necessary, with proper shared state, renderer lifecycle and performance verification. Document why A could not meet native imagery quality.

If neither A nor B can pass real visual QA due to technical or licensing limits, mark the close-range cinematic gate **BLOCKED**. Do not invent a solution or distort scale.

## 4 — P0: CAMERA STATES AND MOTION

Implement state machine: `OPERATOR → FOLLOW ↔ CHASE → OPERATOR`, with `OVERVIEW` as a deliberate regional preset and `INSPECT` as development-only studio mode. No two active follow loops or conflicting timers.

- **OPERATOR / OVERVIEW:** true MapLibre geographic camera, fit fleet/selected route; manually pans and rotates.
- **FOLLOW:** center selected 3D model in safe region, keep position visually stable, smoothly update bearing if necessary; no stutter from `jumpTo()` every render frame. Use tick-aware, throttled camera updates or the appropriate camera API.
- **CHASE:** true behind-and-above relative pose against truck heading; not merely a zoomed-in map with new label. Orient road movement and horizon consistently; clearly show vehicle and surroundings.
- **SELECT NEW TRUCK:** preserve mode if valid and retarget immediately, or exit with clear feedback if selected truck cannot be rendered.
- **MANUAL CAMERA INPUT:** pause/exit automatic tracking visibly, allow deliberate resume.
- **SIMULATION PAUSE:** truck and wheel stop; camera may remain usable.
- **REDUCED MOTION:** transitions and tracking are adapted without pausing business simulation; avoid cinematic animation.

Use genuine measurements for camera state, target distance and target screen position. Never hard-code altitude to pass tests.

## 5 — P0: MOBILE SHEET AND OVERLAY INTEGRITY

Follow WF-04 and WF-05. **Mobile should not be a scaled-down desktop map.**

- On 390×844, collapse desktop layers list behind an accessible Layers button; use a popover or panel that can close on Escape/overlay tap.
- Top compact camera bar has Operator/Map, Follow, Chase and Fit or equivalent controls, each interactive and touch-usable.
- Selected vehicle uses a draggable/clickable bottom sheet: collapsed card contains ID/status, speed and virtual ETA; expanded card contains driver/route/telemetry and actions. No content clipped; no horizontal overflow.
- In collapsed state the map is unobstructed above the sheet, and the selected vehicle remains visible in its safe region.
- In expanded state the map and selected vehicle are still visible above the sheet when tracking; `Exit follow` remains reachable.
- Simulation bar stays visible with essential Pause/Play, speed and virtual time; advanced simulation options are collapsed.
- Toasts and callouts are not permanent bars across bottom attribution or on top of the truck.
- **Map source attribution is always visible, legible and legally compliant.** Do not cover it with the bottom sheet.
- Test 390×844, 360×800 and 768×1024; keyboard/focus/click/touch; if no live video/cursor capture, use actual mobile Chromium touch emulation.

## 6 — P1: TELEMETRY INTEGRITY (NO FAKE LIVE DATA)

- Every visible ID reflects the actual selection, including toast and inspector.
- Any simulated ETA, route speed or driver names must be clearly labeled as DEMO/SIMULATED and derived from the *same* canonical snapshot as vehicle progress where possible.
- Pause, Resume and Reset must update status, speed and position consistently (status cannot remain `IN TRANSIT` at 47km/h while the simulated vehicle is stationary, unless clearly described as planned speed rather than observed instantaneous speed).
- Do not infer actual speed from arbitrary vehicle index; compute speed from canonical route distance versus accepted virtual time if simulation supports it, otherwise label a clearly named synthetic target speed.
- Do not confuse virtual WITA time with wall-clock or data freshness.
- Zero console exceptions and no duplicate camera toast notifications.

## 7 — P1: TESTING THAT CANNOT BE GAMED

### Minimum reproducible test suite

`npm run check`, `npm test`, `node tests/browser-smoke.mjs`, `node tests/qa-evidence.mjs`, `node tests/3d-evidence.mjs`.

Add focused browser integration tests for:

1. Actual GLB tanker exists and is rendered in the **live map**; report model source, visible bounds, world scale and screen bbox.
2. Follow and Chase transition to a stable target, and in two separated simulation ticks the camera/vehicle relationship remains correct.
3. Camera subject is not occluded by the callout or inspector (screen rectangle intersection test; supplemented by human review).
4. No upscaled raster-tile **misrepresentation**: image native zoom vs camera zoom is recorded; if insufficient, switch to documented fallback state.
5. Mobile layers open/close, inspector expand/collapse, safe-area and tap interaction work at 360/390/768 widths; page has no horizontal overflow.
6. Selecting TRK-004 → TRK-001 updates every ID/route/inspector/visible marker; does not silently force the hero back.
7. Pause freezes distance and wheel angle; Step increments exactly once; Resume advances.
8. `OVERVIEW` flight awaits actual `moveend` (or completes synchronously for reduced-motion) and preserves strict regional zoom, without arbitrary sleep-only assumptions.
9. Negative-control *mutations* of the actual 3D layer/model/camera must fail the corresponding check in isolated test context. A check for a made-up ghost layer is **not sufficient**.
10. Record screenshot capture time, state, zoom, selected vehicle, real renderer metrics, browser GPU mode, and asset license reference.

### Screenshot protocol

Create **genuine Chromium output** for:

- desktop: `S03_OVERVIEW`, `S03_FOLLOW_TRK004`, `S03_CHASE_TRK004`, `S03_SELECTED_TRK001_AFTER_SWITCH`;
- mobile: `S03_COLLAPSED`, `S03_EXPANDED`, `S03_FOLLOW_TRK004`, `S03_CHASE_TRK004`;
- one actual *live-map* close shot of GLB tanker (not studio-only);
- comparison against the attached v4.1.1 before files with identical viewport/selected vehicle when feasible;
- one 3-frame sequence showing truck actually moved along its route after deterministic virtual ticks.

Do not label a captured frame as a realistic truck close-up unless the actual vehicle is visible and visually inspectable. A unique SHA-256 hash proves only uniqueness, not contents.

**Report screenshot status as `PASS / FAIL / PENDING HUMAN VISUAL REVIEW / BLOCKED`** independently from CI result.

## 8 — P1: PERFORMANCE AND LICENSING

- Preserve/map existing one-authoritative-map architecture and WebGL lifecycle. Do not recreate duplicate engines or reintroduce canvas context conflicts.
- Use actual measured frame times, draw calls and triangles; do not label Chromium headless as guaranteed hardware-accelerated without inspecting renderer details.
- Adaptive detail on 8GB-class PCs and mobile, with safe vector mode if full detail unavailable. Never degrade simulation correctness to achieve FPS.
- Esri/OSM/routing tile access, attribution, caching and commercial-use rights must be verified for intended public release. A publicly reachable URL is not a redistribution license. No unauthorized purchase/API key.
- Keep asset provenance in `docs/REALISM_SOURCE_REGISTER.md` and transparently state CesiumMilkTruck is still a demo GLB, not the final five-class commercial fleet.

## 9 — IMPLEMENTATION CHECKPOINTS (EXECUTE IN ORDER)

**C0 · Repo safety:** fetch latest, check branch/status/local diffs; preserve local changes. Identify HEAD and relevant implementation.

**C1 · Baseline proof:** reproduce current three before screenshots from running local app, record screen bbox, tile max native zoom, loading state, overlays; store evidence.

**C2 · Live-map GLB fix:** correct transform, scale, framing and occlusion; capture at least one unmistakable real live-map GLB tanker image. If MapLibre native imagery fails, invoke §3 Option B with explicit provenance and map inset.

**C3 · Camera states:** Follow, Chase, Overview and return to Operator; moving state with at least 2 virtual tick samples; manual gesture cancels follow.

**C4 · Mobile layout:** bottom sheet, compact controls, safe areas, no blocked attribution.

**C5 · QA/telemetry:** assertions (including actual broken-layer negative controls), dynamic selection, no invented FPS, no duplicate toasts. Capture matching before/after.

**C6 · Delivery:** run all tests, inspect screenshots, commit, push to **existing** feature branch, verify both push and PR remote CI on exact new SHA, publish Vercel Preview and update existing Draft PR #4 with honest gate table.

**Fail-closed dependency:** if C2 has no valid live vehicle evidence, do not mark C3/C4 as visual PASS even if implementation proceeds. Do not falsely certify the full project.

## 10 — GIT/DEPLOYMENT SAFETY

Allowed: safe feature-branch commits and push, current Draft PR updates, Vercel Preview only, verified licensed assets, tests/evidence, docs.

Forbidden: `git reset --hard`, destructive `git clean`, force push, silent discard of local work, duplicate PR/renderer, merge to `main` or stabilization branch, production deployment, unauthorized asset downloads, paid API activations, fake screenshots, weakening tests.

A GitHub green check **is not** the final visual acceptance of S03.

## 11 — REQUIRED FINAL REPORT (EXACT STRUCTURE)

```
ATLAS — Hermes v4.1.2 Visual Integrity Report

A. Git
   Initial SHA / Final SHA / Local work preserved / PR #4 URL
B. Diagnosis
   Actual cause of blur / native tile zoom / renderer and licensing / truck bbox BEFORE
C. Chosen architecture
   Option A or B / why / active geographic map / actual GLB screen bbox
D. Visual proof
   Desktop overview, Follow, Chase / Mobile collapsed, expanded, Follow, Chase
   BEFORE vs AFTER comparison with actual image paths
   Vehicle screen bbox, occlusion test, source names, no fake evidence
E. Functional proof
   Vehicle switch / Play, Pause, Step, Reset / motion / camera state / manual takeover
F. Performance
   Actual measured frame times / draw calls / triangles / GPU mode / caveats
G. CI & Preview
   All test commands and results / Push CI URL + result / PR CI URL + result / Preview URL
H. Gates
   C0–C6: PASS, FAIL, BLOCKED, or PENDING HUMAN VISUAL REVIEW
I. Remaining v4.2 work
   Professional GLBs for container / box / reefer / tanker / flatbed
   Better port assets / native close-up geography limits / any paid-asset proposals (not purchased)
```

**FINAL DIRECTIVE:** Fix the actual v4.1.1 screenshots. Follow the attached wireframe hierarchy. Make `TRK-004` visibly recognizable in a moving, geo-consistent S03 view. Keep mobile usable, the simulation authoritative, and the quality report truthful. Push only verified feature-branch changes; **do not merge or deploy production**.
