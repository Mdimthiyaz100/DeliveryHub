import { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import ProfileModal from "./ProfileModal";

function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileDropupOpen, setProfileDropupOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [userName, setUserName] = useState(localStorage.getItem("userName") || "Administrator");
  const [userEmail, setUserEmail] = useState(localStorage.getItem("userEmail") || "admin@deliveryhub.com");
  const userRole = (localStorage.getItem("role") || "").toLowerCase();
  const isSuperAdmin = userRole === "super_admin";

  const dropupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropupRef.current && !dropupRef.current.contains(event.target as Node)) {
        setProfileDropupOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleProfileUpdated = (name: string, email: string) => {
    setUserName(name);
    setUserEmail(email);
  };

  const menuItems = [
    {
      path: "/dashboard",
      label: "Dashboard",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      ),
    },
    {
      path: "/orders",
      label: "Orders",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      ),
    },
    {
      path: "/delivery",
      label: "Delivery Partners",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
        </svg>
      ),
    },
    {
      path: "/users",
      label: "Customers",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
    },
    ...(isSuperAdmin
      ? [
          {
            path: "/admin/management",
            label: "Admin Management",
            icon: (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            ),
          },
        ]
      : []),
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("portalContext");
    localStorage.removeItem("userName");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userPicture");
    localStorage.removeItem("user");
    navigate("/admin/login", { replace: true });
  };

  const navContent = (
    <div className="flex flex-col h-full bg-[#141619] text-white">
      {/* Brand Header */}
      <div className="px-6 py-5 border-b border-[#2C2E33] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center font-black text-white text-base shadow-sm">
            📦
          </div>
          <div>
            <span className="font-extrabold text-base tracking-tight text-white">
              Delivery<span className="text-orange-500">Hub</span>
            </span>
            <p className="text-[10px] text-gray-400 font-semibold tracking-wider uppercase">
              {isSuperAdmin ? "SUPER ADMIN PORTAL" : "ADMIN PORTAL"}
            </p>
          </div>
        </div>

        {/* Close button inside mobile slideover */}
        <button
          onClick={() => setMobileOpen(false)}
          className="md:hidden text-gray-400 hover:text-white p-1"
          aria-label="Close menu"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="px-5 pt-5 pb-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">
        Navigation
      </div>

      {/* Nav Items */}
      <nav className="px-3 space-y-1.5 flex-1 overflow-y-auto scrollbar-thin">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                isActive
                  ? "bg-orange-500 text-white shadow-sm"
                  : "text-gray-300 hover:bg-[#1F2226] hover:text-white"
              }`}
            >
              <span className={isActive ? "text-white" : "text-gray-400"}>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Footer Profile & Dropup */}
      <div className="p-4 border-t border-[#2C2E33] bg-[#101214] relative" ref={dropupRef}>
        {/* Dropup Menu */}
        {profileDropupOpen && (
          <div className="absolute bottom-full left-3 right-3 mb-2 bg-[#1A1C1E] border border-[#2C2E33] rounded-2xl shadow-2xl p-2 z-50 animate-fadeIn text-white">
            <div className="px-3 py-2.5 border-b border-[#2C2E33]/60 mb-1">
              <p className="text-xs font-bold text-white truncate">{userName}</p>
              <p className="text-[11px] text-gray-400 truncate">{userEmail}</p>
              <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full mt-1.5 ${
                isSuperAdmin ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
              }`}>
                {isSuperAdmin ? "Super Admin Account" : "Admin Account"}
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                setProfileDropupOpen(false);
                setIsEditModalOpen(true);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-gray-200 hover:text-white hover:bg-[#202225] transition-colors text-left"
            >
              <svg className="w-4 h-4 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span>Edit Profile Settings</span>
            </button>

            {isSuperAdmin && (
              <Link
                to="/admin/management"
                onClick={() => setProfileDropupOpen(false)}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-gray-200 hover:text-white hover:bg-[#202225] transition-colors text-left"
              >
                <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>Admin Management</span>
              </Link>
            )}

            <div className="border-t border-[#2C2E33]/60 my-1"></div>

            <button
              type="button"
              onClick={() => {
                setProfileDropupOpen(false);
                handleLogout();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors text-left"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Sign Out</span>
            </button>
          </div>
        )}

        {/* Clickable Profile Card that triggers Dropup */}
        <button
          type="button"
          onClick={() => setProfileDropupOpen(!profileDropupOpen)}
          className="w-full flex items-center gap-3 p-1.5 -m-1.5 rounded-xl hover:bg-[#1A1C1E] transition-colors text-left cursor-pointer group"
          title="Click to view profile settings"
        >
          <div className="w-9 h-9 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 group-hover:border-orange-500 flex items-center justify-center font-bold text-sm transition-colors">
            {userName ? userName[0].toUpperCase() : "A"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-white truncate group-hover:text-orange-400 transition-colors flex items-center gap-1.5">
              <span>{userName}</span>
              <span className="text-[10px] text-gray-500 font-normal">▲</span>
            </p>
            <p className="text-xs text-gray-400 truncate">{userEmail}</p>
            <span className={`inline-block text-[10px] font-bold px-1.5 py-0.2 rounded mt-0.5 ${
              isSuperAdmin ? "bg-amber-500/20 text-amber-300" : "bg-blue-500/20 text-blue-300"
            }`}>
              {isSuperAdmin ? "SUPER_ADMIN" : "ADMIN"}
            </span>
          </div>
        </button>
      </div>

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <ProfileModal
          onClose={() => setIsEditModalOpen(false)}
          onUpdateSuccess={handleProfileUpdated}
        />
      )}
    </div>
  );

  return (
    <>
      {/* Mobile Top App Bar with Hamburger Toggle */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[#141619] border-b border-[#2C2E33] z-30 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-orange-500 flex items-center justify-center font-black text-white text-sm shadow-sm">
            📦
          </div>
          <span className="font-extrabold text-sm tracking-tight text-white">
            Delivery<span className="text-orange-500">Hub</span>
          </span>
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
            isSuperAdmin ? "bg-amber-500/20 text-amber-300" : "bg-blue-500/20 text-blue-300"
          }`}>
            {isSuperAdmin ? "SUPER ADMIN" : "ADMIN"}
          </span>
        </div>

        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 text-gray-300 hover:text-white rounded-lg hover:bg-[#1F2226]"
          aria-label="Open menu"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Desktop Sidebar (Fixed left) */}
      <aside className="hidden md:flex w-64 border-r border-[#2C2E33] h-screen fixed left-0 top-0 flex-col z-30">
        {navContent}
      </aside>

      {/* Mobile Drawer (Slide in) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer Pane */}
          <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] shadow-2xl z-10">
            {navContent}
          </div>
        </div>
      )}
    </>
  );
}

export default Sidebar;
