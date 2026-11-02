import React, { useState, useEffect, useRef } from "react";
import api from "../../../api/api";
import { getTrackingSocket } from "../../utils/trackingSocket";

interface DriverTrackerProps {
  orderId?: number;
  trackingNumber?: string;
  driverId?: number;
  driverName?: string;
  currentStatus?: string;
  onStatusChange?: (newStatus: string) => void;
}

export const DriverGPSControl: React.FC<DriverTrackerProps> = ({
  orderId = 5,
  trackingNumber = "DH2026081400005",
  driverId = 5,
  driverName = "Rahul Kumar",
  currentStatus = "Out for Delivery",
  onStatusChange,
}) => {
  const [isTracking, setIsTracking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [speed, setSpeed] = useState<number | null>(null);
  const [heading, setHeading] = useState<number | null>(null);
  const [lastPingTime, setLastPingTime] = useState<string | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [deliveryStatus, setDeliveryStatus] = useState(currentStatus);

  const watchIdRef = useRef<number | null>(null);
  const socketRef = useRef(getTrackingSocket());

  // Clean up watcher on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  const sendLocationUpdate = async (coords: GeolocationCoordinates) => {
    try {
      const payload = {
        deliveryPartnerId: driverId,
        orderId,
        trackingNumber,
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy: coords.accuracy,
        speed: coords.speed || 0,
        heading: coords.heading || 0,
        locationName: "En Route to Destination",
      };

      // 1. Send via REST endpoint for DB persistence
      await api.post("/tracking/location", payload);

      // 2. Broadcast immediately over Socket.IO for real-time smoothness
      socketRef.current.emit("delivery-gps-update", payload);

      setCurrentCoords({ lat: coords.latitude, lng: coords.longitude });
      setAccuracy(Math.round(coords.accuracy));
      setSpeed(coords.speed ? Math.round(coords.speed * 3.6) : 0); // Convert m/s to km/h
      setHeading(coords.heading ? Math.round(coords.heading) : null);
      setLastPingTime(new Date().toLocaleTimeString());
      setGpsError(null);
    } catch (err: any) {
      console.warn("GPS update delivery failed:", err);
    }
  };

  const startTracking = () => {
    if (!navigator.geolocation) {
      setGpsError("Geolocation is not supported by your browser/device.");
      return;
    }

    setGpsError(null);
    setIsTracking(true);
    setIsPaused(false);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        if (!isPaused) {
          sendLocationUpdate(position.coords);
        }
      },
      (error) => {
        let msg = "GPS unavailable.";
        if (error.code === error.PERMISSION_DENIED) {
          msg = "Location permission denied. Please allow GPS access in your browser settings.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg = "Position unavailable. Please ensure GPS is toggled on.";
        } else if (error.code === error.TIMEOUT) {
          msg = "GPS request timed out. Retrying...";
        }
        setGpsError(msg);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000,
      }
    );
  };

  const pauseTracking = () => {
    setIsPaused(true);
  };

  const resumeTracking = () => {
    setIsPaused(false);
  };

  const stopTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
    setIsPaused(false);
  };

  const handleUpdateStatus = async (newStatus: string) => {
    try {
      await api.patch(`/tracking/${encodeURIComponent(trackingNumber)}/status`, {
        status: newStatus,
        description: `Shipment marked as ${newStatus} by ${driverName}`,
        latitude: currentCoords?.lat,
        longitude: currentCoords?.lng,
      });
      setDeliveryStatus(newStatus);
      if (onStatusChange) {
        onStatusChange(newStatus);
      }
      if (newStatus === "Delivered" || newStatus === "Cancelled") {
        stopTracking();
      }
    } catch (err: any) {
      alert("Failed to update status: " + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="bg-[#181B20] border border-[#26282B] rounded-2xl p-5 space-y-4 text-white">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="w-3 h-3 rounded-full bg-orange-500 animate-pulse" />
          <h3 className="font-extrabold text-sm text-white">Delivery Partner GPS Console</h3>
        </div>
        <span
          className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
            isTracking && !isPaused
              ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400"
              : isPaused
              ? "bg-amber-500/15 border border-amber-500/30 text-amber-400"
              : "bg-gray-800 text-gray-400 border border-gray-700"
          }`}
        >
          {isTracking && !isPaused ? "Broadcasting Live GPS" : isPaused ? "Tracking Paused" : "GPS Inactive"}
        </span>
      </div>

      {gpsError && (
        <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
          <span>{gpsError}</span>
          <button onClick={() => setGpsError(null)} className="text-rose-400 hover:text-white">✕</button>
        </div>
      )}

      {/* GPS Telemetry Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3 rounded-xl bg-[#111317] border border-[#26282B]">
          <span className="text-[10px] text-gray-400 block uppercase">Coordinates</span>
          <p className="font-mono font-bold text-white mt-0.5 truncate">
            {currentCoords ? `${currentCoords.lat.toFixed(4)}, ${currentCoords.lng.toFixed(4)}` : "Waiting for fix"}
          </p>
        </div>
        <div className="p-3 rounded-xl bg-[#111317] border border-[#26282B]">
          <span className="text-[10px] text-gray-400 block uppercase">Accuracy</span>
          <p className="font-bold text-white mt-0.5">{accuracy ? `± ${accuracy}m` : "--"}</p>
        </div>
        <div className="p-3 rounded-xl bg-[#111317] border border-[#26282B]">
          <span className="text-[10px] text-gray-400 block uppercase">Speed</span>
          <p className="font-bold text-white mt-0.5">{speed !== null ? `${speed} km/h` : "--"}</p>
        </div>
        <div className="p-3 rounded-xl bg-[#111317] border border-[#26282B]">
          <span className="text-[10px] text-gray-400 block uppercase">Last Heartbeat</span>
          <p className="font-bold text-emerald-400 mt-0.5">{lastPingTime || "Not active"}</p>
        </div>
      </div>

      {/* Primary Action Buttons */}
      <div className="flex flex-wrap items-center gap-2.5 pt-2">
        {!isTracking ? (
          <button
            onClick={startTracking}
            className="flex-1 py-2.5 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <span>🛰️</span>
            <span>Start Live GPS Tracking</span>
          </button>
        ) : (
          <>
            {isPaused ? (
              <button
                onClick={resumeTracking}
                className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors flex items-center justify-center gap-2"
              >
                <span>▶️</span>
                <span>Resume GPS</span>
              </button>
            ) : (
              <button
                onClick={pauseTracking}
                className="flex-1 py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-colors flex items-center justify-center gap-2"
              >
                <span>⏸️</span>
                <span>Pause GPS</span>
              </button>
            )}
            <button
              onClick={stopTracking}
              className="py-2.5 px-4 rounded-xl border border-gray-600 hover:bg-gray-800 text-gray-300 text-xs font-bold transition-colors"
            >
              Stop GPS
            </button>
          </>
        )}

        {/* Milestone transition buttons */}
        <button
          onClick={() => handleUpdateStatus("Picked Up")}
          className="py-2.5 px-3 rounded-xl border border-[#26282B] hover:bg-white/10 text-white text-xs font-semibold transition-colors"
        >
          Picked Up
        </button>
        <button
          onClick={() => handleUpdateStatus("Out for Delivery")}
          className="py-2.5 px-3 rounded-xl border border-[#26282B] hover:bg-white/10 text-orange-400 text-xs font-semibold transition-colors"
        >
          Out for Delivery
        </button>
        <button
          onClick={() => handleUpdateStatus("Delivered")}
          className="py-2.5 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors"
        >
          Complete Delivery ✓
        </button>
      </div>
    </div>
  );
};

export default DriverGPSControl;
