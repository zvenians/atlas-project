# ATLAS Stage B P0 Stabilization — Preview Only

Base: main at 8d16b052f2c5abf634bccd2a85868508d4f95958
Branch: fix/atlas-p0-stabilization# ATLAS Stage B P0 Stabilization — Preview Only

Base: main at 8d16b052f2c5abf634bccd2a85868508d4f95958
Branch: fix/atlas-p0-stabilization

The existing S01 Landing, S02 Overview and S03 Live Map layouts have not been redesigned. Source fixes are intentionally limited to structural HTML, honest control disclosures, CSV parser hardening, Canvas animation lifecycle gating, and simulation bridge integration.

## Changes
- Consolidated concatenated documents into one HTML5 document while preserving all legacy operational sections, accessible using the explicit /#legacy URL for review.
- Restored simulation getSnapshot(), subscribe() contract; Play, Pause, Step, preset, speed and Reset produce consistent snapshots.
- Connected primary S03 simulation dock (`toggleSimPlay()`, `resetSim()`, `#sim-speed`) to the canonical `window.ATLAS_V21.sim` engine and added explicit prototype disclosures to `setCamMode()`, `resetOrbit()`, and unmigrated S02/S03 navigation actions (`B-P0-02`).
- Hardened `parseAndValidateShipmentsCsv` and `exportShipmentsCsv` in `src/core/shipments.js` for RFC-4180 quoted commas, multiline fields, escaped quotes, UTF-8 BOM, size/row limits (`MAX_CSV_CHARS`, `MAX_CSV_ROWS`), and stacked/whitespace formula injection (`B-P0-03`).
- Gated primary Canvas `requestAnimationFrame` loops (`atlas-3d-canvas`, `atlas-3d-canvas-mini`, `atlas-3d-canvas-full`), legacy `vclock` interval, and `#svg-map` SMIL animations by active view visibility, `prefers-reduced-motion`, and `pagehide` cleanup (`B-P0-04`).
- Scoped DOM camera operations to the legacy #svg-map rather than the first arbitrary SVG element.
- Replaced blocking fake-success alert() stubs with truthful status messages or browser-local actions. CSV upload UI, VRP and backend concurrency remain unavailable.
- Added npm run check, unit/structural tests and GitHub Actions quality gate.

## Known limitations
- Browser-local prototype only: no server-isolated sandbox, WebSocket, real GIS, genuine fleet telematics or real VRP backend.
- Primary S01–S03 responsive redesign (`G01`, `G02`) is held pending owner visual sign-off (`UI-GATE-01..03`).
- /#legacy is a preservation/migration view, not the final approved S04–S16 design.
- DO NOT MERGE to main or deploy production without owner approval.

## Test commands
npm run check
npm test
node tests/browser-smoke.mjs
node tests/qa-evidence.mjs

Copyright © 2026 Kevin Oloan Simatupang. All rights reserved.

The existing S01 Landing, S02 Overview and S03 Live Map layouts have not been redesigned. Source fixes are intentionally limited to structural HTML and the legacy simulation integration.

## Changes
- Consolidated concatenated documents into one HTML5 document while preserving all legacy operational sections, accessible using the explicit /#legacy URL for review.
- Restored simulation getSnapshot(), subscribe() contract; Play, Pause, Step, preset, speed and Reset produce consistent snapshots.
- Scoped DOM camera operations to the legacy #svg-map rather than the first arbitrary SVG element.
- Replaced blocking fake-success alert() stubs with truthful status messages or browser-local actions. CSV upload, VRP and backend concurrency remain unavailable.
- Added npm run check, unit/structural tests and GitHub Actions quality gate.

## Known limitations
- Browser-local prototype only: no server-isolated sandbox, WebSocket, real GIS, genuine fleet telematics or real VRP backend.
- /#legacy is a preservation/migration view, not the final approved S04–S16 design.
- Browser E2E, mobile device tests and true geographic 3D validation remain pending.
- DO NOT MERGE to main or deploy production without owner approval.

## Test commands
npm run check
npm test

Copyright © 2026 Kevin Oloan Simatupang. All rights reserved.
