import { useState, useEffect } from "react";
import api from "../../api/api";

function formatOrderItem(item) {
  if (!item) return "";
  return item.replace(/\s*\(Qty:\s*\d+\)/i, "").trim();
}

function getOrderQuantity(order, products) {
  const savedQuantity = Number(order.quantity);
  if (Number.isInteger(savedQuantity) && savedQuantity > 1) return savedQuantity;

  const itemQuantity = order.item?.match(/\(Qty:\s*(\d+)\)/i);
  if (itemQuantity) return Number(itemQuantity[1]);

  const product = products.find(
    ({ name }) => name?.trim().toLowerCase() === order.item?.trim().toLowerCase()
  );
  const calculatedQuantity = Number(order.amount) / Number(product?.price);

  if (Number.isInteger(calculatedQuantity) && calculatedQuantity > 1) {
    return calculatedQuantity;
  }

  return Number.isInteger(savedQuantity) && savedQuantity > 0 ? savedQuantity : 1;
}

function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = () => {
    setLoading(true);
    Promise.all([api.get("/orders/my"), api.get("/products")])
      .then(([ordersResponse, productsResponse]) => {
        setOrders(ordersResponse.data || []);
        setProducts(productsResponse.data || []);
      })
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
              <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Qty</th>
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
                <td className="px-6 py-4 text-sm text-gray-800 font-medium">{formatOrderItem(order.item)}</td>
                <td className="px-4 py-4 text-center">
                  <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
                    {getOrderQuantity(order, products)}
                  </span>
                </td>
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
