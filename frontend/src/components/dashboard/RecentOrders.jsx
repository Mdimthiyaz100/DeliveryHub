import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../../api/api";
import StatusBadge from "../common/StatusBadge";

function RecentOrders() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    api.get("/dashboard/stats").then(res => {
        if (res.data && res.data.recentOrders) {
          const mapped = res.data.recentOrders.map(item => ({
            id: `#ORD${String(item.id).padStart(3, '0')}`,
            customer: item.customer_name || "user",
            driver: item.delivery_person_name || "—",
            status: item.delivery_status || "Pending",
            amount: `₹${Number(item.amount || 0).toLocaleString()}`
          }));
          setOrders(mapped);
        }
      })
      .catch(err => {
        console.error("Error fetching recent orders:", err);
      });
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
        <h3 className="font-semibold text-gray-800">Recent Orders</h3>
        <Link to="/orders" className="text-blue-600 text-sm font-medium hover:underline flex items-center gap-1">
          View All →
        </Link>
      </div>
      
      <table className="w-full table-fixed">
        <thead className="bg-gray-50">
          <tr>
            <th className="w-[19%] text-left px-3 py-3 text-xs font-medium text-gray-500 uppercase">Order ID</th>
            <th className="w-[30%] text-left px-3 py-3 text-xs font-medium text-gray-500 uppercase">Customer</th>
            <th className="w-[20%] text-left px-3 py-3 text-xs font-medium text-gray-500 uppercase">Driver</th>
            <th className="w-[20%] text-left px-3 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
            <th className="w-[11%] text-right px-3 py-3 text-xs font-medium text-gray-500 uppercase">Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {orders.map((order) => (
            <tr key={order.id} className="hover:bg-gray-50">
              <td className="px-3 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">{order.id}</td>
              <td className="px-3 py-3 text-sm text-gray-600">
                <div className="font-medium truncate">{order.customer}</div>
                <div className="text-xs text-gray-400 truncate">{order.phone}</div>
              </td>
              <td className="px-4 py-3 text-sm text-gray-700">{order.driver || "—"}</td>
              <td className="px-3 py-3 whitespace-nowrap"><StatusBadge status={order.status} /></td>
              <td className="px-3 py-3 text-right text-sm font-medium text-gray-900 whitespace-nowrap">{order.amount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default RecentOrders;
