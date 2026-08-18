import { Link, useLocation, useNavigate } from "react-router-dom";

const DashboardIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6" aria-hidden="true">
    <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);

const OrdersIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6" aria-hidden="true">
    <rect x="3" y="4" width="18" height="17" rx="2" /><path d="M8 2v4M16 2v4M7 10h10M7 14h4M7 17h6" />
  </svg>
);

const DeliveryIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6" aria-hidden="true">
    <path d="M3 5h11v11H3zM14 9h4l3 3v4h-7z" /><circle cx="7" cy="18" r="2" /><circle cx="18" cy="18" r="2" />
  </svg>
);

const LogoutIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6" aria-hidden="true">
    <path d="M10 17l5-5-5-5M15 12H3M12 3h6a2 2 0 012 2v14a2 2 0 01-2 2h-6" />
  </svg>
);

function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const userName = localStorage.getItem("userName") || "Admin";
  const initial = userName.trim().charAt(0).toUpperCase() || "A";
  const menuItems = [
    { path: "/dashboard", label: "Dashboard", icon: DashboardIcon },
    { path: "/orders", label: "Orders", icon: OrdersIcon },
    { path: "/delivery", label: "Delivery", icon: DeliveryIcon },
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("userName");
    navigate("/admin/login");
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-20 flex w-72 flex-col border-r border-slate-100 bg-white px-5 py-10 shadow-sm">
      <nav className="space-y-2" aria-label="Admin navigation">
        {menuItems.map(({ path, label, icon: Icon }) => {
          const isActive = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className={`flex items-center gap-4 rounded-2xl px-5 py-4 text-base font-semibold transition-colors ${
                isActive
                  ? "bg-blue-50 text-blue-600"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Icon />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-slate-100 pt-5">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sky-600 text-lg font-medium text-white">
            {initial}
          </span>
          <div className="min-w-0">
            <p className="truncate font-semibold text-slate-900">{userName}</p>
            <p className="text-sm text-slate-500">Administrator</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="mt-5 flex w-full items-center gap-4 rounded-xl px-5 py-3 text-left font-semibold text-red-500 transition-colors hover:bg-red-50 hover:text-red-600"
        >
          <LogoutIcon />
          Logout
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
