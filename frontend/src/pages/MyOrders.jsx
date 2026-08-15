import { useState, useEffect } from "react";
import api from "../../api/api";

function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = () => {
    setLoading(true);
    api
      .get("/orders/my")
      .then((res) => setOrders(res.data || []))
      .catch((err) => console.error("Error fetching orders:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const getStatusStyle = (status) => {
    switch (status) {
      case "delivered":
        return "bg-green-100 text-green-800";
      case "assigned":
        return "bg-blue-100 text-blue-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-500">Loading your orders...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">My Orders</h2>
          <p className="text-gray-500 mt-1">Track your order history and delivery status</p>
        </div>
        <button
          onClick={fetchOrders}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2.5 rounded-lg transition-colors flex items-center gap-2 shadow-sm"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Order ID</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Item</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Delivery Person</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Ordered On</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-blue-600">{order.id}</td>
                <td className="px-6 py-4 text-sm text-gray-800">{order.item}</td>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  Rs.{Number(order.amount || 0).toLocaleString()}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusStyle(order.delivery_status)}`}>
                    {order.delivery_status || "pending"}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {order.delivery_person_name || "Not assigned"}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {order.created_at
                    ? new Date(order.created_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "Recently"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {orders.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No orders yet. Start shopping to place your first order!
          </div>
        )}
      </div>
    </div>
  );
}

export default MyOrders;
