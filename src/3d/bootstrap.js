// ATLAS 3D Bootstrap Module
// Connects Three.js WebGL scenes to the canvas elements
// Copyright © 2026 Kevin Oloan Simatupang. All rights reserved.

import * as THREE from '../vendor/three.module.js';
import * as maplibreglModule from '../vendor/maplibre-gl.mjs';
import { initLanding3DScene, initOverview3DScene } from './scenes.js';
import { initAuthoritativeMap3D } from './engine.js';

const maplibregl = maplibreglModule.default || maplibreglModule;

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

  const mapContainer = document.getElementById('atlas-map-container') ||
                       document.getElementById('atlas-3d-canvas-full')?.parentElement ||
                       document.getElementById('view-map');
  if (mapContainer) {
    const prev = controllersMap.get('atlas-3d-canvas-full');
    if (prev && typeof prev.stop === 'function') prev.stop();
    const c3 = initAuthoritativeMap3D(mapContainer, THREE, maplibregl);
    if (c3) {
      controllersMap.set('atlas-3d-canvas-full', c3);
      window.__atlas3DEngine = c3;
      window.setCamMode = (m) => c3.setCameraMode?.(m);
      window.resetOrbit = () => c3.resetCamera?.();
      window.selectMapVehicle = (i) => c3.selectVehicle?.(i);
      window.inspectHeroTruck = (a) => c3.inspectHeroTruck?.(a);
      window.__atlas3DSetCamMode = (m) => c3.setCameraMode?.(m);
      window.__atlas3DResetOrbit = () => c3.resetCamera?.();
      window.__atlas3DGetCameraState = () => c3.getCameraState?.();
      window.__atlas3DGetRenderInfo = () => c3.getRenderInfo?.();
      window.__atlas3DGetVehicleProgress = (i) => c3.getVehicleProgress?.(i);
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
