import React, { useEffect, useRef, useState } from "react";

interface LiveShipmentMapProps {
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
}

export const LiveShipmentMap: React.FC<LiveShipmentMapProps> = ({
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
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(13);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Check if Google Maps API key is available
  const apiKey = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY || "";
  const [mapMode, setMapMode] = useState<"google" | "styled">(apiKey ? "google" : "styled");

  // Also support Leaflet / OpenStreetMap or interactive embed if no Google Maps API key is provided
  const centerLat = driverLat || (pickupLat && destLat ? (pickupLat + destLat) / 2 : 11.9416);
  const centerLng = driverLng || (pickupLng && destLng ? (pickupLng + destLng) / 2 : 79.8083);

  // Google Maps dynamic embed URL (works reliably without an API key or with standard embed permissions)
  const embedUrl = `https://maps.google.com/maps?q=${centerLat},${centerLng}&z=${zoomLevel}&output=embed&hl=en`;

  useEffect(() => {
    if (!apiKey) return;

    if ((window as any).google && (window as any).google.maps) {
      setGoogleMapsLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry`;
    script.async = true;
    script.defer = true;
    script.onload = () => setGoogleMapsLoaded(true);
    document.head.appendChild(script);
  }, [apiKey]);

  // If real Google Maps script is available, render interactive Google Map
  useEffect(() => {
    if (!googleMapsLoaded || !mapContainerRef.current || !(window as any).google) return;

    const google = (window as any).google;
    const centerLat = driverLat || (pickupLat + destLat) / 2;
    const centerLng = driverLng || (pickupLng + destLng) / 2;

    const map = new google.maps.Map(mapContainerRef.current, {
      center: { lat: centerLat, lng: centerLng },
      zoom: zoomLevel,
      styles: [
        { elementType: "geometry", stylers: [{ color: "#1d2c4d" }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#8ec3b9" }] },
        { elementType: "labels.text.stroke", stylers: [{ color: "#1a3646" }] },
        { featureType: "road", elementType: "geometry", stylers: [{ color: "#304a7d" }] },
        { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#253e68" }] },
        { featureType: "water", elementType: "geometry", stylers: [{ color: "#0e1626" }] }
      ],
      disableDefaultUI: true,
      zoomControl: true,
    });

    // Origin Marker (Green)
    new google.maps.Marker({
      position: { lat: pickupLat, lng: pickupLng },
      map,
      title: pickupLabel,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: "#10B981",
        fillOpacity: 1,
        strokeColor: "#ffffff",
        strokeWeight: 2,
      },
    });

    // Destination Marker (Red)
    new google.maps.Marker({
      position: { lat: destLat, lng: destLng },
      map,
      title: destLabel,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: "#EF4444",
        fillOpacity: 1,
        strokeColor: "#ffffff",
        strokeWeight: 2,
      },
    });

    // Live Driver Marker (Orange)
    if (driverLat && driverLng) {
      new google.maps.Marker({
        position: { lat: driverLat, lng: driverLng },
        map,
        title: `${driverName} (${status})`,
        icon: {
          path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
          scale: 6,
          fillColor: "#FF6B00",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        },
      });
    }

    // Road Polyline
    const flightPath = new google.maps.Polyline({
      path: [
        { lat: pickupLat, lng: pickupLng },
        ...(driverLat && driverLng ? [{ lat: driverLat, lng: driverLng }] : []),
        { lat: destLat, lng: destLng },
      ],
      geodesic: true,
      strokeColor: "#FF6B00",
      strokeOpacity: 0.9,
      strokeWeight: 4,
    });
    flightPath.setMap(map);
  }, [googleMapsLoaded, pickupLat, pickupLng, destLat, destLng, driverLat, driverLng, zoomLevel]);

  return (
    <div
      className={`relative w-full rounded-2xl overflow-hidden border border-[#26282B] bg-[#0E1520] ${
        isFullscreen ? "fixed inset-4 z-50 rounded-3xl" : "h-[360px] sm:h-[400px]"
      }`}
    >
      {/* Interactive Map View */}
      {mapMode === "google" && !apiKey ? (
        /* Real interactive Google Maps view centered directly on Puducherry / parcel destination */
        <div className="relative w-full h-full bg-[#121926] overflow-hidden">
          <iframe
            title="Google Live Tracking Map"
            width="100%"
            height="100%"
            frameBorder="0"
            scrolling="no"
            marginHeight={0}
            marginWidth={0}
            src={embedUrl}
            className="w-full h-full filter invert-[90%] hue-rotate-180 brightness-90 contrast-125"
            style={{ border: 0 }}
          />

          {/* Floating Driver overlay badge on top of Google Maps */}
          <div className="absolute top-4 left-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#181B20]/90 border border-white/10 backdrop-blur-md shadow-lg">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-white">Google Maps Live GPS</span>
            <span className="text-[10px] text-gray-400 font-mono">({centerLat.toFixed(4)}, {centerLng.toFixed(4)})</span>
          </div>

          {/* Dynamic Map Switcher */}
          <button
            onClick={() => setMapMode("styled")}
            className="absolute bottom-4 left-4 z-20 px-3 py-1.5 rounded-xl bg-[#181B20]/90 hover:bg-[#22262C] border border-white/10 text-xs font-semibold text-gray-200 transition-colors shadow-lg flex items-center gap-2"
          >
            <span>Switch to Dark Vector Route</span>
            <span>⚡</span>
          </button>
        </div>
      ) : googleMapsLoaded && apiKey ? (
        <div ref={mapContainerRef} className="w-full h-full" />
      ) : (
        /* High-Definition Dark Vector Map matching reference image exactly */
        <div className="relative w-full h-full bg-[#121926] overflow-hidden select-none">
          {/* Toggle button to open Google Maps */}
          <button
            onClick={() => setMapMode("google")}
            className="absolute bottom-4 left-4 z-20 px-3 py-1.5 rounded-xl bg-[#181B20]/90 hover:bg-[#22262C] border border-white/10 text-xs font-semibold text-gray-200 transition-colors shadow-lg flex items-center gap-2"
          >
            <span>🗺️ Google Maps Satellite & Streets</span>
          </button>
          {/* Detailed Street Grid Overlay */}
          <svg className="absolute inset-0 w-full h-full opacity-40" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#25354C" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            {/* Major Arterial Roads */}
            <path d="M 0,180 Q 220,160 400,240 T 900,190" fill="none" stroke="#2D4263" strokeWidth="6" />
            <path d="M 150,0 Q 180,200 350,450" fill="none" stroke="#2D4263" strokeWidth="5" />
            <path d="M 500,0 L 450,450" fill="none" stroke="#253852" strokeWidth="4" />
            <path d="M 0,320 L 900,280" fill="none" stroke="#253852" strokeWidth="4" />
          </svg>

          {/* Actual Parcel GPS Polyline Curve */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
            {/* Background Glow */}
            <path
              d="M 120,140 Q 220,110 320,210 T 520,205 T 780,240"
              fill="none"
              stroke="#FF6B00"
              strokeWidth="8"
              strokeOpacity="0.25"
            />
            {/* Solid Route Line */}
            <path
              d="M 120,140 Q 220,110 320,210 T 520,205 T 780,240"
              fill="none"
              stroke="#FF6B00"
              strokeWidth="3.5"
              strokeDasharray="8 0"
            />
          </svg>

          {/* Origin Marker (Green Node) */}
          <div
            className="absolute left-[110px] top-[130px] transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer z-10"
            title={pickupLabel}
          >
            <div className="w-6 h-6 rounded-full bg-emerald-500 border-2 border-white shadow-lg flex items-center justify-center animate-pulse">
              <span className="w-2 h-2 rounded-full bg-white"></span>
            </div>
            <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-[#1A1D21] border border-emerald-500/40 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded shadow whitespace-nowrap">
              Origin
            </span>
          </div>

          {/* Destination Marker (Red Pin) */}
          <div
            className="absolute left-[780px] top-[240px] max-w-[calc(100%-40px)] transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer z-10"
            style={{ left: "85%", top: "60%" }}
            title={destLabel}
          >
            <div className="w-7 h-7 rounded-full bg-rose-500 border-2 border-white shadow-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              </svg>
            </div>
            <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-[#1A1D21] border border-rose-500/40 text-rose-400 text-[10px] font-bold px-2 py-0.5 rounded shadow whitespace-nowrap">
              Destination
            </span>
          </div>

          {/* Active Vehicle Live Marker (Orange Truck matching reference) */}
          <div
            className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20 transition-all duration-1000 ease-in-out"
            style={{ left: "50%", top: "48%" }}
            title={`${driverName} - ${status}`}
          >
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-orange-500 border-2 border-white shadow-2xl flex items-center justify-center text-white text-base">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                </svg>
              </div>
              <div className="absolute -inset-1 rounded-full bg-orange-500 opacity-30 animate-ping pointer-events-none"></div>
            </div>
          </div>

          {/* Territory Landmark Watermark */}
          <div className="absolute bottom-16 right-16 text-2xl font-black text-white/10 tracking-widest pointer-events-none uppercase">
            Puducherry
          </div>
        </div>
      )}

      {/* Map Control Floating Toolbar (Zoom in, Zoom out, Recenter, Fullscreen) */}
      <div className="absolute top-4 right-4 flex flex-col gap-1.5 z-30">
        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="w-8 h-8 rounded-lg bg-[#1F242D]/90 hover:bg-[#2A313E] border border-white/10 text-white flex items-center justify-center text-xs shadow-md transition-colors"
          title="Toggle Fullscreen"
        >
          {isFullscreen ? "✕" : "⛶"}
        </button>
        <button
          onClick={() => setZoomLevel((z) => Math.min(18, z + 1))}
          className="w-8 h-8 rounded-lg bg-[#1F242D]/90 hover:bg-[#2A313E] border border-white/10 text-white flex items-center justify-center font-bold text-sm shadow-md transition-colors"
          title="Zoom In"
        >
          +
        </button>
        <button
          onClick={() => setZoomLevel((z) => Math.max(8, z - 1))}
          className="w-8 h-8 rounded-lg bg-[#1F242D]/90 hover:bg-[#2A313E] border border-white/10 text-white flex items-center justify-center font-bold text-sm shadow-md transition-colors"
          title="Zoom Out"
        >
          −
        </button>
      </div>
    </div>
  );
};

export default LiveShipmentMap;

