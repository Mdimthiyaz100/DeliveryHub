import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../../api/api";
import MapboxTrackingMap from "../components/tracking/MapboxTrackingMap";
import { getTrackingSocket } from "../utils/trackingSocket";

export function CustomerTrackPage() {
  const { trackingNumber: paramTracking } = useParams();
  const [trackingNumberInput, setTrackingNumberInput] = useState(paramTracking || "DH2026081400005");
  const [shipment, setShipment] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTracking = async (num: string) => {
    if (!num.trim()) return;

    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/tracking/public/${encodeURIComponent(num.trim())}`);
      if (res.data) {
        setShipment(res.data);
      }
    } catch (err: any) {
      setError("No parcel found for this tracking number. Please verify and try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (paramTracking) {
      fetchTracking(paramTracking);
    } else {
      fetchTracking("DH2026081400005");
    }

    // Connect to live updates for this parcel
    const socket = getTrackingSocket();
    const activeNum = paramTracking || "DH2026081400005";
    socket.emit("join-tracking", activeNum);

    const onLocation = (data: any) => {
      setShipment((prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          current_latitude: data.latitude,
          current_longitude: data.longitude,
          current_location_name: data.locationName || prev.current_location_name,
        };
      });
    };

    const onStatus = (data: any) => {
      setShipment((prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          current_status: data.status,
        };
      });
    };

    socket.on("tracking-gps-update", onLocation);
    socket.on("shipment-status-changed", onStatus);

    return () => {
      socket.emit("leave-tracking", activeNum);
      socket.off("tracking-gps-update", onLocation);
      socket.off("shipment-status-changed", onStatus);
    };
  }, [paramTracking]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTracking(trackingNumberInput);
  };

  return (
    <div className="min-h-screen bg-[#FBFBFB] text-[#171717] font-sans antialiased">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-[#EAEAEA] sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/shop" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-500 flex items-center justify-center text-white font-black text-sm">
              DH
            </div>
            <span className="font-extrabold text-lg tracking-tight text-[#171717]">DeliveryHub</span>
          </Link>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <Link to="/shop" className="text-gray-600 hover:text-black">Shop</Link>
            <Link to="/my-orders" className="text-gray-600 hover:text-black">My Orders</Link>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Search Header */}
        <div className="text-center max-w-xl mx-auto space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#171717] tracking-tight">
            Track Your Delivery in Real-Time
          </h1>
          <p className="text-xs sm:text-sm text-[#737373]">
            Watch your parcel route, live courier progress, and estimated delivery schedule.
          </p>

          <form onSubmit={handleSearch} className="pt-4 flex gap-2 max-w-md mx-auto">
            <input
              type="text"
              value={trackingNumberInput}
              onChange={(e) => setTrackingNumberInput(e.target.value)}
              placeholder="Enter Tracking # (e.g. DH2026081400005)"
              className="flex-1 px-4 py-2.5 rounded-full border border-[#DCDCDC] text-xs font-mono focus:outline-none focus:border-orange-500 bg-white shadow-sm"
            />
            <button
              type="submit"
              className="px-6 py-2.5 rounded-full bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-sm"
            >
              Track
            </button>
          </form>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold text-center">
            {error}
          </div>
        )}

        {shipment && (
          <div className="space-y-6">
            {/* Mapbox Live Map */}
            <div className="rounded-3xl overflow-hidden border border-[#EAEAEA] shadow-sm bg-white p-2">
              <MapboxTrackingMap
                pickupLat={shipment.pickup_latitude || 13.0827}
                pickupLng={shipment.pickup_longitude || 80.2707}
                pickupLabel="Origin Distribution Hub"
                destLat={shipment.destination_latitude || 11.9416}
                destLng={shipment.destination_longitude || 79.8083}
                destLabel={shipment.destination_address || "Delivery Address"}
                driverLat={shipment.current_latitude || 11.9480}
                driverLng={shipment.current_longitude || 79.8150}
                driverName="Delivery Partner"
                status={shipment.current_status}
              />
            </div>

            {/* Status & Journey Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 bg-white rounded-3xl border border-[#EAEAEA] p-6 shadow-sm space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-mono text-gray-500 uppercase">Tracking Number</span>
                    <h2 className="text-xl font-extrabold text-[#171717]">{shipment.tracking_number}</h2>
                  </div>
                  <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-orange-500/10 text-orange-600 border border-orange-500/20">
                    {shipment.current_status || "In Transit"}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-[#FAFAFA] border border-[#EAEAEA] space-y-2 text-xs">
                  <div className="flex items-start justify-between">
                    <span className="text-gray-500">Destination:</span>
                    <span className="font-semibold text-right max-w-xs">{shipment.destination_address}</span>
                  </div>
                  <div className="flex items-start justify-between">
                    <span className="text-gray-500">Item:</span>
                    <span className="font-semibold">{shipment.order_item || "Package"}</span>
                  </div>
                </div>
              </div>

              {/* ETA & Courier Card */}
              <div className="bg-white rounded-3xl border border-[#EAEAEA] p-6 shadow-sm space-y-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Live ETA</h3>
                <div className="p-4 rounded-2xl bg-orange-50 border border-orange-100 text-center">
                  <span className="text-3xl font-black text-orange-600">~{shipment.estimated_delivery_mins || 18}</span>
                  <span className="text-xs font-bold text-orange-700 block mt-1">Minutes Remaining</span>
                </div>

                <div className="pt-2 text-xs space-y-2">
                  <div className="flex justify-between text-gray-600">
                    <span>Distance Left:</span>
                    <span className="font-bold text-black">{shipment.distance_remaining_km || 2.4} km</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Courier Service:</span>
                    <span className="font-bold text-black">Express Air / Surface</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default CustomerTrackPage;
