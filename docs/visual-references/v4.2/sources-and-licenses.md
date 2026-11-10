# ATLAS v4.2 — Verified Technical Starting Points & Licensing Checklist

This document links to relevant authoritative public documentation. **Documentation availability does not imply any particular dataset, asset, API, image, tile service or brand may be downloaded, redistributed or deployed without its own terms review.** Verify each source at implementation time.

## MapLibre official sources

- Custom style layer interface: https://maplibre.org/maplibre-gl-js/docs/API/interfaces/CustomLayerInterface/
- Current custom layer render argument schema: https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/CustomRenderMethodInput/
- Custom style layer example: https://maplibre.org/maplibre-gl-js/docs/examples/add-a-custom-style-layer/
- 3D objects, model and terrain integration example: https://maplibre.org/maplibre-gl-js/docs/examples/add-3d-tiles-3d-objects-and-models-using-threejs/

MapLibre custom layers use a WebGL context and camera projection data; validate installed vendored version. Example may change across versions. Respect WebGL context events and proper resource lifecycle.

## OpenStreetMap policy

- Community raster tile usage: https://operations.osmfoundation.org/policies/tiles/
- OSM attribution and data licensing: https://www.openstreetmap.org/copyright

Important: OSM road **data** is distinct from OSMF community tile **server** access. Tiles are bandwidth-limited; bulk downloading/scraping/prefetch/offline packaging from `tile.openstreetmap.org` is prohibited. Avoid broad high-zoom headless tile sweeps in CI. Prefer deterministic local map fixtures and a permitted licensed tile provider for browser integration, especially under production traffic.

## Model sources — evaluate, do not assume rights

- Khronos glTF sample assets: https://github.com/KhronosGroup/glTF-Sample-Assets
- Khronos model browser with per-asset license: https://github.khronos.org/glTF-Assets/
- Sketchfab: https://sketchfab.com/
- CGTrader: https://www.cgtrader.com/
- Fab: https://www.fab.com/
- Poly Haven (material library): https://polyhaven.com/
- ambientCG (PBR textures): https://ambientcg.com/

**Do not label a model 'CC-BY' based only on a repo-wide assumption.** Open the exact model's attribution/license file and maker page; verify permitted modification, hosting, distribution, and credit. Marketplace previews are not licenses to download or redistribute. Do not purchase or subscribe without user authorization.

## Each source-register entry requires

| Field | Requirement |
|---|---|
| Asset/route/imagery ID | Stable unique ID and runtime file path |
| Exact provenance | Creator, original source URI, retrieval date |
| License | Exact asset-specific name and official URL |
| Usage rights | Commercial demo use, derivatives, redistribution, hosting, screenshot and attribution requirements |
| Evidence | Hash, screenshot, actual loaded runtime state |
| Restrictions | API keys/billing, daily requests, cache/storage, trademarks |
| Quality status | DOWNLOADED / LOADED / VISIBLE / VISUAL REVIEW PENDING / ACCEPTED |
| Geographic confidence | Verified vs representative/demo vs approximate |

## Esri imagery and other provider caution

The existing app uses Esri World Imagery tile endpoints. Verify the exact ArcGIS/Esri service terms for the user's intended usage and account status. No assertion that access to an unauthenticated tile endpoint implies unrestricted redistribution, caching, server-side proxying or production rights. Do not bundle Esri imagery JPEGs or archive map tiles without explicit authorization. Attribution is necessary but may not be sufficient.

## Sourcing objective

Keep project open-source-friendly and avoid paid dependencies where possible. If legally suitable realistic heavy-truck geometry is unavailable at zero cost, report a model-quality blocker clearly, continue independently executable geography improvements, and present a short candidate comparison for owner decision.
