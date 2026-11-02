import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../../api/api";
import StatusBadge from "../common/StatusBadge";

interface RecentOrder {
  id: number;
  customer: string;
  email?: string;
  phone?: string;
  item: string;
  driver: string;
  status: string;
  payment_status: string;
  amount: number;
  date: string;
}

export default function RecentOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecent = () => {
    api.get("/dashboard/stats")
      .then(res => {
        if (res.data && res.data.recentOrders) {
          const mapped = res.data.recentOrders.map((item: any) => ({
            id: item.id,
            customer: item.customer_name || "Customer",
            email: item.customer_email || "",
            phone: item.phone || "",
            item: item.item || "Electronics",
            driver: item.delivery_person_name || "Unassigned",
            status: item.delivery_status || "Pending",
            payment_status: item.payment_status || "pending",
            amount: Number(item.amount || 0),
            date: item.created_at ? new Date(item.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric" }) : "Today"
          }));
          setOrders(mapped);
        }
      })
      .catch(err => console.error("Error fetching recent transactions:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRecent();
    const interval = setInterval(fetchRecent, 25000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-[#1A1C1E] rounded-[22px] border border-[#2C2E33] shadow-card overflow-hidden flex flex-col justify-between text-white">
      {/* Table Header */}
      <div className="px-5 py-4 border-b border-[#2C2E33] flex justify-between items-center bg-[#141619]">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-[#FF6B00]">Live Dispatches</span>
          <h3 className="font-extrabold text-base text-white">Recent Transactions</h3>
        </div>
        <Link 
          to="/orders" 
          className="text-xs font-bold text-[#FF8A24] hover:text-[#FF6B00] flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FF6B00]/10 border border-[#FF6B00]/20 transition-all hover:bg-[#FF6B00]/20"
        >
          View Full Ledger →
        </Link>
      </div>
      
      {/* Table */}
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full text-left">
          <thead className="bg-[#0F1012] text-[11px] font-bold uppercase tracking-wider text-gray-400 border-b border-[#2C2E33]">
            <tr>
              <th className="px-4 py-3">Order ID</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Delivery Partner</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2C2E33]/60 text-xs">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-gray-400">
                  <div className="inline-block w-6 h-6 border-2 border-[#FF6B00] border-t-transparent rounded-full animate-spin mb-2"></div>
                  <p>Loading live transactions...</p>
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-gray-400">
                  No recent dispatches in database.
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr 
                  key={order.id} 
                  onClick={() => navigate(`/orders`)}
                  className="hover:bg-white/5 transition-colors cursor-pointer group"
                >
                  <td className="px-4 py-3.5 font-bold text-[#FF8A24] whitespace-nowrap">
                    <span className="group-hover:underline">#{String(order.id).padStart(5, '0')}</span>
                    <span className="block text-[10px] text-gray-500 font-normal">{order.date}</span>
                  </td>
                  <td className="px-4 py-3.5 text-white">
                    <span className="font-semibold block truncate max-w-[130px]">{order.customer}</span>
                    <span className="text-[10px] text-gray-400 truncate max-w-[130px] block">{order.item}</span>
                  </td>
                  <td className="px-4 py-3.5 text-gray-300 whitespace-nowrap">
                    <span className="font-medium text-white block">{order.driver}</span>
                    <span className="text-[10px] text-gray-500">Express Courier</span>
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-4 py-3.5 text-right whitespace-nowrap">
                    <span className="font-extrabold text-white block">
                      ₹{order.amount.toLocaleString()}
                    </span>
                    <span className={`text-[9px] font-bold uppercase ${order.payment_status === 'paid' ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {order.payment_status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="px-5 py-3 bg-[#141619] border-t border-[#2C2E33] text-[11px] text-gray-400 flex justify-between items-center">
        <span>Displaying latest database order events</span>
        <span className="text-emerald-400 font-medium flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          Database Connected
        </span>
      </div>
    </div>
  );
}
