import React from "react";

export interface AccountSidebarProps {
  activeTab: "profile" | "orders" | "cart" | "wishlist" | "addresses" | "payments" | "settings";
  onTabChange: (tab: "profile" | "orders" | "cart" | "wishlist" | "addresses" | "payments" | "settings") => void;
  ordersCount?: number;
  wishlistCount?: number;
  cartCount?: number;
}

export const AccountSidebar: React.FC<AccountSidebarProps> = ({
  activeTab,
  onTabChange,
  ordersCount,
  wishlistCount,
  cartCount,
}) => {
  const menuItems = [
    {
      id: "profile" as const,
      label: "Profile",
      // Clean, professional user silhouette
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
    {
      id: "orders" as const,
      label: "My Orders",
      badge: ordersCount !== undefined && ordersCount > 0 ? ordersCount : undefined,
      // Premium box/package icon
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
    },
    {
      id: "cart" as const,
      label: "My Cart",
      badge: cartCount !== undefined && cartCount > 0 ? cartCount : undefined,
      // Shopping bag icon
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      ),
    },
    {
      id: "wishlist" as const,
      label: "Wishlist",
      badge: wishlistCount !== undefined && wishlistCount > 0 ? wishlistCount : undefined,
      // Minimalist heart icon
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      ),
    },
    {
      id: "addresses" as const,
      label: "Addresses",
      // Pin/Map marker icon
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      id: "payments" as const,
      label: "Payments",
      // Modern credit card icon
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
    },
    {
      id: "settings" as const,
      label: "Settings",
      // Crisp settings / sliders icon
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ];

  return (
    <aside className="w-full bg-[#FAFAFA] border border-[#EAEAEA] rounded-[24px] p-5 sm:p-6 shadow-sm">
      <div className="pb-4 mb-2 border-b border-[#F0F0F0]">
        <h3 className="text-lg font-extrabold text-[#171717] tracking-tight">My Account</h3>
        <p className="text-xs text-[#737373] mt-0.5">Manage orders, addresses & settings</p>
      </div>

      {/* Desktop / Tablet Vertical Menu */}
      <nav className="space-y-1.5" aria-label="Account navigation">
        {menuItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 group text-left ${
                isActive
                  ? "bg-white border border-[#EAEAEA] text-orange-500 font-bold shadow-sm"
                  : "text-[#555555] hover:text-[#171717] hover:bg-white/60"
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`transition-colors duration-200 ${
                    isActive ? "text-orange-500" : "text-[#888888] group-hover:text-[#171717]"
                  }`}
                >
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </div>

              {item.badge !== undefined && (
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    isActive
                      ? "bg-orange-100 text-orange-600"
                      : "bg-[#EDEDED] text-[#555555] group-hover:bg-[#E2E2E2]"
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </aside>
  );
};

export default AccountSidebar;

