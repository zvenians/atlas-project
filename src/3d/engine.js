// ATLAS 3D Engine — MapLibre GL JS + Three.js integration
// Copyright © 2026 Kevin Oloan Simatupang. All rights reserved.

import { createFleet } from './vehicles.js';
import { HUBS, assignVehicleRoutes, interpolateRoute, routesToGeoJSON, hubsToGeoJSON } from './routes.js';

/**
 * ATLAS 3D Engine
 * Manages MapLibre GL map, Three.js custom layer, vehicle animation,
 * camera modes, and lifecycle.
 */
export class Atlas3DEngine {
  constructor() {
    this.map = null;
    this.three = null;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.fleet = [];
    this.vehicleRoutes = [];
    this.cameraMode = 'free';
    this.selectedVehicle = 0;
    this.animating = false;
    this.disposed = false;
    this.simSpeed = 1;
    this.simPaused = false;
    this._animId = null;
    this._container = null;
    this._maplibregl = null;
    this._onResize = null;
    this._initialized = false;
    this._vehicleMarkers = [];
    this._routeProgressions = [];
    this._lastTime = 0;
  }

  /**
   * Initialize the 3D engine into a DOM container.
   * @param {HTMLElement} container - DOM element to mount the map
   * @param {object} options - { maplibregl, THREE }
   */
  async init(container, { maplibregl, THREE }) {
    if (this._initialized) return;
    this._initialized = true;
    this._container = container;
    this._maplibregl = maplibregl;
    this.three = THREE;

    // Dark map style matching ATLAS enterprise theme
    const style = {
      version: 8,
      name: 'ATLAS Dark',
      sources: {
        'osm-tiles': {
          type: 'raster',
          tiles: [
            'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
          ],
          tileSize: 256,
          attribution: '© OpenStreetMap contributors'
        }
      },
      layers: [
        {
          id: 'osm-base',
          type: 'raster',
          source: 'osm-tiles',
          paint: {
            'raster-saturation': -0.85,
            'raster-brightness-max': 0.35,
            'raster-contrast': 0.2
          }
        }
      ],
      glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
    };

    // Center on Kariangau-Balikpapan logistics area
    this.map = new maplibregl.Map({
      container,
      style,
      center: [116.8300, -1.2200],
      zoom: 12.5,
      pitch: 55,
      bearing: -20,
      antialias: true,
      maxPitch: 75,
    });

    await new Promise(resolve => this.map.on('load', resolve));

    this._addRouteLayers();
    this._addHubLayers();
    this._addBuildingExtrusions();
    this._addGeofences();
    this._initThreeLayer(THREE, maplibregl);
    this._initVehicleRoutes();
    this._startAnimation();

    // Responsive resize
    this._onResize = () => this.map.resize();
    window.addEventListener('resize', this._onResize);
  }

  /**
   * Add route line layers to the map.
   */
  _addRouteLayers() {
    this.map.addSource('atlas-routes', {
      type: 'geojson',
      data: routesToGeoJSON()
    });

    // Route glow effect (wider background line)
    this.map.addLayer({
      id: 'atlas-routes-glow',
      type: 'line',
      source: 'atlas-routes',
      paint: {
        'line-color': '#2DD4BF',
        'line-width': 6,
        'line-opacity': 0.25,
        'line-blur': 4,
      }
    });

    // Main route line
    this.map.addLayer({
      id: 'atlas-routes-line',
      type: 'line',
      source: 'atlas-routes',
      paint: {
        'line-color': '#2DD4BF',
        'line-width': 3,
        'line-opacity': 0.8,
      },
      layout: {
        'line-cap': 'round',
        'line-join': 'round',
      }
    });

    // Route direction arrows
    this.map.addLayer({
      id: 'atlas-routes-arrows',
      type: 'symbol',
      source: 'atlas-routes',
      layout: {
        'symbol-placement': 'line',
        'symbol-spacing': 100,
        'text-field': '▸',
        'text-size': 16,
        'text-rotate': 0,
        'text-keep-upright': false,
        'text-allow-overlap': true,
      },
      paint: {
        'text-color': '#2DD4BF',
        'text-opacity': 0.6,
      }
    });
  }

