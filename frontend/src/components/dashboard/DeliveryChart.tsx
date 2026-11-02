import { useEffect, useState } from "react";
import api from "../../../api/api";

interface SalesPoint {
  date: string;
  ordersCount: number;
  deliveredCount: number;
  pendingCount: number;
  revenue: number;
}

export default function DeliveryChart() {
  const [range, setRange] = useState<"7d" | "30d" | "90d" | "1y">("30d");
  const [timeline, setTimeline] = useState<SalesPoint[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalVolume, setTotalVolume] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchChart = (selectedRange: string) => {
    setLoading(true);
    api.get(`/dashboard/stats?range=${selectedRange}`)
      .then(res => {
        if (res.data) {
          const points = (res.data.salesTimeline || []).map((p: any) => ({
            date: p.date,
            ordersCount: Number(p.ordersCount || 0),
            deliveredCount: Number(p.deliveredCount || 0),
            pendingCount: Number(p.pendingCount || 0),
            revenue: Number(p.revenue || 0),
          }));
          setTimeline(points);

          const sumRev = points.reduce((acc: number, p: SalesPoint) => acc + p.revenue, 0);
          const sumVol = points.reduce((acc: number, p: SalesPoint) => acc + p.ordersCount, 0);
          setTotalRevenue(sumRev || Number(res.data.stats?.totalCollectedRevenue || 0));
          setTotalVolume(sumVol || Number(res.data.stats?.totalOrders || 0));
        }
      })
      .catch(err => console.error("Error fetching sales timeline:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchChart(range);
  }, [range]);

  // Max scale calculation
  const maxRevenue = Math.max(...timeline.map(d => d.revenue), 1000);
  const maxVolume = Math.max(...timeline.map(d => d.ordersCount), 5);

  return (
    <div className="bg-[#1A1C1E] rounded-[22px] border border-[#2C2E33] p-5 sm:p-6 shadow-card flex flex-col justify-between text-white">
      {/* Header with Title and Range Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#2C2E33]">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-[#FF6B00]">Real Sales & Revenue Analytics</span>
          <h3 className="font-extrabold text-base sm:text-lg text-white">Dispatch Velocity & Revenue</h3>
        </div>

        {/* Range Buttons */}
        <div className="flex items-center gap-1 bg-[#0F1012] p-1 rounded-xl border border-[#2C2E33] self-start sm:self-auto">
          {(["7d", "30d", "90d", "1y"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={`px-3 py-1 rounded-lg text-xs font-bold uppercase transition-all ${
                range === r
                  ? "bg-[#FF6B00] text-white shadow-sm"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-2 gap-4 py-4 border-b border-[#2C2E33]/50">
        <div>
          <span className="text-[11px] text-gray-400 font-medium">Period Real Revenue</span>
          <p className="text-xl sm:text-2xl font-black text-white mt-0.5">
            ₹{totalRevenue.toLocaleString()}
          </p>
        </div>
        <div className="text-right">
          <span className="text-[11px] text-gray-400 font-medium">Period Orders Logged</span>
          <p className="text-xl sm:text-2xl font-black text-[#FF8A24] mt-0.5">
            {totalVolume} <span className="text-xs font-normal text-gray-400">shipments</span>
          </p>
        </div>
      </div>

      {/* Dynamic Graph Area */}
      <div className="py-4">
        {loading ? (
          <div className="h-48 flex items-center justify-center text-gray-400">
            <div className="inline-block w-6 h-6 border-2 border-[#FF6B00] border-t-transparent rounded-full animate-spin mr-2"></div>
            <span className="text-xs">Computing database metrics...</span>
          </div>
        ) : timeline.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-gray-400 bg-[#0F1012] rounded-xl border border-[#2C2E33]/60 p-4">
            <span className="text-2xl mb-1">📊</span>
            <p className="text-xs font-bold text-white">No sales transactions in this period</p>
            <p className="text-[11px] text-gray-500 mt-0.5">Orders placed will automatically chart here in real-time.</p>
          </div>
        ) : (
          <div className="flex items-end justify-between h-52 gap-2 sm:gap-3 pt-6 pb-2">
            {timeline.map((point) => {
              const dateObj = new Date(point.date);
              const dayLabel = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" });
              const revHeight = Math.min(100, Math.max(12, Math.round((point.revenue / maxRevenue) * 100)));
              const volHeight = Math.min(100, Math.max(8, Math.round((point.ordersCount / maxVolume) * 100)));

              return (
                <div key={point.date} className="flex-1 flex flex-col items-center gap-2 group min-w-[28px]">
                  {/* Bar Container */}
                  <div className="w-full flex gap-1 justify-center items-end h-40 bg-[#0F1012] rounded-xl p-1 border border-[#2C2E33]/60 relative">
                    {/* Tooltip on hover */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-12 bg-[#202225] border border-[#2C2E33] rounded-lg px-2 py-1 text-[10px] text-white whitespace-nowrap shadow-xl z-20 pointer-events-none">
                      <p className="font-bold text-[#FF8A24]">₹{point.revenue.toLocaleString()}</p>
                      <p className="text-gray-300">{point.ordersCount} orders</p>
                    </div>

                    {/* Revenue Bar */}
                    <div
                      className="w-full max-w-[12px] bg-gradient-to-t from-[#FF6B00] to-[#FF8A24] rounded-t-sm transition-all duration-300"
                      style={{ height: `${revHeight}%` }}
                      title={`Revenue: ₹${point.revenue}`}
                    />
                    {/* Volume Bar */}
                    <div
                      className="w-full max-w-[12px] bg-emerald-500/80 rounded-t-sm transition-all duration-300"
                      style={{ height: `${volHeight}%` }}
                      title={`Orders: ${point.ordersCount}`}
                    />
                  </div>
                  <span className="text-[10px] font-semibold text-gray-400 group-hover:text-white transition-colors truncate max-w-[48px]">
                    {dayLabel}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Legend & Refresh Indicator */}
      <div className="pt-3 border-t border-[#2C2E33] flex flex-wrap items-center justify-between text-xs text-gray-400 gap-2">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-[#FF6B00] to-[#FF8A24]" />
            <span className="text-[11px] text-gray-300">Revenue (₹)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-[11px] text-gray-300">Order Volume</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Live Synchronized</span>
        </div>
      </div>
    </div>
  );
}
