# ATLAS v4.2 — Wireframe and Camera Contract

**Read the PNGs and editable SVGs**. They are **layout/behavior diagrams**, not a request to imitate their primitive truck shapes, road curves, materials or actual map geography. Actual WGS84 route geometry must override illustration coordinates.

## Shared visual direction

- Design lock: **Dark Enterprise Editorial**, high density only when task context requires it, balanced desktop, mobile task-first. Neutral backgrounds, muted typography, copper highlights/teal operational indicators. No gaudy game-like glow or repeated generic card layout.
- User's ATLAS identity, navigation, existing bilingual EN/ID behavior, S01 and S02 remain intact.
- Branding applies to UI; vehicles, asphalt, ports and environmental materials have **realistic colors**.
- Every scene labels data provenance: `SIMULATED OPERATIONS` and for near-road tracking `ROUTE-DERIVED 3D / DEMO CONTEXT` unless assets and locations are verified.
- Avoid fixed overlay that masks asset, lane bends, road signs or map attribution. All UI needs accessible text and reliable keyboard/touch operation.

## WF-01 — Desktop Authoritative Map (`01_DESKTOP_AUTHORITATIVE_MAP`)

**Viewport:** 1440×900. **Task:** verify real geography and routes before cinematic presentation.

- Full-height map area left, right operator inspector 320–400px (adapt existing S03 rather than redesigning every section).
- Center on selected real route, not an arbitrary port render.
- Source-backed GeoJSON road network and route, real WGS84 point, current distance-along-route and route tangent. MapLibre pans/zooms/rotates as expected.
- Selected vehicle marker/mesh must correspond to `routeId, s, tick`. Any road/terminal features that are speculative are identified as demo, not claimed as accurate infrastructure.
- Map attribution and map provider must be visible. If network tile provider fails, show a clear map error/limited mode.

**Gate:** switch vehicle / simulate step / pause and compare all consumers against canonical state. Do not show 10 verified roads if metadata proves only approximations.

## WF-02 — Desktop Follow (`02_DESKTOP_ROUTE_FOLLOW`)

**Viewport:** 1440×900. **Task:** see the actual truck on a **curving route**, not a toy in a generic scene.

- Truck clearly recognizable, bounding width >=180px and height >=70px measured from model + actual projection, never from viewport ratios.
- Camera leads/offsets relative to **local tangent** of selected road, with interpolation for smooth curve transition.
- Road must visibly curve as selected truck approaches and passes bends. **Route-window resampling** may be used to keep geometry performant.
- Badge outside model bounding rectangle; inspector never occludes vehicle; maintain >=16px physical margin wherever practicable.
- Mini-map shows route from same GeoJSON, or actual MapLibre map if licensed/performance-ready.
- If the underlying imagery lacks required resolution, do not magnify raster pixels; use accurate route-derived geometry and disclose which environment is approximate.

**Gate:** three distinct arc-length samples must render distinct, source-consistent local curves and heading; screenshot uses actual loaded GLB.

## WF-03 — Desktop Chase (`03_DESKTOP_ROUTE_CHASE`)

**Viewport:** 1440×900. **Task:** dynamic perspective from behind/above the same truck; route physically bends.

- Camera sits behind and above truck based on heading, with forward lookahead; use world meters and terrain constraints.
- The road, road-edge, markings and truck should agree on heading at s, not a permanently straight road.
- Vehicle should be large enough to identify class but preserve road horizon; target projected width >=180px for desktop where possible.
- Smooth damping is elapsed-time-based; no teleport upon selecting another truck or entering a sharp curve.
- On low fidelity / missing model, display honest unavailable visual state rather than switching to another class.

**Gate:** moving truck around ≥2 real bends changes road curvature and camera bearing; prove through state logs and screenshots at 3 ticks.

## WF-04 — Minimap truth (`04_GEOGRAPHIC_INSET_TRUTH`)

**Accepted:** a real MapLibre viewport with attribution, OR a GeoJSON-derived projected route diagram that identifies itself as a diagram. **Unacceptable:** static decorative SVG route and hand-animated dot labeled as live geography.

