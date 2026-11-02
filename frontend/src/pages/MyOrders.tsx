import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../../api/api";
import UserSidebar from "../components/common/UserSidebar";
import AccountSidebar from "../components/account/AccountSidebar";
import ProfileView from "../components/account/ProfileView";
import OrdersView from "../components/account/OrdersView";
import WishlistView from "../components/account/WishlistView";
import AddressesView from "../components/account/AddressesView";
import PaymentsView from "../components/account/PaymentsView";
import SettingsView from "../components/account/SettingsView";

import { useCart } from "../context/CartContext";

export type AccountTab = "profile" | "orders" | "cart" | "wishlist" | "addresses" | "payments" | "settings";

function MyOrders() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { cartCount } = useCart();

  // Tab State synced with URL query ?tab=
  const initialTab = (searchParams.get("tab") as AccountTab) || "orders";
  const [activeTab, setActiveTab] = useState<AccountTab>(initialTab);

  // User State
  const [userProfile, setUserProfile] = useState<any>(null);

  // Orders and Products State
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  // Wishlist item count for sidebar badge
  const [wishlistCount, setWishlistCount] = useState<number>(0);

  // Sync state if URL changes externally
  useEffect(() => {
    const tabParam = searchParams.get("tab") as AccountTab;
    if (tabParam && ["profile", "orders", "wishlist", "addresses", "payments", "settings"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const handleTabChange = (tab: AccountTab) => {
    if (tab === "cart") {
      navigate("/cart");
      return;
    }
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const fetchOrders = () => {
    setLoadingOrders(true);
    Promise.all([
      api.get("/orders/my-orders").catch(() => api.get("/orders/my").catch(() => ({ data: [] }))),
      api.get("/products").catch(() => ({ data: [] })),
    ])
      .then(([ordersResponse, productsResponse]) => {
        setOrders(ordersResponse.data || []);
        setProducts(productsResponse.data || []);
      })
      .catch((err) => console.error("Error fetching account orders:", err))
      .finally(() => setLoadingOrders(false));
  };

  const fetchUserProfile = () => {
    api
      .get("/users/profile")
      .then((res) => {
        if (res.data) {
          setUserProfile(res.data);
          if (res.data.name) localStorage.setItem("userName", res.data.name);
          if (res.data.email) localStorage.setItem("userEmail", res.data.email);
        }
      })
      .catch((err) => console.error("Error fetching user profile:", err));
  };

  const updateWishlistCounter = () => {
    try {
      const saved = localStorage.getItem("deliveryhub_wishlist");
      if (saved) {
        const parsed = JSON.parse(saved);
        setWishlistCount(Array.isArray(parsed) ? parsed.length : 0);
      }
    } catch (e) {
      // Ignored
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchUserProfile();
    updateWishlistCounter();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("portalContext");
    localStorage.removeItem("userName");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userPicture");
    localStorage.removeItem("user");
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-[#171717] font-sans antialiased">
      {/* Concept Header */}
      <UserSidebar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          {/* Left Account Sidebar with SVG icons and active highlights */}
          <div className="lg:col-span-3 lg:sticky lg:top-24">
            <AccountSidebar
              activeTab={activeTab}
              onTabChange={handleTabChange}
              ordersCount={orders.length}
              wishlistCount={wishlistCount}
              cartCount={cartCount}
            />
          </div>

          {/* Right Content View corresponding to active tab */}
          <section className="lg:col-span-9 bg-white border border-[#EAEAEA] rounded-[24px] p-6 sm:p-8 lg:p-10 shadow-sm min-h-[600px]">
            {activeTab === "profile" && (
              <ProfileView
                user={userProfile}
                onProfileUpdated={(updated) => setUserProfile(updated)}
              />
            )}

            {activeTab === "orders" && (
              <OrdersView
                orders={orders}
                products={products}
                loading={loadingOrders}
                onRefreshOrders={fetchOrders}
                onNavigateShop={() => navigate("/shop")}
              />
            )}

            {activeTab === "wishlist" && (
              <WishlistView
                onNavigateShop={() => navigate("/shop")}
                onAddToCart={() => updateWishlistCounter()}
              />
            )}

            {activeTab === "addresses" && <AddressesView orders={orders} />}

            {activeTab === "payments" && <PaymentsView orders={orders} />}

            {activeTab === "settings" && <SettingsView onLogout={handleLogout} />}
          </section>
        </div>
      </main>
    </div>
  );
}

export default MyOrders;
