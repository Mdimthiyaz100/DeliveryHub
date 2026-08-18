import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/common/Navbar";
import Sidebar from "./components/common/Sidebar";
import UserNavbar from "./components/common/UserNavbar";
import UserSidebar from "./components/common/UserSidebar";
import Login from "./pages/login";
import UserLogin from "./pages/UserLogin";
import Dashboard from "./pages/Dashboard";
import Orders from "./pages/Orders";
import DeliveryStatusPage from "./pages/Deliverystatus";
import Shop from "./pages/Shop";
import MyOrders from "./pages/MyOrders";

/* ── Admin Layout (Sidebar + Navbar) ── */
function MainLayout({ children }) {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }
  if (role !== "admin") {
    return <Navigate to="/shop" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="ml-64">
        <Navbar />
        <main className="p-6 pt-24">{children}</main>
      </div>
    </div>
  );
}

/* ── User Layout (UserSidebar + UserNavbar — same style as admin) ── */
function UserLayout({ children }) {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <UserSidebar />
      <div className="ml-64">
        <UserNavbar />
        <main className="p-6 pt-24">{children}</main>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ── Auth Pages (no layout) ── */}
        <Route path="/" element={<UserLogin />} />
        <Route path="/admin/login" element={<Login />} />

        {/* ── User Pages (UserSidebar + UserNavbar) ── */}
        <Route path="/shop" element={<UserLayout><Shop /></UserLayout>} />
        <Route path="/my-orders" element={<UserLayout><MyOrders /></UserLayout>} />

        {/* ── Admin Pages (Sidebar + Navbar) ── */}
        <Route path="/dashboard" element={<MainLayout><Dashboard /></MainLayout>} />
        <Route path="/orders" element={<MainLayout><Orders /></MainLayout>} />
        <Route path="/delivery" element={<MainLayout><DeliveryStatusPage /></MainLayout>} />
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;