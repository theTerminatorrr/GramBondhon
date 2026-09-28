import L from 'leaflet';

export interface FarmLocation {
  id: string;
  name: string;
  division: string;
  district: string;
  upazila: string;
  category: string;
  lat: number;
  lng: number;
  latStr: string;
  lngStr: string;
  elevation: string;
  rtkStatus: string;
  status: 'on_track' | 'attention';
  statusLabel: string;
  progress: number;
  soilMoisture: number;
  fieldAmbient: number;
  leadProducer: string;
  floodRisk: string;
  floodRiskClass: 'risk-moderate' | 'risk-low' | 'risk-elevated';
  committedCapital: string;
  targetCapital: string;
  satellites: number;
  pillLabel: string;
  zoom: number;
  cropTypes: string;
}

export const ACTIVE_FARM_PLOTS: Record<string, FarmLocation> = {
  mymensingh: {
    id: 'mymensingh',
    name: 'Monsoon Boro Paddy Harvest',
    division: 'Mymensingh',
    district: 'Mymensingh',
    upazila: 'Kistopur Basin',
    category: 'Paddy & Grains • Mymensingh, Mymensingh Division',
    lat: 24.7471,
    lng: 90.4203,
    latStr: '24.747100° N',
    lngStr: '90.420300° E',
    elevation: '18.4m ASL',
    rtkStatus: 'RTK Fixed (1.8cm)',
    status: 'on_track',
    statusLabel: 'On Track',
    progress: 90,
    soilMoisture: 78,
    fieldAmbient: 28,
    leadProducer: 'Abdur Rashid',
    floodRisk: 'Moderate',
    floodRiskClass: 'risk-moderate',
    committedCapital: '৳ 405,000',
    targetCapital: '৳ 450,000',
    satellites: 28,
    pillLabel: 'Mymensingh (Paddy &)',
    zoom: 14,
    cropTypes: 'Boro Rice & High-Yield Grains'
  },
  bogura: {
    id: 'bogura',
    name: 'High-Density Poultry Bio-Secured Farm',
    division: 'Rajshahi',
    district: 'Bogura',
    upazila: 'Sherpur Agro Belt',
    category: 'Poultry & Eggs • Bogura, Rajshahi Division',
    lat: 24.8465,
    lng: 89.3772,
    latStr: '24.846500° N',
    lngStr: '89.377200° E',
    elevation: '22.1m ASL',
    rtkStatus: 'RTK Fixed (1.4cm)',
    status: 'on_track',
    statusLabel: 'On Track',
    progress: 65,
    soilMoisture: 62,
    fieldAmbient: 27,
    leadProducer: 'Tofazzal Hossain',
    floodRisk: 'Low',
    floodRiskClass: 'risk-low',
    committedCapital: '৳ 290,000',
    targetCapital: '৳ 350,000',
    satellites: 24,
    pillLabel: 'Bogura (Poultry)',
    zoom: 14,
    cropTypes: 'Free-Range Broiler & Organic Layer'
  },
  sylhet: {
    id: 'sylhet',
    name: 'Surma Basin Organic Aquaculture',
    division: 'Sylhet',
    district: 'Sylhet',
    upazila: 'Radhanagar Wetlands',
    category: 'Aquaculture & Fisheries • Sylhet, Sylhet Division',
    lat: 24.8949,
    lng: 91.8687,
    latStr: '24.894900° N',
    lngStr: '91.868700° E',
    elevation: '35.2m ASL',
    rtkStatus: 'RTK Fixed (2.1cm)',
    status: 'attention',
    statusLabel: 'Attention',
    progress: 78,
    soilMoisture: 86,
    fieldAmbient: 25,
    leadProducer: 'Kabir Ahmed',
    floodRisk: 'Elevated',
    floodRiskClass: 'risk-elevated',
    committedCapital: '৳ 320,000',
    targetCapital: '৳ 380,000',
    satellites: 22,
    pillLabel: 'Sylhet (Aquacul)',
    zoom: 14,
    cropTypes: 'Indigenous Fish Varieties & Lotus'
  },
  rajshahi: {
    id: 'rajshahi',
    name: 'Chalan Beel Cottage Silk & Mustard',
    division: 'Rajshahi',
    district: 'Godagari',
    upazila: 'Premtoli Basin',
    category: 'Cottage Craft & Mustard • Godagari, Rajshahi Division',
    lat: 24.4124,
    lng: 88.5832,
    latStr: '24.412400° N',
    lngStr: '88.583200° E',
    elevation: '21.6m ASL',
    rtkStatus: 'RTK Fixed (1.2cm)',
    status: 'on_track',
    statusLabel: 'On Track',
    progress: 82,
    soilMoisture: 68,
    fieldAmbient: 29,
    leadProducer: 'Mofizul Islam',
    floodRisk: 'Low',
    floodRiskClass: 'risk-low',
    committedCapital: '৳ 160,000',
    targetCapital: '৳ 200,000',
    satellites: 26,
    pillLabel: 'Rajshahi (Cottage)',
    zoom: 14,
    cropTypes: 'Golden Mustard & Mulberry Silk'
  },
  tangail: {
    id: 'tangail',
    name: 'Tangail Heritage Loom & Dairy Cooperative',
    division: 'Dhaka',
    district: 'Tangail',
    upazila: 'Delduar Green Belt',
    category: 'Cottage & Dairy • Delduar, Dhaka Division',
    lat: 24.2498,
    lng: 89.9167,
    latStr: '24.249800° N',
    lngStr: '89.916700° E',
    elevation: '16.8m ASL',
    rtkStatus: 'RTK Fixed (1.6cm)',
    status: 'on_track',
    statusLabel: 'On Track',
    progress: 70,
    soilMoisture: 72,
    fieldAmbient: 28,
    leadProducer: 'Nasima Begum',
    floodRisk: 'Moderate',
    floodRiskClass: 'risk-moderate',
    committedCapital: '৳ 210,000',
    targetCapital: '৳ 250,000',
    satellites: 25,
    pillLabel: 'Tangail (Cottage)',
    zoom: 14,
    cropTypes: 'Handloom Cotton & Dairy Herd'
  },
  chattogram: {
    id: 'chattogram',
    name: 'Karnafuli Brackish Shrimp Nursery',
    division: 'Chattogram',
    district: 'Sitakunda',
    upazila: 'Barabkunda Estuary',
    category: 'Fisheries & Nursery • Sitakunda, Chattogram Division',
    lat: 22.5621,
    lng: 91.8217,
    latStr: '22.562100° N',
    lngStr: '91.821700° E',
    elevation: '14.3m ASL',
    rtkStatus: 'RTK Fixed (1.9cm)',
    status: 'on_track',
    statusLabel: 'On Track',
    progress: 85,
    soilMoisture: 75,
    fieldAmbient: 30,
    leadProducer: 'Nurul Alam',
    floodRisk: 'Low',
    floodRiskClass: 'risk-low',
    committedCapital: '৳ 375,000',
    targetCapital: '৳ 420,000',
    satellites: 27,
    pillLabel: 'Chattogram (Fishery)',
    zoom: 14,
    cropTypes: 'Black Tiger Shrimp & Seaweed'
  },
  rangpur: {
    id: 'rangpur',
    name: 'Teesta Riverbed High-Yield Maize',
    division: 'Rangpur',
    district: 'Mithapukur',
    upazila: 'Ranipukur Field',
    category: 'Grains & Agro • Mithapukur, Rangpur Division',
    lat: 25.5823,
    lng: 89.2814,
    latStr: '25.582300° N',
    lngStr: '89.281400° E',
    elevation: '32.1m ASL',
    rtkStatus: 'RTK Fixed (1.5cm)',
    status: 'attention',
    statusLabel: 'Attention',
    progress: 55,
    soilMoisture: 64,
    fieldAmbient: 26,
    leadProducer: 'Rafiqul Islam',
    floodRisk: 'Moderate',
    floodRiskClass: 'risk-moderate',
    committedCapital: '৳ 180,000',
    targetCapital: '৳ 220,000',
    satellites: 23,
    pillLabel: 'Rangpur (Maize)',
    zoom: 14,
    cropTypes: 'Hybrid Corn & Riverbed Tubers'
  }
};

