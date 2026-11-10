# ATLAS v4.2 — Route Geometry, Coordinate Systems and Asset Specification

## A. Core architecture

**Single source of truth**: canonical simulation tick → arc-length `s` → route sample `(longitude, latitude, elevation/ground, heading)` → `world/local` transforms → real/map vehicle → Follow/Chase model → minimap marker → telemetry and wheels. All consumers must share one sample, not different approximations.

### A1. Route data contract

Use a committed, permitted route record with immutable ID and source metadata:

```json
{
  "routeId": "demo-route-004",
  "geometry": {"type": "LineString", "coordinates": [[116.82,-1.22],[116.821,-1.221]]},
  "source": {"provider": "provider-name", "retrievedAt": "YYYY-MM-DD", "url": "source-url", "license": "exact-license", "attribution": "text", "isVerified": false},
  "quality": {"vehicleAccessVerified": false, "roadWidthMeters": null, "terrainVerified": false},
  "simulated": true
}
```

**JSON above is schematic**. It does **not** assert these sample coordinates are actual connected roads. Replace with real source record. Do not label a synthetic `LineString` as OSM-verified.

### A2. Arc-length and tangent

- Validate line segment lengths using geodesic distance in WGS84 (e.g. haversine for short segments; use robust geodesics for longer routes).
- Precompute cumulative segment distances `d[0] ... d[n]`.
- For target `s`, find bracketing segment and interpolate carefully. Avoid duplicate-coordinate and zero-length segments; normalize heading through ±180° transitions.
- Estimate tangent from samples around `s ± δ`, keeping δ in meters (e.g. 3–10m adapted to road geometry), not indexed points.
- Compute speed from `Δs / Δt_sim` with correct units and scenario behavior; Pause = 0 m/s, Stop = 0 m/s; ETA stays illustrative when schedule cannot be verified.
- Define resets, route loop transitions, multiple units and route switching as deterministic transformations.

### A3. Local metric frame

- Project the route window around selected truck with an explicit local tangent-space reference. For small road patches, a local ENU frame is appropriate; use verified conversion mathematics and proper origin/clamping.
- Align axes: document which local axis is East, North, Up and truck Forward. Avoid accidental negative-scale winding inversion.
- Arc-length interpolation occurs in metric space; world geometry is built from local window points, not canvas percentages.
- Do not use simplistic `111139` degree scales across long routes without accounting for projection or source bounds; cite exact transformation.
- Assert round-trip coordinate transform error with synthetic ground-truth test fixtures; source road accuracy is tested separately.

### A4. Extruded road ribbon

Input ordered local centerline vertices `p_i`. At each sample, calculate tangent `t_i`, lateral normal `n_i`, and left/right road boundaries `p_i ± n_i * width_i/2`. Generate indexed triangle mesh with UV coordinates based on traveled meters, consistent winding, vertex normals and physically plausible road material.

- Use adaptive sampling / miter or bevel joins for sharp turns; prevent overlapping quads and crack gaps.
- Lane markings follow the exact same sampled centerline and support dashed distances in meters.
- If width/lanes/barriers not sourced, treat as generic representative visual and label as such. Never claim fabricated guardrails/buildings are verified local infrastructure.
- Make route window longer than visible camera frustum; rebuild/scroll in real coordinates with segment-dependent curvature, not just a fixed road texture translation.
- Add actual vertical/elevation data only when permitted terrain/elevation is available; otherwise flat `z=0` with explicit limitation. Do not invent terrain elevation.

### A5. Integrated map state

MapLibre source/line overlay, selected vehicle 3D position and route-derived camera view must agree at each `s`. The inset may use MapLibre or local GeoJSON projected to SVG, but source remains identical. Every scene switches on the same selected vehicle ID.

### A6. Checkable scenarios

Store at least 5 source-derived sample windows after verifying they exist on available routing data:

1. Straight corridor.
2. Curved left bend.
3. Curved right bend.
4. Junction/intersection or a verified safe turn.
5. Near route end / route switch.

Log route ID, distance, heading and coordinates in each screenshot metadata. If the data contains no safe intersection, substitute another real geometry feature and disclose why.

## B. 3D asset qualification

### B1. Required model evidence

For the chosen heavy vehicle, record actual file checksum, creator, source URI, model-specific license text and redistribution rights. Attach material maps and bounding dimensions. Test final GLB through Three.js `GLTFLoader`, and check returned `gltf.scene` vs `getModelInfo` runtime values. Avoid hard-coded mesh counts.

### B2. Required shape and material quality

- **Cabin:** realistic silhouette, grill/bumper, windshield glazing, mirrors, door seams, steps, headlights.
- **Chassis:** meaningful wheelbase, axle count, mounting points, mudguards, underbody.
- **Tires:** geometry with tire shoulder/tread and correct orientation; wheel nodes identifiable for animation.
- **Body:** cargo-specific geometry (container, enclosed box, reefer refrigeration body, tanker tank, flatbed/lowboy deck).
- **Material:** physically plausible roughness/metalness response, consistent texture UVs, real shadows and ambient lighting. Use textures actually loaded at runtime, not claims in a registry.
- **Level-of-detail:** readable from 1m–50m in local tracking; optimized at regional map zoom.

No need to simulate full rigid-body suspension if project does not support it; do not claim it does. Prioritize visually credible proportion over triangle counts.

### B3. Candidate scoring rubric (100-point qualitative gate)

| Criterion | Points | Observable basis |
|---|---:|---|
| Cab geometry and vehicle silhouette | 20 | 3/4, side and rear close-ups |
| Tires/axle/chassis accuracy | 15 | Wheel/chassis close-up |
| Freight body/class authenticity | 15 | Correct physically plausible cargo configuration |
| Material and texture PBR fidelity | 20 | Maps loaded, studio daylight, roughness variation |
| Live-map and tracking integration | 15 | On-road screenshots across bends |
| Mobile visual consistency | 5 | Same GLB identity and materials |
| Performance at acceptable quality | 10 | Real render/frame-time measurements |

**Score is for candidate comparison, not an automated claim of photorealism.** Require all licensing/security gates regardless of score and owner visual signoff for final acceptance.

### B4. Fleet rollout plan

- Stage 1: one licensed hero in studio + live map + Follow/Chase + mobile.
- Stage 2: vehicle ID model registry; correct scale and wheels; 4 extra real classes when assets legally available.
- Stage 3: 20 unit scene resource sharing, LOD and FPS/performance validation.
- Stage 4: infrastructure/model near verified locations; keep source-truth labels.

If only one hero is available, do not call the entire fleet photorealistic.

## C. Model-camera transform proof

- Compute `worldMatrix` and `worldBox` from actual GLB group, not hard-coded dimensions.
- For live map, log geodetic anchor and converted Mercator pose, compare to mapped road.
- For local view, ensure distance to road and tire contact approximates ground contact; show shot where tire/road contact is visible.
- Heading from actual source route tangent. Apply model-specific forward-axis correction **once**, with measured tests at 0°, 90°, 180°, 270°. Avoid double quaternions.
- Compare vehicle location across camera modes and render view; no two independent simulated clones drifting apart.

## D. Operational scope and data security

The demo has 20 simulated units; do not imply live real fleet data or actual logistics operations. Names, drivers and jobs should be clearly simulation fixtures. Avoid company logos/marks without rights and personally identifying real drivers. Retain correct map attribution and avoid exposing secrets in the repo.
