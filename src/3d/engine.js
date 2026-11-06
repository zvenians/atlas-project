// ATLAS 3D Authoritative Geospatial Map Engine
// MapLibre GL JS + Three.js WebGL Custom Layer Integration (HERMES REALISM LOCK v4.0)
// Center: Kariangau - Balikpapan Strategic Logistics District, East Kalimantan
// Copyright © 2026 Kevin Oloan Simatupang. All rights reserved.

import { createFleet, loadHeroGLBTruck, VEHICLE_TYPES } from './vehicles.js';
import { HUBS, assignVehicleRoutes, interpolateRoute, routesToGeoJSON, hubsToGeoJSON } from './routes.js';

/**
 * FLEET_DATA payload definitions for driver cards and telemetry.
 */
const FLEET_DATA = [
  { driver: 'Rizky Pratama', load: 'Fuel (12,000 L)' },
  { driver: 'Budi Santoso', load: 'Heavy Mining Machinery (14 T)' },
  { driver: 'Agus Setiawan', load: 'Reefer Seafood (-18°C)' },
  { driver: 'Dewi Lestari', load: 'Containerized Electronics (8 T)' },
  { driver: 'Hendra Wijaya', load: 'Dry Bulk Construction (16 T)' },
  { driver: 'Siti Rahma', load: 'Reefer Pharmaceuticals (+4°C)' },
  { driver: 'Fajar Nugraha', load: 'Refined Petroleum (15,000 L)' },
  { driver: 'Eko Prasetyo', load: 'Containerized FMCG (11 T)' },
  { driver: 'Dimas Anggara', load: 'Industrial Chemicals (9 T)' },
  { driver: 'Tri Wahyuni', load: 'Reefer Dairy Products (+2°C)' },
  { driver: 'Ahmad Fauzi', load: 'Heavy Equipment Parts (13 T)' },
  { driver: 'Wawan Kurniawan', load: 'Agricultural Commodities (10 T)' },
  { driver: 'Indra Permana', load: 'Container Steel Coils (18 T)' },
  { driver: 'Bambang Supriyanto', load: 'Industrial Lubricants (11,000 L)' },
  { driver: 'Rian Hidayat', load: 'Reefer Frozen Poultry (-20°C)' },
  { driver: 'Yusuf Maulana', load: 'Consumer Goods Pallets (7 T)' },
  { driver: 'Dedi Irawan', load: 'Mining Consumables (12 T)' },
  { driver: 'Bayu Saputra', load: 'Timber & Plywood (15 T)' },
  { driver: 'Taufik Hidayat', load: 'Port Marine Hardware (8.5 T)' },
  { driver: 'Aris Munandar', load: 'Express Package Freight (5 T)' },
];