// Aliases for backward compatibility
export const ACTIVE_FARM_LOCATIONS = ACTIVE_FARM_PLOTS;

export type GoogleMapLayerType = 'roadmap' | 'satellite' | 'terrain';

export class GnssGoogleMapManager {
  private map: L.Map | null = null;
  private currentLayerType: GoogleMapLayerType = 'satellite';
  private currentTileLayer: L.TileLayer | null = null;
  private activePlotId: string = 'mymensingh';
  private statusFilter: 'all' | 'on_track' | 'attention' = 'all';
  public activeDivision: string = 'Mymensingh';
  private markers: Map<string, L.Marker> = new Map();
  private pinMarker: L.Marker | null = null;
  public rootMountId: string = 'gnss-navigation-mount';
  private mapContainerId: string = 'gnss-google-map-canvas';
  private toastCallback?: (msg: string) => void;
  public onInspectDeal?: (farm: FarmLocation) => void;

  // Google Maps tile endpoints
  private readonly GOOGLE_MAP_TILES = {
    roadmap: 'https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
    satellite: 'https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    terrain: 'https://mt{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}'
  };

  constructor(toastCallback?: (msg: string) => void) {
    this.toastCallback = toastCallback;
  }

  /**
   * Builds the complete GNSS Navigation UI matching user screenshot into the container
   */
  public mountNavigationUI(containerId: string): void {
    this.rootMountId = containerId;
    const container = document.getElementById(containerId);
    if (!container) return;

    const currentFarm = ACTIVE_FARM_PLOTS[this.activePlotId] || ACTIVE_FARM_PLOTS['mymensingh'];

    container.innerHTML = `
      <div class="gnss-header-row">
        <!-- Title & Live Badge -->
        <div class="gnss-title-group">
          <div class="gnss-radio-icon">
            <svg class="gnss-radio-pulse" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9"/>
              <path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5"/>
              <circle cx="12" cy="12" r="2"/>
              <path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5"/>
              <path d="M19.1 4.9C23 8.8 23 15.1 19.1 19.1"/>
            </svg>
          </div>
          <div>
            <div class="gnss-heading-title-wrap">
              <h2 class="gnss-main-title">Real GNSS Google Map Navigation</h2>
              <span class="gnss-live-badge">Live Google Maps</span>
            </div>
            <p class="gnss-subtitle">Real-time Google Maps satellite & roadmap navigation for agricultural cohorts across Bangladesh</p>
          </div>
        </div>

        <!-- Top Right Filter & Layer Switcher Controls -->
        <div class="gnss-top-controls">
          <button type="button" class="gnss-filter-pill ${this.statusFilter === 'all' ? 'active' : ''}" id="gnss-filter-all">
            All (7)
          </button>
          <button type="button" class="gnss-filter-pill ${this.statusFilter === 'on_track' ? 'active' : ''}" id="gnss-filter-on-track">
            <span style="color: #10B981;">●</span> On Track
          </button>
          <button type="button" class="gnss-filter-pill ${this.statusFilter === 'attention' ? 'active' : ''}" id="gnss-filter-attention">
            <span style="color: #F59E0B;">●</span> Attention
          </button>

          <div class="gnss-layer-group">
            <button type="button" class="gnss-layer-btn active" id="gnss-layer-sat">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
              Satellite
            </button>
            <button type="button" class="gnss-layer-btn" id="gnss-layer-road">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
              Roadmap
            </button>
          </div>

          <a href="https://www.google.com/maps?q=${currentFarm.lat},${currentFarm.lng}" target="_blank" rel="noopener" class="gnss-external-btn" id="gnss-btn-open-gmaps">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            Google Maps
          </a>
        </div>
      </div>

      <!-- Division Navigator Bar -->
      <div class="gnss-division-bar">
        <span class="gnss-nav-label">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.4"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
          Navigate Bangladesh:
        </span>
        <div class="gnss-div-pills">
          <button type="button" class="gnss-div-pill" data-div="All BD">All BD</button>
          <button type="button" class="gnss-div-pill" data-div="Dhaka">Dhaka</button>
          <button type="button" class="gnss-div-pill active" data-div="Mymensingh">Mymensingh</button>
          <button type="button" class="gnss-div-pill" data-div="Rajshahi">Rajshahi</button>
          <button type="button" class="gnss-div-pill" data-div="Sylhet">Sylhet</button>
          <button type="button" class="gnss-div-pill" data-div="Chattogram">Chattogram</button>
          <button type="button" class="gnss-div-pill" data-div="Khulna">Khulna</button>
          <button type="button" class="gnss-div-pill" data-div="Rangpur">Rangpur</button>
          <button type="button" class="gnss-div-pill" data-div="Barishal">Barishal</button>
        </div>
      </div>

      <!-- Main Two-Column Viewport -->
      <div class="gnss-viewport-grid">
        <!-- Left: Map Container with Floating HUD and Bottom Plot Bar -->
        <div class="gnss-map-wrapper">
          <div id="${this.mapContainerId}" class="gnss-map-canvas"></div>

          <!-- Top-Left Live HUD Capsule -->
          <div class="gnss-hud-pill">
            <div class="gnss-hud-coords-row">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>
              <span id="gnss-hud-latlng">${currentFarm.lat.toFixed(4)}° N, ${currentFarm.lng.toFixed(4)}° E • Zoom: ${currentFarm.zoom}x</span>
            </div>
            <div class="gnss-hud-rtk-row">
              <span>RTK FIXED ±1.8cm • ${currentFarm.satellites} Satellites (GPS/BDS/GLO)</span>
            </div>
          </div>

          <!-- Floating Map Controls (Top-Right) -->
          <div class="gnss-map-controls-floating">
            <button type="button" class="gnss-map-ctrl-btn" id="gnss-ctrl-zoom-in" title="Zoom in">+</button>
            <button type="button" class="gnss-map-ctrl-btn" id="gnss-ctrl-zoom-out" title="Zoom out">−</button>
            <button type="button" class="gnss-map-ctrl-btn" id="gnss-ctrl-recenter" title="Re-center Plot">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
            </button>
          </div>

          <!-- Floating Bottom Overlay: SELECT FARM PLOT -->
          <div class="gnss-bottom-plot-bar">
            <span class="gnss-plot-bar-label">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polygon points="12 2 15 8 22 9 17 14 18 21 12 17 6 21 7 14 2 9 9 8 12 2"/></svg>
              SELECT FARM PLOT:
            </span>
            <div class="gnss-plot-pills-scroll" id="gnss-plot-pills-container">
              ${this.renderPlotPillsHtml()}
            </div>
          </div>
        </div>

        <!-- Right: FARM GNSS TELEMETRY Panel -->
        <div class="gnss-telemetry-panel" id="gnss-telemetry-panel">
          ${this.renderTelemetryPanelHtml(currentFarm)}
        </div>
      </div>
    `;

    // Initialize Leaflet Google Map on the map canvas
    this.initMap(this.mapContainerId);

    // Bind event handlers
    this.bindEvents();
  }

