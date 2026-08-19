import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./components/common/Sidebar";
import UserSidebar from "./components/common/UserSidebar";
import Login from "./pages/login";
import UserLogin from "./pages/UserLogin";
import Dashboard from "./pages/Dashboard";
import Orders from "./pages/Orders";
import DeliveryStatusPage from "./pages/Deliverystatus";
import Shop from "./pages/Shop";
import MyOrders from "./pages/MyOrders";
import Users from "./pages/Users";

/* ── Admin Layout (Sidebar) ── */
function MainLayout({ children }) {
  const token = localStorage.getItem("token");
  const role = (localStorage.getItem("role") || "").toLowerCase();

  if (!token || role !== "admin") {
    return <Navigate to="/admin/login" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="ml-64">
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}

/* ── User Layout (UserSidebar) ── */
function UserLayout({ children }) {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <UserSidebar />
      <div className="ml-64">
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<UserLogin />} />
        <Route path="/admin/login" element={<Login />} />

        {/* ── User Pages (UserSidebar) ── */}
        <Route path="/shop" element={<UserLayout><Shop /></UserLayout>} />
        <Route path="/my-orders" element={<UserLayout><MyOrders /></UserLayout>} />

        {/* ── Admin Pages (Sidebar) ── */}
        <Route path="/dashboard" element={<MainLayout><Dashboard /></MainLayout>} />
        <Route path="/orders" element={<MainLayout><Orders /></MainLayout>} />
        <Route path="/delivery" element={<MainLayout><DeliveryStatusPage /></MainLayout>} />
        <Route path="/users" element={<MainLayout><Users /></MainLayout>} />
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;