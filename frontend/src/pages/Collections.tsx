import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api/api";
import UserSidebar from "../components/common/UserSidebar";

const CURATED_COLLECTIONS = [
  {
    id: "headphones",
    name: "Headphones",
    tagline: "Surround yourself in sound.",
    description: "High-fidelity active noise-cancelling headphones, wireless studio monitors, and everyday over-ear comfort.",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80",
    filter: "Electronics",
    itemCount: "48 products"
  },
  {
    id: "earphones",
    name: "Earphones & TWS",
    tagline: "Small design, great sound.",
    description: "Compact wireless earbuds, ergonomic sports earphones, and lossless audio true-wireless pods.",
    image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&auto=format&fit=crop&q=80",
    filter: "Accessories",
    itemCount: "36 products"
  },
  {
    id: "speakers",
    name: "Speakers & Soundbars",
    tagline: "The world's most immersive sound.",
    description: "Bluetooth portable outdoor speakers, room-filling stereo soundbars, and audiophile acoustic systems.",
    image: "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800&auto=format&fit=crop&q=80",
    filter: "Electronics",
    itemCount: "22 products"
  },
  {
    id: "accessories",
    name: "Computer Accessories",
    tagline: "Optimal condition for years.",
    description: "Ergonomic laptop stands, USB-C multiport hubs, high-speed braided cables, and shockproof cases.",
    image: "https://images.unsplash.com/photo-1625772452859-1c03d5bf1137?w=800&auto=format&fit=crop&q=80",
    filter: "Accessories",
    itemCount: "54 products"
  },
  {
    id: "gaming",
    name: "Gaming Peripherals",
    tagline: "Dive into the game with every sound.",
    description: "Mechanical keyboards with blue switches, precision DPI optical mice, RGB pads, and console accessories.",
    image: "https://images.unsplash.com/photo-1600080972464-8e5f35f63d08?w=800&auto=format&fit=crop&q=80",
    filter: "Electronics",
    itemCount: "29 products"
  },
  {
    id: "laptops",
    name: "Laptops & Hardware",
    tagline: "Performance for every professional need.",
    description: "Workstation laptops, desktop monitors, ultra-thin ultrabooks, and high-performance computing components.",
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80",
    filter: "Accessories",
    itemCount: "18 products"
  }
];

function Collections() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white text-[#171717] font-sans antialiased flex flex-col justify-between">
      <div>
        <UserSidebar />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          {/* Breadcrumb Navigation */}
          <div className="flex items-center gap-2 text-xs text-[#777777] mb-6">
            <Link to="/shop" className="hover:underline">Home</Link>
            <span>›</span>
            <span className="text-[#171717] font-bold">Collections</span>
          </div>

          {/* Section Header matching Shopify Concept Reference Image 2 */}
          <div className="mb-10">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-[#171717] tracking-tight">
              Collections
            </h1>
            <p className="text-sm text-[#777777] mt-2 max-w-xl leading-relaxed">
              Discover our carefully curated tech collections designed to elevate your audio, gaming, workstation, and mobile productivity.
            </p>
          </div>

          {/* Collections Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {CURATED_COLLECTIONS.map((col) => (
              <div
                key={col.id}
                onClick={() => navigate(`/shop?category=${col.filter}`)}
                className="bg-[#F7F7F7] rounded-[24px] border border-[#EAEAEA] overflow-hidden group cursor-pointer hover:shadow-float hover:border-[#171717] transition-all duration-300 flex flex-col justify-between"
              >
                {/* Image showcase */}
                <div className="aspect-[4/3] bg-white p-6 flex items-center justify-center overflow-hidden border-b border-[#EAEAEA]">
                  <img
                    src={col.image}
                    alt={col.name}
                    className="max-h-60 object-contain group-hover:scale-105 transition-transform duration-500"
                  />
                </div>

                {/* Details */}
                <div className="p-6 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-orange-500">
                      {col.itemCount}
                    </span>
                    <span className="w-8 h-8 rounded-full bg-white border border-[#EAEAEA] flex items-center justify-center text-xs font-bold text-[#171717] group-hover:bg-[#171717] group-hover:text-white transition-colors">
                      →
                    </span>
                  </div>

                  <h3 className="text-xl font-extrabold text-[#171717] group-hover:text-orange-500 transition-colors">
                    {col.name}
                  </h3>
                  <p className="text-xs font-semibold text-[#171717]">{col.tagline}</p>
                  <p className="text-xs text-[#777777] leading-relaxed pt-1">
                    {col.description}
                  </p>
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
            <Link to="/categories" className="hover:text-white">Categories</Link>
            <Link to="/our-story" className="hover:text-white">Our Story</Link>
            <Link to="/my-orders" className="hover:text-white">My Orders</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Collections;