  /**
   * Initializes the Leaflet map with Google Satellite or Roadmap tiles
   */
  private initMap(canvasId: string): void {
    const el = document.getElementById(canvasId);
    if (!el) return;

    if (this.map) {
      this.map.remove();
      this.map = null;
    }

    const farm = ACTIVE_FARM_PLOTS[this.activePlotId] || ACTIVE_FARM_PLOTS['mymensingh'];

    this.map = L.map(canvasId, {
      center: [farm.lat, farm.lng],
      zoom: farm.zoom,
      zoomControl: false,
      attributionControl: true
    });

    this.setMapLayer(this.currentLayerType);
    this.renderFarmMarker(farm);

    // Map move/zoom HUD updates
    this.map.on('moveend zoomend', () => {
      if (!this.map) return;
      const center = this.map.getCenter();
      const zoom = this.map.getZoom();
      const hudEl = document.getElementById('gnss-hud-latlng');
      if (hudEl) {
        hudEl.textContent = `${center.lat.toFixed(4)}° N, ${center.lng.toFixed(4)}° E • Zoom: ${zoom}x`;
      }
    });

    if (window.ResizeObserver) {
      const resizeObserver = new ResizeObserver(() => {
        this.map?.invalidateSize();
      });
      resizeObserver.observe(el);
    }

    [100, 300, 600, 1200].forEach(delay => {
      setTimeout(() => {
        this.map?.invalidateSize();
      }, delay);
    });
  }

