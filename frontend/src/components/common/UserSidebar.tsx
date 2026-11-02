import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";

interface UserSidebarProps {
  cartCount?: number;
  onOpenCart?: () => void;
  onOpenSearch?: () => void;
}

function UserSidebar({ cartCount: propCartCount, onOpenCart, onOpenSearch }: UserSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { cartCount: contextCartCount } = useCart();

  // Prefer context count, or prop count if explicitly provided
  const activeCartCount = propCartCount !== undefined ? propCartCount : contextCartCount;

  const userName = localStorage.getItem("userName") || "Customer";

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

  const navLinks = [
    { path: "/shop", label: "Shop" },
    { path: "/collections", label: "Collections" },
    { path: "/categories", label: "Categories" },
    { path: "/my-orders", label: "My Orders" },
    { path: "/our-story", label: "Our Story" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-[#EAEAEA] text-[#171717]">
      {/* Top Announcement Bar */}
      <div className="bg-[#F7F7F7] border-b border-[#EAEAEA] px-4 py-2 text-[11px] text-[#777777] tracking-tight">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 font-semibold text-[#171717]">
              <span className="inline-block w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
              Fast Express Delivery in 24-48 Hours!
            </span>
            <span className="hidden md:inline text-gray-300">|</span>
            <span className="hidden md:inline">Free Shipping on orders above ₹999</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <div className="hidden sm:flex items-center gap-2">
              <span>🇮🇳 INR (₹)</span>
              <span className="text-gray-300">|</span>
              <span>Need help? 1-800-DELIVER</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
        {/* Left: Mobile Hamburger & Brand Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 rounded-lg text-[#171717] hover:bg-[#F7F7F7] focus:outline-none"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>

          <Link to="/shop" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center text-white font-bold text-lg shadow-sm">
              📦
            </div>
            <span className="font-extrabold text-xl tracking-tight text-[#171717]">
              Delivery<span className="text-orange-500">Hub</span>
            </span>
          </Link>
        </div>

        {/* Desktop Page Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`transition-colors py-1 relative ${
                  isActive
                    ? "text-[#171717] font-bold after:content-[''] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[#171717]"
                    : "text-[#777777] hover:text-[#171717]"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right side Icons: Search, User Account, Shopping Cart with live badge */}
        <div className="flex items-center gap-2 sm:gap-4 text-[#171717]">
          {/* Search Trigger */}
          <button
            onClick={() => {
              if (onOpenSearch) onOpenSearch();
              else {
                navigate("/shop");
                setTimeout(() => {
                  const el = document.getElementById("search-input");
                  el?.focus();
                }, 100);
              }
            }}
            title="Search Products"
            className="p-1.5 rounded-full hover:bg-[#F7F7F7] text-[#171717] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>

          {/* User Account */}
          <div className="flex items-center gap-2">
            <Link
              to="/my-orders"
              title={userName}
              className="p-1.5 rounded-full hover:bg-[#F7F7F7] text-[#171717] transition-colors flex items-center gap-1.5"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="hidden lg:inline text-xs font-semibold max-w-[80px] truncate">{userName}</span>
            </Link>

            <button
              onClick={handleLogout}
              title="Sign Out"
              className="text-[#777777] hover:text-rose-600 text-xs font-medium transition-colors hidden sm:inline"
            >
              Logout
            </button>
          </div>

          {/* Cart Icon with Live Count */}
          <button
            onClick={onOpenCart || (() => navigate("/cart"))}
            className="relative p-1.5 rounded-full hover:bg-[#F7F7F7] text-[#171717] transition-colors flex items-center"
            title="View Cart"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            {activeCartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#171717] text-white text-[10px] font-bold flex items-center justify-center animate-in zoom-in-75 duration-150">
                {activeCartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Slide-down Navigation Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#EAEAEA] bg-white px-4 py-3 space-y-2 animate-fade-in shadow-lg">
          <div className="pb-2 border-b border-[#F0F0F0]">
            <p className="text-xs text-[#777777]">Signed in as</p>
            <p className="text-sm font-bold text-[#171717]">{userName}</p>
          </div>

          <div className="space-y-1">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
                    isActive
                      ? "bg-[#171717] text-white"
                      : "text-[#777777] hover:bg-[#F7F7F7] hover:text-[#171717]"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          <div className="pt-2 border-t border-[#F0F0F0]">
            <button
              onClick={handleLogout}
              className="w-full text-left px-3 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 rounded-xl"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

export default UserSidebar;
