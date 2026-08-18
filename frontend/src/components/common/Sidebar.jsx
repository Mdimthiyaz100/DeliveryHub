import { Link, useLocation, useNavigate } from "react-router-dom";
import logo from "../../assets/deliverylogo.png";

function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    {
      path: "/dashboard",
      label: "Dashboard",
      icon: "📊",
    },
    {
      path: "/orders",
      label: "Orders",
      icon: "📦",
    },
    {
      path: "/delivery",
      label: "Delivery",
      icon: "🚚",
    },
  ];

  const handleLogout = () => {
    
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <aside className="w-64 bg-white h-screen shadow-md fixed left-0 top-0 flex flex-col">

      {/* Logo */}
      <div className="flex justify-center py-6">
        <img
          src={logo}
          alt="DeliveryHub Logo"
          className="w-48 h-auto"
        />
      </div>

      {/* Menu */}
      <nav className="px-4 space-y-2">
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

        {/* Admin Profile */}
        <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-4 mb-4">
          
          {/* Avatar */}
          <div className="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center text-lg font-medium">
            IM
          </div>

          {/* User Details */}
          <div>
            <p className="font-semibold text-gray-900">
              Imthiyaz
            </p>

            <p className="text-sm text-gray-500">
              Admin
            </p>
          </div>

        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-4 px-4 py-3 rounded-lg text-red-500 hover:bg-red-50 transition"
        >
        
        <logout>
            Logout
            </logout>
        </button>

      </div>
    </aside>
  );
}

export default Sidebar;