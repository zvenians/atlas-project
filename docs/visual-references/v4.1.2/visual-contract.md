# ATLAS v4.1.2 — Visual Wireframe Contract

**Do not treat the schematic truck/roads in these drawings as final assets or actual geography.** This document is a layout + state contract for real map data, GLB vehicles, and an enterprise-grade operator UI.

## Locked UI direction

- Dark Enterprise Editorial, balanced density, copper for actions and teal for operational health. Not a sci-fi game UI.
- Desktop S03 is an operator workstation with a real geographically accurate map and one selected vehicle.
- Mobile S03 is map/task-first, with a collapsed selected-vehicle bottom sheet rather than a floating desktop inspector.
- Keep source provenance / simulated state visible. Never suggest demo telemetry is sourced from real vehicles.
- S01 and S02 wireframes exist for design continuity only; do **not** redesign those pages as part of this hotfix.

## WF-01 — Desktop Operator / Overview, 1440×900

**File:** `wireframes/01_S03_DESKTOP_OVERVIEW.svg`

- Nav 222–248px; top header 64px; toolbar y~77–128; map x~246–1070, y~141–794.
- Inspector x~1085–1413, aligned with map; default contextual info tied to selected vehicle; no ghost details for empty selection.
- Regional map features selected actual road route, 20 registered synthetic vehicles, optional verified building layer and legal attribution.
- Bottom 69px simulation strip with Play/Pause, Step, 1×/speed, scenario, reset, virtual WITA time.
- Free camera is operator default. No automatic close camera when a user merely opens the map.

## WF-02 — Desktop Follow, 1440×900

**File:** `wireframes/02_S03_DESKTOP_FOLLOW.svg`

- The vehicle must be the visible subject in the map viewport, not the subject of an independent screenshot elsewhere.
- Follow camera leads slightly along heading, showing enough road ahead and real geographic context.
- Selected GLB truck targets an approximate 180–260px visual width, if physically correct camera + map provider resolution supports it. Do not fake physical truck size.
- Overlay callout is **above** and does **not** intersect model bbox. Inspector remains docked and shows the same selected ID, route, speed and virtual ETA.
- Add optional contextual inset map only if the near-road custom-layer rendering cannot retain useful geographic context, with explicit `SIMULATED 3D VIEW` labeling if a representative local stage is used.

## WF-03 — Desktop Chase, 1440×900

**File:** `wireframes/03_S03_DESKTOP_CHASE.svg`

- Camera is physically behind and above truck, oriented along actual road heading. Truck stays recognizably in frame through corners.
- More road horizon / movement cues than Follow, but no blurry stretched satellite-plane backdrop.
- `Exit Chase` always accessible, and any manual pan/rotate cancels automatic camera lock.
- Source/attribution and simulation controls remain visible.

## WF-04 — Mobile selected vehicle collapsed, 390×844

**File:** `wireframes/04_S03_MOBILE_COLLAPSED.svg`

- Compact top app bar; one row of map/follow/chase/fit controls (accessible 44px minimum).
- Collapse layers controls behind a Layers action. No permanently floating left desktop list.
- The geographically valid map remains the dominant surface.
- Vehicle bottom sheet is compact (~90px) with status, selected ID, relevant speed/ETA; expand via tap or drag handle.
- Essential Play/Pause + 1× + virtual WITA time remain reachable at bottom.
- Attribution is visible above the sheet and safe area, not hidden behind toast or controls.

## WF-05 — Mobile tracking expanded, 390×844

**File:** `wireframes/05_S03_MOBILE_TRACKING.svg`

- Map remains visible in top portion, with the selected GLB truck in its safe area.
- Expanded bottom sheet max ~50–55% screen height with scrollable route, driver, ETA, speed, source, Follow/Chase actions.
- Exit follow or collapse button always visible. Touch targets ≥44×44px; no horizontal overflow.
- No persistent toast occludes footer or selected vehicle.

## WF-06/07 — S01 / S02 continuity

