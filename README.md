# ATLAS — Logistics Command Center

ATLAS is an interactive logistics-operations prototype focused on fleet movement, shipment activity, and geospatial monitoring. The interface combines a dark operations workspace with a 3D fleet map set around Kariangau and Balikpapan, East Kalimantan.

**[Live project](https://atlas-project-blond.vercel.app/)** · **[Source and issues](https://github.com/zvenians/atlas-project)**

## Product overview

| Area | Purpose |
| --- | --- |
| Landing | Introduces the logistics environment through a moving 3D scene |
| Overview | Summarizes operational activity alongside a compact visualization |
| Live 3D Map | Displays a simulated fleet, map layers, camera controls, routes, and a selected-vehicle inspector |
| Legacy workspace | Preserves earlier operations views at `/#legacy` |

ATLAS is a **portfolio demonstration**, not a production fleet-management platform. Vehicle positions, shipments, and operational metrics are simulated. The project does not claim access to live telematics, verified real-time logistics data, automated dispatch, or a production routing service.

## Rendering and data

The application uses Three.js for vehicle and scene rendering and MapLibre GL JS for the geographical map. Camera modes include overview, free, follow, and chase views. Route visualization draws on committed geographic corridor data, including OpenStreetMap-derived references; satellite imagery is delivered from an external tile provider and needs network access.

The project vendors its browser rendering libraries under `src/vendor/`. A sample GLB asset is stored under `models/`; upstream attribution and licensing are recorded in [the asset register](docs/v42/ASSET_REGISTER.md). Geographic imagery, routes, and source material remain subject to their respective provider terms.

## Repository structure

```text
index.html                Application shell, screens, and layout
src/3d/                   Fleet scenes, geospatial engine, camera and route logic
src/core/                 Simulation and shipment utilities
src/legacy-integration.js Earlier operations workspace integration
src/vendor/               Bundled browser rendering dependencies
models/                   Licensed 3D model assets
tests/                    Unit, static, browser, and visual checks
docs/                     Architecture, provenance, and wireframes
```

Technical references: [3D implementation](docs/TRUE_3D_UPGRADE.md), [geospatial provenance](docs/REALISM_SOURCE_REGISTER.md), [v4.2 findings](docs/v42/BASELINE.md), and [camera/layout studies](docs/visual-references/v4.2/camera-and-layout.md).

## Run locally

A modern browser and Node.js are sufficient for the static source and its built-in checks.

```bash
npm run check
npm test
python -m http.server 8000
```

Open `http://localhost:8000`. Do not open `index.html` directly from a `file://` URL: the map and model loaders rely on HTTP requests.

The browser screenshot suites under `tests/` require a configured Playwright/Chromium environment and are not part of the default Node test command.

## Verification and status

The repository includes automated syntax checks, simulation tests, and browser-oriented evidence scripts. The [historical validation report](docs/v42/VERIFIED_RESULTS.md) records the scope and dates of earlier tests. Passing checks for one commit does not establish identical rendering performance on every device.

The map and simulation remain a developing demonstration. Review mobile layouts, reduced-motion behavior, external map tiles, and rendering performance after relevant changes.

## Credits and reuse

Project by **Kevin Oloan Simatupang**. Copyright © 2026. All rights reserved, except third-party materials distributed under their own licenses. Mapping sources, data terms, and model attribution are recorded in the associated technical documentation.