  /**
   * Sets Google Maps layer (satellite or roadmap)
   */
  public setMapLayer(type: GoogleMapLayerType): void {
    if (!this.map) return;
    this.currentLayerType = type;

    if (this.currentTileLayer) {
      this.map.removeLayer(this.currentTileLayer);
    }

    const tileUrl = this.GOOGLE_MAP_TILES[type];
    const attribution = type === 'satellite'
      ? '&copy; <a href="https://www.google.com/maps" target="_blank" rel="noopener">Google Earth / Maps</a>'
      : type === 'terrain'
      ? '&copy; <a href="https://www.google.com/maps" target="_blank" rel="noopener">Google Terrain</a>'
      : '&copy; <a href="https://www.google.com/maps" target="_blank" rel="noopener">Google Maps</a>';

    this.currentTileLayer = L.tileLayer(tileUrl, {
      subdomains: ['0', '1', '2', '3'],
      maxZoom: 20,
      attribution: attribution
    }).addTo(this.map);

    // Update active button state
    const btnSat = document.getElementById('gnss-layer-sat') || document.getElementById('btn-map-sat');
    const btnRoad = document.getElementById('gnss-layer-road') || document.getElementById('btn-map-road');
    const btnTerrain = document.getElementById('btn-map-terrain');
    if (btnSat) btnSat.classList.toggle('active', type === 'satellite');
    if (btnRoad) btnRoad.classList.toggle('active', type === 'roadmap');
    if (btnTerrain) btnTerrain.classList.toggle('active', type === 'terrain');
  }

