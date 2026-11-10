# ATLAS v4.2 — Honest QA / CI / Visual Acceptance Plan

## A. State definitions

**PASS:** working implementation plus corresponding actual browser evidence.  
**FAIL:** correct test detects unmet behavior.  
**BLOCKED:** demonstrable external dependency (license, geographic data, authorized asset).  
**NOT VERIFIED:** evidence insufficient.  
**PENDING VISUAL REVIEW:** objectively rendered but owner has not approved visual quality.

CI green establishes *test success*, never authorizes declaring realistic/accurate things that the tests did not actually measure.

## B. Required automated checks

1. **Route source:** trusted route dataset exists; geometry nonempty; WGS84 coordinate order correct; source/license metadata present; OSRM/OSM provenance traceable.
2. **Arc-length math:** monotonic accumulated distance; t=0/last; duplicate vertices; sharp turns; segment/loop boundaries; no teleport; heading wraps safely.
3. **Map agreement:** at 10 fixed `s` samples (multiple curves), MapLibre source overlay point and local scene truck point correspond to same WGS84 coordinate, route ID and tick. Mathematical tolerance specified independently from source confidence.
4. **Local geometry:** actual centerline vertex geometry at 3 different `s` windows changes curvature and matches projected source within tolerance; no fixed straight 200m corridor can pass.
5. **Minimap:** path created from same route geometry; marker on rendered path; selecting a different route updates both; deliberately wrong inset route must fail.
6. **GLB visibility:** loaded `gltf.scene` is attached, visible in main map and local scene and screenshots. Actual mesh and material counts measured. No missing-camera fallback screen BBox.
7. **Camera:** Follow and Chase keep vehicle within target viewport, test active steering/bend changes and manual takeover. Camera mode button labels alone cannot pass.
8. **Simulation:** pause/step/reset/speed/scenario; identical `s` and wheel orientation under 30FPS/60FPS/irregular frames; no double speed multiplier. Movement verified in meters, not image hash changes.
9. **Mobile:** 360×800, 390×844, 430×932, 768×1024; real GLB class consistent, no sheet overlap, no overflow, real controls respond, attribution and Exit Follow remain visible.
10. **Regression:** S01/S02, legacy URL behavior, 20 fleet units, existing data integrity, all existing tests, browser console and WebGL lifecycle.

## C. Negative controls that must break the relevant test

- Block the **real GLB URL** under test, expect asset-render gate FAIL.
- Remove or disable the actual `atlas-3d-vehicles` layer (in isolated test), expect map 3D gate FAIL.
- Force the route sampler to return a straight segment for a known curved fixture, expect curvature gate FAIL.
- Substitute unrelated coordinates into the real minimap renderer, expect route consistency gate FAIL.
- Detach selected real vehicle from tracking scene, expect visibility gate FAIL (no fake fallback BBox).
- Force camera position stationary while route tangent changes, expect camera tracking gate FAIL.
- Pause or freeze canonical tick in a known stepping test, expect progression gate FAIL.

Restore normal app state after isolated negative controls. Do not disable assertions to pass CI.

## D. Required screenshot manifest

**All screenshots must come from actual running browser after asset/map initialization**, with controlled viewpoint/time, capture size, model identity, route ID, `s`, tick, scene type and SHA-256. Distinguish existing v4.1.2 reference from new v4.2.

