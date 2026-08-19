import { useEffect, useState } from "react";
import api from "../../../api/api";

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

  // Supports older orders that were saved with quantity 1 and a multiplied total.
  if (Number.isInteger(calculatedQuantity) && calculatedQuantity > 1) {
    return calculatedQuantity;
  }

  return Number.isInteger(savedQuantity) && savedQuantity > 0 ? savedQuantity : 1;
}

function OrderTable({ orders: propOrders, availableDPs: propAvailableDPs, onAssign: propOnAssign, onDelete: propOnDelete, refreshTrigger }) {
  const [orders, setOrders] = useState([]);
  const [availableDPs, setAvailableDPs] = useState([]);
  const [products, setProducts] = useState([]);

  const fetchOrdersAndDPs = () => {
    api.get("/orders")
      .then(res => {
        setOrders(res.data || []);
      })
      .catch(err => {
        console.error("Error fetching orders:", err);
      });

    // Fetch ALL drivers so drivers can be selected and changed freely
    api.get("/delivery")
      .then(res => {
        setAvailableDPs(res.data || []);
      })
      .catch(err => {
        console.error("Error fetching delivery persons:", err);
      });

    api.get("/products")
      .then(res => setProducts(res.data || []))
      .catch(err => console.error("Error fetching products:", err));
  };

  useEffect(() => {
    if (propOrders) {
      setOrders(propOrders);
    } else {
      fetchOrdersAndDPs();
    }
  }, [propOrders, refreshTrigger]);

  useEffect(() => {
    if (propAvailableDPs) {
      setAvailableDPs(propAvailableDPs);
    } else if (!propOrders) {
      api.get("/delivery")
        .then(res => {
          setAvailableDPs(res.data || []);
        })
        .catch(err => {
          console.error("Error fetching delivery persons:", err);
        });
    }
  }, [propAvailableDPs, propOrders]);

  const handleAssign = (orderId, dpId) => {
    if (propOnAssign) {
      propOnAssign(orderId, dpId);
    } else {
      api.post("/delivery/assign", { orderId, dpId: dpId || null })
        .then(() => {
          fetchOrdersAndDPs();
        })
        .catch(err => {
          console.error("Error assigning DP:", err);
        });
    }
  };

  const handleStatusChange = (orderId, newStatus) => {
    api.patch(`/delivery/order/${orderId}/status`, { status: newStatus })
      .then(() => {
        fetchOrdersAndDPs();
      })
      .catch(err => {
        console.error("Error updating order status:", err);
        alert("Failed to update status: " + (err.response?.data?.message || err.message));
      });
  };

  const handleDelete = (orderId) => {
    if (window.confirm(`Are you sure you want to delete Order #${orderId}?`)) {
      if (propOnDelete) {
        propOnDelete(orderId);
      } else {
        api.delete(`/orders/${orderId}`)
          .then(() => {
            fetchOrdersAndDPs();
          })
          .catch(err => {
            console.error("Error deleting order:", err);
            alert("Failed to delete order: " + (err.response?.data?.message || err.message));
          });
      }
    }
  };

  const rawOrders = propOrders || orders;
  const displayOrders = [...rawOrders].sort((a, b) => Number(a.id) - Number(b.id));
  const displayDPs = propAvailableDPs || availableDPs;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Order ID</th>
            <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Customer</th>
            <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Item</th>
            <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Qty</th>
            <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
            <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Amount</th>
            <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Driver</th>
            <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {displayOrders.map((order) => (
            <tr key={order.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 text-sm font-medium text-blue-600">{order.id}</td>
              <td className="px-6 py-4 text-sm text-gray-800 font-medium">{order.customer_name || "customer"}</td>
              <td className="px-6 py-4 text-sm text-gray-600">{formatOrderItem(order.item)}</td>
              <td className="px-4 py-4 text-center">
                <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
                  {getOrderQuantity(order, products)}
                </span>
              </td>
              <td className="px-6 py-4">
                <select
                  value={order.delivery_status || "pending"}
                  onChange={(e) => handleStatusChange(order.id, e.target.value)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold border-0 cursor-pointer focus:ring-2 focus:ring-blue-400 outline-none transition-colors ${
                    order.delivery_status === 'delivered' ? 'bg-green-100 text-green-800' :
                    order.delivery_status === 'assigned' ? 'bg-blue-100 text-blue-800' :
                    order.delivery_status === 'cancelled' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  <option value="pending" className="bg-white text-gray-800">pending</option>
                  <option value="assigned" className="bg-white text-gray-800">assigned</option>
                  <option value="delivered" className="bg-white text-gray-800">delivered</option>
                  <option value="cancelled" className="bg-white text-gray-800">cancelled</option>
                </select>
              </td>
              <td className="px-6 py-4 text-sm font-medium text-gray-900">
                Rs.{Number(order.amount || 0).toLocaleString()}
              </td>
              <td className="px-6 py-4">
                <select
                  value={order.delivery_person_id || ""}
                  onChange={(e) => handleAssign(order.id, e.target.value)}
                  className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm font-medium text-gray-700 bg-white hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                >
                  <option value="">Assign driver</option>
                  {displayDPs.map((dp) => (
                    <option key={dp.id} value={dp.id}>
                      {dp.name}
                    </option>
                  ))}
                </select>
              </td>
              <td className="px-6 py-4 text-right">
                <button onClick={() => handleDelete(order.id)} className="text-red-600 hover:text-red-800 text-sm font-medium bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-md transition-colors border border-red-200">
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {displayOrders.length === 0 && (
        <div className="text-center py-8 text-gray-500">No orders found in the database.</div>
      )}
    </div>
  );
}

export default OrderTable;