  /**
   * Add hub markers as a symbol layer.
   */
  _addHubLayers() {
    this.map.addSource('atlas-hubs', {
      type: 'geojson',
      data: hubsToGeoJSON()
    });

    // Hub glow circles
    this.map.addLayer({
      id: 'atlas-hubs-glow',
      type: 'circle',
      source: 'atlas-hubs',
      paint: {
        'circle-radius': 14,
        'circle-color': '#D99B66',
        'circle-opacity': 0.15,
        'circle-blur': 1,
      }
    });

    // Hub point markers
    this.map.addLayer({
      id: 'atlas-hubs-point',
      type: 'circle',
      source: 'atlas-hubs',
      paint: {
        'circle-radius': 6,
        'circle-color': ['match', ['get', 'type'],
          'port', '#2DD4BF',
          'airport', '#38BDF8',
          'industrial', '#D99B66',
          '#D99B66'
        ],
        'circle-stroke-width': 2,
        'circle-stroke-color': '#0B0F14',
      }
    });

    // Hub labels
    this.map.addLayer({
      id: 'atlas-hubs-labels',
      type: 'symbol',
      source: 'atlas-hubs',
      layout: {
        'text-field': ['get', 'name'],
        'text-size': 11,
        'text-offset': [0, 1.8],
        'text-anchor': 'top',
        'text-font': ['Open Sans Regular'],
      },
      paint: {
        'text-color': '#D99B66',
        'text-halo-color': '#0B0F14',
        'text-halo-width': 2,
      }
    });
  }

  /**
   * Add 3D building extrusions to simulate port infrastructure.
   */
  _addBuildingExtrusions() {
    // Simulated building footprints around logistics hubs
    const buildings = {
      type: 'FeatureCollection',
      features: this._generateBuildingFootprints()
    };

    this.map.addSource('atlas-buildings', {
      type: 'geojson',
      data: buildings
    });

    this.map.addLayer({
      id: 'atlas-buildings-3d',
      type: 'fill-extrusion',
      source: 'atlas-buildings',
      paint: {
        'fill-extrusion-color': ['get', 'color'],
        'fill-extrusion-height': ['get', 'height'],
        'fill-extrusion-base': 0,
        'fill-extrusion-opacity': 0.75,
      }
    });
  }

