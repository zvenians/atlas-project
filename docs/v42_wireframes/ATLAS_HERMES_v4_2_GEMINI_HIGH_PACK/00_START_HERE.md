# ATLAS Hermes v4.2 — Read Me First

**Package purpose:** Execute the next ATLAS realism improvement in **Google Antigravity / Gemini 3.8 High**, based on verified v4.1.2 shortcomings. **This is an implementation specification and wireframe contract, not a claim that v4.2 has already been implemented.**

## Git baseline verified on 9 November 2026

- Repository: `https://github.com/zvenians/atlas-project`
- Branch: `feat/atlas-true-3d-visual-upgrade`
- Draft PR: `https://github.com/zvenians/atlas-project/pull/4`
- Last verified HEAD: `1c8f9b19aa4a182f5e8eebcba1e64319d840069c`
- Base branch: `fix/atlas-p0-stabilization`
- GitHub Actions: latest Push and Pull Request successful at this reference.
- **Refresh HEAD before making changes.** The SHA above is a baseline, not permission to overwrite newer work.

## What to upload to Antigravity

Provide the entire ZIP, including wireframes and `reference_evidence/`. Then send the short entry message from `06_SEND_TO_ANTIGRAVITY.md`.

## Recommended reading order

1. `01_GEMINI_38_HIGH_MASTER_PROMPT.md` — authority, work order and release constraints.
2. `02_WIREFRAME_AND_CAMERA_CONTRACT.md` — visual compositions and interaction contract, referencing all SVG/PNG wireframes.
3. `03_ROUTE_AND_ASSET_SPEC.md` — technical geometry, geographic truth and glTF/PBR asset quality.
4. `04_QA_AND_RELEASE_GATES.md` — deterministic test and evidence criteria.
5. `05_SOURCES_AND_LICENSES.md` — source verification / copyright / map service constraints.
6. `wireframes/*.png` and `wireframes/*.svg` — the seven schematic diagrams. SVGs are editable specifications; truck drawings are placeholders, **not model files**.
7. `reference_evidence/BEFORE_v412_*.png` — existing CI screenshots proving starting point, not the desired end state.

## Non-negotiable distinction

- Real geographic route: WGS84/GeoJSON from a traceable authorized road dataset or routing service.
- Real 3D corridor: geometry constructed **from that same geographic route**, including visible curvature and changing headings.
- Real vehicle model: correctly loaded, licensed glTF/GLB with author/terms, not a schematic truck or box geometry.
- Real minimap: rendered/projection-derived from the same actual geographic data; if schematic fallback, label it explicitly.
- Real measurements: actual model and camera geometry, frame-time and render draw calls by view; never manufactured defaults.

## Stage scope

**v4.2 scope:** one certified geographic corridor and one certified realistic heavy vehicle first; then propagate to five classes / 20 vehicles only after each quality gate has passed. Preserve existing screens and responsive layouts. Continue using feature branch / Draft PR / preview. **No production merge/deploy until owner visual approval.**

## Troubleshooting

The AI must continue implementation through tests and actual browser inspection. It may declare a specific task BLOCKED if an asset license, provider access or mapping data truly cannot be obtained legally. In that case, report the source, exact limitation, and executable alternatives; never invent a passing result.
