import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import Sidebar from "./components/common/Sidebar";
import Login from "./pages/login";
import UserLogin from "./pages/UserLogin";
import Dashboard from "./pages/Dashboard";
import Orders from "./pages/Orders";
import DeliveryStatusPage from "./pages/Deliverystatus";
import Shop from "./pages/Shop";
import MyOrders from "./pages/MyOrders";
import Collections from "./pages/Collections";
import Categories from "./pages/Categories";
import OurStory from "./pages/OurStory";
import Users from "./pages/Users";
import AdminManagement from "./pages/AdminManagement";
import AdminTracking from "./pages/AdminTracking";
import CustomerTrackPage from "./pages/CustomerTrackPage";
import Cart from "./pages/Cart";
import ProductDetailPage from "./pages/ProductDetailPage";
import { CartProvider } from "./context/CartContext";

/* ── Admin Layout (Accessible by ADMIN & SUPER_ADMIN) ── */
function MainLayout({ children }: { children: ReactNode }) {
  const token = localStorage.getItem("token");
  const role = (localStorage.getItem("role") || "").toLowerCase();
  const portalContext = localStorage.getItem("portalContext");

  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }

  // Security: only admin and super_admin accounts that authenticated through the Admin portal can access admin routes
  if ((role !== "admin" && role !== "super_admin") || portalContext !== "admin") {
    return <Navigate to="/shop" replace />;
  }

  return (
    <div className="min-h-screen bg-[#0F1012] text-white flex flex-col md:flex-row">
      <Sidebar />
      {/* Offset for mobile top bar (pt-16) and desktop sidebar (md:ml-64) */}
      <div className="flex-1 md:ml-64 flex flex-col min-w-0 bg-[#0F1012] pt-16 md:pt-0">
        <main className="p-4 sm:p-6 lg:p-8 flex-1">{children}</main>
      </div>
    </div>
  );
}

/* ── Super Admin Layout (Restricted EXCLUSIVELY to SUPER_ADMIN) ── */
function SuperAdminLayout({ children }: { children: ReactNode }) {
  const token = localStorage.getItem("token");
  const role = (localStorage.getItem("role") || "").toLowerCase();
  const portalContext = localStorage.getItem("portalContext");

  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }

  if (role !== "super_admin" || portalContext !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-[#0F1012] text-white flex flex-col md:flex-row">
      <Sidebar />
      <div className="flex-1 md:ml-64 flex flex-col min-w-0 bg-[#0F1012] pt-16 md:pt-0">
        <main className="p-4 sm:p-6 lg:p-8 flex-1">{children}</main>
      </div>
    </div>
  );
}

/* ── User Layout (Customer Functionality) ── */
function UserLayout({ children }: { children: ReactNode }) {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-white text-[#171717] flex flex-col font-sans">
      <div className="flex-1 min-w-0">
        <main>{children}</main>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <CartProvider>
        <Routes>
          {/* Auth entry routes */}
          <Route path="/" element={<UserLogin />} />
          <Route path="/login" element={<Navigate to="/" replace />} />
          <Route path="/admin/login" element={<Login />} />

          {/* ── Public Live Customer Tracking ── */}
          <Route path="/track" element={<CustomerTrackPage />} />
          <Route path="/track/:trackingNumber" element={<CustomerTrackPage />} />

          {/* ── Customer Pages ── */}
          <Route path="/shop" element={<UserLayout><Shop /></UserLayout>} />
          <Route path="/product/:id" element={<UserLayout><ProductDetailPage /></UserLayout>} />
          <Route path="/cart" element={<UserLayout><Cart /></UserLayout>} />
          <Route path="/collections" element={<UserLayout><Collections /></UserLayout>} />
          <Route path="/categories" element={<UserLayout><Categories /></UserLayout>} />
          <Route path="/my-orders" element={<UserLayout><MyOrders /></UserLayout>} />
          <Route path="/account" element={<Navigate to="/my-orders?tab=profile" replace />} />
          <Route path="/account/profile" element={<Navigate to="/my-orders?tab=profile" replace />} />
          <Route path="/account/orders" element={<Navigate to="/my-orders?tab=orders" replace />} />
          <Route path="/account/cart" element={<Navigate to="/cart" replace />} />
          <Route path="/account/wishlist" element={<Navigate to="/my-orders?tab=wishlist" replace />} />
          <Route path="/account/addresses" element={<Navigate to="/my-orders?tab=addresses" replace />} />
          <Route path="/account/payments" element={<Navigate to="/my-orders?tab=payments" replace />} />
          <Route path="/account/settings" element={<Navigate to="/my-orders?tab=settings" replace />} />
          <Route path="/our-story" element={<UserLayout><OurStory /></UserLayout>} />

          {/* ── Admin Dashboard Pages (Admin + Super Admin) ── */}
          <Route path="/dashboard" element={<MainLayout><Dashboard /></MainLayout>} />
          <Route path="/admin/dashboard" element={<Navigate to="/dashboard" replace />} />
          <Route path="/orders" element={<MainLayout><Orders /></MainLayout>} />
          <Route path="/tracking" element={<MainLayout><AdminTracking /></MainLayout>} />
          <Route path="/admin/tracking" element={<Navigate to="/tracking" replace />} />
          <Route path="/delivery" element={<MainLayout><DeliveryStatusPage /></MainLayout>} />
          <Route path="/users" element={<MainLayout><Users /></MainLayout>} />

          {/* ── Super Admin Dedicated Page ── */}
          <Route
            path="/admin/management"
            element={
              <SuperAdminLayout>
                <AdminManagement />
              </SuperAdminLayout>
            }
          />
          
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </CartProvider>
    </BrowserRouter>
  );
}

export default App;
