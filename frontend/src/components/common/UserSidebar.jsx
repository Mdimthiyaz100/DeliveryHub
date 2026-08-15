
import { Link, useLocation } from "react-router-dom";
import logo from "../../assets/deliverylogo.png";

function UserSidebar() {
  const location = useLocation();
  
  const menuItems = [
    { path: "/shop", label: "Shop", icon: "🛍️" },
    { path: "/my-orders", label: "My Orders", icon: "📦" },
  ];

  return (
    <aside className="w-64 bg-white h-screen shadow-md fixed left-0 top-0 pt-20">
      {/*logo*/}
      <div className="flex justify-center mb-4">
        <img
          src={logo}
          className="w-56 h-auto p-"
        />
      </div>

      <nav className="px-4 space-y-2">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              location.pathname === item.path
                ? "bg-blue-50 text-blue-600 font-medium"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <span>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}

export default UserSidebar;
