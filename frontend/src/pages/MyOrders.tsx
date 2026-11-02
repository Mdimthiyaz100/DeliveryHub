import { useState, useEffect } from "react";
import api from "../../api/api";
import StatusBadge from "../components/common/StatusBadge";
import UserSidebar from "../components/common/UserSidebar";

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

function MyOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

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

  const filteredOrders = orders.filter((o) => {
    if (activeTab === "all") return true;
    return (o.delivery_status || "pending").toLowerCase() === activeTab;
  });

  return (
    <div className="min-h-screen bg-white text-[#171717] font-sans antialiased">
      {/* Concept Header */}
      <UserSidebar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left Account Sidebar matching Reference Image 7 */}
          <aside className="lg:col-span-3 bg-[#F7F7F7] border border-[#EAEAEA] rounded-[22px] p-6 space-y-6">
            <h3 className="text-base font-extrabold text-[#171717]">My Account</h3>

            <nav className="space-y-1.5 text-xs font-semibold">
              <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-[#777777] hover:text-[#171717] cursor-pointer">
                <span>👤</span>
                <span>Profile</span>
              </div>
              <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white border border-[#EAEAEA] text-orange-500 font-bold shadow-sm cursor-pointer">
                <span>📦</span>
                <span>My Orders</span>
              </div>
              <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-[#777777] hover:text-[#171717] cursor-pointer">
                <span>♥</span>
                <span>Wishlist</span>
              </div>
              <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-[#777777] hover:text-[#171717] cursor-pointer">
                <span>📍</span>
                <span>Addresses</span>
              </div>
              <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-[#777777] hover:text-[#171717] cursor-pointer">
                <span>💳</span>
                <span>Payments</span>
              </div>
              <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-[#777777] hover:text-[#171717] cursor-pointer">
                <span>⚙️</span>
                <span>Settings</span>
              </div>
            </nav>
          </aside>

          {/* Right Orders List matching Reference Image 7 */}
          <section className="lg:col-span-9 space-y-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#171717] tracking-tight">
                My Orders
              </h2>
              <p className="text-xs text-[#777777] mt-1">Track and review past shipments</p>
            </div>

            {/* Filter Tabs matching Reference: All Orders, Pending, Processing, Shipped, Delivered, Cancelled */}
            <div className="flex gap-2 overflow-x-auto pb-2 border-b border-[#EAEAEA] text-xs">
              {[
                { id: "all", label: "All Orders" },
                { id: "pending", label: "Pending" },
                { id: "assigned", label: "Processing" },
                { id: "picked_up", label: "Shipped" },
                { id: "delivered", label: "Delivered" },
                { id: "cancelled", label: "Cancelled" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-full font-semibold transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? "bg-[#171717] text-white"
                      : "bg-[#F7F7F7] text-[#777777] hover:text-[#171717]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Orders Cards List */}
            {loading ? (
              <div className="py-20 text-center text-[#777777]">
                <div className="inline-block w-8 h-8 border-2 border-[#171717] border-t-transparent rounded-full animate-spin mb-3"></div>
                <p className="text-xs font-bold">Querying order history...</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="bg-[#F7F7F7] rounded-[22px] p-12 text-center text-[#777777] border border-[#EAEAEA]">
                <span className="text-4xl block mb-2">📦</span>
                <p className="font-bold text-[#171717]">No shipments found in this category.</p>
                <div className="pt-4">
                  <a
                    href="/shop"
                    className="inline-block px-6 py-2.5 rounded-full bg-[#171717] text-white text-xs font-bold uppercase tracking-wider"
                  >
                    Start Shopping →
                  </a>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((order) => {
                  const qty = getOrderQuantity(order, products);

                  return (
                    <div
                      key={order.id}
                      className="bg-white rounded-[20px] border border-[#EAEAEA] p-5 hover:shadow-subtle transition-all duration-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                    >
                      {/* Left: Order Info */}
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-xl bg-[#F7F7F7] border border-[#EAEAEA] flex items-center justify-center text-2xl flex-shrink-0">
                          🎧
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-sm text-[#171717]">
                              #ORD{String(order.id).padStart(5, "0")}
                            </span>
                            <span className="text-[11px] text-[#777777]">
                              Placed on {order.created_at ? new Date(order.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }) : "Recently"}
                            </span>
                          </div>
                          <h4 className="font-bold text-xs text-[#171717] mt-1">
                            {formatOrderItem(order.item)}
                          </h4>
                          <p className="text-xs font-extrabold text-[#171717] mt-0.5">
                            ₹{Number(order.amount || 0).toLocaleString()} <span className="text-[11px] font-normal text-[#777777]">({qty} item{qty > 1 ? "s" : ""})</span>
                          </p>
                        </div>
                      </div>

                      {/* Right: Status Pill & Action button */}
                      <div className="flex items-center gap-4 self-end sm:self-center">
                        <StatusBadge status={order.delivery_status || "pending"} />
                        <span className="text-xs font-bold text-[#171717] hover:underline cursor-pointer">
                          Track Order →
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

export default MyOrders;
