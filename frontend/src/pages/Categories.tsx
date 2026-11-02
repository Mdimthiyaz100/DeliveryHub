import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api/api";
import UserSidebar from "../components/common/UserSidebar";

const ALL_CATEGORIES = [
  {
    name: "Laptops & Computers",
    icon: "💻",
    description: "High-performance laptops, aluminum cooling stands, and workstation docks.",
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&auto=format&fit=crop&q=80",
    filter: "Accessories",
    count: "12 Items"
  },
  {
    name: "Headphones & Audio",
    icon: "🎧",
    description: "Wireless over-ear headphones, noise cancellation, and studio sound.",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80",
    filter: "Electronics",
    count: "24 Items"
  },
  {
    name: "Earphones & TWS Pods",
    icon: "🎵",
    description: "Compact wireless buds, in-ear monitors, and sports earphones.",
    image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&auto=format&fit=crop&q=80",
    filter: "Accessories",
    count: "18 Items"
  },
  {
    name: "Speakers & Soundbars",
    icon: "🔊",
    description: "360-degree wireless outdoor speakers and home acoustic systems.",
    image: "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=600&auto=format&fit=crop&q=80",
    filter: "Electronics",
    count: "14 Items"
  },
  {
    name: "Mice & Keyboards",
    icon: "🖱️",
    description: "Ergonomic wireless optical mice, RGB mechanical keyboards, and desks.",
    image: "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=600&auto=format&fit=crop&q=80",
    filter: "Electronics",
    count: "30 Items"
  },
  {
    name: "Power & Fast Charging",
    icon: "🔋",
    description: "20000mAh portable power banks, Qi wireless fast chargers, and braided cables.",
    image: "https://images.unsplash.com/photo-1609592807664-42f53fb6a341?w=600&auto=format&fit=crop&q=80",
    filter: "Accessories",
    count: "16 Items"
  },
  {
    name: "Smartwatches & Wearables",
    icon: "⌚",
    description: "Fitness trackers, OLED smart watches, and interchangeable sports bands.",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80",
    filter: "Electronics",
    count: "10 Items"
  },
  {
    name: "Gaming Gear & Peripherals",
    icon: "🎮",
    description: "Pro game controllers, tactile switches, mouse mats, and streaming gear.",
    image: "https://images.unsplash.com/photo-1600080972464-8e5f35f63d08?w=600&auto=format&fit=crop&q=80",
    filter: "Electronics",
    count: "22 Items"
  }
];

function Categories() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white text-[#171717] font-sans antialiased flex flex-col justify-between">
      <div>
        <UserSidebar />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-[#777777] mb-6">
            <Link to="/shop" className="hover:underline">Home</Link>
            <span>›</span>
            <span className="text-[#171717] font-bold">Categories</span>
          </div>

          {/* Page Heading */}
          <div className="mb-10">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-[#171717] tracking-tight">
              Product Categories
            </h1>
            <p className="text-sm text-[#777777] mt-2 max-w-xl leading-relaxed">
              Explore our complete catalogue of electronics, computer hardware, power accessories, and audio devices organized for seamless browsing.
            </p>
          </div>

          {/* Categories Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {ALL_CATEGORIES.map((cat) => (
              <div
                key={cat.name}
                onClick={() => navigate(`/shop?category=${cat.filter}`)}
                className="bg-[#F7F7F7] hover:bg-white rounded-[24px] border border-[#EAEAEA] hover:border-[#171717] p-6 hover:shadow-float transition-all duration-300 flex flex-col justify-between group cursor-pointer"
              >
                <div className="space-y-4">
                  {/* Category Image */}
                  <div className="aspect-square bg-white rounded-[18px] p-6 flex items-center justify-center border border-[#EAEAEA] overflow-hidden">
                    <img
                      src={cat.image}
                      alt={cat.name}
                      className="max-h-40 object-contain group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs font-bold text-orange-500 mb-1">
                      <span>{cat.count}</span>
                      <span className="text-xl">{cat.icon}</span>
                    </div>
                    <h3 className="text-base font-extrabold text-[#171717] group-hover:text-orange-500 transition-colors">
                      {cat.name}
                    </h3>
                    <p className="text-xs text-[#777777] leading-relaxed mt-1">
                      {cat.description}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#EAEAEA] flex items-center justify-between text-xs font-bold text-[#171717] mt-4">
                  <span>Browse Gear</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-[#171717] text-white py-12 text-xs border-t border-gray-800 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-gray-400">
          <span>© {new Date().getFullYear()} DeliveryHub Technologies Inc. All rights reserved.</span>
          <div className="flex gap-6">
            <Link to="/shop" className="hover:text-white">Shop</Link>
            <Link to="/collections" className="hover:text-white">Collections</Link>
            <Link to="/our-story" className="hover:text-white">Our Story</Link>
            <Link to="/my-orders" className="hover:text-white">My Orders</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Categories;