**Files:** `wireframes/06_S01_CONTINUITY_GUIDE.svg`, `wireframes/07_S02_CONTINUITY_GUIDE.svg`

- Preserve editorial hero landing, visitor demo, guided tour and executive overview KPI focus.
- Preserve separate S01/S02 use of their existing engine; avoid duplicating S03 heavy rendering work into unnecessary background renderers.
- These are **not** change requests to S01/S02 during v4.1.2.

## Spatial/no-occlusion constraints

| State | Vehicle safe region | Controls / overlays | Acceptance |
|---|---|---|---|
| Desktop Follow | Central map region left of inspector and below top toolbar | Floating badge may be above/side of bbox | Vehicle recognizable and unobstructed |
| Desktop Chase | Lower-middle third of map with enough road ahead | Camera controls at top, UI outside visual anchor | Perspective clearly behind heading |
| Mobile collapsed | Center of map above bottom sheet | No desktop inspector covering truck | Map usable on 390px |
| Mobile expanded | Upper map portion above sheet | Exit tracking always tappable | Truck remains visible, sheet scrolls |
| All | Provider attribution at non-overlapped edge | No false 60-FPS badge or fake satellite | Source clear |

## Adaptive/fallback states

1. **High detail supported:** real licensed GLB + authorized geographic map in correct physical coordinates.
2. **High zoom imagery too blurry:** reduced-zoom geographic map, or separate synchronized real-map inset + clearly labeled representative 3D close view; never mislabel as photorealistic Balikpapan capture.
3. **Limited device:** simplify optional graphics or show vector vehicle representation when selected 3D cannot be rendered, but keep actual tracked state and label the degradation.
4. **Tile failure:** show truthful map-unavailable state and accessible vehicle list; do not display fake imagery.
5. **No selected vehicle:** empty inspector or task hint; do not pretend TRK-004 is selected.
6. **Reduced motion:** no forced camera flyover; manual controls usable.

## Example text-only wireframe (portable when image context is unavailable)

```text
DESKTOP 1440×900 — S03 FOLLOW
┌──────── SIDEBAR ──────┬────────── TITLE / STATUS / LANGUAGE ────────────────┐
│ Overview              ├──── SEARCH / FILTER / LAYERS / 3D / FIT / TOUR ────┤
│ LIVE MAP ◀            │ ┌──────────── 3D LIVE MAP ────────────┬─ INSPECTOR ┤
│ Shipments             │ │ Free   [FOLLOW]    Chase   Overview  │ TRK-004   │
│ Dispatch              │ │                                     │ In Transit│
│ Fleet                 │ │    selected route / source context   │ Driver    │
│ Trips                 │ │                                     │ Route     │
│ Analytics             │ │        [ CALL-OUT CLEAR OF TRUCK ]  │ ETA       │
│ Replay                │ │                                     │ Source    │
│ Settings              │ │      <<< VISIBLE REAL GLB TRUCK >>>  │           │
│                       │ │            road ahead & context      │ Follow    │
│                       │ │   optional geo-context inset        │ Exit      │
│ SIMULATED / WITA      │ └──── LEGAL ATTRIBUTION ──────────────┴───────────┘
└───────────────────────┴──── PLAY / PAUSE / STEP / SPEED / VIRTUAL WITA ────┘

MOBILE 390×844 — COLLAPSED / EXPANDED
┌──── Back   Live Map                  Layers ────┐
│ Map     Follow      Chase        Fit           │
├──────────────── LIVE MAP ──────────────────────┤
│                                                │
│         SELECTED TRUCK, CLEAR SUBJECT         │
│                                                │
│                   MAP                         │
│           (attribution visible)               │
├───────────── VEHICLE BOTTOM SHEET ─────────────┤
│ TRK-004  • In transit  • 47 km/h • Expand      │
├──────── PAUSE / 1× / VIRTUAL WITA ─────────────┤
└────────────────────────────────────────────────┘
```

**Wireframe signoff is NOT product visual signoff.** The final browser screenshots must show actual assets/geography and pass human review.
