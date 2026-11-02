import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

interface MapboxTrackingMapProps {
  pickupLat: number;
  pickupLng: number;
  pickupLabel?: string;
  destLat: number;
  destLng: number;
  destLabel?: string;
  driverLat?: number | null;
  driverLng?: number | null;
  driverName?: string;
  status?: string;
  onRouteCalculated?: (distanceKm: number, durationMins: number) => void;
}

export const MapboxTrackingMap: React.FC<MapboxTrackingMapProps> = ({
  pickupLat,
  pickupLng,
  pickupLabel = "Origin Hub",
  destLat,
  destLng,
  destLabel = "Destination",
  driverLat,
  driverLng,
  driverName = "Express Courier",
  status = "In Transit",
  onRouteCalculated,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const driverMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const originMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const destMarkerRef = useRef<mapboxgl.Marker | null>(null);

  const [mapStyle, setMapStyle] = useState<"dark" | "streets" | "navigation">("dark");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [durationMins, setDurationMins] = useState<number | null>(null);

  // Mapbox token: check environment or fallback to production public token
  const token =
    (import.meta as any).env?.VITE_MAPBOX_ACCESS_TOKEN ||
    "pk.eyJ1IjoibWRpbXRoaXlheiIsImEiOiJjbTdtbTczcmkwNmJqMmtza21wbTVoNWcxIn0.demo_placeholder";

  const getStyleUrl = (style: "dark" | "streets" | "navigation") => {
    switch (style) {
      case "streets":
        return "mapbox://styles/mapbox/streets-v12";
      case "navigation":
        return "mapbox://styles/mapbox/navigation-night-v1";
      case "dark":
      default:
        return "mapbox://styles/mapbox/dark-v11";
    }
  };

  // Initialize Mapbox instance
  useEffect(() => {
    if (!mapContainerRef.current) return;

    mapboxgl.accessToken = token;

    // Center between pickup, dest or driver
    const centerLng = driverLng || (pickupLng + destLng) / 2 || 79.815;
    const centerLat = driverLat || (pickupLat + destLat) / 2 || 11.948;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: getStyleUrl(mapStyle),
      center: [centerLng, centerLat],
      zoom: 12.5,
      attributionControl: false,
    });

    map.addControl(new mapboxgl.NavigationControl({ showCompass: true }), "top-right");

    mapRef.current = map;

    map.on("load", () => {
      // 1. Origin Marker (Green Pin)
      const originEl = document.createElement("div");
      originEl.className = "flex items-center justify-center";
      originEl.innerHTML = `
        <div style="background-color: #10B981; width: 26px; height: 26px; border-radius: 50%; border: 3px solid #ffffff; box-shadow: 0 4px 10px rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center;">
          <div style="background-color: #ffffff; width: 8px; height: 8px; border-radius: 50%;"></div>
        </div>
      `;
      originMarkerRef.current = new mapboxgl.Marker({ element: originEl })
        .setLngLat([pickupLng, pickupLat])
        .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(`<b style="color:#111;">${pickupLabel}</b><br/><span style="color:#666;font-size:11px;">Pickup Hub</span>`))
        .addTo(map);

      // 2. Destination Marker (Red Pin)
      const destEl = document.createElement("div");
      destEl.className = "flex items-center justify-center";
      destEl.innerHTML = `
        <div style="background-color: #EF4444; width: 28px; height: 28px; border-radius: 50%; border: 3px solid #ffffff; box-shadow: 0 4px 12px rgba(239,68,68,0.6); display: flex; align-items: center; justify-content: center;">
          <svg style="width: 14px; height: 14px; color: #ffffff;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          </svg>
        </div>
      `;
      destMarkerRef.current = new mapboxgl.Marker({ element: destEl })
        .setLngLat([destLng, destLat])
        .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(`<b style="color:#111;">${destLabel}</b><br/><span style="color:#666;font-size:11px;">Delivery Address</span>`))
        .addTo(map);

      // 3. Driver Live Animated Marker (Orange Pulsing Truck)
      if (driverLat && driverLng) {
        const driverEl = document.createElement("div");
        driverEl.innerHTML = `
          <div style="position: relative; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; width: 44px; height: 44px; border-radius: 50%; background-color: #FF6B00; opacity: 0.35; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="position: relative; background-color: #FF6B00; width: 36px; height: 36px; border-radius: 50%; border: 3px solid #ffffff; box-shadow: 0 6px 14px rgba(255,107,0,0.6); display: flex; align-items: center; justify-content: center;">
              <svg style="width: 18px; height: 18px; color: #ffffff;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
              </svg>
            </div>
          </div>
        `;
        driverMarkerRef.current = new mapboxgl.Marker({ element: driverEl })
          .setLngLat([driverLng, driverLat])
          .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(`<b style="color:#111;">${driverName}</b><br/><span style="color:#FF6B00;font-size:11px;font-weight:bold;">${status}</span>`))
          .addTo(map);
      }

      // 4. Request directions route from Mapbox Directions API
      fetchRoute(map, [pickupLng, pickupLat], [destLng, destLat]);

      // 5. Fit bounds to contain both pickup, dest, and driver
      fitMapBounds(map);
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [mapStyle, token]);

  // Update driver marker smoothly when driver coordinates change via Socket.IO
  useEffect(() => {
    if (!mapRef.current || !driverLat || !driverLng) return;

    if (driverMarkerRef.current) {
      driverMarkerRef.current.setLngLat([driverLng, driverLat]);
    } else {
      const driverEl = document.createElement("div");
      driverEl.innerHTML = `
        <div style="position: relative; display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; width: 44px; height: 44px; border-radius: 50%; background-color: #FF6B00; opacity: 0.35; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="position: relative; background-color: #FF6B00; width: 36px; height: 36px; border-radius: 50%; border: 3px solid #ffffff; box-shadow: 0 6px 14px rgba(255,107,0,0.6); display: flex; align-items: center; justify-content: center;">
            <svg style="width: 18px; height: 18px; color: #ffffff;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
            </svg>
          </div>
        </div>
      `;
      driverMarkerRef.current = new mapboxgl.Marker({ element: driverEl })
        .setLngLat([driverLng, driverLat])
        .addTo(mapRef.current);
    }
  }, [driverLat, driverLng]);

  // Fit bounds helper
  const fitMapBounds = (map: mapboxgl.Map) => {
    const bounds = new mapboxgl.LngLatBounds();
    bounds.extend([pickupLng, pickupLat]);
    bounds.extend([destLng, destLat]);
    if (driverLat && driverLng) {
      bounds.extend([driverLng, driverLat]);
    }
    map.fitBounds(bounds, { padding: 80, maxZoom: 15, duration: 1000 });
  };

  // Fetch driving route via Mapbox Directions API
  const fetchRoute = async (map: mapboxgl.Map, start: [number, number], end: [number, number]) => {
    try {
      const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${start[0]},${start[1]};${end[0]},${end[1]}?geometries=geojson&overview=full&access_token=${token}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const coordinates = route.geometry.coordinates;

        const distance = Math.round((route.distance / 1000) * 10) / 10;
        const duration = Math.round(route.duration / 60);

        setDistanceKm(distance);
        setDurationMins(duration);
        if (onRouteCalculated) {
          onRouteCalculated(distance, duration);
        }

        // Draw line on map
        if (map.getSource("route")) {
          (map.getSource("route") as mapboxgl.GeoJSONSource).setData({
            type: "Feature",
            properties: {},
            geometry: {
              type: "LineString",
              coordinates: coordinates,
            },
          });
        } else {
          map.addSource("route", {
            type: "geojson",
            data: {
              type: "Feature",
              properties: {},
              geometry: {
                type: "LineString",
                coordinates: coordinates,
              },
            },
          });

          // Route glow layer
          map.addLayer({
            id: "route-glow",
            type: "line",
            source: "route",
            layout: { "line-join": "round", "line-cap": "round" },
            paint: {
              "line-color": "#FF6B00",
              "line-width": 8,
              "line-opacity": 0.35,
            },
          });

          // Route core line
          map.addLayer({
            id: "route-core",
            type: "line",
            source: "route",
            layout: { "line-join": "round", "line-cap": "round" },
            paint: {
              "line-color": "#FF8A24",
              "line-width": 4,
            },
          });
        }
      }
    } catch (err) {
      console.warn("Mapbox Directions API fallback:", err);
    }
  };

  return (
    <div
      className={`relative w-full rounded-2xl overflow-hidden border border-[#26282B] bg-[#0E1520] ${
        isFullscreen ? "fixed inset-4 z-50 rounded-3xl" : "h-[380px] sm:h-[440px]"
      }`}
    >
      {/* Mapbox Canvas Container */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Floating Mapbox Controls Bar */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
        {/* Style Switcher */}
        <div className="bg-[#181B20]/90 border border-white/10 rounded-xl p-1 flex items-center backdrop-blur-md shadow-lg text-[11px] font-semibold">
          <button
            onClick={() => setMapStyle("dark")}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              mapStyle === "dark" ? "bg-[#FF6B00] text-white" : "text-gray-400 hover:text-white"
            }`}
          >
            Dark
          </button>
          <button
            onClick={() => setMapStyle("navigation")}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              mapStyle === "navigation" ? "bg-[#FF6B00] text-white" : "text-gray-400 hover:text-white"
            }`}
          >
            Night Nav
          </button>
          <button
            onClick={() => setMapStyle("streets")}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              mapStyle === "streets" ? "bg-[#FF6B00] text-white" : "text-gray-400 hover:text-white"
            }`}
          >
            Streets
          </button>
        </div>

        {/* Live Route Telemetry Pill */}
        {distanceKm !== null && durationMins !== null && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#181B20]/90 border border-white/10 backdrop-blur-md text-xs font-bold text-white shadow-lg">
            <span className="text-[#FF6B00]">🛣️ {distanceKm} km</span>
            <span className="text-gray-400">•</span>
            <span className="text-emerald-400">⏱️ ~{durationMins} mins</span>
          </div>
        )}
      </div>

      {/* Floating Right Control (Fullscreen & Recenter) */}
      <div className="absolute top-4 right-14 z-20 flex items-center gap-1.5">
        <button
          onClick={() => {
            if (mapRef.current) fitMapBounds(mapRef.current);
          }}
          className="px-2.5 py-1.5 rounded-xl bg-[#181B20]/90 hover:bg-[#252A32] border border-white/10 text-white text-xs font-semibold backdrop-blur-md transition-colors shadow-lg flex items-center gap-1.5"
          title="Recenter and Fit Bounds"
        >
          <span>🎯</span>
          <span className="hidden sm:inline">Fit Route</span>
        </button>

        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="p-1.5 rounded-xl bg-[#181B20]/90 hover:bg-[#252A32] border border-white/10 text-white text-xs font-semibold backdrop-blur-md transition-colors shadow-lg"
          title="Toggle Fullscreen"
        >
          {isFullscreen ? "✕" : "⛶"}
        </button>
      </div>
    </div>
  );
};

export default MapboxTrackingMap;