- Inset uses exact `routeId`, route geometry, source ID, along-route `s` and `lngLat` state.
- Vehicle dot is projected from real route position. Path is computed from the same geographical samples, not sine waves or arbitrary interpolation.
- Marker must remain on or near drawn line within test tolerance.
- Dynamically updates when route changes; labels provider and notes partial/approximate coverage.
- No extra web requests solely for tests. Honour provider tile terms and reasonable cache behavior.

**Gate:** compare inset marker to route samples at 10 positions, including 2 bends and route end; wrong input route must fail test.

## WF-05 — Mobile Follow Collapsed (`05_MOBILE_TRACKING_COLLAPSED`)

**Viewport:** 390×844, additionally test 360×800 and 430×932.

- Upper area prioritizes truck and road, minimal persistent overlays.
- Collapsed sheet approx **88–110px** (safe-area-aware), enough for truck ID, action and live status.
- Projected truck width >=100px and outside sheet/CTA rectangles; no offscreen clipping.
- 44×44px or larger essential touch target; tap to expand, swipe sheet and immediate Exit Follow available.
- Map attribution remains available, not masked by floating elements.

**Gate:** manual camera interaction ends tracking or switches modes predictably; no horizontal overflow.

## WF-06 — Mobile Expanded (`06_MOBILE_TRACKING_EXPANDED`)

- Sheet height <=55% of usable viewport, scroll its content without scrolling parent map.
- Show readable simulated speed, remaining distance, ETA and route ID with source status.
- Retain truck visible in upper safe region. On highly constrained device, shrink/reposition camera instead of hiding vehicle.
- Exit Follow and Chase are always reachable; focus management and screen reader labels work.
- Expanding sheet does not reset route progress, camera or truck model.

**Gate:** actual browser bounding rectangles demonstrate no overlap at test breakpoints with sheet both collapsed and expanded.

## WF-07 — Asset quality (`07_ASSET_QUALITY_GATE`)

- Left = existing sample/procedural baseline, suitable for testing loading but not for professional hero realism.
- Right = target **qualitative silhouette and detail guidance**, not a model file or evidence.
- All assets require exact provenance and license. Model has credible cab/tyre/chassis/freight details, PBR maps and real-world scale.
- Use same GLB asset identity at studio, live map and Follow/Chase/mobile; no procedural substitute pretending to be the same vehicle.
- A separate inspected model may differ temporarily if it is clearly labeled “evaluation candidate”.

**Gate:** one licensed detailed asset and five genuine screenshots, plus route-follow mobile and desktop views. Owner approval pending until user judges appearance.

## Global camera and interaction contract

| Mode | World data | Camera focus | What fails |
|---|---|---|---|
| Free | MapLibre geospatial | User-controlled | Fake image plane, broken map interaction |
| Overview | Same map state | Regional geographic context | Mid-`flyTo` assertion, omitted attribution |
| Follow | Route-derived 3D local corridor | Front/side 3/4 truck on a REAL curve | Generic 200m straight road, fake vehicle bbox |
| Chase | Same route-derived corridor | Behind/above truck and real road tangent | Road shape static while map position changes |
| Mobile Follow | Exact same GLB and route state | Subject above collapsed/expanded sheet | Different model class, sheet covers truck |

## Geometry and occlusion metrics

- Bounding box from actual world-space mesh and camera projection with clipping and canvas rectangle offsets. Handle behind-camera corners and near-plane intersection; return unavailable when no visible geometry.
- `bboxWidth`, `bboxHeight`, `bboxLeft`, `bboxTop`, fraction visible, subject overlap area with inspector/callout, `frameId`, and selected `routeId` all logged.
- If model not loaded, return `available: false` and fail visual gate. **No fallback `width = viewport*0.16`.**
- For the road, measure the projected centerline vs route geometry after coordinate transform; distinguish mathematical accuracy from source road precision.

## Design quality review

- Check text truncation, font sizes on 390px viewport, density, cards, inconsistent badge use, stroke weight, purposeful spacing, legible labels, no repeated decorative separators, and real control behavior.
- Do not rearrange S01 or S02. Avoid gratuitous orange glow, excessive shine, stock textures or generic AI landing-page redesign.
- Evidence must be actual app screenshots plus before/after comparison, not the wireframes bundled here.