  /**
   * Renders the red glowing GNSS location pin on the map
   */
  private renderFarmMarker(farm: FarmLocation): void {
    if (!this.map) return;

    if (this.pinMarker) {
      this.map.removeLayer(this.pinMarker);
      this.pinMarker = null;
    }

    const pinIcon = L.divIcon({
      className: 'gnss-field-marker-container',
      html: `
        <div style="position:relative; display:flex; align-items:center; justify-content:center; width:40px; height:40px;">
          <div class="gnss-marker-pulse-ring"></div>
          <div class="gnss-field-marker-core">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.5">
              <path d="M12 2a8 8 0 0 0-8 8c0 5.4 7 11.5 7.4 11.9a1 1 0 0 0 1.2 0c.4-.4 7.4-6.5 7.4-11.9a8 8 0 0 0-8-8z"/>
              <circle cx="12" cy="10" r="2.5" fill="#FFFFFF"/>
            </svg>
          </div>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 36]
    });

    this.pinMarker = L.marker([farm.lat, farm.lng], { icon: pinIcon }).addTo(this.map);
  }

  /**
   * Generates HTML for bottom plot pills
   */
  private renderPlotPillsHtml(): string {
    const plots = Object.values(ACTIVE_FARM_PLOTS).filter(p => {
      if (this.statusFilter === 'on_track') return p.status === 'on_track';
      if (this.statusFilter === 'attention') return p.status === 'attention';
      return true;
    });

    return plots.map(farm => `
      <button type="button" class="gnss-plot-pill ${farm.id === this.activePlotId ? 'active' : ''}" data-farm-id="${farm.id}">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2a8 8 0 0 0-8 8c0 5.4 7 11.5 7.4 11.9a1 1 0 0 0 1.2 0c.4-.4 7.4-6.5 7.4-11.9a8 8 0 0 0-8-8z"/><circle cx="12" cy="10" r="2.5"/></svg>
        <span>${farm.pillLabel}</span>
      </button>
    `).join('');
  }

  /**
   * Generates HTML for the right-side Telemetry Panel
   */
  private renderTelemetryPanelHtml(farm: FarmLocation): string {
    const isAttention = farm.status === 'attention';

    return `
      <div>
        <!-- Top Status Bar -->
        <div class="gnss-telemetry-top">
          <span class="gnss-telemetry-badge-label">FARM GNSS TELEMETRY</span>
          <span class="gnss-status-badge ${isAttention ? 'attention' : 'on-track'}">
            <span style="font-size: 0.65rem;">●</span>
            ${farm.statusLabel}
          </span>
        </div>

        <!-- Plot Title & Category -->
        <h3 class="gnss-plot-title">${farm.name}</h3>
        <p class="gnss-plot-category">${farm.category}</p>

        <!-- GNSS Specs Box -->
        <div class="gnss-specs-box">
          <div class="gnss-spec-row">
            <span class="gnss-spec-key">GNSS LAT:</span>
            <span class="gnss-spec-val">${farm.latStr}</span>
          </div>
          <div class="gnss-spec-row">
            <span class="gnss-spec-key">GNSS LNG:</span>
            <span class="gnss-spec-val">${farm.lngStr}</span>
          </div>
          <div class="gnss-spec-row">
            <span class="gnss-spec-key">ELEVATION:</span>
            <span class="gnss-spec-val">${farm.elevation}</span>
          </div>
          <div class="gnss-spec-row">
            <span class="gnss-spec-key">RTK FIX:</span>
            <span class="gnss-spec-val rtk-highlight">${farm.rtkStatus}</span>
          </div>
        </div>

        <!-- Crop Cycle Progress -->
        <div class="gnss-progress-wrap">
          <div class="gnss-progress-label-row">
            <span class="gnss-progress-title">Crop Cycle Progress</span>
            <span class="gnss-progress-pct">${farm.progress}%</span>
          </div>
          <div class="gnss-progress-bar-track">
            <div class="gnss-progress-bar-fill" style="width: ${farm.progress}%;"></div>
          </div>
        </div>

        <!-- Two Side-by-Side Dual Metric Cards (Soil Moisture & Field Ambient) -->
        <div class="gnss-metrics-dual-grid">
          <div class="gnss-metric-box">
            <div class="gnss-metric-header soil">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
              </svg>
              <span>Soil Moisture</span>
            </div>
            <div class="gnss-metric-value">${farm.soilMoisture}%</div>
          </div>

          <div class="gnss-metric-box">
            <div class="gnss-metric-header ambient">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/>
              </svg>
              <span>Field Ambient</span>
            </div>
            <div class="gnss-metric-value">${farm.fieldAmbient}°C</div>
          </div>
        </div>

        <!-- Producer & Risk Row -->
        <div class="gnss-lead-risk-row">
          <div class="gnss-lead-producer">Lead Producer: <strong>${farm.leadProducer}</strong></div>
          <div class="gnss-flood-risk">Flood Risk: <span class="${farm.floodRiskClass}">${farm.floodRisk}</span></div>
        </div>
      </div>

      <!-- Bottom Action Row -->
      <div class="gnss-telemetry-bottom-action">
        <div class="gnss-capital-block">
          <span class="gnss-capital-label">Committed Capital</span>
          <span class="gnss-capital-amount">${farm.committedCapital} / ${farm.targetCapital}</span>
        </div>
        <button type="button" class="gnss-inspect-btn" id="gnss-btn-inspect-deal">
          <span>Inspect Deal</span>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>
        </button>
      </div>
    `;
  }

  /**
   * Selects an active farm plot, smoothly flies the map, updates HUD and sidebar
   */
  public selectPlot(farmId: string): void {
    const farm = ACTIVE_FARM_PLOTS[farmId];
    if (!farm) return;

    this.activePlotId = farmId;

    // Fly map smoothly
    if (this.map) {
      this.map.flyTo([farm.lat, farm.lng], farm.zoom, {
        animate: true,
        duration: 1.2
      });
      this.renderFarmMarker(farm);
    }

    // Update Live HUD
    const hudLatlng = document.getElementById('gnss-hud-latlng');
    if (hudLatlng) {
      hudLatlng.textContent = `${farm.lat.toFixed(4)}° N, ${farm.lng.toFixed(4)}° E • Zoom: ${farm.zoom}x`;
    }

    // Update External Google Maps link
    const gmapsLink = document.getElementById('gnss-btn-open-gmaps') as HTMLAnchorElement | null;
    if (gmapsLink) {
      gmapsLink.href = `https://www.google.com/maps?q=${farm.lat},${farm.lng}`;
    }

    // Update bottom plot pill active states
    const pills = document.querySelectorAll<HTMLButtonElement>('.gnss-plot-pill');
    pills.forEach(pill => {
      pill.classList.toggle('active', pill.dataset.farmId === farmId);
    });

    // Update Telemetry Panel
    const telemetryPanel = document.getElementById('gnss-telemetry-panel');
    if (telemetryPanel) {
      telemetryPanel.innerHTML = this.renderTelemetryPanelHtml(farm);
      this.bindInspectDealButton();
    }

    // Update division pill
    this.updateActiveDivisionPill(farm.division);

    if (this.toastCallback) {
      this.toastCallback(`📍 Navigated to ${farm.name} (${farm.division})`);
    }
  }

  /**
   * Binds UI events
   */
  private bindEvents(): void {
    // 1. Layer Switcher
    document.getElementById('gnss-layer-sat')?.addEventListener('click', () => {
      this.setMapLayer('satellite');
    });
    document.getElementById('gnss-layer-road')?.addEventListener('click', () => {
      this.setMapLayer('roadmap');
    });

    // 2. Status Filters
    document.getElementById('gnss-filter-all')?.addEventListener('click', () => {
      this.setStatusFilter('all');
    });
    document.getElementById('gnss-filter-on-track')?.addEventListener('click', () => {
      this.setStatusFilter('on_track');
    });
    document.getElementById('gnss-filter-attention')?.addEventListener('click', () => {
      this.setStatusFilter('attention');
    });

    // 3. Division Pills
    const divPills = document.querySelectorAll<HTMLButtonElement>('.gnss-div-pill');
    divPills.forEach(pill => {
      pill.addEventListener('click', () => {
        const divName = pill.dataset.div;
        if (!divName) return;

        divPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        this.activeDivision = divName;

        if (divName === 'All BD') {
          this.resetToAllBangladesh();
        } else {
          // Find first plot in this division or default
          const matching = Object.values(ACTIVE_FARM_PLOTS).find(f => f.division.toLowerCase() === divName.toLowerCase());
          if (matching) {
            this.selectPlot(matching.id);
          } else {
            // Pan to division center approximation if no direct plot
            const divCoords: Record<string, [number, number]> = {
              'Dhaka': [23.8103, 90.4125],
              'Mymensingh': [24.7471, 90.4203],
              'Rajshahi': [24.4124, 88.5832],
              'Sylhet': [24.8949, 91.8687],
              'Chattogram': [22.5621, 91.8217],
              'Khulna': [22.8456, 89.5403],
              'Rangpur': [25.5823, 89.2814],
              'Barishal': [22.7010, 90.3535]
            };
            const coord = divCoords[divName];
            if (coord && this.map) {
              this.map.flyTo(coord, 11, { animate: true, duration: 1.2 });
            }
          }
        }
      });
    });

    // 4. Bottom Plot Pills
    this.bindPlotPillClicks();

    // 5. Map Floating Controls
    document.getElementById('gnss-ctrl-zoom-in')?.addEventListener('click', () => {
      this.map?.zoomIn();
    });
    document.getElementById('gnss-ctrl-zoom-out')?.addEventListener('click', () => {
      this.map?.zoomOut();
    });
    document.getElementById('gnss-ctrl-recenter')?.addEventListener('click', () => {
      const farm = ACTIVE_FARM_PLOTS[this.activePlotId];
      if (farm && this.map) {
        this.map.flyTo([farm.lat, farm.lng], farm.zoom, { animate: true, duration: 1 });
      }
    });

    // 6. Inspect Deal Button
    this.bindInspectDealButton();
  }

  private bindPlotPillClicks(): void {
    const pills = document.querySelectorAll<HTMLButtonElement>('.gnss-plot-pill');
    pills.forEach(pill => {
      pill.addEventListener('click', () => {
        const id = pill.dataset.farmId;
        if (id) {
          this.selectPlot(id);
        }
      });
    });
  }

  private bindInspectDealButton(): void {
    const btn = document.getElementById('gnss-btn-inspect-deal');
    if (!btn) return;

    btn.addEventListener('click', () => {
      const farm = ACTIVE_FARM_PLOTS[this.activePlotId];
      if (this.onInspectDeal) {
        this.onInspectDeal(farm);
      } else {
        const projectsSection = document.getElementById('projects');
        if (projectsSection) {
          projectsSection.scrollIntoView({ behavior: 'smooth' });
        }
      }
      if (this.toastCallback) {
        this.toastCallback(`📋 Inspecting investment cohort for ${farm.name}`);
      }
    });
  }

  private setStatusFilter(filter: 'all' | 'on_track' | 'attention'): void {
    this.statusFilter = filter;

    const btnAll = document.getElementById('gnss-filter-all');
    const btnOnTrack = document.getElementById('gnss-filter-on-track');
    const btnAttention = document.getElementById('gnss-filter-attention');

    btnAll?.classList.toggle('active', filter === 'all');
    btnOnTrack?.classList.toggle('active', filter === 'on_track');
    btnAttention?.classList.toggle('active', filter === 'attention');

    const pillsContainer = document.getElementById('gnss-plot-pills-container');
    if (pillsContainer) {
      pillsContainer.innerHTML = this.renderPlotPillsHtml();
      this.bindPlotPillClicks();
    }
  }

  private updateActiveDivisionPill(divName: string): void {
    const divPills = document.querySelectorAll<HTMLButtonElement>('.gnss-div-pill');
    divPills.forEach(pill => {
      pill.classList.toggle('active', pill.dataset.div?.toLowerCase() === divName.toLowerCase());
    });
  }

  /**
   * Resets map view to show all of Bangladesh
   */
  public resetToAllBangladesh(): void {
    if (!this.map) return;
    const bounds = L.latLngBounds(
      Object.values(ACTIVE_FARM_PLOTS).map(f => [f.lat, f.lng])
    );
    this.map.fitBounds(bounds, { padding: [60, 60], animate: true, duration: 1.2 });
  }

  /**
   * Initializes or mounts into container
   */
  public init(containerId: string = 'dash-gnss-map-section'): void {
    const el = document.getElementById(containerId);
    if (!el) {
      if (document.getElementById('dash-gnss-map-section')) {
        this.mountNavigationUI('dash-gnss-map-section');
      }
      return;
    }

    if (
      containerId === 'dash-gnss-map-section' ||
      containerId === 'gnss-navigation-mount' ||
      el.classList.contains('dash-gnss-full-panel') ||
      el.classList.contains('gnss-section-wrapper')
    ) {
      this.mountNavigationUI(containerId);
    } else {
      this.mapContainerId = containerId;
      this.initMap(containerId);
    }
  }

  public flyToFarm(farmId: string): void {
    this.selectPlot(farmId);
  }

  public resetToAllFarms(): void {
    this.resetToAllBangladesh();
  }

  public trackRover(): void {
    this.selectPlot('rajshahi');
  }

  public locateUser(): void {
    if (!navigator.geolocation || !this.map) {
      alert('GNSS Geolocation is not available or supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (!this.map) return;
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        this.map.flyTo([lat, lng], 13, { duration: 1.5 });
      },
      (err) => {
        console.warn('Geolocation error:', err);
        this.resetToAllBangladesh();
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  public destroy(): void {
    if (this.map) {
      try {
        this.map.remove();
      } catch (e) {
        console.warn('Error removing map:', e);
      }
      this.map = null;
    }
    this.pinMarker = null;
    this.markers.clear();
  }
}

export const gnssMapManager = new GnssGoogleMapManager();
