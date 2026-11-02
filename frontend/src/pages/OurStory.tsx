import { Link } from "react-router-dom";
import UserSidebar from "../components/common/UserSidebar";

function OurStory() {
  return (
    <div className="min-h-screen bg-white text-[#171717] font-sans antialiased flex flex-col justify-between">
      <div>
        <UserSidebar />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-[#777777] mb-6">
            <Link to="/shop" className="hover:underline">Home</Link>
            <span>›</span>
            <span className="text-[#171717] font-bold">Our Story</span>
          </div>

          {/* Editorial Hero Section (matching Shopify Concept reference Image 9) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center py-8">
            <div className="lg:col-span-6 space-y-6">
              <span className="text-xs font-bold uppercase tracking-widest text-orange-500 bg-orange-50 px-3 py-1 rounded-full border border-orange-200">
                Pioneering Tech Delivery
              </span>
              <h1 className="text-4xl sm:text-6xl font-extrabold text-[#171717] tracking-tight leading-tight">
                Our Journey
              </h1>
              <p className="text-base sm:text-lg text-[#777777] leading-relaxed">
                In 2017, at the heart of Chennai's growing tech community, DeliveryHub was born. Our goal has always been simple: to make high-quality electronics and everyday tech accessories accessible to everyone with speed, trust, and care.
              </p>
              <div className="pt-2 flex gap-4">
                <Link
                  to="/shop"
                  className="px-8 py-3.5 rounded-full bg-[#171717] hover:bg-black text-white text-xs font-bold uppercase tracking-wider transition-all shadow-sm"
                >
                  Explore Our Catalog →
                </Link>
                <Link
                  to="/collections"
                  className="px-8 py-3.5 rounded-full bg-[#F7F7F7] hover:bg-gray-200 border border-[#EAEAEA] text-[#171717] text-xs font-bold uppercase tracking-wider transition-all"
                >
                  View Collections
                </Link>
              </div>
            </div>

            {/* Overlapping Editorial Imagery matching Image 9 */}
            <div className="lg:col-span-6 flex gap-5 items-center justify-center">
              <div className="w-1/2 rounded-[26px] overflow-hidden border border-[#EAEAEA] shadow-float">
                <img
                  src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=700&auto=format&fit=crop&q=80"
                  alt="Acoustic headphone testing"
                  className="w-full h-80 object-cover"
                />
              </div>
              <div className="w-1/2 rounded-[26px] overflow-hidden border border-[#EAEAEA] shadow-float mt-10">
                <img
                  src="https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=700&auto=format&fit=crop&q=80"
                  alt="Workstation laptop hardware"
                  className="w-full h-80 object-cover"
                />
              </div>
            </div>
          </div>

          {/* Pillars of DeliveryHub */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-16 border-t border-[#EAEAEA] mt-12">
            <div className="bg-[#F7F7F7] rounded-[24px] p-8 border border-[#EAEAEA] space-y-3">
              <span className="text-3xl block">⚡</span>
              <h3 className="text-lg font-extrabold text-[#171717]">Lightning Dispatch</h3>
              <p className="text-xs text-[#777777] leading-relaxed">
                By integrating localized micro-warehouses and automated carrier routing algorithms, we fulfill customer electronics in 24–48 hours across urban corridors.
              </p>
            </div>

            <div className="bg-[#F7F7F7] rounded-[24px] p-8 border border-[#EAEAEA] space-y-3">
              <span className="text-3xl block">🛡️</span>
              <h3 className="text-lg font-extrabold text-[#171717]">100% Genuine Tech</h3>
              <p className="text-xs text-[#777777] leading-relaxed">
                Every mouse, headset, charger, and cable in our catalogue is sourced directly from OEM authorized distributors with official warranty coverage.
              </p>
            </div>

            <div className="bg-[#F7F7F7] rounded-[24px] p-8 border border-[#EAEAEA] space-y-3">
              <span className="text-3xl block">🤝</span>
              <h3 className="text-lg font-extrabold text-[#171717]">Customer-Centric Care</h3>
              <p className="text-xs text-[#777777] leading-relaxed">
                7-day replacement policies, live GPS courier tracking, and dedicated tech support hotlines ensure your hardware arrives safe, sound, and ready to power up.
              </p>
            </div>
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
            <Link to="/categories" className="hover:text-white">Categories</Link>
            <Link to="/my-orders" className="hover:text-white">My Orders</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default OurStory;

