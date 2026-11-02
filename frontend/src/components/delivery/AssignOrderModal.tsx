import { useEffect, useState, FormEvent } from "react";
import api from "../../../api/api";

interface AssignOrderModalProps {
  driver: any;
  onClose: () => void;
  onSuccess: () => void;
}

function AssignOrderModal({ driver, onClose, onSuccess }: AssignOrderModalProps) {
  const [unassignedOrders, setUnassignedOrders] = useState<any[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get("/orders/unassigned/list")
      .then(res => setUnassignedOrders(res.data || []))
      .catch(err => console.error("Error fetching unassigned orders:", err));
  }, []);

  const handleSubmit = (e: FormEvent) => {
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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#191A1C] border border-[#303236] rounded-2xl shadow-card w-full max-w-md p-6 relative">
        <div className="flex justify-between items-center pb-4 border-b border-[#303236] mb-5">
          <div>
            <span className="text-[10px] font-bold text-[#FF6B00] uppercase tracking-wider">Courier Dispatch</span>
            <h3 className="text-lg font-extrabold text-white">Assign to {driver.name}</h3>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-lg bg-[#202225] text-[#A5A5A5] hover:text-white flex items-center justify-center border border-[#303236]"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#A5A5A5] mb-2">
              Select Awaiting Shipment
            </label>
            {unassignedOrders.length === 0 ? (
              <p className="text-xs text-[#A5A5A5] py-4 bg-[#202225] rounded-xl text-center border border-[#303236]">
                All pending shipments currently have couriers assigned!
              </p>
            ) : (
              <select
                value={selectedOrderId}
                onChange={(e) => setSelectedOrderId(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#202225] border border-[#303236] rounded-xl text-white text-xs focus:outline-none focus:border-[#FF6B00]"
                required
              >
                <option value="">-- Choose Shipment to Route --</option>
                {unassignedOrders.map((o) => (
                  <option key={o.id} value={o.id}>
                    #{o.id} • {o.item} (₹{Number(o.amount).toLocaleString()})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[#303236]">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-4 py-2 text-xs font-semibold text-[#A5A5A5] hover:text-white rounded-xl bg-[#202225] border border-[#303236]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || unassignedOrders.length === 0}
              className="px-5 py-2 text-xs font-bold uppercase tracking-wider text-white bg-gradient-to-r from-[#FF6B00] to-[#FF8A24] rounded-xl shadow-glow-sm disabled:opacity-50"
            >
              {loading ? "Routing..." : "Confirm Dispatch"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AssignOrderModal;
