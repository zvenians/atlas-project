// ATLAS 3D Live Fleet Map — Authoritative Bridge
// Re-exports geoTo3D and delegates to the authoritative MapLibre + Three.js engine
// Copyright © 2026 Kevin Oloan Simatupang. All rights reserved.

import * as maplibreglModule from '../vendor/maplibre-gl.mjs';
import { initAuthoritativeMap3D, Atlas3DEngine } from './engine.js';

const maplibregl = maplibreglModule.default || maplibreglModule;

/**
 * Geographic projection helper to map [lng, lat] around Balikpapan to 3D scene coordinates.
 * Center is around [116.83, -1.22] (Somber / Balikpapan center).
 */
const CENTER_LNG = 116.83;
const CENTER_LAT = -1.22;
const SCALE_X = 1400; // units per degree longitude
const SCALE_Z = -1400; // units per degree latitude (inverted for North-up)

export function geoTo3D(lng, lat) {
  return {
    x: ((lng - CENTER_LNG) * SCALE_X) || 0,
    z: ((lat - CENTER_LAT) * SCALE_Z) || 0
  };
}

/**
 * Initializes the full 3D interactive Live Fleet Map for S03.
 * Delegates directly to the authoritative MapLibre GL JS + Three.js engine.
 *
 * @param {HTMLElement} canvas - Canvas or container element
 * @param {object} THREE - Three.js module
 * @returns {Atlas3DEngine}
 */
export function initLiveMap3D(canvas, THREE) {
  const container = canvas.parentElement || canvas;
  return initAuthoritativeMap3D(container, THREE, maplibregl);
}

export { Atlas3DEngine };
