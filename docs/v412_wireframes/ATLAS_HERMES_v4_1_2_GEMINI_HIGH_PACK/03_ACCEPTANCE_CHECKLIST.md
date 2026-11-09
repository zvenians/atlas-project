# ATLAS Hermes v4.1.2 — Acceptance Checklist

## Must pass before claiming visual repair

- [ ] PR #4 correct feature branch, latest HEAD fetched, local work preserved.
- [ ] Actual v4.1.1 Follow/Chase/mobile before-images compared with after-images.
- [ ] Actual live S03 GLB TRK-004 present and visibly identifiable; screenshot demonstrates it in **live map / synced tracking viewport**, not studio-only.
- [ ] Selected model's real-world dimensions are respected, with actual screen projected bbox recorded; no fake 100-meter trucks.
- [ ] Truck does not overlap callout/inspector or simulation controls, by geometric check **plus human screenshot review**.
- [ ] Near-road base image has source-verified usable native resolution; if not, legal and explicitly labeled dual-view fallback.
- [ ] Follow framing and Chase rear-of-truck behavior tested across turns at two virtual times, with real camera state.
- [ ] Operator manual control cancels tracking; Exit Follow/Chase works and is visible.
- [ ] Selection switches between TRK-004 and TRK-001 while keeping panel/route/toast IDs consistent.
- [ ] Mobile (390×844 and 360×800) has collapsible layers and sheet, touch-safe controls, no overflow, readable attribution.
- [ ] Simulation Pause/Resume/Step/Reset remains canonical; wheel distance consistent with simulated route progress.
- [ ] Demo telemetry clearly labeled synthetic; no fake 'observed' speed/FPS.
- [ ] Actual removed/disabled GLB or custom layer **causes a focused test to fail** in isolated test context.
- [ ] Screenshot hashes distinct, and screenshots visually reviewed; hashes are not interpreted as realism evidence.
- [ ] Unit, syntax, browser smoke, QA and 3D evidence test suites run locally.
- [ ] **Both remote GitHub Actions push and pull_request workflows green for final exact SHA.**
- [ ] Vercel Preview on exact SHA reviewed; PR remains Draft; production untouched.
- [ ] Reuse licensed model/map data; source and restrictions documented.
- [ ] Five vehicle-class photorealism remains explicitly **PENDING v4.2** unless actually solved and evidenced.

## Stop-the-line

Fail/Pending Visual Review if actual vehicle is tiny or obscured, ground is magnified blurry satellite, mobile sheet blocks the map, GLB appears only in studio, camera only changes zoom label, or remote CI is red. No aesthetic pass can be inferred from positive draw-call counts.

## Final acceptance matrix format

| Gate | Technical status | Visual status | Evidence path | Reviewer note |
|---|---|---|---|---|
| C0 Repo safety | ... | n/a | ... | ... |
| C1 Baseline diagnosis | ... | ... | ... | ... |
| C2 Live GLB map | ... | ... | ... | ... |
| C3 Camera tracking | ... | ... | ... | ... |
| C4 Mobile | ... | ... | ... | ... |
| C5 QA / telemetry | ... | ... | ... | ... |
| C6 GitHub CI + Preview | ... | ... | ... | ... |