  /**
   * Generate building footprints around hub locations.
   * These represent warehouses, container yards, cranes, and industrial buildings.
   */
  _generateBuildingFootprints() {
    const features = [];
    const buildingTypes = [
      { name: 'Warehouse', color: '#1E293B', height: 12, w: 0.0015, h: 0.0008 },
      { name: 'Container Yard', color: '#334155', height: 6, w: 0.0020, h: 0.0010 },
      { name: 'Crane Tower', color: '#D99B66', height: 35, w: 0.0003, h: 0.0003 },
      { name: 'Office Building', color: '#263142', height: 20, w: 0.0006, h: 0.0005 },
      { name: 'Fuel Depot', color: '#94A3B8', height: 8, w: 0.0008, h: 0.0008 },
    ];

    const hubEntries = Object.entries(HUBS);
    hubEntries.forEach(([key, hub], hi) => {
      // 4-6 buildings around each hub
      const count = 4 + (hi % 3);
      for (let b = 0; b < count; b++) {
        const bt = buildingTypes[(hi + b) % buildingTypes.length];
        const angle = (b / count) * Math.PI * 2 + hi * 0.5;
        const dist = 0.002 + (b * 0.0008);
        const cx = hub.coords[0] + Math.cos(angle) * dist;
        const cy = hub.coords[1] + Math.sin(angle) * dist;
        const hw = bt.w / 2;
        const hh = bt.h / 2;

        features.push({
          type: 'Feature',
          properties: {
            name: `${bt.name} — ${hub.name}`,
            color: bt.color,
            height: bt.height + (b * 2),
            hub: key,
          },
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [cx - hw, cy - hh],
              [cx + hw, cy - hh],
              [cx + hw, cy + hh],
              [cx - hw, cy + hh],
              [cx - hw, cy - hh],
            ]]
          }
        });
      }
    });

    return features;
  }

  /**
   * Add geofence polygons around key zones.
   */
  _addGeofences() {
    const geofences = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: { name: 'Kariangau Port Zone', color: '#2DD4BF' },
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [116.7480, -1.1780], [116.7680, -1.1780],
              [116.7680, -1.1920], [116.7480, -1.1920],
              [116.7480, -1.1780],
            ]]
          }
        },
        {
          type: 'Feature',
          properties: { name: 'Somber Industrial Zone', color: '#D99B66' },
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [116.8100, -1.1970], [116.8300, -1.1970],
              [116.8300, -1.2130], [116.8100, -1.2130],
              [116.8100, -1.1970],
            ]]
          }
        },
        {
          type: 'Feature',
          properties: { name: 'Sepinggan Airport Zone', color: '#38BDF8' },
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [116.8840, -1.2600], [116.9040, -1.2600],
              [116.9040, -1.2760], [116.8840, -1.2760],
              [116.8840, -1.2600],
            ]]
          }
        },
      ]
    };

    this.map.addSource('atlas-geofences', { type: 'geojson', data: geofences });
    this.map.addLayer({
      id: 'atlas-geofences-fill',
      type: 'fill',
      source: 'atlas-geofences',
      paint: {
        'fill-color': ['get', 'color'],
        'fill-opacity': 0.08,
      }
    });
    this.map.addLayer({
      id: 'atlas-geofences-border',
      type: 'line',
      source: 'atlas-geofences',
      paint: {
        'line-color': ['get', 'color'],
        'line-width': 2,
        'line-dasharray': [4, 4],
        'line-opacity': 0.5,
      }
    });
  }

  /**
   * Initialize Three.js custom layer for 3D vehicle rendering.
   */
  _initThreeLayer(THREE, maplibregl) {
    this.fleet = createFleet(THREE);
    const engine = this;

    const customLayer = {
      id: 'atlas-3d-vehicles',
      type: 'custom',
      renderingMode: '3d',
      onAdd(map, gl) {
        engine.scene = new THREE.Scene();

        // Ambient light for base illumination
        const ambient = new THREE.AmbientLight(0x404050, 1.5);
        engine.scene.add(ambient);

        // Directional light for shadows and depth
        const directional = new THREE.DirectionalLight(0xffeedd, 1.2);
        directional.position.set(100, 200, 150);
        engine.scene.add(directional);

        // Add fleet to scene
        for (const truck of engine.fleet) {
          engine.scene.add(truck);
        }

        engine.camera = new THREE.Camera();
        engine.renderer = new THREE.WebGLRenderer({
          canvas: map.getCanvas(),
          context: gl,
          antialias: true,
        });
        engine.renderer.autoClear = false;
      },

      render(gl, matrix) {
        if (!engine.scene || !engine.camera || !engine.renderer) return;

        // Update vehicle positions
        engine._updateVehiclePositions(THREE, maplibregl, matrix);

        // Render the Three.js scene
        engine.renderer.resetState();
        engine.renderer.render(engine.scene, engine.camera);
        engine.map.triggerRepaint();
      }
    };

    this.map.addLayer(customLayer);
  }

  /**
   * Initialize vehicle route assignments and progress state.
   */
  _initVehicleRoutes() {
    this.vehicleRoutes = assignVehicleRoutes(20);
    this._routeProgressions = this.vehicleRoutes.map(vr => vr.progress);
  }

  /**
   * Update vehicle mesh positions on each render frame.
   */
  _updateVehiclePositions(THREE, maplibregl, projMatrix) {
    if (this.simPaused) {
      // Still need to set camera matrix for rendering static positions
      this._setCameraMatrix(THREE, projMatrix);
      return;
    }

    const speedFactor = 0.00008 * this.simSpeed;

    for (let i = 0; i < 20; i++) {
      const vr = this.vehicleRoutes[i];
      this._routeProgressions[i] = (this._routeProgressions[i] + speedFactor * (0.8 + (i % 5) * 0.1)) % 1.0;

      const pos = interpolateRoute(vr.waypoints, this._routeProgressions[i]);
      const merc = maplibregl.MercatorCoordinate.fromLngLat([pos.lng, pos.lat], 0);
      const scale = merc.meterInMercatorCoordinateUnits();

      const truck = this.fleet[i];
      truck.position.set(merc.x, merc.y, 0);
      truck.scale.set(scale, -scale, scale);
      // Rotate truck to face heading direction
      truck.rotation.set(Math.PI / 2, 0, (-pos.bearing * Math.PI / 180) + Math.PI);
    }

    this._setCameraMatrix(THREE, projMatrix);
  }

  /**
   * Apply MapLibre's projection matrix to Three.js camera.
   */
  _setCameraMatrix(THREE, projMatrix) {
    const m = new THREE.Matrix4().fromArray(projMatrix);
    this.camera.projectionMatrix = m;
  }

  /**
   * Start the animation loop for camera tracking modes.
   */
  _startAnimation() {
    this.animating = true;
    this._lastTime = performance.now();
    const animate = (time) => {
      if (this.disposed) return;
      this._animId = requestAnimationFrame(animate);

      const dt = (time - this._lastTime) / 1000;
      this._lastTime = time;

      if (this.cameraMode !== 'free' && !this.simPaused) {
        this._updateCameraTracking(dt);
      }
    };
    this._animId = requestAnimationFrame(animate);
  }

  /**
   * Update camera position for Follow/Chase modes.
   */
  _updateCameraTracking(dt) {
    const vr = this.vehicleRoutes[this.selectedVehicle];
    if (!vr) return;
    const pos = interpolateRoute(vr.waypoints, this._routeProgressions[this.selectedVehicle]);

    if (this.cameraMode === 'follow') {
      this.map.easeTo({
        center: [pos.lng, pos.lat],
        bearing: pos.bearing,
        pitch: 55,
        zoom: 15,
        duration: 200,
        easing: t => t,
      });
    } else if (this.cameraMode === 'chase') {
      // Behind-vehicle camera
      const offsetDist = 0.003;
      const bearingRad = (pos.bearing * Math.PI) / 180;
      const chaseLng = pos.lng - Math.sin(bearingRad) * offsetDist;
      const chaseLat = pos.lat - Math.cos(bearingRad) * offsetDist;
      this.map.easeTo({
        center: [chaseLng, chaseLat],
        bearing: pos.bearing,
        pitch: 70,
        zoom: 16,
        duration: 200,
        easing: t => t,
      });
    }
  }

  // --- PUBLIC API ---

  /**
   * Set camera mode: 'free', 'follow', 'chase', 'overview'.
   */
  setCameraMode(mode) {
    this.cameraMode = mode;
    if (mode === 'overview') {
      this.map.flyTo({
        center: [116.8300, -1.2200],
        zoom: 12.5,
        pitch: 55,
        bearing: -20,
        duration: 1500,
      });
      this.cameraMode = 'free'; // After flying to overview, leave as free
    } else if (mode === 'free') {
      // Enable default interaction
    }
  }

  /**
   * Reset camera to default position.
   */
  resetCamera() {
    this.cameraMode = 'free';
    this.map.flyTo({
      center: [116.8300, -1.2200],
      zoom: 12.5,
      pitch: 55,
      bearing: -20,
      duration: 1200,
    });
  }

  /**
   * Select a vehicle by index (0-19) for Follow/Chase camera.
   */
  selectVehicle(index) {
    this.selectedVehicle = Math.max(0, Math.min(19, index));
  }

  /**
   * Set simulation speed multiplier.
   */
  setSpeed(multiplier) {
    this.simSpeed = multiplier;
  }

  /**
   * Pause/unpause simulation.
   */
  setPaused(paused) {
    this.simPaused = paused;
  }

  /**
   * Reset simulation (restart all vehicle positions).
   */
  reset() {
    this.vehicleRoutes = assignVehicleRoutes(20);
    this._routeProgressions = this.vehicleRoutes.map(vr => vr.progress);
    this.simPaused = false;
  }

  /**
   * Get current state of all vehicles for UI.
   */
  getVehicleStates() {
    return this.vehicleRoutes.map((vr, i) => {
      const pos = interpolateRoute(vr.waypoints, this._routeProgressions[i]);
      return {
        id: `TRK-${String(i + 1).padStart(3, '0')}`,
        index: i,
        from: vr.from,
        to: vr.to,
        lng: pos.lng,
        lat: pos.lat,
        bearing: pos.bearing,
        progress: this._routeProgressions[i],
      };
    });
  }

  /**
   * Resize the map (call after container size changes).
   */
  resize() {
    if (this.map) this.map.resize();
  }

  /**
   * Destroy the engine and clean up resources.
   */
  dispose() {
    this.disposed = true;
    this.animating = false;
    if (this._animId) cancelAnimationFrame(this._animId);
    if (this._onResize) window.removeEventListener('resize', this._onResize);
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer = null;
    }
    if (this.scene) {
      this.scene.traverse(obj => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
          else obj.material.dispose();
        }
      });
      this.scene = null;
    }
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }
}

/**
 * Create and export a singleton engine instance.
 */
export function createAtlas3DEngine() {
  return new Atlas3DEngine();
}
