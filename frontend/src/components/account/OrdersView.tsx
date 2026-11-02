import React, { useState } from "react";
import StatusBadge from "../common/StatusBadge";
import api from "../../../api/api";

interface OrdersViewProps {
  orders: any[];
  products: any[];
  loading: boolean;
  onRefreshOrders: () => void;
  onNavigateShop: () => void;
}

function formatOrderItem(item: string) {
  if (!item) return "";
  return item.replace(/\s*\(Qty:\s*\d+\)/i, "").trim();
}

function getOrderQuantity(order: any, products: any[]) {
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

export const OrdersView: React.FC<OrdersViewProps> = ({
  orders,
  products,
  loading,
  onRefreshOrders,
  onNavigateShop,
}) => {
  const [activeTab, setActiveTab] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const filterTabs = [
    { id: "all", label: "All Orders" },
    { id: "pending", label: "Pending" },
    { id: "assigned", label: "Processing" },
    { id: "picked_up", label: "Shipped" },
    { id: "delivered", label: "Delivered" },
    { id: "cancelled", label: "Cancelled" },
  ];

  const filteredOrders = orders.filter((o) => {
    if (activeTab === "all") return true;
    return (o.delivery_status || "pending").toLowerCase() === activeTab;
  });

  const handleCancelOrder = async (orderId: number) => {
    const ok = window.confirm("Are you sure you want to cancel this order? This action cannot be undone.");
    if (!ok) return;

    try {
      setCancellingId(orderId);
      // Cancel customer order using dedicated authenticated route
      await api.patch(`/orders/${orderId}/cancel`);
      setActionMessage(`Order #ORD${String(orderId).padStart(5, "0")} was successfully cancelled.`);
      setTimeout(() => setActionMessage(null), 5000);
      onRefreshOrders();
      if (selectedOrder?.id === orderId) {
        setSelectedOrder((prev: any) => prev ? { ...prev, delivery_status: "cancelled" } : null);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to cancel order. Please contact customer support.");
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#171717] tracking-tight">
            My Orders
          </h2>
          <p className="text-xs text-[#737373] mt-1">Track and review past shipments</p>
        </div>

        <button
          onClick={onRefreshOrders}
          title="Refresh orders"
          className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#EAEAEA] text-xs font-semibold text-[#555555] hover:text-[#171717] hover:bg-[#FAFAFA] transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {actionMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between">
          <span>{actionMessage}</span>
          <button onClick={() => setActionMessage(null)} className="text-emerald-700 hover:text-emerald-900">
            ✕
          </button>
        </div>
      )}

      {/* Pill Filter Tabs matching Screenshot */}
      <div className="flex gap-2 overflow-x-auto pb-2 border-b border-[#EAEAEA] text-xs no-scrollbar">
        {filterTabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-full font-semibold transition-all whitespace-nowrap ${
                isActive
                  ? "bg-[#171717] text-white shadow-sm"
                  : "bg-[#F7F7F7] text-[#737373] hover:text-[#171717] hover:bg-[#EDEDED]"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Orders List / Loading / Empty States */}
      {loading ? (
        <div className="py-20 text-center text-[#737373]">
          <div className="inline-block w-8 h-8 border-2 border-[#171717] border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-xs font-bold text-[#171717]">Querying order history...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-[#FAFAFA] rounded-[24px] p-12 text-center text-[#737373] border border-[#EAEAEA]">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white border border-[#EAEAEA] flex items-center justify-center text-orange-500 shadow-sm">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <p className="font-extrabold text-base text-[#171717]">No shipments found in this category.</p>
          <p className="text-xs text-[#888888] mt-1 max-w-sm mx-auto">
            You haven't placed any orders with this status yet. Browse our flagship electronics catalog.
          </p>
          <div className="pt-6">
            <button
              onClick={onNavigateShop}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#171717] hover:bg-black text-white text-xs font-bold uppercase tracking-wider transition-all"
            >
              <span>Start Shopping</span>
              <span>→</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const qty = getOrderQuantity(order, products);
            const status = (order.delivery_status || "pending").toLowerCase();
            const canCancel = ["pending", "assigned"].includes(status);

            return (
              <div
                key={order.id}
                className="bg-white rounded-[22px] border border-[#EAEAEA] p-5 sm:p-6 hover:shadow-subtle transition-all duration-300"
              >
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
                  {/* Left: Product visual & Metadata */}
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-[#F7F7F7] border border-[#EAEAEA] flex items-center justify-center overflow-hidden flex-shrink-0">
                      {order.product_image ? (
                        <img
                          src={order.product_image}
                          alt={order.item}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <svg className="w-8 h-8 text-[#999999]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                        </svg>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-extrabold text-sm text-[#171717]">
                          #ORD{String(order.id).padStart(5, "0")}
                        </span>
                        <span className="text-[11px] text-[#737373]">
                          Placed on{" "}
                          {order.created_at
                            ? new Date(order.created_at).toLocaleDateString("en-IN", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })
                            : "Recently"}
                        </span>
                      </div>

                      <h4 className="font-bold text-xs text-[#171717] mt-1">
                        {formatOrderItem(order.item)}
                      </h4>

                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs font-extrabold text-[#171717]">
                          ₹{Number(order.amount || 0).toLocaleString()}
                        </span>
                        <span className="text-[11px] font-normal text-[#737373]">
                          ({qty} {qty > 1 ? "items" : "item"})
                        </span>
                        <span className="text-gray-300">|</span>
                        <span className="text-[11px] text-[#737373]">
                          {order.payment_method || "Cash on Delivery"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Status Pill & Actions */}
                  <div className="flex flex-wrap items-center gap-3 self-end lg:self-center">
                    <StatusBadge status={order.delivery_status || "pending"} />

                    <button
                      onClick={() => setSelectedOrder(selectedOrder?.id === order.id ? null : order)}
                      className="px-3.5 py-1.5 rounded-full border border-[#DCDCDC] text-xs font-bold text-[#171717] hover:bg-[#F7F7F7] transition-colors"
                    >
                      {selectedOrder?.id === order.id ? "Close Details" : "View Details →"}
                    </button>

                    {canCancel && (
                      <button
                        onClick={() => handleCancelOrder(order.id)}
                        disabled={cancellingId === order.id}
                        className="px-3 py-1.5 rounded-full border border-rose-200 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        {cancellingId === order.id ? "Cancelling..." : "Cancel Order"}
                      </button>
                    )}
                  </div>
                </div>

                {/* Expandable Order Details Drawer */}
                {selectedOrder?.id === order.id && (
                  <div className="mt-5 pt-5 border-t border-[#F0F0F0] space-y-4 animate-in fade-in duration-200">
                    {/* Stepper Progress */}
                    <div className="p-4 rounded-2xl bg-[#FAFAFA] border border-[#EAEAEA]">
                      <h5 className="text-xs font-bold text-[#171717] mb-3">Shipment Progress</h5>
                      <div className="grid grid-cols-4 text-center gap-2">
                        {[
                          { key: "pending", label: "Confirmed" },
                          { key: "assigned", label: "Processing" },
                          { key: "picked_up", label: "Shipped" },
                          { key: "delivered", label: "Delivered" },
                        ].map((step, idx) => {
                          const orderSteps = ["pending", "assigned", "picked_up", "delivered"];
                          const currentIdx = orderSteps.indexOf(status);
                          const isDone = currentIdx >= idx && status !== "cancelled";
                          const isCancelled = status === "cancelled";

                          return (
                            <div key={step.key} className="space-y-1">
                              <div
                                className={`h-1.5 rounded-full ${
                                  isCancelled
                                    ? "bg-rose-300"
                                    : isDone
                                    ? "bg-emerald-500"
                                    : "bg-gray-200"
                                }`}
                              />
                              <span
                                className={`text-[10px] font-semibold ${
                                  isDone ? "text-[#171717]" : "text-[#999999]"
                                }`}
                              >
                                {step.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Address & Delivery Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div className="p-4 rounded-xl border border-[#EAEAEA] bg-white">
                        <span className="font-bold text-[#171717] block mb-1">Delivery Address</span>
                        <p className="text-[#555555]">
                          {order.recipient_name || order.customer_name || "Customer"}
                        </p>
                        <p className="text-[#737373] mt-0.5">
                          {order.delivery_address || "Standard registered address"}
                        </p>
                        {order.customer_phone && (
                          <p className="text-[#737373] mt-0.5">Phone: {order.customer_phone}</p>
                        )}
                      </div>

                      <div className="p-4 rounded-xl border border-[#EAEAEA] bg-white">
                        <span className="font-bold text-[#171717] block mb-1">Payment & Dispatch</span>
                        <p className="text-[#555555]">
                          Payment Method: <span className="font-semibold">{order.payment_method || "COD"}</span>
                        </p>
                        <p className="text-[#555555] mt-0.5">
                          Payment Status:{" "}
                          <span className={`font-semibold ${order.payment_status === "paid" ? "text-emerald-600" : "text-amber-600"}`}>
                            {order.payment_status || "Pending"}
                          </span>
                        </p>
                        {order.delivery_person_name && (
                          <p className="text-[#555555] mt-0.5">
                            Assigned Partner: <span className="font-semibold">{order.delivery_person_name}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OrdersView;

