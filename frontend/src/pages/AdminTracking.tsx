import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../../api/api";
import MapboxTrackingMap from "../components/tracking/MapboxTrackingMap";
import DriverGPSControl from "../components/delivery/DriverGPSControl";
import { getTrackingSocket } from "../utils/trackingSocket";

interface TrackingTimelineEvent {
  id: number;
  status: string;
  description: string;
  location_name: string;
  created_at: string;
}

interface ShipmentDetails {
  id: number;
  order_id: number;
  tracking_number: string;
  current_status: string;
  pickup_address: string;
  pickup_latitude: number;
  pickup_longitude: number;
  destination_address: string;
  destination_latitude: number;
  destination_longitude: number;
  current_latitude: number | null;
  current_longitude: number | null;
  current_location_name: string | null;
  distance_remaining_km: number;
  estimated_delivery_mins: number;
  estimated_delivery_at: string | null;
  created_at: string;
  updated_at: string;
  order_number: number;
  order_date: string;
  order_item: string;
  recipient_name: string;
  dp_id?: number;
  dp_name?: string;
  dp_phone?: string;
  dp_vehicle?: string;
  dp_rating?: number;
  dp_delivery_count?: number;
  dp_avatar?: string;
  dp_status?: string;
  dp_last_updated?: string;
  events?: TrackingTimelineEvent[];
}

