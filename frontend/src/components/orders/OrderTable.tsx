import { useEffect, useState } from "react";
import api from "../../../api/api";
import StatusBadge from "../common/StatusBadge";

interface OrderItem {
  id: number;
  item: string;
  amount: number | string;
  quantity?: number;
  delivery_status?: string;
  payment_status?: string;
  payment_method?: string;
  transaction_id?: string;
  customer_name?: string;
  customer_email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  delivery_instructions?: string;
  delivery_person_id?: number | string | null;
  delivery_person_name?: string;
  delivery_person_phone?: string;
  delivery_person_vehicle?: string;
  created_at?: string;
  product_name?: string;
  product_price?: number | string;
  product_image?: string;
  category?: string;
  discount?: number | string;
  delivery_fee?: number | string;
  tax?: number | string;
}

interface OrderTableProps {
  orders?: OrderItem[];
  availableDPs?: any[];
  onAssign?: (orderId: number, dpId: string) => void;
  onDelete?: (orderId: number) => void;
  refreshTrigger?: number;
  statusFilter?: string;
}

function cleanProductName(item: string) {
  if (!item) return "Electronics Product";
  return item.replace(/\s*\(Qty:\s*\d+\)/i, "").trim();
}

function getQuantity(order: OrderItem) {
  const q = Number(order.quantity);
  if (Number.isInteger(q) && q > 0) return q;
  const match = order.item?.match(/\(Qty:\s*(\d+)\)/i);
  if (match) return Number(match[1]);
  return 1;
}

// Lifecycle steps mapping
const LIFECYCLE_STEPS = [
  { key: "pending", label: "Pending", icon: "🕒" },
  { key: "confirmed", label: "Confirmed", icon: "✓" },
  { key: "processing", label: "Processing", icon: "⚙️" },
  { key: "assigned", label: "Assigned", icon: "🛵" },
  { key: "picked_up", label: "Picked Up", icon: "📦" },
  { key: "on_the_way", label: "On The Way", icon: "🚚" },
  { key: "delivered", label: "Delivered", icon: "🎉" },
];

function getLifecycleIndex(status: string) {
  const norm = (status || "pending").toLowerCase();
  const idx = LIFECYCLE_STEPS.findIndex(s => s.key === norm);
  return idx >= 0 ? idx : 0;
}

