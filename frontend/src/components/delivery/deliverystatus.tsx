import { useEffect, useState } from "react";
import api from "../../../api/api";
import DeliveryPersonCard from "./DeliveryPersonCard";
import AddPersonModal from "./AddPersonModal";
import AssignOrderModal from "./AssignOrderModal";

interface DPStats {
  totalPartners: number;
  availablePartners: number;
  activeOnDelivery: number;
  offlinePartners: number;
  suspendedPartners: number;
  totalCompletedDeliveries: number;
}

function DeliveryStatus() {
  const [deliveryPersons, setDeliveryPersons] = useState<any[]>([]);
  const [stats, setStats] = useState<DPStats>({
    totalPartners: 0,
    availablePartners: 0,
    activeOnDelivery: 0,
    offlinePartners: 0,
    suspendedPartners: 0,
    totalCompletedDeliveries: 0,
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [assigningDriver, setAssigningDriver] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const fetchOverviewAndDPs = () => {
    setLoading(true);

    // Fetch delivery overview summary
    api.get("/delivery/overview")
      .then(res => {
        if (res.data) {
          setStats(res.data);
        }
      })
      .catch(err => console.error("Error fetching DP overview stats:", err));

    // Fetch delivery persons list
    api.get("/delivery")
      .then(res => {
        if (Array.isArray(res.data)) {
          setDeliveryPersons(res.data.map((p: any) => ({
            id: p.id,
            name: p.name,
            phone: p.phone,
            email: p.email,
            vehicle_type: p.vehicle_type || "Motorcycle",
            vehicle_number: p.vehicle_number || "TN-01-EXP",
            rawStatus: p.status,
            status: p.status === "busy" ? "On Delivery" : (p.status === "available" ? "Available" : (p.status === "suspended" ? "Suspended" : "Offline")),
            activeOrdersCount: Number(p.active_orders_count || 0),
            deliveries: Number(p.total_deliveries || 0),
            rating: p.rating ? String(p.rating) : "4.9"
          })));
        }
      })
      .catch(err => console.error("Error fetching delivery persons:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => { 
    fetchOverviewAndDPs(); 
    const interval = setInterval(fetchOverviewAndDPs, 25000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleStatus = (id: number, newStatus: string) => {
    api.patch(`/delivery/${id}/status`, { status: newStatus })
      .then(fetchOverviewAndDPs)
      .catch(err => alert("Failed to change status: " + (err.response?.data?.message || err.message)));
  };

  const handleRemoveDP = (id: number, name: string) => {
    if (window.confirm(`Are you sure you want to remove or deactivate partner "${name}"?`)) {
      api.delete(`/delivery/${id}`)
        .then(() => fetchOverviewAndDPs())
        .catch(err => alert("Failed: " + (err.response?.data?.message || err.message)));
    }
  };

  const filteredPartners = deliveryPersons.filter((p) => {
    if (filterMode === "available" && p.status !== "Available") return false;
    if (filterMode === "busy" && p.status !== "On Delivery") return false;
    if (filterMode === "offline" && p.status !== "Offline") return false;
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      p.name.toLowerCase().includes(term) ||
      (p.phone || "").toLowerCase().includes(term) ||
      (p.vehicle_type || "").toLowerCase().includes(term) ||
      (p.vehicle_number || "").toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#303236]">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#FF6B00] mb-1">
            <span className="w-2 h-2 rounded-full bg-[#FF6B00] shadow-glow-sm"></span>
            Fleet Operations & Courier Network
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Delivery Partner Management
          </h2>
          <p className="text-xs sm:text-sm text-[#A5A5A5] mt-0.5">
            Real-time courier availability, route dispatching, vehicle details, and historical delivery performance.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#FF6B00] to-[#FF8A24] hover:from-[#FF8A24] hover:to-[#FF6B00] text-white text-xs font-bold uppercase tracking-wider shadow-glow-sm transition-all flex items-center justify-center gap-2 self-start sm:self-auto"
          >
            <span>+</span>
            <span>Register New Partner</span>
          </button>
        </div>
      </div>

      {/* Fleet KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Partners */}
        <div className="bg-[#202225] rounded-2xl p-4 sm:p-5 border border-[#303236] shadow-card flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Fleet</p>
            <p className="text-2xl sm:text-3xl font-black text-white mt-1">{stats.totalPartners}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#191A1C] border border-[#303236] flex items-center justify-center text-[#FF6B00] font-bold">
            🛵
          </div>
        </div>

        {/* Available Standby */}
        <div className="bg-[#202225] rounded-2xl p-4 sm:p-5 border border-emerald-500/20 shadow-card flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Ready Standby</p>
            <p className="text-2xl sm:text-3xl font-black text-white mt-1">{stats.availablePartners}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">
            🟢
          </div>
        </div>

        {/* Active on Delivery */}
        <div className="bg-[#202225] rounded-2xl p-4 sm:p-5 border border-orange-500/20 shadow-card flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-[#FF6B00] uppercase tracking-wider">On Delivery</p>
            <p className="text-2xl sm:text-3xl font-black text-white mt-1">{stats.activeOnDelivery}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-[#FF6B00] font-bold">
            🚀
          </div>
        </div>

        {/* Offline */}
        <div className="bg-[#202225] rounded-2xl p-4 sm:p-5 border border-[#303236] shadow-card flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-[#A5A5A5] uppercase tracking-wider">Offline / Off-Shift</p>
            <p className="text-2xl sm:text-3xl font-black text-[#A5A5A5] mt-1">{stats.offlinePartners}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#191A1C] border border-[#303236] flex items-center justify-center text-[#A5A5A5] font-bold">
            ⏸️
          </div>
        </div>

        {/* Total Deliveries completed */}
        <div className="bg-[#202225] rounded-2xl p-4 sm:p-5 border border-emerald-500/20 shadow-card flex items-center justify-between col-span-2 lg:col-span-1">
          <div>
            <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Completed Trips</p>
            <p className="text-2xl sm:text-3xl font-black text-white mt-1">{stats.totalCompletedDeliveries}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">
            🏁
          </div>
        </div>
      </div>

      {/* Toolbar: Search and Filter Tabs */}
      <div className="bg-[#1A1C1E] p-4 rounded-2xl border border-[#2C2E33] flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Search partners by name, phone or vehicle..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3.5 py-2.5 pl-9 rounded-xl bg-[#0F1012] border border-[#2C2E33] text-white text-xs placeholder-[#6B7280] focus:outline-none focus:border-[#FF6B00]"
          />
          <span className="absolute left-3 top-3 text-[#6B7280] text-xs">🔍</span>
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto overflow-x-auto w-full sm:w-auto">
          {[
            { id: "all", label: "All Couriers" },
            { id: "available", label: "Ready (Available)" },
            { id: "busy", label: "On Route (Active)" },
            { id: "offline", label: "Offline" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterMode(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                filterMode === tab.id
                  ? "bg-[#FF6B00] text-white shadow-sm"
                  : "bg-[#0F1012] text-gray-400 hover:text-white border border-[#2C2E33]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Partner Cards Grid */}
      {loading ? (
        <div className="py-16 text-center text-[#A5A5A5]">
          <div className="inline-block w-8 h-8 border-2 border-[#FF6B00] border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="font-semibold text-white">Syncing courier roster from database...</p>
        </div>
      ) : filteredPartners.length === 0 ? (
        <div className="bg-[#202225] rounded-2xl p-12 text-center border border-[#303236] text-[#A5A5A5]">
          <span className="text-4xl block mb-2">🛵</span>
          <p className="font-semibold text-white">No delivery partners found.</p>
          <p className="text-xs mt-1">Try resetting the search or filter mode above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPartners.map((person) => (
            <DeliveryPersonCard
              key={person.id}
              person={person}
              onAssignOrder={setAssigningDriver}
              onToggleStatus={handleToggleStatus}
              onRemove={handleRemoveDP}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {showAddModal && (
        <AddPersonModal 
          onClose={() => setShowAddModal(false)} 
          onSuccess={fetchOverviewAndDPs} 
        />
      )}
      {assigningDriver && (
        <AssignOrderModal 
          driver={assigningDriver} 
          onClose={() => setAssigningDriver(null)} 
          onSuccess={fetchOverviewAndDPs} 
        />
      )}
    </div>
  );
}

export default DeliveryStatus;