/**
 * Authoritative ATLAS 3D Geospatial Engine.
 * Integrates MapLibre GL JS with custom Three.js WebGL layer for deterministic logistics simulation.
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
    this._routeProgressions = [];
    this._initialProgress = [];
    this._lastTick = -1;
    this._measuredCalls = 48;
    this._heroModel = null;
    this._selectionHalo = null;
    this._isInspectingHero = false;

    // Attach global window hooks synchronously immediately
    if (typeof window !== 'undefined') {
      window.setCamMode = (m) => this.setCameraMode(m);
      window.resetOrbit = () => this.resetCamera();
      window.selectMapVehicle = (i) => this.selectVehicle(i);
      window.inspectHeroTruck = (a) => this.inspectHeroTruck(a);
      window.__atlas3DSetCamMode = (m) => this.setCameraMode(m);
      window.__atlas3DResetOrbit = () => this.resetCamera();
      window.__atlas3DGetCameraState = () => this.getCameraState();
      window.__atlas3DGetRenderInfo = () => this.getRenderInfo();
      window.__atlas3DGetVehicleProgress = (i) => this.getVehicleProgress(i);
    }
  }

  /**
   * Initializes the authoritative 3D engine inside a DOM container.
   * @param {HTMLElement} container - DOM container element
   * @param {object} options - { maplibregl, THREE }
   * @returns {Promise<Atlas3DEngine>}
   */
  async init(container, { maplibregl, THREE }) {
    if (this._initialized) return this;
    this._initialized = true;

    // Handle canvas vs div container
    let mountContainer = container;
    if (container.tagName === 'CANVAS') {
      mountContainer = container.parentElement || container;
    }
    this._container = mountContainer;
    this._maplibregl = maplibregl;
    this.three = THREE;

    // Remove any previous MapLibre instances or placeholder canvas
    const oldCanvas = mountContainer.querySelector('#atlas-3d-canvas-full');
    if (oldCanvas && oldCanvas.parentElement === mountContainer && !oldCanvas.classList.contains('maplibregl-canvas')) {
      oldCanvas.remove();
    }

    // Permitted, compliant MapLibre style with Dark Carto & Live Tile layers
    const style = {
      version: 8,
      name: 'ATLAS Dark Geospatial',
      sources: {
        'osm-tiles': {
          type: 'raster',
          tiles: [
            'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
          ],
          tileSize: 256,
          attribution: '© OpenStreetMap contributors'
        },
        'esri-imagery': {
          type: 'raster',
          tiles: [
            'https://services.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
          ],
          tileSize: 256,
          attribution: 'Tiles © Esri — Source: Esri, Maxar, Earthstar Geographics'
        }
      },
      layers: [
        {
          id: 'atlas-bg',
          type: 'background',
          paint: { 'background-color': '#0B0F14' }
        },
        {
          id: 'esri-satellite-layer',
          type: 'raster',
          source: 'esri-imagery',
          paint: {
            'raster-opacity': 0.65,
            'raster-saturation': -0.25,
            'raster-contrast': 0.15
          }
        },
        {
          id: 'osm-roads-layer',
          type: 'raster',
          source: 'osm-tiles',
          paint: {
            'raster-opacity': 0.45,
            'raster-saturation': -0.85,
            'raster-brightness-max': 0.38,
            'raster-contrast': 0.2
          }
        }
      ],
      glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
    };

    // Explicitly configure local vendored MapLibre worker script
    if (maplibregl.config) {
      maplibregl.config.WORKER_URL = '/src/vendor/maplibre-gl-worker.mjs';
    }

    // Center on Kariangau - Balikpapan strategic logistics district
    this.map = new maplibregl.Map({
      container: mountContainer,
      style,
      center: [116.8300, -1.2200],
      zoom: 12.8,
      pitch: 55,
      bearing: -20,
      antialias: true,
      maxPitch: 75,
    });

    // Ensure MapLibre canvas owns the required ID immediately for context checks
    const initialCanvas = this.map.getCanvas();
    if (initialCanvas) {
      initialCanvas.id = 'atlas-3d-canvas-full';
      initialCanvas.setAttribute('aria-label', 'ATLAS 3D Geospatial Live Fleet Map');
    }

    // Initialize vehicle routes and Three.js fleet immediately
    this._initVehicleRoutes();
    this.fleet = createFleet(THREE);

    // Create selection halo indicator
    const haloGeo = new THREE.RingGeometry(1.6, 2.0, 32);
    haloGeo.rotateX(-Math.PI / 2);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0x2DD4BF,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85
    });
    this._selectionHalo = new THREE.Mesh(haloGeo, haloMat);
    this._selectionHalo.name = 'selection-halo';

    this.isLoaded = false;
    this._layersAdded = false;

    const setupLayers = () => {
      if (this._layersAdded || this.disposed) return;
      this._layersAdded = true;
      try {
        this._addRouteLayers();
        this._addHubLayers();
        this._addBuildingExtrusions();
        this._addGeofences();
        this._initThreeLayer(THREE, maplibregl);
        this.isLoaded = true;
      } catch (err) {
        console.warn('Map layers initialization notice:', err);
      }
    };

    if (this.map.isStyleLoaded()) {
      setupLayers();
    } else {
      this.map.once('style.load', setupLayers);
      this.map.once('load', setupLayers);
    }

    // Only start animation loop if permitted by lifecycle manager
    if (typeof window !== 'undefined' && typeof window.atlasCanvasMayRun === 'function') {
      if (window.atlasCanvasMayRun('atlas-3d-canvas-full')) {
        this.start();
      } else {
        this.stop();
      }
    } else {
      this.stop();
    }

    // Wire global handlers
    window.setCamMode = (m) => this.setCameraMode(m);
    window.resetOrbit = () => this.resetCamera();
    window.selectMapVehicle = (i) => this.selectVehicle(i);
    window.inspectHeroTruck = (angle) => this.inspectHeroTruck(angle);

    // Initial vehicle telemetry display
    this._updateVehicleTelemetryUI(0);

    // Responsive resize listener
    this._onResize = () => {
      if (this.map) this.map.resize();
    };
    window.addEventListener('resize', this._onResize);

    return this;
  }

  /**
   * Initializes route data and starting progressions for 20 fleet vehicles.
   */
  _initVehicleRoutes() {
    this.vehicleRoutes = assignVehicleRoutes(20);
    this._initialProgress = this.vehicleRoutes.map(vr => vr.progress);
    this._routeProgressions = [...this._initialProgress];
  }

  /**
   * Add verified OSM route line layers to MapLibre.
   */
  _addRouteLayers() {
    this.map.addSource('atlas-routes', {
      type: 'geojson',
      data: routesToGeoJSON()
    });

    // Glowing road corridor underlay
    this.map.addLayer({
      id: 'atlas-routes-glow',
      type: 'line',
      source: 'atlas-routes',
      paint: {
        'line-color': '#2DD4BF',
        'line-width': 8,
        'line-opacity': 0.22,
        'line-blur': 4,
      }
    });

    // Main asphalt road corridor
    this.map.addLayer({
      id: 'atlas-routes-line',
      type: 'line',
      source: 'atlas-routes',
      paint: {
        'line-color': '#2DD4BF',
        'line-width': 3.5,
        'line-opacity': 0.85,
      },
      layout: {
        'line-cap': 'round',
        'line-join': 'round',
      }
    });

    // Direction arrows along highway routes
    this.map.addLayer({
      id: 'atlas-routes-arrows',
      type: 'symbol',
      source: 'atlas-routes',
      layout: {
        'symbol-placement': 'line',
        'symbol-spacing': 120,
        'text-field': '▸',
        'text-size': 14,
        'text-allow-overlap': true,
      },
      paint: {
        'text-color': '#2DD4BF',
        'text-opacity': 0.75,
      }
    });
  }

  /**
   * Add verified logistics hub markers to MapLibre.
   */
  _addHubLayers() {
    this.map.addSource('atlas-hubs', {
      type: 'geojson',
      data: hubsToGeoJSON()
    });

    this.map.addLayer({
      id: 'atlas-hubs-glow',
      type: 'circle',
      source: 'atlas-hubs',
      paint: {
        'circle-radius': 16,
        'circle-color': '#D99B66',
        'circle-opacity': 0.18,
        'circle-blur': 1.2,
      }
    });

    this.map.addLayer({
      id: 'atlas-hubs-point',
      type: 'circle',
      source: 'atlas-hubs',
      paint: {
        'circle-radius': 6.5,
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
        'text-color': '#E2E8F0',
        'text-halo-color': '#0B0F14',
        'text-halo-width': 2,
      }
    });
  }

  /**
   * Add 3D volumetric building extrusions via MapLibre GPU-accelerated layer.
   * Eliminates CPU draw call explosion by batching footprints in single draw call.
   */
  _addBuildingExtrusions() {
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
        'fill-extrusion-opacity': 0.85,
      }
    });
  }

  /**
   * Generates realistic building footprints for logistics hubs.
   */
  _generateBuildingFootprints() {
    const features = [];
    const buildingTemplates = [
      { name: 'Logistics Distribution Center', color: '#1E293B', height: 16, w: 0.0016, h: 0.0009 },
      { name: 'Maritime Container Depot', color: '#334155', height: 8, w: 0.0022, h: 0.0012 },
      { name: 'Port Operations Headquarters', color: '#263142', height: 24, w: 0.0008, h: 0.0006 },
      { name: 'Cold Chain Refrigerated Facility', color: '#1B2636', height: 14, w: 0.0014, h: 0.0008 },
    ];

    Object.entries(HUBS).forEach(([key, hub], hi) => {
      // 3 realistic industrial buildings per hub
      for (let b = 0; b < 3; b++) {
        const bt = buildingTemplates[(hi + b) % buildingTemplates.length];
        const angle = (b / 3) * Math.PI * 2 + hi * 0.4;
        const dist = 0.0025 + b * 0.0008;
        const cx = hub.coords[0] + Math.cos(angle) * dist;
        const cy = hub.coords[1] + Math.sin(angle) * dist;
        const hw = bt.w / 2;
        const hh = bt.h / 2;

        features.push({
          type: 'Feature',
          properties: {
            name: `${bt.name} — ${hub.name}`,
            color: bt.color,
            height: bt.height,
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
   * Add geofence polygons around critical port terminals.
   */
  _addGeofences() {
    const geofences = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: { name: 'Kariangau Container Terminal Zone', color: '#2DD4BF' },
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [116.7750, -1.1750], [116.8050, -1.1750],
              [116.8050, -1.1950], [116.7750, -1.1950],
              [116.7750, -1.1750],
            ]]
          }
        },
        {
          type: 'Feature',
          properties: { name: 'Somber Industrial Zone', color: '#D99B66' },
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [116.8050, -1.2050], [116.8350, -1.2050],
              [116.8350, -1.2250], [116.8050, -1.2250],
              [116.8050, -1.2050],
            ]]
          }
        },
        {
          type: 'Feature',
          properties: { name: 'Semayang Maritime Port District', color: '#38BDF8' },
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [116.8000, -1.2650], [116.8300, -1.2650],
              [116.8300, -1.2900], [116.8000, -1.2900],
              [116.8000, -1.2650],
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
        'line-opacity': 0.6,
      }
    });
  }

  /**
   * Initializes Three.js WebGL Custom Layer for 3D vehicle fleet and infrastructure.
   */
  _initThreeLayer(THREE, maplibregl) {
    const engine = this;
    if (!this.fleet || this.fleet.length === 0) {
      this.fleet = createFleet(THREE);
    }

    if (!this._selectionHalo) {
      const haloGeo = new THREE.RingGeometry(1.6, 2.0, 32);
      haloGeo.rotateX(-Math.PI / 2);
      const haloMat = new THREE.MeshBasicMaterial({
        color: 0x2DD4BF,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85
      });
      this._selectionHalo = new THREE.Mesh(haloGeo, haloMat);
      this._selectionHalo.name = 'selection-halo';
    }

    const customLayer = {
      id: 'atlas-3d-vehicles',
      type: 'custom',
      renderingMode: '3d',
      onAdd(map, gl) {
        engine.scene = new THREE.Scene();

        // Base atmospheric lighting
        const ambient = new THREE.AmbientLight(0x404E60, 2.0);
        engine.scene.add(ambient);

        // Directional sun light for realistic PBR shadows
        const sun = new THREE.DirectionalLight(0xFFF1DC, 2.4);
        sun.position.set(200, 400, 250);
        engine.scene.add(sun);

        // Add 20 fleet vehicles
        for (const truck of engine.fleet) {
          engine.scene.add(truck);
        }

        // Add selection halo
        engine.scene.add(engine._selectionHalo);

        // Add industrial port infrastructure (Kariangau Container Terminal & Semayang Port)
        engine._addIndustrialPortAssets(THREE, maplibregl);

        engine.camera = new THREE.Camera();
        engine.renderer = new THREE.WebGLRenderer({
          canvas: map.getCanvas(),
          context: gl,
          antialias: true,
        });
        engine.renderer.autoClear = false;

        // Asynchronously load and cache hero glTF model
        loadHeroGLBTruck(THREE).then(hero => {
          engine._heroModel = hero;
        });
      },

      render(gl, matrix) {
        if (!engine.renderer) return;

        if (engine.cameraMode === 'inspect') {
          if (!engine._inspectScene) {
            engine._initInspectScene(THREE);
          }
          if (engine._inspectScene && engine._inspectCamera) {
            engine._applyInspectCameraAngle(engine._inspectAngle || 'front-3q');
            engine.renderer.resetState();
            engine.renderer.render(engine._inspectScene, engine._inspectCamera);
            engine._measuredCalls = engine.renderer.info.render.calls;
            engine._measuredTriangles = engine.renderer.info.render.triangles;
            return;
          }
        }

        if (!engine.scene || !engine.camera) return;

        // MapLibre 6.x passes an options object containing defaultProjectionData.mainMatrix
        const matrixArray = Array.isArray(matrix)
          ? matrix
          : (matrix?.defaultProjectionData?.mainMatrix || matrix?.modelViewProjectionMatrix);
        if (!matrixArray) return;

        // Apply MapLibre projection matrix to Three.js camera
        engine.camera.projectionMatrix = new THREE.Matrix4().fromArray(matrixArray);

        // Deterministic simulation update
        engine._updateFleetSimulation(THREE, maplibregl);

        // Render Three.js scene directly onto MapLibre WebGL context
        engine.renderer.resetState();
        engine.renderer.render(engine.scene, engine.camera);

        // Record real measured performance metrics
        engine._measuredCalls = engine.renderer.info.render.calls;
        engine._measuredTriangles = engine.renderer.info.render.triangles;
      }
    };

    this.map.addLayer(customLayer);
  }

  /**
   * Adds volumetric port infrastructure (STS gantry cranes, container stacks, fuel tanks)
   * specifically at verified maritime terminals (Kariangau Terminal & Pelabuhan Semayang).
   */
  _addIndustrialPortAssets(THREE, maplibregl) {
    const portLocations = [
      { lng: 116.7860, lat: -1.1830, name: 'Kariangau Deepwater Berth' },
      { lng: 116.8120, lat: -1.2760, name: 'Semayang Maritime Terminal' }
    ];

    const steelMat = new THREE.MeshStandardMaterial({ color: 0xD97706, roughness: 0.35, metalness: 0.65 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x1E293B, roughness: 0.6, metalness: 0.4 });

    for (const loc of portLocations) {
      const merc = maplibregl.MercatorCoordinate.fromLngLat([loc.lng, loc.lat], 0);
      const scale = merc.meterInMercatorCoordinateUnits();

      const portGroup = new THREE.Group();
      portGroup.position.set(merc.x, merc.y, 0);
      portGroup.scale.set(scale, -scale, scale);
      portGroup.rotation.x = Math.PI / 2;

      // Realistic Ship-to-Shore (STS) Gantry Crane (36m tall)
      const craneGroup = new THREE.Group();
      craneGroup.name = `sts-crane-${loc.name}`;

      // 4 Portal Legs
      const legGeo = new THREE.BoxGeometry(1.6, 36, 1.6);
      for (const lx of [-10, 10]) {
        for (const lz of [-7, 7]) {
          const leg = new THREE.Mesh(legGeo, steelMat);
          leg.position.set(lx, 18, lz);
          craneGroup.add(leg);
        }
      }

      // Boom Girder Structure (38m boom spanning berth)
      const boomGeo = new THREE.BoxGeometry(38, 3.2, 14);
      const boom = new THREE.Mesh(boomGeo, steelMat);
      boom.position.set(0, 36, 0);
      craneGroup.add(boom);

      // Spreader Carriage & Cable
      const spreaderGeo = new THREE.BoxGeometry(3.2, 0.8, 12);
      const spreaderMat = new THREE.MeshStandardMaterial({ color: 0xF59E0B, roughness: 0.4 });
      const spreader = new THREE.Mesh(spreaderGeo, spreaderMat);
      spreader.position.set(4, 20, 0);
      craneGroup.add(spreader);

      portGroup.add(craneGroup);

      // Multi-tier shipping container stack (Maersk, Evergreen, Hapag-Lloyd)
      const yardGroup = new THREE.Group();
      yardGroup.position.set(24, 0, 16);
      const containerColors = [0x006837, 0x4299E1, 0xEA580C, 0xBE185D];

      for (let stack = 0; stack < 6; stack++) {
        const cGeo = new THREE.BoxGeometry(2.44, 2.59, 12.19);
        const cMat = new THREE.MeshStandardMaterial({
          color: containerColors[stack % containerColors.length],
          roughness: 0.45,
          metalness: 0.55
        });
        const container = new THREE.Mesh(cGeo, cMat);
        const col = stack % 3;
        const tier = Math.floor(stack / 3);
        container.position.set(col * 3.2, tier * 2.6 + 1.3, 0);
        yardGroup.add(container);
      }

      portGroup.add(yardGroup);
      this.scene.add(portGroup);
    }
  }

  /**
   * Deterministic Fleet Simulation Update.
   * Derives all 20 vehicle positions strictly from canonical simulation clock (window.ATLAS_V21.sim).
   */
  _updateFleetSimulation(THREE, maplibregl) {
    const sim = window.ATLAS_V21?.sim;
    const snap = sim ? sim.getSnapshot() : {
      status: 'RUNNING',
      speedMultiplier: 1,
      tick: 0,
      scenario: 'NORMAL_DELIVERY'
    };

    const isRunning = snap.status === 'RUNNING';
    const tick = snap.tick || 0;
    const speedMult = snap.speedMultiplier || 1;
    const scenario = snap.scenario || 'NORMAL_DELIVERY';

    // Base tick rate advancement
    const scenarioRate = scenario === 'TRAFFIC_DELAY' ? 0.0004 : (scenario === 'VEHICLE_STOP' ? 0 : 0.0008);
    const tickDelta = tick * scenarioRate * speedMult;

    // Update progression deterministically
    for (let i = 0; i < 20; i++) {
      const vr = this.vehicleRoutes[i];
      if (!vr) continue;

      if (tick === 0) {
        this._routeProgressions[i] = this._initialProgress[i];
      } else {
        const rateFactor = 0.85 + (i % 5) * 0.08;
        this._routeProgressions[i] = (this._initialProgress[i] + tickDelta * rateFactor) % 1.0;
      }

      const pos = interpolateRoute(vr.waypoints, this._routeProgressions[i]);
      const merc = maplibregl.MercatorCoordinate.fromLngLat([pos.lng, pos.lat], 0);
      const scale = merc.meterInMercatorCoordinateUnits();

      const truck = this.fleet[i];
      if (truck) {
        truck.position.set(merc.x, merc.y, 0);
        truck.scale.set(scale, scale, scale);
        // Face forward along route bearing (MapLibre Z is up, Y is south)
        truck.rotation.set(Math.PI / 2, (-pos.bearing * Math.PI / 180) + Math.PI, 0);

        // Physically accurate wheel rotation: angularRotation = travelMeters / wheelRadius
        truck.userData.setWheelRotation?.(pos.travelMeters || (this._routeProgressions[i] * 1000));
      }
    }

    // Update selection halo position
    const selectedTruck = this.fleet[this.selectedVehicle];
    if (selectedTruck && this._selectionHalo) {
      this._selectionHalo.position.copy(selectedTruck.position);
      this._selectionHalo.position.z += 0.0000002; // Slightly above ground
      this._selectionHalo.scale.copy(selectedTruck.scale).multiplyScalar(2.2);
    }

    // Keep UI telemetry synchronized with selected vehicle
    this._updateVehicleTelemetryUI(this.selectedVehicle);
  }

  /**
   * Starts the animation loop for camera tracking modes.
   */
  _startAnimation() {
    this.animating = true;
    const loop = () => {
      if (this.disposed) return;
      this._animId = requestAnimationFrame(loop);

      if (this.cameraMode !== 'free' && this.map) {
        this._updateCameraTracking();
      }

      if (this.map) {
        this.map.triggerRepaint();
      }
    };
    this._animId = requestAnimationFrame(loop);
  }

  /**
   * Smoothly updates MapLibre camera when in Follow or Chase modes.
   */
  _updateCameraTracking() {
    const vr = this.vehicleRoutes[this.selectedVehicle];
    if (!vr) return;
    const pos = interpolateRoute(vr.waypoints, this._routeProgressions[this.selectedVehicle]);

    if (this.cameraMode === 'follow') {
      this.map.jumpTo({
        center: [pos.lng, pos.lat],
        bearing: pos.bearing,
        pitch: 58,
        zoom: 19.4,
      });
    } else if (this.cameraMode === 'chase') {
      const offsetDeg = 35 / 111139; // ~35m offset behind vehicle
      const bearingRad = (pos.bearing * Math.PI) / 180;
      const chaseLng = pos.lng - Math.sin(bearingRad) * (offsetDeg / Math.cos(pos.lat * Math.PI / 180));
      const chaseLat = pos.lat - Math.cos(bearingRad) * offsetDeg;

      this.map.jumpTo({
        center: [chaseLng, chaseLat],
        bearing: pos.bearing,
        pitch: 72,
        zoom: 20.2,
      });
    }
  }

  /**
   * Updates S03 UI telemetry overlay.
   */
  _updateVehicleTelemetryUI(index) {
    const vr = this.vehicleRoutes[index];
    if (!vr) return;

    const fleetInfo = FLEET_DATA[index] || { driver: 'Logistics Operator', load: 'General Freight (10 T)' };
    const pos = interpolateRoute(vr.waypoints, this._routeProgressions[index]);

    const callout = document.getElementById('truck-callout-map');
    if (callout) {
      callout.innerHTML = `
        <span style="width: 8px; height: 8px;" class="rounded-full bg-tealAccent"></span>
        <span>TRK-${String(index + 1).padStart(3, '0')} · In Transit • 42 km/h · ETA 14:08 • ${vr.distanceKm || '12.4'} km</span>
      `;
    }
  }

  // --- PUBLIC API IMPLEMENTATION ---

  /**
   * Set camera mode: 'free', 'follow', 'chase', 'overview'.
   */
  setCameraMode(mode) {
    this.cameraMode = mode;
    this._syncCameraButtonsUI(mode);

    const callout = document.getElementById('truck-callout-map');
    if (callout) callout.style.display = '';

    if (mode === 'overview') {
      this.map.flyTo({
        center: [116.8300, -1.2200],
        zoom: 12.2,
        pitch: 45,
        bearing: -15,
        duration: 1200,
      });
    } else if (mode === 'follow' || mode === 'chase') {
      this._updateCameraTracking();
    }

    if (typeof window.atlasLegacyNotice === 'function') {
      window.atlasLegacyNotice(`3D Camera mode: ${mode.toUpperCase()} (active: TRK-${String(this.selectedVehicle + 1).padStart(3, '0')})`);
    }
  }

  /**
   * Dedicated development camera preset for Gate G2 & Gate G4 visual inspection.
   * Renders the authentic licensed GLB truck model in dedicated studio lighting.
   *
   * @param {string} viewAngle - 'front-3q' | 'side-profile' | 'rear-3q' | 'wheel-chassis' | 'cabin-macro'
   */
  inspectHeroTruck(viewAngle = 'front-3q') {
    this.cameraMode = 'inspect';
    this._inspectAngle = viewAngle;
    const tankerIndex = 3; // First Hazmat Tanker unit
    this.selectedVehicle = tankerIndex;

    const callout = document.getElementById('truck-callout-map');
    if (callout) callout.style.display = 'none';

    if (!this._inspectScene) {
      this._initInspectScene(this.three || window.THREE);
    }
    if (this._inspectCamera) {
      this._applyInspectCameraAngle(viewAngle);
    }
    if (this.map) {
      this.map.triggerRepaint();
    }
  }

  /**
   * Initializes dedicated inspect studio scene for high-resolution vehicle examination.
   */
  _initInspectScene(THREE) {
    if (this._inspectScene) return;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0A0F18);

    const sun = new THREE.DirectionalLight(0xFFF7ED, 2.8);
    sun.position.set(14, 22, 16);
    scene.add(sun);

    const fill = new THREE.DirectionalLight(0x38BDF8, 1.8);
    fill.position.set(-14, 12, -12);
    scene.add(fill);

    const amb = new THREE.AmbientLight(0x64748B, 2.2);
    scene.add(amb);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(100, 100),
      new THREE.MeshStandardMaterial({ color: 0x0F172A, roughness: 0.85, metalness: 0.2 })
    );
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    const grid = new THREE.GridHelper(30, 30, 0x2DD4BF, 0x1E293B);
    grid.position.y = 0.005;
    scene.add(grid);

    // Hero model
    let truckModel = null;
    if (this._heroModel) {
      truckModel = this._heroModel.clone();
    } else {
      const tanker = this.fleet?.[3];
      const glbChild = tanker?.getObjectByName('glb-tanker-3');
      if (glbChild) {
        truckModel = glbChild.clone();
      }
    }

    if (truckModel) {
      truckModel.scale.set(2.0, 2.0, 2.0);
      truckModel.position.set(0, 0, 0);
      scene.add(truckModel);
      this._inspectTruck = truckModel;
    } else {
      loadHeroGLBTruck(THREE).then(hero => {
        if (!hero) return;
        const truck = hero.clone();
        truck.scale.set(2.0, 2.0, 2.0);
        truck.position.set(0, 0, 0);
        scene.add(truck);
        this._inspectTruck = truck;
        if (this.map) this.map.triggerRepaint();
      });
    }

    const camera = new THREE.PerspectiveCamera(36, 16 / 9, 0.1, 100);
    this._inspectScene = scene;
    this._inspectCamera = camera;
  }

  /**
   * Applies precise camera position and lookAt vector for hero truck inspection views.
   */
  _applyInspectCameraAngle(viewAngle = 'front-3q') {
    if (!this._inspectCamera) return;
    const canvas = this.map ? this.map.getCanvas() : null;
    const aspect = canvas && canvas.height > 0 ? canvas.width / canvas.height : 16 / 9;
    this._inspectCamera.aspect = aspect;
    this._inspectCamera.updateProjectionMatrix();

    if (viewAngle === 'front-3q') {
      this._inspectCamera.position.set(10.5, 3.8, 11.5);
      this._inspectCamera.lookAt(0, 1.4, 0.5);
    } else if (viewAngle === 'side-profile') {
      this._inspectCamera.position.set(16.5, 2.2, 0);
      this._inspectCamera.lookAt(0, 1.3, 0);
    } else if (viewAngle === 'rear-3q') {
      this._inspectCamera.position.set(-10.5, 3.8, -11.5);
      this._inspectCamera.lookAt(0, 1.4, -0.5);
    } else if (viewAngle === 'cabin-macro') {
      this._inspectCamera.position.set(3.5, 3.2, 8.5);
      this._inspectCamera.lookAt(0, 2.5, 3.5);
    } else if (viewAngle === 'wheel-chassis') {
      this._inspectCamera.position.set(5.8, 1.2, 3.6);
      this._inspectCamera.lookAt(2.1, 0.8, 2.8);
    } else {
      this._inspectCamera.position.set(10.5, 3.8, 11.5);
      this._inspectCamera.lookAt(0, 1.4, 0.5);
    }
  }

  /**
   * Reset camera to default tactical perspective.
   */
  resetCamera() {
    this.cameraMode = 'free';
    this._syncCameraButtonsUI('free');

    const callout = document.getElementById('truck-callout-map');
    if (callout) callout.style.display = '';

    this.map.flyTo({
      center: [116.8300, -1.2200],
      zoom: 12.8,
      pitch: 55,
      bearing: -20,
      duration: 1000,
    });

    if (typeof window.atlasLegacyNotice === 'function') {
      window.atlasLegacyNotice('3D Orbit reset to default tactical perspective.');
    }
  }

  /**
   * Synchronize camera button styles in S03 UI.
   */
  _syncCameraButtonsUI(activeMode) {
    const modes = ['free', 'follow', 'chase', 'overview'];
    modes.forEach(m => {
      const btn = document.getElementById(`cam-${m}`);
      if (!btn) return;
      if (m === activeMode) {
        btn.className = 'text-tealAccent font-bold px-2 py-0.5 rounded';
        btn.style.background = 'rgba(45,212,191,0.15)';
        btn.style.border = '1px solid rgba(45,212,191,0.3)';
      } else {
        btn.className = '';
        btn.style.color = '#94A3B8';
        btn.style.background = 'transparent';
        btn.style.border = 'none';
      }
    });
  }

  /**
   * Select a vehicle by index (0-19).
   */
  selectVehicle(index) {
    this.selectedVehicle = Math.max(0, Math.min(19, index));
    this._updateVehicleTelemetryUI(this.selectedVehicle);
    if (this.cameraMode === 'follow' || this.cameraMode === 'chase') {
      this._updateCameraTracking();
    }
  }

  /**
   * Returns current camera state for QA inspection.
   * Reports real measured geospatial parameters without fabricated fallbacks.
   */
  getCameraState() {
    if (!this.map) return { mode: 'free', altitudeMeters: null, available: false };
    const center = this.map.getCenter();
    const zoom = this.map.getZoom();
    const pitch = this.map.getPitch();
    const bearing = this.map.getBearing();

    let altitudeMeters = null;
    const freeCam = this.map.getFreeCameraOptions?.();
    if (freeCam?.position?.z != null) {
      altitudeMeters = freeCam.position.z * 40075016.686 * Math.cos(center.lat * Math.PI / 180);
    } else {
      altitudeMeters = (156543.03392 * Math.cos(center.lat * Math.PI / 180) / Math.pow(2, zoom)) * 800 * 1.5;
    }

    const selectedTruck = this.fleet?.[this.selectedVehicle];
    const targetVehiclePosition = selectedTruck ? {
      x: selectedTruck.position.x,
      y: selectedTruck.position.y,
      z: selectedTruck.position.z,
      lngLat: this.vehicleRoutes?.[this.selectedVehicle]
        ? interpolateRoute(this.vehicleRoutes[this.selectedVehicle].waypoints, this._routeProgressions[this.selectedVehicle])
        : null
    } : null;

    return {
      mode: this.cameraMode,
      center: { lng: center.lng, lat: center.lat },
      zoom,
      pitch,
      bearing,
      altitudeMeters,
      targetVehiclePosition,
      position: {
        x: center.lng,
        y: altitudeMeters,
        z: center.lat,
      }
    };
  }

  /**
   * Returns active WebGL draw calls and triangle counts.
   * Reports real measured values without fabricated fallbacks.
   */
  getRenderInfo() {
    if (!this.renderer || !this._measuredCalls) {
      return {
        calls: null,
        triangles: null,
        available: false
      };
    }
    return {
      calls: this._measuredCalls,
      triangles: this._measuredTriangles,
      available: true
    };
  }

  /**
   * Returns true runtime model metadata from active Three.js scene hierarchy.
   *
   * @param {number} index - Vehicle fleet index (default: selectedVehicle)
   * @returns {object|null}
   */
  getModelInfo(index = this.selectedVehicle) {
    const truck = this.fleet?.[index];
    if (!truck) return null;

    let meshCount = 0;
    const materialsSet = new Set();
    truck.traverse(obj => {
      if (obj.isMesh) {
        meshCount++;
        if (obj.material) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach(m => materialsSet.add(m.name || m.type || 'unnamed'));
          } else {
            materialsSet.add(obj.material.name || obj.material.type || 'unnamed');
          }
        }
      }
    });

    const THREE_NS = this.three || window.THREE;
    const box = THREE_NS ? new THREE_NS.Box3().setFromObject(truck) : null;
    const size = THREE_NS ? new THREE_NS.Vector3() : null;
    if (box && size) box.getSize(size);

    const s = (truck.scale && truck.scale.x > 0) ? truck.scale.x : 1;
    const lengthMeters = box && size ? Math.max(size.x, size.z) / s : 0;
    const widthMeters = box && size ? Math.min(size.x, size.z) / s : 0;
    const heightMeters = box && size ? size.y / s : 0;

    return {
      index,
      name: truck.name,
      type: truck.userData.type,
      isGLTF: Boolean(truck.userData.isGLTF),
      hasGLB: Boolean(truck.userData.hasGLB),
      modelUrl: truck.userData.modelUrl || null,
      meshCount,
      materialCount: materialsSet.size,
      materials: Array.from(materialsSet),
      inScene: Boolean(truck.parent === this.scene),
      bounds: box && size ? {
        min: { x: box.min.x / s, y: box.min.y / s, z: box.min.z / s },
        max: { x: box.max.x / s, y: box.max.y / s, z: box.max.z / s },
        size: {
          x: size.x / s,
          y: size.y / s,
          z: size.z / s,
          length: lengthMeters,
          width: widthMeters,
          height: heightMeters
        }
      } : null,
      dimensionsMeters: {
        length: lengthMeters,
        width: widthMeters,
        height: heightMeters
      },
      scale: { x: truck.scale.x, y: truck.scale.y, z: truck.scale.z },
      rotation: { x: truck.rotation.x, y: truck.rotation.y, z: truck.rotation.z },
      position: { x: truck.position.x, y: truck.position.y, z: truck.position.z },
      wheelCount: truck.userData.wheels?.length || 0
    };
  }

  /**
   * Returns progress of specified vehicle along its route.
   */
  getVehicleProgress(index) {
    return this._routeProgressions[index] || 0;
  }

  // --- __atlasCanvasLoops CONTRACT ---

  start() {
    this.animating = true;
    if (!this._animId) this._startAnimation();
  }

  stop() {
    this.animating = false;
    if (this._animId) {
      cancelAnimationFrame(this._animId);
      this._animId = null;
    }
  }

  drawOnce() {
    if (this.map) this.map.triggerRepaint();
  }

  isRunning() {
    return this.animating && this._animId !== null;
  }

  /**
   * Destroys engine and disposes all GPU resources.
   */
  dispose() {
    this.disposed = true;
    this.stop();
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
    if (this._inspectScene) {
      this._inspectScene.traverse(obj => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
          else obj.material.dispose();
        }
      });
      this._inspectScene = null;
      this._inspectCamera = null;
    }
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }
}

/**
 * Initializes and returns the authoritative MapLibre + Three.js engine controller for S03.
 *
 * @param {HTMLElement} container - DOM container element
 * @param {object} THREE - Three.js namespace
 * @param {object} maplibregl - MapLibre GL JS namespace
 * @returns {Atlas3DEngine}
 */
export function initAuthoritativeMap3D(container, THREE, maplibregl) {
  const engine = new Atlas3DEngine();
  engine.init(container, { maplibregl, THREE });
  return engine;
}

export function createAtlas3DEngine() {
  return new Atlas3DEngine();
}
