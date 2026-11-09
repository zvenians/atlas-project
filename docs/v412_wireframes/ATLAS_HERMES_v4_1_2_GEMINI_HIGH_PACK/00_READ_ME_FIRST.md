# ATLAS — Hermes v4.1.2 | Antigravity handoff

**Purpose:** a focused visual-integrity implementation pack for Gemini 3.8 High in Google Antigravity.

## Use in this order

1. Open the **correct local ATLAS repository** and safely sync the existing feature branch.
2. Upload/attach **`01_GEMINI_38_HIGH_MASTER_PROMPT.md`**.
3. Attach **`02_WIREFRAME_CONTRACT.md`** and the PNG/SVG files under `wireframes/`.
4. Include `evidence_before/` so the model sees *actual failure screenshots* rather than accepting green CI as visual proof.
5. Send: **"Execute the attached Hermes v4.1.2 master prompt, treat the wireframe contract as a layout specification, use before-images as defects to eliminate, and verify the final browser renders against the acceptance gates. Keep PR #4 Draft; do not merge or deploy production."**

## Key files

- `01_GEMINI_38_HIGH_MASTER_PROMPT.md` — mandatory implementation instructions
- `02_WIREFRAME_CONTRACT.md` — precise layouts, sizing, safe regions, states
- `wireframes/*.svg` — **editable** screen diagrams; recommended source for developer inspection
- `wireframes/*.png` — easy-to-view corresponding examples
- `ATLAS_WIREFRAMES_CONTACT_SHEET.png` — preview index
- `evidence_before/*.png` — native Chromium screenshots from v4.1.1 CI (the known poor state)
- `03_ACCEPTANCE_CHECKLIST.md` — fail-closed test specification

## Essential distinction

Wireframes are *not rendered app screens* and show simplified schematic vehicles/roads solely to explain layout and composition. Do not reuse their toy-like shapes or geographic geometry as real assets. Actual output must come from verified licensed map tiles and properly integrated 3D models.

**Release governance:** `zvenians/atlas-project`, branch `feat/atlas-true-3d-visual-upgrade`, PR #4, no merge/production deployment.