export default function OrderTable({
  orders: propOrders,
  availableDPs: propAvailableDPs,
  onAssign: propOnAssign,
  onDelete: propOnDelete,
  refreshTrigger,
  statusFilter = "all",
}: OrderTableProps) {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [availableDPs, setAvailableDPs] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const fetchOrdersAndDPs = () => {
    setLoading(true);
    api.get("/orders")
      .then(res => setOrders(res.data || []))
      .catch(err => console.error("Error fetching orders:", err))
      .finally(() => setLoading(false));

    api.get("/delivery")
      .then(res => setAvailableDPs(res.data || []))
      .catch(err => console.error("Error fetching delivery persons:", err));
  };

  useEffect(() => {
    if (propOrders) {
      setOrders(propOrders);
      setLoading(false);
    } else {
      fetchOrdersAndDPs();
    }
  }, [propOrders, refreshTrigger]);

  useEffect(() => {
    if (propAvailableDPs) {
      setAvailableDPs(propAvailableDPs);
    } else if (!propOrders) {
      api.get("/delivery")
        .then(res => setAvailableDPs(res.data || []))
        .catch(err => console.error("Error fetching delivery persons:", err));
    }
  }, [propAvailableDPs, propOrders]);

  const toggleExpand = (id: number) => {
    setExpandedOrderId(prev => (prev === id ? null : id));
  };

  const handleAssign = (orderId: number, dpId: string) => {
    setUpdatingId(orderId);
    if (propOnAssign) {
      propOnAssign(orderId, dpId);
      setUpdatingId(null);
    } else {
      api.post("/delivery/assign", { orderId, dpId: dpId || null })
        .then(() => fetchOrdersAndDPs())
        .catch(err => alert("Failed to assign courier: " + (err.response?.data?.message || err.message)))
        .finally(() => setUpdatingId(null));
    }
  };

  const handleStatusChange = (orderId: number, newStatus: string) => {
    setUpdatingId(orderId);
    api.patch(`/delivery/order/${orderId}/status`, { status: newStatus })
      .then(() => fetchOrdersAndDPs())
      .catch(err => {
        alert("Failed to update status: " + (err.response?.data?.message || err.message));
      })
      .finally(() => setUpdatingId(null));
  };

  const handleDelete = (order: OrderItem) => {
    const isTransit = ["assigned", "picked_up", "on_the_way"].includes((order.delivery_status || "").toLowerCase());
    if (isTransit) {
      alert(`Order #${order.id} is currently in active transit and cannot be removed until resolved.`);
      return;
    }
    if (window.confirm(`Are you sure you want to permanently delete Order #${order.id}?`)) {
      setUpdatingId(order.id);
      if (propOnDelete) {
        propOnDelete(order.id);
        setUpdatingId(null);
      } else {
        api.delete(`/orders/${order.id}`)
          .then(() => fetchOrdersAndDPs())
          .catch(err => alert("Failed to delete order: " + (err.response?.data?.message || err.message)))
          .finally(() => setUpdatingId(null));
      }
    }
  };

  const rawOrders = propOrders || orders;
  const filteredOrders = rawOrders
    .filter((order) => {
      if (statusFilter !== "all" && (order.delivery_status || "pending").toLowerCase() !== statusFilter.toLowerCase()) {
        return false;
      }
      if (paymentFilter !== "all" && (order.payment_status || "pending").toLowerCase() !== paymentFilter.toLowerCase()) {
        return false;
      }
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      return (
        String(order.id).toLowerCase().includes(term) ||
        (order.customer_name || "").toLowerCase().includes(term) ||
        (order.customer_email || "").toLowerCase().includes(term) ||
        (order.phone || "").toLowerCase().includes(term) ||
        (order.item || "").toLowerCase().includes(term)
      );
    })
    .sort((a, b) => Number(a.id) - Number(b.id));

  const displayDPs = propAvailableDPs || availableDPs;

  return (
    <div className="bg-[#1A1C1E] rounded-[22px] border border-[#2C2E33] shadow-card overflow-hidden text-white">
      {/* Search, Filter & Controls Toolbar */}
      <div className="p-4 sm:p-5 bg-[#141619] border-b border-[#2C2E33] flex flex-col md:flex-row gap-3 md:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center flex-1">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search by ID, customer name, email, phone or item..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3.5 py-2.5 pl-9 rounded-xl bg-[#0F1012] border border-[#2C2E33] text-white text-xs placeholder-[#6B7280] focus:outline-none focus:border-[#FF6B00] transition-colors"
            />
            <span className="absolute left-3 top-3 text-[#6B7280] text-xs">🔍</span>
          </div>

          {/* Payment filter pill */}
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl bg-[#0F1012] border border-[#2C2E33] text-xs text-gray-300 focus:outline-none focus:border-[#FF6B00] cursor-pointer"
          >
            <option value="all">All Payments</option>
            <option value="paid">💳 Paid Only</option>
            <option value="pending">⏳ Pending Payment</option>
            <option value="failed">❌ Failed Payment</option>
          </select>
        </div>

        {/* Counter & Refresh */}
        <div className="flex items-center justify-between sm:justify-end gap-3 text-xs text-gray-400">
          <span>Found <strong className="text-white font-bold">{filteredOrders.length}</strong> {filteredOrders.length === 1 ? 'order' : 'orders'}</span>
          <button
            onClick={() => fetchOrdersAndDPs()}
            className="px-3 py-2 rounded-xl bg-[#0F1012] hover:bg-[#2C2E33] text-gray-300 hover:text-white transition-colors flex items-center gap-1.5 font-medium border border-[#2C2E33]"
            title="Refresh Orders"
          >
            <span>🔄</span>
            <span className="hidden sm:inline">Sync</span>
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full text-left border-collapse">
          <thead className="bg-[#0F1012] text-[11px] font-bold uppercase tracking-wider text-gray-400 border-b border-[#2C2E33]">
            <tr>
              <th className="w-10 px-3 py-3.5 text-center"></th>
              <th className="px-4 py-3.5">Order ID</th>
              <th className="px-4 py-3.5">Buyer</th>
              <th className="px-4 py-3.5">Item Ordered</th>
              <th className="px-3 py-3.5 text-center">Qty</th>
              <th className="px-4 py-3.5">Fulfillment Status</th>
              <th className="px-4 py-3.5">Amount</th>
              <th className="px-4 py-3.5">Assigned Courier</th>
              <th className="px-4 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2C2E33]/50 text-xs">
            {loading ? (
              <tr>
                <td colSpan={9} className="px-6 py-14 text-center text-gray-400">
                  <div className="inline-block w-7 h-7 border-2 border-[#FF6B00] border-t-transparent rounded-full animate-spin mb-3"></div>
                  <p className="font-medium text-white">Loading order records from live database...</p>
                </td>
              </tr>
            ) : filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-6 py-14 text-center text-gray-400">
                  <span className="text-3xl block mb-2">📦</span>
                  <p className="font-bold text-white text-sm">No orders matching your filters.</p>
                  <p className="text-xs text-gray-500 mt-1">Try resetting the search keyword or filter options.</p>
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => {
                const isExpanded = expandedOrderId === order.id;
                const quantity = getQuantity(order);
                const orderDate = order.created_at ? new Date(order.created_at) : null;
                const dateString = orderDate ? orderDate.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "Recent";
                const timeString = orderDate ? orderDate.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "";
                const isCancelled = (order.delivery_status || "").toLowerCase() === "cancelled";
                const activeStepIdx = getLifecycleIndex(order.delivery_status || "pending");

                // Price arithmetic
                const totalAmount = Number(order.amount || 0);
                const deliveryFee = Number(order.delivery_fee || 0);
                const discount = Number(order.discount || 0);
                const tax = Number(order.tax || 0);
                const subtotal = Math.max(0, totalAmount - deliveryFee - tax + discount);
                const unitPrice = quantity > 0 ? (subtotal / quantity) : totalAmount;

                return (
                  <>
                    <tr
                      key={order.id}
                      onClick={() => toggleExpand(order.id)}
                      className={`cursor-pointer transition-colors ${
                        isExpanded ? "bg-[#202225]" : "hover:bg-white/[0.03]"
                      }`}
                    >
                      {/* Accordion Expand Chevron */}
                      <td className="px-3 py-4 text-center text-gray-400">
                        <span
                          className={`inline-block transition-transform duration-200 text-xs font-bold ${
                            isExpanded ? "rotate-90 text-[#FF6B00]" : "text-gray-500"
                          }`}
                        >
                          ▶
                        </span>
                      </td>

                      {/* Sequential Order ID */}
                      <td className="px-4 py-4 font-bold text-[#FF8A24] whitespace-nowrap">
                        <span className="font-mono">#{String(order.id).padStart(5, "0")}</span>
                        <span className="block text-[10px] text-gray-500 font-normal">{dateString}</span>
                      </td>

                      {/* Buyer */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="font-semibold text-white block">
                          {order.customer_name || "Customer"}
                        </span>
                        <span className="text-[10px] text-gray-400 block truncate max-w-[140px]">
                          {order.customer_email || order.phone || "No contact info"}
                        </span>
                      </td>

                      {/* Item Ordered */}
                      <td className="px-4 py-4 text-gray-200 font-medium max-w-[200px] truncate">
                        {cleanProductName(order.item)}
                      </td>

                      {/* Qty */}
                      <td className="px-3 py-4 text-center">
                        <span className="inline-flex items-center justify-center min-w-[24px] px-2 py-0.5 rounded-full text-xs font-bold bg-[#0F1012] text-[#FF6B00] border border-[#2C2E33]">
                          {quantity}
                        </span>
                      </td>

                      {/* Fulfillment Status Dropdown */}
                      <td className="px-4 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={order.delivery_status || "pending"}
                          disabled={updatingId === order.id}
                          onChange={(e) => handleStatusChange(order.id, e.target.value)}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold border cursor-pointer focus:ring-1 focus:ring-[#FF6B00] outline-none transition-all bg-[#0F1012] text-white border-[#2C2E33]"
                        >
                          <option value="pending">⏳ Pending</option>
                          <option value="confirmed">✓ Confirmed</option>
                          <option value="processing">⚙️ Processing</option>
                          <option value="assigned">🛵 Assigned</option>
                          <option value="picked_up">📦 Picked Up</option>
                          <option value="on_the_way">🚚 On The Way</option>
                          <option value="delivered">🎉 Delivered</option>
                          <option value="cancelled">❌ Cancelled</option>
                        </select>
                      </td>

                      {/* Amount & Payment Status */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="font-extrabold text-white block">
                          ₹{totalAmount.toLocaleString()}
                        </span>
                        <span
                          className={`inline-block text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded mt-0.5 ${
                            (order.payment_status || "pending") === "paid"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : (order.payment_status || "pending") === "failed"
                              ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                              : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          }`}
                        >
                          {order.payment_status || "pending"}
                        </span>
                      </td>

                      {/* Assigned Courier */}
                      <td className="px-4 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={order.delivery_person_id || ""}
                          disabled={updatingId === order.id}
                          onChange={(e) => handleAssign(order.id, e.target.value)}
                          className="bg-[#0F1012] border border-[#2C2E33] rounded-xl px-3 py-1.5 text-xs font-medium text-white hover:border-[#FF6B00] focus:outline-none focus:ring-1 focus:ring-[#FF6B00] transition-colors max-w-[160px] truncate"
                        >
                          <option value="">+ Assign Courier</option>
                          {displayDPs.map((dp) => (
                            <option key={dp.id} value={dp.id}>
                              {dp.name} ({dp.vehicle_type || "Courier"})
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Action buttons */}
                      <td className="px-4 py-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => toggleExpand(order.id)}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-gray-300 hover:text-white bg-[#0F1012] border border-[#2C2E33] hover:border-gray-500 transition-all"
                            title="Toggle Full Order Details"
                          >
                            {isExpanded ? "Collapse" : "Details"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(order)}
                            disabled={updatingId === order.id}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-400 hover:text-white hover:bg-rose-500/20 border border-rose-500/20 transition-all disabled:opacity-50"
                            title="Delete Order Record"
                          >
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* EXPANDABLE ACCORDION ROW */}
                    {isExpanded && (
                      <tr className="bg-[#121316]">
                        <td colSpan={9} className="p-0">
                          <div className="p-5 sm:p-6 border-b border-[#2C2E33] space-y-6 animate-fadeIn">
                            {/* Section 1: Visual Tracking Lifecycle Stepper */}
                            <div className="bg-[#1A1C1E] p-4 sm:p-5 rounded-2xl border border-[#2C2E33]">
                              <div className="flex items-center justify-between mb-4">
                                <div>
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF6B00]">Shipment Lifecycle</span>
                                  <h4 className="text-sm font-bold text-white">Order Tracking Progress</h4>
                                </div>
                                <span className="text-xs text-gray-400">
                                  Current: <strong className="text-white capitalize">{order.delivery_status || "Pending"}</strong>
                                </span>
                              </div>

                              {isCancelled ? (
                                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center gap-3">
                                  <span className="text-2xl">❌</span>
                                  <div>
                                    <p className="font-bold text-sm">Order Cancelled</p>
                                    <p className="text-xs text-rose-300">This shipment was cancelled and is excluded from active dispatches and revenue calculation.</p>
                                  </div>
                                </div>
                              ) : (
                                <div className="overflow-x-auto pb-2">
                                  <div className="min-w-[640px] flex items-center justify-between relative">
                                    {/* Stepper connecting line */}
                                    <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-[#2C2E33] -translate-y-1/2 z-0" />
                                    <div
                                      className="absolute top-1/2 left-4 h-0.5 bg-gradient-to-r from-[#FF6B00] to-emerald-500 -translate-y-1/2 z-0 transition-all duration-300"
                                      style={{
                                        width: `${(activeStepIdx / (LIFECYCLE_STEPS.length - 1)) * 95}%`,
                                      }}
                                    />

                                    {LIFECYCLE_STEPS.map((step, idx) => {
                                      const isPassed = idx <= activeStepIdx;
                                      const isCurrent = idx === activeStepIdx;
                                      return (
                                        <div key={step.key} className="relative z-10 flex flex-col items-center group">
                                          <div
                                            className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-md ${
                                              isCurrent
                                                ? "bg-[#FF6B00] text-white ring-4 ring-[#FF6B00]/20 scale-110"
                                                : isPassed
                                                ? "bg-emerald-500 text-white"
                                                : "bg-[#202225] text-gray-500 border border-[#2C2E33]"
                                            }`}
                                          >
                                            {isPassed && !isCurrent ? "✓" : step.icon}
                                          </div>
                                          <span
                                            className={`text-[11px] font-semibold mt-2 whitespace-nowrap ${
                                              isCurrent ? "text-[#FF8A24] font-bold" : isPassed ? "text-white" : "text-gray-500"
                                            }`}
                                          >
                                            {step.label}
                                          </span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Section 2: 4-Column Detailed Information Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                              {/* 1. Order Info Card */}
                              <div className="bg-[#1A1C1E] p-4 rounded-xl border border-[#2C2E33] flex flex-col justify-between">
                                <div>
                                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#FF6B00] mb-2">
                                    <span>📑</span> Order Information
                                  </div>
                                  <div className="space-y-1.5 text-xs">
                                    <div className="flex justify-between py-1 border-b border-[#2C2E33]">
                                      <span className="text-gray-400">Order ID:</span>
                                      <span className="font-mono font-bold text-white">#{String(order.id).padStart(5, "0")}</span>
                                    </div>
                                    <div className="flex justify-between py-1 border-b border-[#2C2E33]">
                                      <span className="text-gray-400">Placed Date:</span>
                                      <span className="text-white font-medium">{dateString}</span>
                                    </div>
                                    <div className="flex justify-between py-1 border-b border-[#2C2E33]">
                                      <span className="text-gray-400">Placed Time:</span>
                                      <span className="text-white font-medium">{timeString || "N/A"}</span>
                                    </div>
                                    <div className="flex justify-between py-1">
                                      <span className="text-gray-400">Fulfillment:</span>
                                      <StatusBadge status={order.delivery_status || "pending"} />
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* 2. Customer Info Card */}
                              <div className="bg-[#1A1C1E] p-4 rounded-xl border border-[#2C2E33] flex flex-col justify-between">
                                <div>
                                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#FF6B00] mb-2">
                                    <span>👤</span> Customer Details
                                  </div>
                                  <div className="space-y-1.5 text-xs">
                                    <div className="flex justify-between py-1 border-b border-[#2C2E33]">
                                      <span className="text-gray-400">Name:</span>
                                      <span className="font-bold text-white truncate max-w-[120px]">{order.customer_name || "Customer"}</span>
                                    </div>
                                    <div className="flex justify-between py-1 border-b border-[#2C2E33]">
                                      <span className="text-gray-400">Email:</span>
                                      <span className="text-gray-300 truncate max-w-[130px]" title={order.customer_email || ""}>
                                        {order.customer_email || "N/A"}
                                      </span>
                                    </div>
                                    <div className="flex justify-between py-1 border-b border-[#2C2E33]">
                                      <span className="text-gray-400">Phone:</span>
                                      <span className="text-white font-mono">{order.phone || "N/A"}</span>
                                    </div>
                                    <div className="flex justify-between py-1">
                                      <span className="text-gray-400">Verification:</span>
                                      <span className="text-emerald-400 font-medium">✓ Verified Buyer</span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* 3. Delivery Info Card */}
                              <div className="bg-[#1A1C1E] p-4 rounded-xl border border-[#2C2E33] flex flex-col justify-between">
                                <div>
                                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#FF6B00] mb-2">
                                    <span>📍</span> Delivery Destination
                                  </div>
                                  <div className="space-y-1.5 text-xs">
                                    <div>
                                      <span className="text-gray-400 block text-[10px] uppercase">Shipping Address:</span>
                                      <p className="text-white font-medium mt-0.5 leading-snug">
                                        {order.address || "Hub Express Dispatch Warehouse"}
                                      </p>
                                    </div>
                                    <div className="flex justify-between py-1 border-b border-[#2C2E33] text-[11px]">
                                      <span className="text-gray-400">City / State:</span>
                                      <span className="text-white">{order.city || "Chennai"}, {order.state || "TN"}</span>
                                    </div>
                                    <div className="flex justify-between py-1 border-b border-[#2C2E33] text-[11px]">
                                      <span className="text-gray-400">Postal Code:</span>
                                      <span className="text-white font-mono">{order.pincode || "600001"}</span>
                                    </div>
                                    <div className="pt-1">
                                      <span className="text-gray-400 block text-[10px] uppercase">Carrier Assigned:</span>
                                      <span className="text-[#FF8A24] font-semibold">
                                        {order.delivery_person_name ? `${order.delivery_person_name} (${order.delivery_person_vehicle || "Bike"})` : "None Assigned Yet"}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* 4. Payment Breakdown Card */}
                              <div className="bg-[#1A1C1E] p-4 rounded-xl border border-[#2C2E33] flex flex-col justify-between">
                                <div>
                                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#FF6B00] mb-2">
                                    <span>💳</span> Payment Breakdown
                                  </div>
                                  <div className="space-y-1.5 text-xs">
                                    <div className="flex justify-between py-1 border-b border-[#2C2E33]">
                                      <span className="text-gray-400">Method:</span>
                                      <span className="text-white font-medium uppercase">{order.payment_method || "Online"}</span>
                                    </div>
                                    <div className="flex justify-between py-1 border-b border-[#2C2E33]">
                                      <span className="text-gray-400">Transaction ID:</span>
                                      <span className="text-gray-300 font-mono text-[10px] truncate max-w-[100px]">
                                        {order.transaction_id || `TXN-${order.id}992`}
                                      </span>
                                    </div>
                                    <div className="flex justify-between py-0.5 text-gray-400 text-[11px]">
                                      <span>Items Subtotal:</span>
                                      <span>₹{subtotal.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between py-0.5 text-gray-400 text-[11px]">
                                      <span>Express Delivery Fee:</span>
                                      <span className="text-emerald-400">{deliveryFee > 0 ? `₹${deliveryFee}` : "FREE"}</span>
                                    </div>
                                    <div className="flex justify-between py-1.5 border-t border-[#2C2E33] font-bold text-white text-sm">
                                      <span>Total Amount:</span>
                                      <span className="text-[#FF8A24]">₹{totalAmount.toLocaleString()}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Section 3: Ordered Products Table */}
                            <div className="bg-[#1A1C1E] rounded-xl border border-[#2C2E33] overflow-hidden">
                              <div className="px-4 py-3 bg-[#141619] border-b border-[#2C2E33] flex justify-between items-center">
                                <span className="text-xs font-bold text-white uppercase tracking-wider">
                                  Items In Package ({quantity} unit{quantity > 1 ? "s" : ""})
                                </span>
                                <span className="text-xs text-gray-400">Category: Consumer Electronics</span>
                              </div>
                              <div className="p-4 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-12 h-12 rounded-xl bg-[#0F1012] border border-[#2C2E33] flex items-center justify-center text-xl overflow-hidden">
                                    {order.product_image ? (
                                      <img src={order.product_image} alt={order.item} className="w-full h-full object-cover" />
                                    ) : (
                                      <span>🎧</span>
                                    )}
                                  </div>
                                  <div>
                                    <h5 className="font-bold text-white text-xs sm:text-sm">{cleanProductName(order.item)}</h5>
                                    <p className="text-[11px] text-gray-400">Genuine consumer electronics with 1-Year Brand Warranty</p>
                                  </div>
                                </div>

                                <div className="text-right">
                                  <span className="text-xs text-gray-400 block">{quantity} x ₹{Math.round(unitPrice).toLocaleString()}</span>
                                  <span className="text-sm font-extrabold text-white">₹{totalAmount.toLocaleString()}</span>
                                </div>
                              </div>
                            </div>

                            {/* Expanded Action Toolbar */}
                            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-400">Quick Change Status:</span>
                                {["pending", "processing", "on_the_way", "delivered"].map((st) => (
                                  <button
                                    key={st}
                                    type="button"
                                    onClick={() => handleStatusChange(order.id, st)}
                                    disabled={order.delivery_status === st || updatingId === order.id}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize border transition-all ${
                                      order.delivery_status === st
                                        ? "bg-[#FF6B00] text-white border-[#FF6B00]"
                                        : "bg-[#0F1012] text-gray-300 border-[#2C2E33] hover:border-gray-500"
                                    }`}
                                  >
                                    {st.replace(/_/g, " ")}
                                  </button>
                                ))}
                              </div>

                              <div className="flex items-center gap-3">
                                {!isCancelled && (
                                  <button
                                    type="button"
                                    onClick={() => handleStatusChange(order.id, "cancelled")}
                                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-400 hover:text-white hover:bg-rose-500/20 border border-rose-500/20 transition-all"
                                  >
                                    Cancel Order
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => toggleExpand(order.id)}
                                  className="px-4 py-1.5 rounded-lg text-xs font-semibold text-gray-300 hover:text-white bg-[#0F1012] border border-[#2C2E33]"
                                >
                                  Close Details ▲
                                </button>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
