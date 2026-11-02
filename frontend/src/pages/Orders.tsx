import { useState, FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import OrderTable from "../components/orders/OrderTable";
import api from "../../api/api";

export function createOrder(item: string, amount: string | number) {
  return api.post("/orders", { item: item.trim(), amount: Number(amount) });
}

function Orders() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showModal, setShowModal] = useState(false);
  const [item, setItem] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const statusFilter = searchParams.get("status") || "all";
  const filterLabel = statusFilter === "all" ? "All Shipments" : `${statusFilter[0].toUpperCase()}${statusFilter.slice(1)} Shipments`;

  const handleAddOrder = (e: FormEvent) => {
    e.preventDefault();
    if (!item.trim() || !amount || Number(amount) < 0) {
      setError("Please provide a valid product name and non-negative amount.");
      return;
    }

    setLoading(true);
    setError("");

    createOrder(item, amount)
      .then(() => {
        setItem("");
        setAmount("");
        setShowModal(false);
        setRefreshTrigger(prev => prev + 1);
      })
      .catch(err => {
        setError(err.response?.data?.message || "Failed to create order");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#303236]">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#FF6B00] mb-1">
            <span className="w-2 h-2 rounded-full bg-[#FF6B00] shadow-glow-sm"></span>
            Fulfillment & Shipments
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Order Management
          </h2>
          <p className="text-xs sm:text-sm text-[#A5A5A5] mt-0.5">
            Monitor real-time electronics dispatch pipelines, assign couriers, and track package shipments.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#FF6B00] to-[#FF8A24] hover:from-[#FF8A24] hover:to-[#FF6B00] text-white text-xs font-bold uppercase tracking-wider shadow-glow-sm transition-all flex items-center justify-center gap-2 self-start sm:self-auto"
        >
          <span>+</span>
          <span>Create Custom Order</span>
        </button>
      </div>

      {/* Error alert */}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs p-4 rounded-xl flex items-center gap-2">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Filter status banner if filtered */}
      {statusFilter !== "all" && (
        <div className="flex items-center justify-between rounded-xl border border-[#FF6B00]/30 bg-[#FF6B00]/10 px-4 py-3 text-xs text-white">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#FF6B00]"></span>
            <span>Active Filter: <strong className="text-[#FF6B00]">{filterLabel}</strong></span>
          </div>
          <button 
            type="button" 
            onClick={() => setSearchParams({})} 
            className="text-xs text-[#A5A5A5] hover:text-white underline font-medium"
          >
            Clear Filter (Show All)
          </button>
        </div>
      )}

      {/* Main Order Table */}
      <OrderTable refreshTrigger={refreshTrigger} statusFilter={statusFilter} />

      {/* Create Order Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#191A1C] border border-[#303236] rounded-2xl shadow-card w-full max-w-md p-6 relative">
            <div className="flex justify-between items-center pb-4 border-b border-[#303236] mb-5">
              <div>
                <span className="text-[10px] font-bold text-[#FF6B00] uppercase tracking-wider">Manual Dispatch</span>
                <h3 className="text-lg font-extrabold text-white">Create Custom Order</h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-lg bg-[#202225] text-[#A5A5A5] hover:text-white flex items-center justify-center border border-[#303236]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddOrder} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#A5A5A5] mb-2">
                  Item Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mechanical RGB Gaming Keyboard (Qty: 1)"
                  value={item}
                  onChange={(e) => setItem(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#202225] border border-[#303236] rounded-xl text-white text-xs placeholder-[#A5A5A5] focus:outline-none focus:border-[#FF6B00]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#A5A5A5] mb-2">
                  Total Amount (₹)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 3499"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#202225] border border-[#303236] rounded-xl text-white text-xs placeholder-[#A5A5A5] focus:outline-none focus:border-[#FF6B00]"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#303236]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#A5A5A5] hover:text-white rounded-xl bg-[#202225] border border-[#303236]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 text-xs font-bold uppercase tracking-wider text-white bg-gradient-to-r from-[#FF6B00] to-[#FF8A24] rounded-xl shadow-glow-sm disabled:opacity-50"
                >
                  {loading ? "Registering..." : "Submit Order"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Orders;
