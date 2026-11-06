// ATLAS 3D Bootstrap Module
// Connects Three.js WebGL scenes to the canvas elements
// Copyright © 2026 Kevin Oloan Simatupang. All rights reserved.

import * as THREE from '../vendor/three.module.js';
import { initLanding3DScene, initOverview3DScene } from './scenes.js';
import { initLiveMap3D } from './map3d.js';

export function setup3DCanvases(controllersMap) {
  if (!controllersMap) return;
  window.THREE = THREE;

  const canvasLanding = document.getElementById('atlas-3d-canvas');
  if (canvasLanding) {
    const prev = controllersMap.get('atlas-3d-canvas');
    if (prev && typeof prev.stop === 'function') prev.stop();
    const c1 = initLanding3DScene(canvasLanding, THREE);
    if (c1) controllersMap.set('atlas-3d-canvas', c1);
  }

  const canvasOverview = document.getElementById('atlas-3d-canvas-mini');
  if (canvasOverview) {
    const prev = controllersMap.get('atlas-3d-canvas-mini');
    if (prev && typeof prev.stop === 'function') prev.stop();
    const c2 = initOverview3DScene(canvasOverview, THREE);
    if (c2) controllersMap.set('atlas-3d-canvas-mini', c2);
  }

  const canvasMap = document.getElementById('atlas-3d-canvas-full');
  if (canvasMap) {
    const prev = controllersMap.get('atlas-3d-canvas-full');
    if (prev && typeof prev.stop === 'function') prev.stop();
    const c3 = initLiveMap3D(canvasMap, THREE);
    if (c3) {
      controllersMap.set('atlas-3d-canvas-full', c3);
      window.__atlas3DSetCamMode = (m) => c3.setCameraMode?.(m);
      window.__atlas3DResetOrbit = () => c3.resetCamera?.();
    }
  }

  window.__atlas3DReady = true;
  if (window.__atlasCanvasLoops?.sync) {
    window.__atlasCanvasLoops.sync();
  }
}

if (typeof window !== 'undefined') {
  window.atlasSetup3DCanvases = setup3DCanvases;
  if (window.__atlasCanvasControllers) {
    setup3DCanvases(window.__atlasCanvasControllers);
  }
}