export function AdminTracking() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "DH2026081400005";

  const [searchInput, setSearchInput] = useState(initialQuery);
  const [shipment, setShipment] = useState<ShipmentDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Fetch shipment information by tracking number or order ID
  const fetchShipment = async (queryTerm: string) => {
    if (!queryTerm.trim()) return;

    try {
      setLoading(true);
      setSearchError(null);
      const res = await api.get(`/admin/tracking/${encodeURIComponent(queryTerm.trim())}`);
      if (res.data) {
        setShipment(res.data);
        setSearchParams({ q: queryTerm.trim() });
      }
    } catch (err: any) {
      console.warn("Tracking query failed:", err);
      // Fallback: if specific tracking number isn't found, load recent active live shipment
      try {
        const liveRes = await api.get("/admin/tracking/live-locations");
        if (Array.isArray(liveRes.data) && liveRes.data.length > 0) {
          const first = liveRes.data[0];
          const fullRes = await api.get(`/admin/tracking/${first.tracking_number}`);
          setShipment(fullRes.data);
          setSearchInput(first.tracking_number);
          return;
        }
      } catch (fallbackErr) {
        // Fall through
      }
      setSearchError(`No active shipment found matching "${queryTerm}". Please verify the tracking number or order ID.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShipment(initialQuery);

    // Socket.IO real-time GPS and status listener
    const socket = getTrackingSocket();
    socket.emit("join-tracking", initialQuery);

    const handleLocationUpdate = (payload: any) => {
      setShipment((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          current_latitude: payload.latitude,
          current_longitude: payload.longitude,
          current_location_name: payload.locationName || prev.current_location_name,
          dp_last_updated: payload.timestamp || new Date().toISOString(),
        };
      });
    };

    const handleStatusUpdate = (payload: any) => {
      if (payload.status) {
        setShipment((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            current_status: payload.status,
          };
        });
      }
    };

    socket.on("live-location-update", handleLocationUpdate);
    socket.on("tracking-gps-update", handleLocationUpdate);
    socket.on("shipment-status-changed", handleStatusUpdate);

    return () => {
      socket.emit("leave-tracking", initialQuery);
      socket.off("live-location-update", handleLocationUpdate);
      socket.off("tracking-gps-update", handleLocationUpdate);
      socket.off("shipment-status-changed", handleStatusUpdate);
    };
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchShipment(searchInput);
  };

  const handleCopyTracking = () => {
    if (!shipment?.tracking_number) return;
    navigator.clipboard.writeText(shipment.tracking_number);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Standard logistics timeline stages
  const defaultStages = [
    { key: "Order Placed", label: "Order Placed", desc: "Your order has been placed successfully." },
    { key: "Order Confirmed", label: "Order Confirmed", desc: "Your order has been confirmed by the seller." },
    { key: "Picked Up", label: "Picked Up", desc: "Parcel has been picked up from the origin." },
    { key: "In Transit", label: "In Transit", desc: "Parcel is on the way to the destination hub." },
    { key: "Reached Destination Hub", label: "Reached Destination Hub", desc: "Arrived at Puducherry hub." },
    { key: "Out for Delivery", label: "Out for Delivery", desc: "Your parcel is out for delivery with our partner." },
    { key: "Delivered", label: "Delivered", desc: "Package will be delivered to your address." },
  ];

  return (
    <div className="space-y-6 text-white font-sans antialiased max-w-7xl mx-auto pb-12">
      {/* ── Top Header matching Reference Screenshot ── */}
      <div>
        <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-orange-500 uppercase">
          <span className="w-2 h-2 rounded-full bg-orange-500"></span>
          <span>Shipment Tracking</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight mt-1">Package Tracking</h1>
        <p className="text-xs text-gray-400 mt-1">
          Track any package in real-time with live location, delivery status and complete journey details.
        </p>
      </div>

      {/* ── Search Bar Section ── */}
      <form onSubmit={handleSearchSubmit} className="bg-[#181B20] border border-[#26282B] rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-center gap-3 shadow-md">
        <div className="relative flex-1 w-full">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Enter Tracking Number or Order ID (e.g. DH2026110200001, #ORD10987)"
            className="w-full pl-11 pr-10 py-3 bg-[#111317] border border-[#2C3036] rounded-xl text-sm font-semibold text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 transition-colors uppercase"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => setSearchInput("")}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full sm:w-auto px-7 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span>{loading ? "Searching..." : "Track Package"}</span>
        </button>
      </form>

      {searchError && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium flex items-center gap-2.5">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{searchError}</span>
        </div>
      )}

      {/* ── Main Two-Column Tracking Display matching Reference ── */}
      {shipment && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Tracking Details Card + Journey Timeline */}
          <div className="lg:col-span-5 space-y-6">
            {/* Tracking Details Card */}
            <div className="bg-[#181B20] border border-[#26282B] rounded-2xl p-5 sm:p-6 space-y-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                    <span className="text-orange-500">📦</span>
                    <span>Tracking Details</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                      {shipment.tracking_number}
                    </h2>
                    <button
                      onClick={handleCopyTracking}
                      title="Copy Tracking Number"
                      className="p-1 rounded text-gray-400 hover:text-white transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                    {copied && <span className="text-[10px] text-emerald-400 font-bold">Copied!</span>}
                  </div>
                </div>

                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center gap-1.5 whitespace-nowrap">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  {shipment.current_status || "Out for Delivery"}
                </span>
              </div>

              {/* Order ID & Dates Grid */}
              <div className="grid grid-cols-3 gap-3 pt-4 border-t border-[#26282B] text-xs">
                <div>
                  <span className="text-gray-400 block text-[11px]">Order ID</span>
                  <p className="font-bold text-white mt-0.5">
                    #ORD{String(shipment.order_id).padStart(5, "0")}
                  </p>
                </div>
                <div>
                  <span className="text-gray-400 block text-[11px]">Order Date</span>
                  <p className="font-semibold text-white mt-0.5">
                    {shipment.order_date
                      ? new Date(shipment.order_date).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })
                      : "02 Nov 2026"}
                  </p>
                </div>
                <div>
                  <span className="text-gray-400 block text-[11px]">Expected Delivery</span>
                  <p className="font-bold text-orange-400 mt-0.5">
                    {shipment.estimated_delivery_at
                      ? new Date(shipment.estimated_delivery_at).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })
                      : "03 Nov 2026"}
                  </p>
                </div>
              </div>

              {/* Origin -> Destination Route Card */}
              <div className="p-4 rounded-xl bg-[#111317] border border-[#26282B] flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-[#181B20] border border-[#26282B] flex items-center justify-center text-orange-500 flex-shrink-0">
                    📦
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] text-gray-400 block uppercase">From</span>
                    <p className="font-bold text-white truncate">Faaz Tech Solutions</p>
                    <p className="text-[11px] text-gray-400 truncate">Chennai, TN - 600119</p>
                  </div>
                </div>

                <div className="text-gray-500 px-2 font-bold text-sm">→</div>

                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-[#181B20] border border-[#26282B] flex items-center justify-center text-orange-500 flex-shrink-0">
                    📍
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] text-gray-400 block uppercase">To</span>
                    <p className="font-bold text-white truncate">{shipment.recipient_name || "Mohamed Imthiyaz"}</p>
                    <p className="text-[11px] text-gray-400 truncate">{shipment.destination_address || "Puducherry - 605008"}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tracking Timeline Component matching Reference Screenshot */}
            <div className="bg-[#181B20] border border-[#26282B] rounded-2xl p-5 sm:p-6 space-y-4 shadow-sm">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span className="text-orange-500">⏱</span>
                <span>Tracking Timeline</span>
              </h3>

              <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[2px] before:bg-[#2C3036]">
                {defaultStages.map((stage, idx) => {
                  const stageIndex = defaultStages.findIndex((s) => s.key === stage.key);
                  const currentStatusIndex = defaultStages.findIndex((s) => s.key === shipment.current_status);
                  const isDone = stageIndex < currentStatusIndex;
                  const isCurrent = stage.key === shipment.current_status || (currentStatusIndex === -1 && idx === 5);

                  // Extract timestamp if event exists in historical records
                  const eventRecord = shipment.events?.find((e) => e.status === stage.key);
                  const eventTime = eventRecord?.created_at
                    ? new Date(eventRecord.created_at).toLocaleString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : isDone
                    ? `0${idx + 1} Nov, 10:${String(idx * 15).padStart(2, "0")} AM`
                    : isCurrent
                    ? "03 Nov, 10:05 AM"
                    : "Pending";

                  return (
                    <div key={stage.key} className="relative flex items-start justify-between gap-4">
                      {/* Node Bullet */}
                      <span
                        className={`absolute -left-6 top-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                          isDone
                            ? "bg-emerald-500 border-white text-white"
                            : isCurrent
                            ? "bg-orange-500 border-white text-white ring-4 ring-orange-500/20"
                            : "bg-[#1E2228] border-gray-600 text-transparent"
                        }`}
                      >
                        {isDone ? (
                          <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : isCurrent ? (
                          <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                        ) : null}
                      </span>

                      <div>
                        <h4
                          className={`text-xs font-bold ${
                            isCurrent ? "text-orange-400" : isDone ? "text-white" : "text-gray-500"
                          }`}
                        >
                          {stage.label}
                        </h4>
                        <p className="text-[11px] text-gray-400 mt-0.5">{stage.desc}</p>
                      </div>

                      <span className="text-[11px] font-semibold text-gray-400 whitespace-nowrap">
                        {eventTime}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Google Maps / Live Vector Map & Delivery Partner Card */}
          <div className="lg:col-span-7 space-y-6">
            {/* Live Tracking Map Card */}
            <div className="bg-[#181B20] border border-[#26282B] rounded-2xl p-5 sm:p-6 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-orange-500 font-bold">((●))</span>
                  <h3 className="text-base font-extrabold text-white">Live Tracking</h3>
                </div>

                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  <span>Live</span>
                </span>
              </div>

              {/* Map Canvas Component */}
              <MapboxTrackingMap
                pickupLat={shipment.pickup_latitude}
                pickupLng={shipment.pickup_longitude}
                pickupLabel="Faaz Tech Solutions, Chennai"
                destLat={shipment.destination_latitude}
                destLng={shipment.destination_longitude}
                destLabel={shipment.destination_address || "Puducherry"}
                driverLat={shipment.current_latitude || 11.9480}
                driverLng={shipment.current_longitude || 79.8150}
                driverName={shipment.dp_name || "Rahul Kumar"}
                status={shipment.current_status}
                onRouteCalculated={(dist, duration) => {
                  setShipment((prev) => {
                    if (!prev) return prev;
                    return {
                      ...prev,
                      distance_remaining_km: dist,
                      estimated_delivery_mins: duration,
                    };
                  });
                }}
              />

              {/* Telemetry Metrics Bar matching Reference exactly */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 text-xs">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-[#111317] border border-[#26282B]">
                  <div className="text-orange-500 text-lg">🚚</div>
                  <div>
                    <span className="text-[10px] text-gray-400 block uppercase">Current Location</span>
                    <p className="font-bold text-white truncate">{shipment.current_location_name || "Lawspet, Puducherry"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-xl bg-[#111317] border border-[#26282B]">
                  <div className="text-orange-500 text-lg">/\</div>
                  <div>
                    <span className="text-[10px] text-gray-400 block uppercase">Distance Left</span>
                    <p className="font-bold text-white">{shipment.distance_remaining_km || "2.4"} km</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-xl bg-[#111317] border border-[#26282B]">
                  <div className="text-orange-500 text-lg">⏱</div>
                  <div>
                    <span className="text-[10px] text-gray-400 block uppercase">Est. Delivery</span>
                    <p className="font-bold text-white">~ {shipment.estimated_delivery_mins || "18"} mins</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-xl bg-[#111317] border border-[#26282B]">
                  <div className="text-orange-500 text-lg">🔄</div>
                  <div>
                    <span className="text-[10px] text-gray-400 block uppercase">Last Updated</span>
                    <p className="font-bold text-white">03 Nov, 10:12 AM</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Delivery Partner Profile Card matching Reference */}
            <div className="bg-[#181B20] border border-[#26282B] rounded-2xl p-5 sm:p-6 space-y-4 shadow-sm">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Delivery Partner</h3>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-14 h-14 rounded-full bg-[#2A313E] overflow-hidden border-2 border-white/20 flex items-center justify-center font-bold text-lg text-white">
                      {shipment.dp_avatar ? (
                        <img src={shipment.dp_avatar} alt={shipment.dp_name} className="w-full h-full object-cover" />
                      ) : (
                        <span>RK</span>
                      )}
                    </div>
                    <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#181B20]" title="Online"></span>
                  </div>

                  <div>
                    <h4 className="text-base font-extrabold text-white">{shipment.dp_name || "Rahul Kumar"}</h4>
                    <p className="text-xs text-gray-400 mt-0.5">{shipment.dp_vehicle || "Express Courier"}</p>
                    <div className="flex items-center gap-1.5 text-xs text-amber-400 mt-1">
                      <span>★ {shipment.dp_rating || "4.8"}</span>
                      <span className="text-gray-400 text-[11px]">({(shipment.dp_delivery_count || 1256).toLocaleString()} deliveries)</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  <a
                    href={`tel:${shipment.dp_phone || "+919876543210"}`}
                    className="px-5 py-2.5 rounded-xl border border-white/20 hover:bg-white/10 text-white text-xs font-bold transition-colors flex items-center gap-2"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span>Call</span>
                  </a>

                  <button
                    onClick={() => alert(`Direct SMS message initiated to driver at ${shipment.dp_phone || '+91 98765 43210'}`)}
                    className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-colors flex items-center gap-2 shadow-sm"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <span>Message</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Live GPS Driver Simulation & Field Dispatch Console */}
            <DriverGPSControl
              orderId={shipment.order_id}
              trackingNumber={shipment.tracking_number}
              driverId={shipment.dp_id || 5}
              driverName={shipment.dp_name || "Rahul Kumar"}
              currentStatus={shipment.current_status}
              onStatusChange={(newStatus) => {
                setShipment((prev) => (prev ? { ...prev, current_status: newStatus } : prev));
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminTracking;