| Evidence ID | Requirement |
|---|---|
| G01 | Main MapLibre geographic route with one selected vehicle |
| G02 | Follow real left bend — source trace overlay comparison |
| G03 | Follow real right bend — source trace overlay comparison |
| G04 | Chase real bend and vehicle heading |
| G05 | At road junction / valid safe turn with route provenance |
| G06 | Live geo inset + truck at same `s` |
| G07 | Real hero truck studio front 3/4 |
| G08 | Real hero truck side profile |
| G09 | Real hero truck cabin and wheel detail (separate close-ups) |
| G10 | Hero truck on route-derived road showing tire-ground contact |
| G11 | Mobile Follow collapsed sheet at 390×844 |
| G12 | Mobile Follow expanded sheet at 390×844 |
| G13 | Mobile Chase (same GLB as desktop) |
| G14 | S01/S02 desktop/mobile unaffected |
| G15 | Actual before/after side-by-side, with baseline SHA |
| G16 | 3+ timed real curve frames (s and heading logged) |
| G17 | Five distinct heavy vehicle classes **only if genuinely integrated** |
| G18 | Proper licensed asset/source register and attribution screenshot |

Screenshot file hash uniqueness only detects identical files. It does not prove subject visibility or geographic reality. Record visual review owner/pending.

## E. Metrics

For **every mode** separately: `MapLibre Free`, `Overview`, `Follow`, `Chase`, `Mobile Follow`, `Mobile Chase`:

- Actual WebGL renderer type and whether software/hardware acceleration can be determined; state unknown if not.
- Median/p95 frame times measured after warmup over representative frames, not a single instant.
- Draw calls and triangles for Three.js scene *in that mode*, plus any available map renderer metrics explicitly separated. Do not claim 'total' numbers unless the full pipeline is measured.
- GPU/heap metrics only if supported and reliably accessible; otherwise unavailable.
- Startup/model load time, asset sizes/texture footprints, map tile network errors.
- Real active model count and fleet IDs. For mobile performance, use actual mobile-class device measurements where possible; desktop emulation is **not** device hardware benchmark.

**Performance target:** Aim desktop p95 frame-time <= 16.7ms (60fps class) if achievable without sacrificing required realism; minimum usability desktop p95 <= 33.3ms and mobile p95 <= 50ms on a documented representative configuration. These are *proposed acceptance budgets*, not observed results. If not met, report FAIL/PERFORMANCE WORK REMAINS with numbers and reproducibility details.

## F. Acceptance matrix

| Gate | Status on arrival | Exact pass condition |
|---|---|---|
| V42-G1 | NOT VERIFIED | Source-backed route geometry, traceable provenance and correct map alignment |
| V42-G2 | NOT VERIFIED | Local Follow road ribbons curve identically to verified route at 3 sample windows |
| V42-G3 | NOT VERIFIED | Chase vehicle, camera and road tangents agree on real bends |
| V42-G4 | NOT VERIFIED | Inset uses actual geodata; wrong-route negative control fails |
| V42-G5 | NOT VERIFIED | One legally licensed detailed heavy truck render passes studio, map, Follow, Chase, mobile |
| V42-G6 | PENDING VISUAL REVIEW | Visual fidelity approved by owner; never self-approve |
| V42-G7 | NOT VERIFIED | No fake BBox values; real visible model and occlusion metrics |
| V42-G8 | NOT VERIFIED | Deterministic simulation/physical movement verified in meters across FPS changes |
| V42-G9 | NOT VERIFIED | S01/S02/mobile regression and per-view performance captured honestly |
| V42-G10 | NOT VERIFIED | New commit pushed, PR #4 Draft preserved, both remote Push and PR CI green, preview ready |

If a high-quality legally usable model cannot be obtained, G5 BLOCKED and G6 remains pending; do not mark all gates PASS and do not expand to 20 real models.

## G. Commands and evidence artifacts

On Windows (or adapt `npm.cmd` to your OS):

```powershell
npm.cmd run check
npm.cmd test
node tests/browser-smoke.mjs
node tests/qa-evidence.mjs
node tests/3d-evidence.mjs
# plus all new route-fidelity, visibility and negative-control tests
```

Final results in `docs/v42/VERIFIED_RESULTS.md`; screenshot files and JSON in repo-designated artifact folder, attached to CI (avoid committing enormous generated evidence unless project convention requires it). GitHub Actions push and PR **must match exact SHA**. Record links, not statements only.
