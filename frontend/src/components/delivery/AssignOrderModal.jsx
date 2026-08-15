import { useEffect, useState } from "react";
import api from "../../../api/api";

function AssignOrderModal({ driver, onClose, onSuccess }) {
  const [unassignedOrders, setUnassignedOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get("/orders/unassigned/list")
      .then(res => setUnassignedOrders(res.data || []))
      .catch(err => console.error("Error fetching unassigned orders:", err));
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedOrderId) return;
    setLoading(true);

    api.post("/delivery/assign", { orderId: selectedOrderId, dpId: driver.id })
      .then(() => {
        onSuccess();
        onClose();
      })
      .catch(err => alert("Failed to assign order: " + (err.response?.data?.message || err.message)))
      .finally(() => setLoading(false));
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 relative">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-xl font-bold text-gray-800">Assign Order to {driver.name}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-bold p-1">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Pending Order</label>
            {unassignedOrders.length === 0 ? (
              <p className="text-sm text-gray-500 py-3 bg-gray-50 rounded-lg text-center">No unassigned orders available.</p>
            ) : (
              <select
                value={selectedOrderId}
                onChange={(e) => setSelectedOrderId(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                required
              >
                <option value="">-- Select an Order --</option>
                {unassignedOrders.map((o) => (
                  <option key={o.id} value={o.id}>
                    Order #{o.id} - {o.item} (Rs. {Number(o.amount).toLocaleString()})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
            <button
              type="submit"
              disabled={loading || unassignedOrders.length === 0}
              className="px-5 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
            >
              {loading ? "Assigning..." : "Assign Order"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AssignOrderModal;
