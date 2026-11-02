import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../api/api";

interface StatCardsProps {
  onFilterClick?: (filter: string) => void;
}

export default function StatCards({ onFilterClick }: StatCardsProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    totalOrders: 0,
    deliveredOrders: 0,
    pendingOrders: 0,
    cancelledOrders: 0,
    activeDeliveries: 0,
    totalCollectedRevenue: 0,
    totalGrossOrderValue: 0,
    totalCustomers: 0,
    totalDeliveryPartners: 0,
  });

  const fetchStats = () => {
    api.get("/dashboard/stats")
      .then(res => {
        if (res.data && res.data.stats) {
          const s = res.data.stats;
          setData({
            totalOrders: Number(s.totalOrders || 0),
            deliveredOrders: Number(s.deliveredOrders || 0),
            pendingOrders: Number(s.pendingOrders || 0),
            cancelledOrders: Number(s.cancelledOrders || 0),
            activeDeliveries: Number(s.activeDeliveries || 0),
            totalCollectedRevenue: Number(s.totalCollectedRevenue || 0),
            totalGrossOrderValue: Number(s.totalGrossOrderValue || 0),
            totalCustomers: Number(s.totalCustomers || 0),
            totalDeliveryPartners: Number(s.totalDeliveryPartners || 0),
          });
        }
      })
      .catch(err => console.error("Error fetching live dashboard metrics:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStats();
    // Live polling every 25 seconds for real-time status updates
    const timer = setInterval(fetchStats, 25000);
    return () => clearInterval(timer);
  }, []);

  const stats = [
    {
      title: "Total Orders",
      value: data.totalOrders,
      filter: "all",
      badge: "Real Ledger",
      badgeColor: "text-[#FF8A24] bg-[#FF6B00]/10 border border-[#FF6B00]/20",
      isCurrency: false,
    },
    {
      title: "Total Sales Revenue",
      value: data.totalCollectedRevenue,
      filter: "paid",
      badge: "Collected",
      badgeColor: "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20",
      isCurrency: true,
      note: "Excludes cancelled & uncollected",
    },
    {
      title: "Active Transit",
      value: data.activeDeliveries,
      filter: "assigned",
      badge: "In Route",
      badgeColor: "text-blue-400 bg-blue-500/10 border border-blue-500/20",
      isCurrency: false,
    },
    {
      title: "Warehouse Pending",
      value: data.pendingOrders,
      filter: "pending",
      badge: "Awaiting Pick",
      badgeColor: "text-amber-400 bg-amber-500/10 border border-amber-500/20",
      isCurrency: false,
    },
    {
      title: "Successfully Delivered",
      value: data.deliveredOrders,
      filter: "delivered",
      badge: "Fulfilled",
      badgeColor: "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20",
      isCurrency: false,
    },
    {
      title: "Cancelled / Returns",
      value: data.cancelledOrders,
      filter: "cancelled",
      badge: "Excluded",
      badgeColor: "text-rose-400 bg-rose-500/10 border border-rose-500/20",
      isCurrency: false,
    },
    {
      title: "Active Customers",
      value: data.totalCustomers,
      filter: "customers",
      badge: "Registered",
      badgeColor: "text-purple-400 bg-purple-500/10 border border-purple-500/20",
      isCurrency: false,
      isUserRoute: true,
    },
    {
      title: "Delivery Fleet",
      value: data.totalDeliveryPartners,
      filter: "delivery",
      badge: "Roster Active",
      badgeColor: "text-[#FF8A24] bg-[#FF6B00]/10 border border-[#FF6B00]/20",
      isCurrency: false,
      isDeliveryRoute: true,
    },
  ];

  const handleCardClick = (stat: typeof stats[0]) => {
    if (stat.isUserRoute) {
      navigate("/users");
    } else if (stat.isDeliveryRoute) {
      navigate("/delivery");
    } else {
      if (onFilterClick) {
        onFilterClick(stat.filter);
      } else {
        navigate(stat.filter === "all" ? "/orders" : `/orders?status=${stat.filter}`);
      }
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <button
          key={index}
          type="button"
          onClick={() => handleCardClick(stat)}
          className="bg-[#1A1C1E] hover:bg-[#202225] border border-[#2C2E33] hover:border-[#FF6B00]/50 rounded-[20px] p-5 text-left transition-all duration-200 group text-white shadow-card flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                {stat.title}
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${stat.badgeColor}`}>
                {stat.badge}
              </span>
            </div>

            <div className="flex items-baseline justify-between mt-2">
              <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {loading ? "..." : stat.isCurrency ? `₹${stat.value.toLocaleString()}` : stat.value.toLocaleString()}
              </h3>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 mt-3 border-t border-[#2C2E33]/60 text-[11px] text-gray-400">
            <span>{stat.note || "Live verified count"}</span>
            <span className="text-gray-400 group-hover:text-[#FF8A24] font-semibold transition-colors">
              Inspect →
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}
