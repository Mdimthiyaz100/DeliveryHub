import { useState } from "react";
import StatCards from "../components/dashboard/StatCards";
import DeliveryChart from "../components/dashboard/DeliveryChart";
import RecentOrders from "../components/dashboard/RecentOrders";

function Dashboard() {
  const userName = localStorage.getItem("userName") || "Super Admin";
  const [syncStatus, setSyncStatus] = useState<string>("Synced");
  const [refreshKey, setRefreshKey] = useState<number>(0);

  const handleManualSync = () => {
    setSyncStatus("Syncing...");
    setRefreshKey(prev => prev + 1);
    setTimeout(() => {
      setSyncStatus("Synced");
    }, 1200);
  };

  return (
    <div className="space-y-6" key={refreshKey}>
      {/* Top Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#2C2E33]">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#FF6B00] mb-1">
            <span className="w-2 h-2 rounded-full bg-[#FF6B00] shadow-glow-sm"></span>
            Real-Time Operations Ledger
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Admin Dashboard
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 mt-0.5">
            Welcome back, <strong className="text-white">{userName}</strong>! Monitoring live e-commerce revenues, dispatches and customer activity.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleManualSync}
            className="px-3.5 py-2 rounded-xl bg-[#1A1C1E] hover:bg-[#202225] border border-[#2C2E33] hover:border-[#FF6B00]/40 text-xs text-gray-300 hover:text-white flex items-center gap-2 transition-all shadow-sm"
          >
            <span className="animate-spin-slow">🔄</span>
            <span>{syncStatus === "Syncing..." ? "Refreshing Live Data..." : "Sync Database"}</span>
          </button>
        </div>
      </div>

      {/* Stats KPI 8-card grid */}
      <StatCards />

      {/* Analytics Charts & Live Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DeliveryChart />
        <RecentOrders />
      </div>
    </div>
  );
}

export default Dashboard;
