import { Link, useLocation, useNavigate } from "react-router-dom";
import logo from "../../assets/deliverylogo.png";

function getInitials(name) {
  if (!name) return "AD";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  const userName = localStorage.getItem("userName") || "ADMINISTRATOR";
  const userEmail = localStorage.getItem("userEmail") || "Admin";
  const initials = getInitials(userName);

  const menuItems = [
    {
      path: "/dashboard",label: "Dashboard",icon: "📊",
    },
    {
      path: "/orders",label: "Orders",icon: "📦",
    },
    {
      path: "/delivery",label: "Delivery", icon: "🚚",
    },
    {
      path: "/users",label: "Users",icon: "👥",
    },
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");localStorage.removeItem("role");
    localStorage.removeItem("userName");localStorage.removeItem("userEmail");
    localStorage.removeItem("user");
    navigate("/admin/login");
  };

  return (
    <aside className="w-64 bg-blue h-screen shadow-md fixed left-0 top-0 flex flex-col z-30">
      {/* Logo */}
      <div className="flex justify-center py-6">
        <img
          src={logo}
          alt="DeliveryHub Logo"
          className="w-48 h-auto"
        />
      </div>
      {/* Menu */}
      <nav className="px-4 space-y-2 flex-1">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-colors ${
              location.pathname === item.path
                ? "bg-blue-50 text-blue-600 font-medium"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <span className="text-xl w-6 text-center">
              {item.icon}
            </span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Bottom User Section */}
      <div className="mt-auto border-t border-gray-200 p-4">
        <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3 mb-2">
          <div className="w-11 h-11 rounded-full bg-blue-600 text-white flex items-center justify-center text-base font-bold flex-shrink-0">
            {initials}
          </div>

          {/* User Details */}
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-gray-900 text-sm truncate uppercase">
              {userName}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {userEmail}
            </p>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-500 hover:bg-red-50 font-medium transition text-sm"
        >
          <span className="text-lg">🚪</span>
          Logout
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;