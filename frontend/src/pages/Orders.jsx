import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import OrderTable from "../components/orders/OrderTable";
import api from "../../api/api";

function Orders() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showModal, setShowModal] = useState(false);
  const [item, setItem] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const statusFilter = searchParams.get("status") || "all";
  const filterLabel = statusFilter === "all" ? "All orders" : `${statusFilter[0].toUpperCase()}${statusFilter.slice(1)} orders`;

  const handleAddOrder = (e) => {
    e.preventDefault();
    if (!item.trim() || !amount || Number(amount) < 0) {
      setError("Please provide a valid item name and amount.");
      return;
    }

    setLoading(true);
    setError("");

    api.post("/orders", { item: item.trim(), amount: Number(amount) })
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
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Orders</h2>
          <p className="text-gray-500 mt-1">{statusFilter === "all" ? "Manage and track all customer orders" : `Showing ${filterLabel.toLowerCase()}`}</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-lg mb-4">
          ⚠️ {error}
        </div>
      )}

      {statusFilter !== "all" && (
        <div className="flex items-center justify-between rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          <span>Filter: <strong>{filterLabel}</strong></span>
          <button type="button" onClick={() => setSearchParams({})} className="font-medium hover:underline">Clear filter</button>
        </div>
      )}

      <OrderTable refreshTrigger={refreshTrigger} statusFilter={statusFilter} />
    </div>
  );
}

export default Orders;
