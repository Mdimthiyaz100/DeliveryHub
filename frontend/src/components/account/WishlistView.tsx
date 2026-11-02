import React, { useState, useEffect } from "react";
import api from "../../../api/api";

interface WishlistViewProps {
  onNavigateShop: () => void;
  onAddToCart?: (product: any) => void;
}

export const WishlistView: React.FC<WishlistViewProps> = ({ onNavigateShop, onAddToCart }) => {
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load wishlist from backend database with fallback to localStorage
  const loadWishlist = async () => {
    setLoading(true);
    try {
      const res = await api.get("/users/wishlist");
      if (Array.isArray(res.data) && res.data.length > 0) {
        setWishlist(res.data);
        localStorage.setItem("deliveryhub_wishlist", JSON.stringify(res.data));
        return;
      }
    } catch (err) {
      console.warn("Backend wishlist fetch failed:", err);
    } finally {
      setLoading(false);
    }

    // Fallback: check localStorage or fetch products catalog
    try {
      const saved = localStorage.getItem("deliveryhub_wishlist");
      if (saved) {
        setWishlist(JSON.parse(saved));
      } else {
        const res = await api.get("/products");
        if (Array.isArray(res.data) && res.data.length > 0) {
          const initial = res.data.slice(0, 2);
          setWishlist(initial);
          localStorage.setItem("deliveryhub_wishlist", JSON.stringify(initial));
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadWishlist();
  }, []);

  const handleRemove = async (productId: number) => {
    try {
      await api.delete(`/users/wishlist/${productId}`);
    } catch (err) {
      console.warn("Backend delete wishlist item failed:", err);
    }

    const updated = wishlist.filter((item) => (item.product_id || item.id) !== productId);
    setWishlist(updated);
    localStorage.setItem("deliveryhub_wishlist", JSON.stringify(updated));
  };

  const handleMoveToCart = (item: any) => {
    try {
      const saved = localStorage.getItem("deliveryhub_cart");
      const currentCart = saved ? JSON.parse(saved) : [];
      const pId = item.product_id || item.id;
      const existing = currentCart.find((c: any) => (c.product_id || c.id) === pId);
      if (existing) {
        existing.quantity = (Number(existing.quantity) || 1) + 1;
      } else {
        currentCart.push({ ...item, product_id: pId, quantity: 1 });
      }
      localStorage.setItem("deliveryhub_cart", JSON.stringify(currentCart));
      window.dispatchEvent(new Event("deliveryhub_cart_updated"));
      setToastMessage(`"${item.name}" added to your cart!`);
      setTimeout(() => setToastMessage(null), 3000);
    } catch (e) {
      console.error(e);
    }

    if (onAddToCart) {
      onAddToCart(item);
    }
    handleRemove(item.product_id || item.id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#171717] tracking-tight">
            Saved Wishlist
          </h2>
          <p className="text-xs text-[#737373] mt-1">
            Keep track of premium products you love and want to purchase later
          </p>
        </div>

        <span className="text-xs font-semibold text-[#888888]">
          {wishlist.length} {wishlist.length === 1 ? "Item" : "Items"} Saved
        </span>
      </div>

      {toastMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in duration-200">
          <svg className="w-4 h-4 text-emerald-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
          </svg>
          <span>{toastMessage}</span>
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center text-[#737373]">
          <div className="inline-block w-8 h-8 border-2 border-[#171717] border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-xs font-bold text-[#171717]">Loading saved items...</p>
        </div>
      ) : wishlist.length === 0 ? (
        <div className="bg-[#FAFAFA] rounded-[24px] p-12 text-center text-[#737373] border border-[#EAEAEA]">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white border border-[#EAEAEA] flex items-center justify-center text-orange-500 shadow-sm">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <p className="font-extrabold text-base text-[#171717]">Your wishlist is currently empty.</p>
          <p className="text-xs text-[#888888] mt-1 max-w-sm mx-auto">
            Discover cutting-edge gadgets, audio gear, and accessories to save for your next order.
          </p>
          <div className="pt-6">
            <button
              onClick={onNavigateShop}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#171717] hover:bg-black text-white text-xs font-bold uppercase tracking-wider transition-all"
            >
              <span>Explore Products</span>
              <span>→</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {wishlist.map((item) => {
            const pId = item.product_id || item.id;
            return (
              <div
                key={pId}
                className="bg-white rounded-2xl border border-[#EAEAEA] overflow-hidden hover:shadow-subtle transition-all duration-300 flex flex-col justify-between"
              >
                <div className="relative p-4 bg-[#FAFAFA] aspect-square flex items-center justify-center overflow-hidden">
                  <img
                    src={item.image_url || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=80"}
                    alt={item.name}
                    className="w-full h-full object-contain hover:scale-105 transition-transform duration-300"
                  />
                  <button
                    onClick={() => handleRemove(pId)}
                    title="Remove from Wishlist"
                    className="absolute top-3 right-3 p-2 rounded-full bg-white/90 hover:bg-white text-rose-500 shadow-sm transition-all"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                  </button>
                  <span className="absolute bottom-3 left-3 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                    In Stock
                  </span>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-semibold text-[#888888] uppercase tracking-wider">
                      {item.category || "Audio & Gear"}
                    </span>
                    <h4 className="font-bold text-sm text-[#171717] mt-0.5 line-clamp-1">{item.name}</h4>
                    <p className="text-sm font-extrabold text-[#171717] mt-1">
                      ₹{Number(item.price || 0).toLocaleString()}
                    </p>
                  </div>

                  <div className="pt-4 mt-3 border-t border-[#F0F0F0] flex items-center gap-2">
                    <button
                      onClick={() => handleMoveToCart(item)}
                      className="flex-1 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-colors shadow-sm"
                    >
                      Move to Cart
                    </button>
                    <button
                      onClick={() => handleRemove(pId)}
                      className="px-3 py-2 rounded-xl border border-[#DCDCDC] text-xs font-semibold text-[#666666] hover:bg-[#F7F7F7] transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default WishlistView;
