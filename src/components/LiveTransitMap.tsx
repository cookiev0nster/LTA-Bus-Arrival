import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { BusStop, ActiveBusVehicle, BusServiceDetail } from '../types/bus';
import { BUS_SERVICES_CATALOG } from '../data/singaporeBusData';
import {
  Compass,
  Layers,
  MapPin,
  Crosshair,
  Maximize2,
  Navigation,
  Eye,
  EyeOff,
} from 'lucide-react';

interface LiveTransitMapProps {
  currentStop: BusStop;
  allStops: BusStop[];
  activeVehicles: ActiveBusVehicle[];
  highlightedServiceNo?: string;
  onSelectStop: (stop: BusStop) => void;
  onSelectService?: (serviceNo: string) => void;
}

export const LiveTransitMap: React.FC<LiveTransitMapProps> = ({
  currentStop,
  allStops,
  activeVehicles,
  highlightedServiceNo,
  onSelectStop,
  onSelectService,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const stopMarkersLayerRef = useRef<L.LayerGroup | null>(null);
  const vehicleMarkersLayerRef = useRef<L.LayerGroup | null>(null);
  const routePolylineLayerRef = useRef<L.LayerGroup | null>(null);

  const [showVehicles, setShowVehicles] = useState(true);
  const [mapTheme, setMapTheme] = useState<'dark' | 'light'>('dark');

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Center on current stop or Orchard Singapore
    const initialLat = currentStop.latitude;
    const initialLng = currentStop.longitude;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 15,
      zoomControl: false,
    });

    // Add sleek dark or light tiles
    const tileUrl =
      mapTheme === 'dark'
        ? 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
        : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

    const tileLayer = L.tileLayer(tileUrl, {
      attribution: '&copy; OpenStreetMap contributors, CartoDB',
      maxZoom: 19,
    }).addTo(map);

    // Zoom control in bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Layer groups for clean updates
    routePolylineLayerRef.current = L.layerGroup().addTo(map);
    stopMarkersLayerRef.current = L.layerGroup().addTo(map);
    vehicleMarkersLayerRef.current = L.layerGroup().addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update Tile Layer on Theme Change
  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        mapRef.current?.removeLayer(layer);
      }
    });

    const tileUrl =
      mapTheme === 'dark'
        ? 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
        : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

    L.tileLayer(tileUrl, {
      attribution: '&copy; OpenStreetMap contributors, CartoDB',
      maxZoom: 19,
    }).addTo(mapRef.current);
  }, [mapTheme]);

  // Update Stop Markers
  useEffect(() => {
    if (!mapRef.current || !stopMarkersLayerRef.current) return;
    stopMarkersLayerRef.current.clearLayers();

    allStops.forEach((stop) => {
      const isCurrent = stop.code === currentStop.code;

      const stopIconHtml = isCurrent
        ? `<div class="relative flex items-center justify-center">
            <div class="w-8 h-8 rounded-full bg-emerald-500 text-slate-950 font-bold flex items-center justify-center shadow-lg border-2 border-white ring-4 ring-emerald-500/40">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C18.1 6.8 17.2 6 16.2 6H7.8c-1 0-1.9.8-2.2 1.8L4.2 12.8c-.1.4-.2.8-.2 1.2 0 .4.1.8.2 1.2.3 1.1.8 2.8.8 2.8h3"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>
            </div>
            <div class="absolute -bottom-5 whitespace-nowrap bg-slate-900/90 text-white text-[10px] font-bold px-1.5 py-0.5 rounded border border-emerald-500/50 shadow">
              ${stop.code}
            </div>
          </div>`
        : `<div class="relative flex items-center justify-center group cursor-pointer">
            <div class="w-6 h-6 rounded-full bg-slate-800 text-slate-300 border border-slate-600 flex items-center justify-center shadow hover:bg-emerald-500 hover:text-slate-950 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>
            </div>
          </div>`;

      const customIcon = L.divIcon({
        html: stopIconHtml,
        className: 'custom-stop-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([stop.latitude, stop.longitude], { icon: customIcon });

      const popupContent = `
        <div class="p-1 text-slate-100">
          <div class="text-[10px] text-emerald-400 font-mono font-bold">Stop ${stop.code}</div>
          <div class="text-sm font-bold text-white mt-0.5">${stop.description}</div>
          <div class="text-xs text-slate-400 mb-2">${stop.roadName}</div>
          ${stop.mrtLines ? `<div class="text-[10px] text-slate-300 mb-2">MRT: ${stop.mrtLines.join(', ')}</div>` : ''}
          <button id="select-stop-${stop.code}" class="w-full py-1 text-center text-xs font-semibold rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors cursor-pointer">
            View Live Arrivals
          </button>
        </div>
      `;

      marker.bindPopup(popupContent);
      marker.on('popupopen', () => {
        const btn = document.getElementById(`select-stop-${stop.code}`);
        if (btn) {
          btn.onclick = () => {
            onSelectStop(stop);
            marker.closePopup();
          };
        }
      });

      stopMarkersLayerRef.current?.addLayer(marker);
    });
  }, [allStops, currentStop]);

  // Update Route Polyline if highlightedServiceNo is selected
  useEffect(() => {
    if (!mapRef.current || !routePolylineLayerRef.current) return;
    routePolylineLayerRef.current.clearLayers();

    if (!highlightedServiceNo) return;

    const service = BUS_SERVICES_CATALOG.find((s) => s.serviceNo === highlightedServiceNo);
    if (!service) return;

    const latlngs: [number, number][] = service.direction1Stops.map((s) => [s.lat, s.lng]);

    // Draw route background shadow line
    const shadowPolyline = L.polyline(latlngs, {
      color: '#064e3b',
      weight: 6,
      opacity: 0.6,
    });

    // Draw glowing route line
    const mainPolyline = L.polyline(latlngs, {
      color: '#10b981',
      weight: 3.5,
      opacity: 0.9,
      dashArray: '6, 6',
    });

    routePolylineLayerRef.current.addLayer(shadowPolyline);
    routePolylineLayerRef.current.addLayer(mainPolyline);

    // Pan map to fit route
    mapRef.current.fitBounds(mainPolyline.getBounds(), { padding: [40, 40] });
  }, [highlightedServiceNo]);

  // Update Moving Vehicle Markers
  useEffect(() => {
    if (!mapRef.current || !vehicleMarkersLayerRef.current) return;
    vehicleMarkersLayerRef.current.clearLayers();

    if (!showVehicles) return;

    activeVehicles.forEach((vehicle) => {
      // If service is highlighted, dim other services
      const isSelected = highlightedServiceNo === vehicle.serviceNo;
      if (highlightedServiceNo && !isSelected) return;

      const getCrowdColor = (load: string) => {
        switch (load) {
          case 'SEA':
            return '#10b981'; // emerald
          case 'SDA':
            return '#f59e0b'; // amber
          case 'LSD':
            return '#f43f5e'; // rose
          default:
            return '#10b981';
        }
      };

      const crowdColor = getCrowdColor(vehicle.load);

      const vehicleHtml = `
        <div class="relative flex items-center justify-center cursor-pointer group" style="transform: rotate(${vehicle.bearing}deg);">
          <div class="w-8 h-8 rounded-lg bg-slate-900 border-2 flex items-center justify-center shadow-xl transition-transform group-hover:scale-110" style="border-color: ${crowdColor};">
            <span class="text-[10px] font-black text-white font-mono" style="transform: rotate(-${vehicle.bearing}deg);">
              ${vehicle.serviceNo}
            </span>
          </div>
          <!-- Direction Arrow -->
          <div class="absolute -top-1 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[6px]" style="border-b-color: ${crowdColor};"></div>
        </div>
      `;

      const vehicleIcon = L.divIcon({
        html: vehicleHtml,
        className: 'custom-bus-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([vehicle.currentLat, vehicle.currentLng], { icon: vehicleIcon });

      const popup = `
        <div class="p-1 text-slate-100">
          <div class="flex items-center justify-between gap-3">
            <span class="text-base font-black text-emerald-400 font-mono">Bus ${vehicle.serviceNo}</span>
            <span class="text-[10px] px-1.5 py-0.5 rounded font-bold" style="background: ${crowdColor}22; color: ${crowdColor}; border: 1px solid ${crowdColor}66;">
              ${vehicle.load === 'SEA' ? 'Seats Avail' : vehicle.load === 'SDA' ? 'Standing' : 'Crowded'}
            </span>
          </div>
          <div class="text-xs text-slate-300 mt-1">To: ${vehicle.destinationName}</div>
          <div class="text-[11px] text-slate-400 mt-1">
            Approaching: <span class="text-white font-medium">${vehicle.nextStopName}</span>
          </div>
          <div class="text-[10px] text-slate-400 font-mono mt-1">
            Speed: ${vehicle.speedKmH} km/h · Heading: ${vehicle.bearing}°
          </div>
        </div>
      `;

      marker.bindPopup(popup);
      vehicleMarkersLayerRef.current?.addLayer(marker);
    });
  }, [activeVehicles, showVehicles, highlightedServiceNo]);

  // Center on current stop
  const handleRecenter = () => {
    if (!mapRef.current) return;
    mapRef.current.setView([currentStop.latitude, currentStop.longitude], 16, {
      animate: true,
    });
  };

  // View entire Singapore overview
  const handleFitSingapore = () => {
    if (!mapRef.current) return;
    mapRef.current.setView([1.3521, 103.8198], 12, { animate: true });
  };

  return (
    <div className="relative w-full h-full min-h-[440px] rounded-2xl overflow-hidden border border-slate-800 shadow-xl bg-slate-950">
      {/* Map Element */}
      <div ref={mapContainerRef} className="w-full h-full min-h-[440px] z-10" />

      {/* Floating Toolbar Controls */}
      <div className="absolute top-3 left-3 z-20 flex flex-wrap items-center gap-2">
        <button
          onClick={handleRecenter}
          className="px-3 py-1.5 bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 rounded-lg text-xs font-medium backdrop-blur-md shadow-md flex items-center gap-1.5 transition-colors cursor-pointer active:scale-95"
          title="Center on selected bus stop"
        >
          <Crosshair className="w-3.5 h-3.5 text-emerald-400" />
          <span>Stop {currentStop.code}</span>
        </button>

        <button
          onClick={handleFitSingapore}
          className="px-3 py-1.5 bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 rounded-lg text-xs font-medium backdrop-blur-md shadow-md flex items-center gap-1.5 transition-colors cursor-pointer active:scale-95"
          title="Zoom out to whole Singapore"
        >
          <Maximize2 className="w-3.5 h-3.5 text-slate-400" />
          <span>Singapore</span>
        </button>

        <button
          onClick={() => setShowVehicles(!showVehicles)}
          className={`px-3 py-1.5 border rounded-lg text-xs font-medium backdrop-blur-md shadow-md flex items-center gap-1.5 transition-colors cursor-pointer active:scale-95 ${
            showVehicles
              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
              : 'bg-slate-900/90 border-slate-700/80 text-slate-400'
          }`}
          title="Toggle live moving bus icons"
        >
          {showVehicles ? (
            <>
              <Eye className="w-3.5 h-3.5" />
              <span>Live Fleet ({activeVehicles.length})</span>
            </>
          ) : (
            <>
              <EyeOff className="w-3.5 h-3.5" />
              <span>Fleet Hidden</span>
            </>
          )}
        </button>
      </div>

      {/* Map Legend (Bottom Left) */}
      <div className="absolute bottom-3 left-3 z-20 bg-slate-900/90 backdrop-blur-md border border-slate-800 p-2.5 rounded-xl shadow-lg text-[11px] space-y-1.5 text-slate-300 pointer-events-none">
        <div className="font-semibold text-white text-[10px] uppercase tracking-wider">
          Live Tracker Legend
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          <span>Seats Available (SEA)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
          <span>Standing Available (SDA)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
          <span>Limited Standing (LSD)</span>
        </div>
      </div>
    </div>
  );
};
