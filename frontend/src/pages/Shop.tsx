import { useState, useEffect, FormEvent } from "react";
import api from "../../api/api";
import UserSidebar from "../components/common/UserSidebar";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80";

// Curated collection definitions matching the Shopify Concept image
const CURATED_COLLECTIONS = [
  {
    id: "headphones",
    name: "Headphones",
    tagline: "Surround yourself in sound.",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80",
    filter: "Electronics"
  },
  {
    id: "earphones",
    name: "Earphones",
    tagline: "Small design, great sound.",
    image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&auto=format&fit=crop&q=80",
    filter: "Accessories"
  },
  {
    id: "speakers",
    name: "Speakers",
    tagline: "The world's most immersive sound.",
    image: "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=600&auto=format&fit=crop&q=80",
    filter: "Electronics"
  },
  {
    id: "accessories",
    name: "Accessories",
    tagline: "Optimal condition for years.",
    image: "https://images.unsplash.com/photo-1625772452859-1c03d5bf1137?w=600&auto=format&fit=crop&q=80",
    filter: "Accessories"
  },
  {
    id: "gaming",
    name: "Gaming",
    tagline: "Dive into the game with every sound.",
    image: "https://images.unsplash.com/photo-1600080972464-8e5f35f63d08?w=600&auto=format&fit=crop&q=80",
    filter: "Electronics"
  },
  {
    id: "laptops",
    name: "Laptops & Gear",
    tagline: "Performance for every professional need.",
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&auto=format&fit=crop&q=80",
    filter: "Accessories"
  }
];

// Category quick icon cards (Shop By Category row in Concept theme)
const CATEGORY_CARDS = [
  { name: "Laptops", icon: "💻", image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=300&auto=format&fit=crop&q=80", filter: "Accessories" },
  { name: "Headphones", icon: "🎧", image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&auto=format&fit=crop&q=80", filter: "Electronics" },
  { name: "Earphones", icon: "🎵", image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=300&auto=format&fit=crop&q=80", filter: "Accessories" },
  { name: "Speakers", icon: "🔊", image: "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=300&auto=format&fit=crop&q=80", filter: "Electronics" },
  { name: "Accessories", icon: "🔌", image: "https://images.unsplash.com/photo-1625772452859-1c03d5bf1137?w=300&auto=format&fit=crop&q=80", filter: "Accessories" },
  { name: "Gaming", icon: "🎮", image: "https://images.unsplash.com/photo-1600080972464-8e5f35f63d08?w=300&auto=format&fit=crop&q=80", filter: "Electronics" },
];

interface Product {
  id: number;
  name: string;
  price: number | string;
  category?: string;
  description?: string;
  image_url?: string;
}

interface CartItem extends Product {
  qty: number;
}

function Shop() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productDetailQty, setProductDetailQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderIds, setOrderIds] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("popularity");
  const [checkoutStep, setCheckoutStep] = useState(1); // 1: Address, 2: Payment, 3: Review
  const [wishlist, setWishlist] = useState<number[]>([]);

  const [checkoutDetails, setCheckoutDetails] = useState({
    name: localStorage.getItem("userName") || "",
    phone: "",
    address: "No.12, 2nd Cross, Anna Nagar, Chennai - 600040",
    paymentMethod: "Cash on Delivery",
  });
  const [checkoutError, setCheckoutError] = useState("");

  useEffect(() => {
    api.get("/products")
      .then((res) => {
        setProducts(res.data || []);
      })
      .catch((err) => console.error("Error fetching products:", err))
      .finally(() => setLoading(false));
  }, []);

  const categories = ["All", ...new Set(products.map((p) => p.category).filter(Boolean) as string[])];

  const filteredProducts = products
    .filter((p) => {
      const matchesQuery =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description || "").toLowerCase().includes(searchQuery.toLowerCase());
      return matchesQuery && (selectedCategory === "All" || p.category === selectedCategory);
    })
    .sort((a, b) => {
      if (sortBy === "price-low") return Number(a.price) - Number(b.price);
      if (sortBy === "price-high") return Number(b.price) - Number(a.price);
      return a.id - b.id;
    });

  const updateQty = (productId: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => (item.id === productId ? { ...item, qty: item.qty + delta } : item))
        .filter((item) => item.qty > 0)
    );
  };

  const addToCart = (product: Product, quantity = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, qty: item.qty + quantity } : item
        );
      }
      return [...prev, { ...product, qty: quantity }];
    });
  };

  const toggleWishlist = (id: number) => {
    setWishlist((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const cartTotal = cart.reduce((sum, item) => sum + Number(item.price) * item.qty, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);

  const openCheckout = () => {
    setCheckoutError("");
    setCheckoutStep(1);
    setCheckoutDetails((prev) => ({
      ...prev,
      name: prev.name || localStorage.getItem("userName") || "",
    }));
    setShowCart(false);
    setShowCheckout(true);
  };

  const placeOrder = async (event?: FormEvent) => {
    if (event) event.preventDefault();
    if (!cart.length) return;
    const { name, phone, address, paymentMethod } = checkoutDetails;
    if (!name.trim() || !phone.trim() || !address.trim() || !paymentMethod) {
      setCheckoutError("Please fill in all delivery and recipient details.");
      return;
    }
    setOrdering(true);
    try {
      const orderRequests = cart.map((item) =>
        api.post("/orders", {
          item: item.name,
          quantity: item.qty || 1,
          amount: Number(item.price) * (item.qty || 1),
          name: name.trim(),
          phone: phone.trim(),
          address: address.trim(),
          paymentMethod,
        })
      );
      const responses = await Promise.all(orderRequests);
      setOrderIds(responses.map((res) => res.data.id));
      setCart([]);
      setShowCheckout(false);
      setOrderSuccess(true);
      setTimeout(() => setOrderSuccess(false), 7000);
    } catch (err) {
      console.error("Error placing order:", err);
      alert("Failed to submit order. Please try again.");
    } finally {
      setOrdering(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#171717] font-sans antialiased">
      {/* ── 1. HEADER (Shopify Concept Theme) ── */}
      <UserSidebar
        cartCount={cartCount}
        onOpenCart={() => setShowCart(true)}
        onOpenSearch={() => {
          const el = document.getElementById("search-input");
          el?.focus();
        }}
      />

      {/* Toast Notification */}
      {orderSuccess && (
        <div className="fixed top-24 right-6 z-50 bg-[#171717] text-white px-6 py-4 rounded-2xl shadow-float flex items-center gap-3 border border-gray-700 animate-bounce">
          <span className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center font-bold text-sm text-white">✓</span>
          <div>
            <p className="font-bold text-sm">Order Confirmed!</p>
            <p className="text-xs text-gray-400">{orderIds.length} item(s) processed. Track in My Orders.</p>
          </div>
        </div>
      )}

      {/* ── 2. HERO SECTION (Concept Preset Image 1) ── */}
      <section className="bg-white py-12 md:py-20 border-b border-[#EAEAEA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Narrative */}
            <div className="lg:col-span-6 space-y-6">
              <span className="inline-block text-[11px] font-bold uppercase tracking-widest text-[#777777] bg-[#F7F7F7] px-3 py-1 rounded-full border border-[#EAEAEA]">
                New Arrivals
              </span>
              <h1 className="text-4xl sm:text-6xl xl:text-7xl font-extrabold tracking-tight text-[#171717] leading-[1.05]">
                Premium <br />
                Electronics <br />
                Delivered Fast
              </h1>
              <p className="text-[#777777] text-base sm:text-lg max-w-md leading-relaxed">
                Laptops, headphones, accessories and more. All in one place.
              </p>

              <div className="flex flex-wrap gap-4 pt-2">
                <a
                  href="#category-listing"
                  className="px-8 py-3.5 rounded-full bg-[#171717] hover:bg-black text-white text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 shadow-sm"
                >
                  <span>Shop Now</span>
                  <span>→</span>
                </a>
                <a
                  href="#collections"
                  className="px-8 py-3.5 rounded-full bg-white hover:bg-[#F7F7F7] border border-[#EAEAEA] text-[#171717] text-xs font-bold uppercase tracking-wider transition-colors"
                >
                  Explore Collections
                </a>
              </div>

              {/* Slider Dots Indicator */}
              <div className="flex items-center gap-2 pt-6">
                <span className="w-6 h-2 rounded-full bg-[#171717]"></span>
                <span className="w-2 h-2 rounded-full bg-gray-300"></span>
                <span className="w-2 h-2 rounded-full bg-gray-300"></span>
                <span className="w-2 h-2 rounded-full bg-gray-300"></span>
              </div>
            </div>

            {/* Right Hero Product Feature Image */}
            <div className="lg:col-span-6 relative flex justify-center">
              <div className="relative w-full max-w-lg aspect-square rounded-[24px] bg-[#F7F7F7] flex items-center justify-center p-8 overflow-hidden group">
                {/* Previous / Next Arrow Controls from Concept Reference */}
                <button
                  className="absolute left-4 w-10 h-10 rounded-full bg-white border border-[#EAEAEA] flex items-center justify-center text-sm font-bold text-[#171717] shadow-sm hover:scale-105 transition-transform z-10"
                  aria-label="Previous image"
                >
                  ‹
                </button>
                <img
                  src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80"
                  alt="Sony WH-CH520 Premium Headphones"
                  className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                />
                <button
                  className="absolute right-4 w-10 h-10 rounded-full bg-white border border-[#EAEAEA] flex items-center justify-center text-sm font-bold text-[#171717] shadow-sm hover:scale-105 transition-transform z-10"
                  aria-label="Next image"
                >
                  ›
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. SHOPPING BENEFITS (Four Items from Image 1) ── */}
      <section className="bg-white py-8 border-b border-[#EAEAEA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#F7F7F7] border border-[#EAEAEA] flex items-center justify-center text-lg">
                🚚
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#171717]">Fast Delivery</h4>
                <p className="text-[11px] text-[#777777]">In 24–48 hours</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#F7F7F7] border border-[#EAEAEA] flex items-center justify-center text-lg">
                🔄
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#171717]">Easy Returns</h4>
                <p className="text-[11px] text-[#777777]">7 day return policy</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#F7F7F7] border border-[#EAEAEA] flex items-center justify-center text-lg">
                🔒
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#171717]">Secure Payments</h4>
                <p className="text-[11px] text-[#777777]">100% safe &amp; secure</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#F7F7F7] border border-[#EAEAEA] flex items-center justify-center text-lg">
                📦
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#171717]">Wide Selection</h4>
                <p className="text-[11px] text-[#777777]">10,000+ products</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. SHOP BY CATEGORY (White Pill Cards from Reference) ── */}
      <section id="categories" className="py-16 max-w-7xl mx-auto px-4 sm:px-6 border-b border-[#EAEAEA]">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#171717] tracking-tight mb-8">
          Shop by Category
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {CATEGORY_CARDS.map((cat) => (
            <button
              key={cat.name}
              onClick={() => {
                setSelectedCategory(cat.filter);
                const el = document.getElementById("category-listing");
                el?.scrollIntoView({ behavior: "smooth" });
              }}
              className="bg-[#F7F7F7] hover:bg-white rounded-[20px] p-5 border border-[#EAEAEA] hover:border-[#171717] hover:shadow-subtle transition-all duration-300 flex flex-col items-center justify-between group h-44 text-center"
            >
              <div className="w-full flex-1 flex items-center justify-center overflow-hidden">
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="max-h-24 object-contain group-hover:scale-110 transition-transform duration-300"
                />
              </div>
              <div className="flex items-center justify-between w-full pt-3 text-xs font-bold text-[#171717]">
                <span>{cat.name}</span>
                <span className="text-[#777777] group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* ── 5. COLLECTIONS SECTION (Shopify Concept Page 2 from Reference) ── */}
      <section id="collections" className="py-16 max-w-7xl mx-auto px-4 sm:px-6 border-b border-[#EAEAEA]">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#171717] tracking-tight">
              Collections
            </h2>
            <p className="text-xs text-[#777777] mt-1">Discover our curated tech collections</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {CURATED_COLLECTIONS.map((col) => (
            <div
              key={col.id}
              onClick={() => {
                setSelectedCategory(col.filter);
                const el = document.getElementById("category-listing");
                el?.scrollIntoView({ behavior: "smooth" });
              }}
              className="bg-[#F7F7F7] rounded-[22px] border border-[#EAEAEA] overflow-hidden group cursor-pointer hover:shadow-subtle transition-all"
            >
              <div className="aspect-[4/3] bg-white p-6 flex items-center justify-center overflow-hidden border-b border-[#EAEAEA]">
                <img
                  src={col.image}
                  alt={col.name}
                  className="max-h-52 object-contain group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-6 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-[#171717] group-hover:text-orange-500 transition-colors">
                    {col.name}
                  </h3>
                  <p className="text-xs text-[#777777] mt-0.5">{col.tagline}</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-white border border-[#EAEAEA] flex items-center justify-center text-xs font-bold text-[#171717] group-hover:bg-[#171717] group-hover:text-white transition-colors">
                  →
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 6. CATEGORY / PRODUCT LISTING (Reference Page 3: Concept Grid + Sidebar Filters) ── */}
      <section id="category-listing" className="py-16 max-w-7xl mx-auto px-4 sm:px-6 border-b border-[#EAEAEA]">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-xs text-[#777777] mb-6">
          <span className="hover:underline cursor-pointer">Home</span>
          <span>›</span>
          <span className="hover:underline cursor-pointer">Electronics</span>
          <span>›</span>
          <span className="text-[#171717] font-bold">{selectedCategory}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Sidebar Filters matching Concept Theme */}
          <aside className="lg:col-span-3 bg-white border border-[#EAEAEA] rounded-[20px] p-6 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#EAEAEA]">
              <h3 className="text-sm font-extrabold text-[#171717]">Filters</h3>
              <button
                onClick={() => {
                  setSelectedCategory("All");
                  setSearchQuery("");
                }}
                className="text-xs text-[#777777] hover:text-[#171717] font-semibold underline"
              >
                Clear All
              </button>
            </div>

            {/* Category Filter */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#171717]">Category</h4>
              <div className="space-y-2">
                {categories.map((cat) => (
                  <label key={cat} className="flex items-center gap-2.5 text-xs text-[#777777] hover:text-[#171717] cursor-pointer">
                    <input
                      type="radio"
                      name="category"
                      checked={selectedCategory === cat}
                      onChange={() => setSelectedCategory(cat)}
                      className="accent-[#171717]"
                    />
                    <span>{cat}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Brand Filter */}
            <div className="space-y-3 pt-4 border-t border-[#EAEAEA]">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#171717]">Brand</h4>
              <div className="space-y-2 text-xs text-[#777777]">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input type="checkbox" defaultChecked className="accent-[#171717] rounded" />
                  <span>Sony &amp; boAt (48)</span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input type="checkbox" defaultChecked className="accent-[#171717] rounded" />
                  <span>DELL &amp; Apple (34)</span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input type="checkbox" className="accent-[#171717] rounded" />
                  <span>JBL &amp; Noise (29)</span>
                </label>
              </div>
            </div>

            {/* Price Filter Slider Simulation */}
            <div className="space-y-3 pt-4 border-t border-[#EAEAEA]">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#171717]">Price</h4>
              <input type="range" min="399" max="5000" className="w-full accent-[#171717]" />
              <div className="flex justify-between text-[11px] text-[#777777] font-semibold">
                <span>₹399</span>
                <span>₹5,000+</span>
              </div>
            </div>

            {/* Rating Filter */}
            <div className="space-y-2 pt-4 border-t border-[#EAEAEA]">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#171717]">Rating</h4>
              <div className="flex items-center gap-1 text-orange-500 text-xs">
                <span>★★★★★</span>
                <span className="text-[#777777] text-[11px]">(4.0 &amp; above)</span>
              </div>
            </div>
          </aside>

          {/* Right Product Grid */}
          <div className="lg:col-span-9 space-y-6">
            {/* Top Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EAEAEA]">
              <div>
                <h3 className="text-xl font-extrabold text-[#171717]">
                  {selectedCategory === "All" ? "All Products" : selectedCategory}
                  <span className="text-xs font-medium text-[#777777] ml-2">({filteredProducts.length} products)</span>
                </h3>
              </div>

              <div className="flex items-center gap-3">
                {/* Search Bar Input */}
                <input
                  id="search-input"
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="px-3.5 py-1.5 rounded-full bg-[#F7F7F7] border border-[#EAEAEA] text-xs text-[#171717] focus:outline-none focus:border-[#171717]"
                />

                {/* Sort By Dropdown */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-white border border-[#EAEAEA] rounded-full px-3.5 py-1.5 text-xs font-semibold text-[#171717] focus:outline-none"
                >
                  <option value="popularity">Sort by: Popularity</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                </select>
              </div>
            </div>

            {/* Product Cards Grid matching Concept Theme Cards */}
            {loading ? (
              <div className="py-20 text-center text-[#777777]">
                <div className="inline-block w-8 h-8 border-2 border-[#171717] border-t-transparent rounded-full animate-spin mb-3"></div>
                <p className="text-xs font-bold">Loading product catalogue...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="bg-[#F7F7F7] rounded-[22px] p-12 text-center text-[#777777]">
                <span className="text-4xl block mb-2">🔍</span>
                <p className="font-bold text-[#171717]">No products found.</p>
                <p className="text-xs mt-1">Try resetting the filter or using different keywords.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredProducts.map((product) => {
                  const isWishlisted = wishlist.includes(product.id);
                  const originalPrice = Math.round(Number(product.price) * 1.4);

                  return (
                    <div
                      key={product.id}
                      className="bg-white rounded-[20px] border border-[#EAEAEA] overflow-hidden hover:shadow-float transition-all duration-300 flex flex-col justify-between group relative"
                    >
                      {/* Discount Badge */}
                      <span className="absolute top-3 left-3 z-10 bg-orange-500 text-white text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md">
                        30% OFF
                      </span>

                      {/* Wishlist Heart Button */}
                      <button
                        onClick={() => toggleWishlist(product.id)}
                        className={`absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm border border-[#EAEAEA] flex items-center justify-center text-sm transition-colors ${
                          isWishlisted ? "text-rose-500" : "text-[#777777] hover:text-[#171717]"
                        }`}
                        title="Add to Wishlist"
                      >
                        {isWishlisted ? "♥" : "♡"}
                      </button>

                      {/* Product Image Area */}
                      <div
                        onClick={() => setSelectedProduct(product)}
                        className="aspect-square bg-[#F7F7F7] p-6 flex items-center justify-center overflow-hidden cursor-pointer"
                      >
                        <img
                          src={product.image_url || FALLBACK_IMAGE}
                          alt={product.name}
                          className="max-h-48 object-contain group-hover:scale-105 transition-transform duration-300"
                          onError={(e: any) => (e.target.src = FALLBACK_IMAGE)}
                        />
                      </div>

                      {/* Content Area */}
                      <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                        <div>
                          {/* Product Title */}
                          <h4
                            onClick={() => setSelectedProduct(product)}
                            className="font-bold text-sm text-[#171717] hover:text-orange-500 transition-colors line-clamp-1 cursor-pointer"
                          >
                            {product.name}
                          </h4>

                          {/* Ratings */}
                          <div className="flex items-center gap-1.5 text-xs text-[#777777] mt-1">
                            <span className="text-orange-500">★ 4.6</span>
                            <span className="text-[11px]">(8,230)</span>
                          </div>

                          {/* Prices */}
                          <div className="flex items-baseline gap-2 mt-2">
                            <span className="text-base font-extrabold text-[#171717]">
                              ₹{Number(product.price).toLocaleString()}
                            </span>
                            <span className="text-xs text-[#777777] line-through">
                              ₹{originalPrice.toLocaleString()}
                            </span>
                          </div>
                        </div>

                        {/* Add to Cart button matching reference */}
                        <div className="pt-2 flex gap-2">
                          <button
                            onClick={() => addToCart(product)}
                            className="flex-1 py-2.5 px-4 rounded-full bg-[#171717] hover:bg-black text-white text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                          >
                            <span>🛒</span>
                            <span>Add to Cart</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── 7. BRAND STORY SECTION (Concept Theme "Our Journey" from Reference) ── */}
      <section id="about-story" className="py-20 bg-[#F7F7F7] border-b border-[#EAEAEA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Overlapping Editorial Images */}
            <div className="lg:col-span-6 flex gap-4 items-center justify-center">
              <div className="w-1/2 rounded-[24px] overflow-hidden border border-[#EAEAEA] shadow-subtle">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80"
                  alt="Founder listening with headphones"
                  className="w-full h-72 object-cover"
                />
              </div>
              <div className="w-1/2 rounded-[24px] overflow-hidden border border-[#EAEAEA] shadow-subtle mt-8">
                <img
                  src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=500&auto=format&fit=crop&q=80"
                  alt="Engineering team testing tech"
                  className="w-full h-72 object-cover"
                />
              </div>
            </div>

            {/* Editorial Story Text */}
            <div className="lg:col-span-6 space-y-6">
              <span className="text-[11px] font-bold uppercase tracking-widest text-orange-500">
                About DeliveryHub
              </span>
              <h2 className="text-4xl sm:text-5xl font-extrabold text-[#171717] tracking-tight">
                Our Journey
              </h2>
              <p className="text-sm sm:text-base text-[#777777] leading-relaxed">
                In 2017, at the heart of Chennai's growing tech community, DeliveryHub was born. Our goal has always been to bring high-quality electronics and everyday tech closer to everyone, with speed, trust, and care.
              </p>
              <div>
                <button
                  onClick={() => {
                    const el = document.getElementById("category-listing");
                    el?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="px-8 py-3.5 rounded-full bg-[#171717] hover:bg-black text-white text-xs font-bold uppercase tracking-wider shadow-sm transition-all"
                >
                  Our Story →
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 8. FOOTER (Shopify Concept Theme Footer) ── */}
      <footer className="bg-[#171717] text-white py-16 text-xs border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-10 mb-12">
            <div className="md:col-span-2 space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center text-white font-bold text-lg">
                  📦
                </div>
                <span className="font-extrabold text-xl tracking-tight text-white">
                  Delivery<span className="text-orange-500">Hub</span>
                </span>
              </div>
              <p className="text-gray-400 text-xs max-w-sm leading-relaxed">
                Your premier e-commerce destination for curated consumer electronics, computer peripherals, and smart accessories. Speed, security, and warranty guaranteed.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-white uppercase tracking-wider mb-4">Shop</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#category-listing" className="hover:text-white">All Products</a></li>
                <li><a href="#collections" className="hover:text-white">Headphones</a></li>
                <li><a href="#collections" className="hover:text-white">Speakers</a></li>
                <li><a href="#collections" className="hover:text-white">Accessories</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white uppercase tracking-wider mb-4">Customer Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><span>Track Order</span></li>
                <li><span>Shipping Policy</span></li>
                <li><span>Returns &amp; Exchanges</span></li>
                <li><span>Warranty Registration</span></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white uppercase tracking-wider mb-4">Stay Connected</h4>
              <p className="text-[11px] text-gray-400 mb-3">Subscribe for exclusive flash deals and announcements.</p>
              <div className="flex">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="px-3.5 py-2.5 rounded-l-full bg-white/10 border border-white/20 text-white text-xs w-full focus:outline-none focus:border-white"
                />
                <button className="bg-white text-[#171717] px-4 py-2.5 rounded-r-full font-bold hover:bg-gray-100">
                  →
                </button>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-gray-400 text-[11px]">
            <span>© {new Date().getFullYear()} DeliveryHub. Designed with Concept Theme preset. All rights reserved.</span>
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded bg-white/10 text-white text-[10px] font-bold">VISA</span>
              <span className="px-2.5 py-1 rounded bg-white/10 text-white text-[10px] font-bold">Mastercard</span>
              <span className="px-2.5 py-1 rounded bg-white/10 text-white text-[10px] font-bold">UPI / GPay</span>
            </div>
          </div>
        </div>
      </footer>

      {/* ── 9. PRODUCT DETAILS MODAL (Image 4 from Reference) ── */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[24px] shadow-modal w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 md:p-8 relative">
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute top-6 right-6 w-9 h-9 rounded-full bg-[#F7F7F7] border border-[#EAEAEA] flex items-center justify-center text-sm font-bold text-[#171717] hover:bg-black hover:text-white transition-colors"
            >
              ✕
            </button>

            {/* Breadcrumb inside modal */}
            <div className="flex items-center gap-2 text-xs text-[#777777] mb-6">
              <span>Home</span>
              <span>›</span>
              <span>Electronics</span>
              <span>›</span>
              <span className="text-[#171717] font-semibold">{selectedProduct.name}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
              {/* Product Gallery Left */}
              <div className="md:col-span-6 space-y-4">
                <div className="aspect-square bg-[#F7F7F7] rounded-[20px] p-6 flex items-center justify-center border border-[#EAEAEA]">
                  <img
                    src={selectedProduct.image_url || FALLBACK_IMAGE}
                    alt={selectedProduct.name}
                    className="max-h-72 object-contain"
                  />
                </div>
              </div>

              {/* Product Info Right */}
              <div className="md:col-span-6 space-y-5">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#777777] block">
                    {selectedProduct.category || "Electronics"}
                  </span>
                  <h3 className="text-2xl font-extrabold text-[#171717] mt-1 leading-snug">
                    {selectedProduct.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-2 text-xs">
                    <span className="text-orange-500">★★★★★</span>
                    <span className="font-bold text-[#171717]">4.6</span>
                    <span className="text-[#777777]">(8,230 reviews)</span>
                  </div>
                </div>

                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-extrabold text-[#171717]">
                    ₹{Number(selectedProduct.price).toLocaleString()}
                  </span>
                  <span className="text-sm text-[#777777] line-through">
                    ₹{Math.round(Number(selectedProduct.price) * 1.4).toLocaleString()}
                  </span>
                  <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2 py-0.5 rounded-full">
                    30% OFF
                  </span>
                  <span className="text-xs text-emerald-600 font-bold ml-auto">● In Stock</span>
                </div>

                {/* Bullets feature list */}
                <ul className="text-xs text-[#777777] space-y-2 border-t border-b border-[#EAEAEA] py-4">
                  <li className="flex items-center gap-2">✓ 1-Year Official Brand Warranty</li>
                  <li className="flex items-center gap-2">✓ Express 24-48 Hours Dispatch</li>
                  <li className="flex items-center gap-2">✓ 7-Day Hassle-Free Replacement</li>
                </ul>

                <p className="text-xs text-[#777777] leading-relaxed">
                  {selectedProduct.description || "High performance electronics built to deliver exceptional quality and longevity."}
                </p>

                {/* Quantity and Actions */}
                <div className="flex items-center gap-4 pt-2">
                  <div className="flex items-center border border-[#EAEAEA] rounded-full p-1 bg-[#F7F7F7]">
                    <button
                      onClick={() => setProductDetailQty(Math.max(1, productDetailQty - 1))}
                      className="w-8 h-8 rounded-full bg-white text-[#171717] font-bold text-sm shadow-sm"
                    >
                      −
                    </button>
                    <span className="w-8 text-center text-xs font-bold">{productDetailQty}</span>
                    <button
                      onClick={() => setProductDetailQty(productDetailQty + 1)}
                      className="w-8 h-8 rounded-full bg-white text-[#171717] font-bold text-sm shadow-sm"
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      addToCart(selectedProduct, productDetailQty);
                      setSelectedProduct(null);
                      setShowCart(true);
                    }}
                    className="flex-1 py-3 px-6 rounded-full bg-[#171717] hover:bg-black text-white text-xs font-bold uppercase tracking-wider transition-all"
                  >
                    Add to Cart
                  </button>

                  <button
                    onClick={() => {
                      addToCart(selectedProduct, productDetailQty);
                      setSelectedProduct(null);
                      openCheckout();
                    }}
                    className="py-3 px-6 rounded-full bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold uppercase tracking-wider transition-all"
                  >
                    Buy Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 10. SHOPPING CART (Image 5 from Reference) ── */}
      {showCart && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[24px] shadow-modal w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-[#EAEAEA]">
              <div>
                <h3 className="text-xl font-extrabold text-[#171717]">Your Cart</h3>
                <p className="text-xs text-[#777777]">{cartCount} item(s) selected</p>
              </div>
              <button
                onClick={() => setShowCart(false)}
                className="w-8 h-8 rounded-full bg-[#F7F7F7] flex items-center justify-center text-sm font-bold text-[#171717] hover:bg-black hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin">
              {!cart.length ? (
                <div className="text-center py-12 text-[#777777]">
                  <span className="text-4xl block mb-2">🛒</span>
                  Your cart is empty. Explore our electronics collection!
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 p-4 rounded-[16px] bg-[#F7F7F7] border border-[#EAEAEA]">
                    <img
                      src={item.image_url || FALLBACK_IMAGE}
                      alt={item.name}
                      className="w-16 h-16 rounded-xl object-contain bg-white p-2 flex-shrink-0 border border-[#EAEAEA]"
                      onError={(e: any) => (e.target.src = FALLBACK_IMAGE)}
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm text-[#171717] truncate">{item.name}</h4>
                      <p className="text-xs font-extrabold text-[#171717] mt-1">₹{Number(item.price).toLocaleString()}</p>
                    </div>

                    {/* Quantity controls */}
                    <div className="flex items-center border border-[#EAEAEA] rounded-full p-0.5 bg-white">
                      <button
                        onClick={() => updateQty(item.id, -1)}
                        className="w-7 h-7 rounded-full bg-[#F7F7F7] hover:bg-gray-200 text-[#171717] font-bold text-xs"
                      >
                        −
                      </button>
                      <span className="w-6 text-center text-xs font-bold">{item.qty}</span>
                      <button
                        onClick={() => updateQty(item.id, 1)}
                        className="w-7 h-7 rounded-full bg-[#F7F7F7] hover:bg-gray-200 text-[#171717] font-bold text-xs"
                      >
                        +
                      </button>
                    </div>

                    <div className="text-right pl-3">
                      <p className="text-xs font-extrabold text-[#171717]">₹{(Number(item.price) * item.qty).toLocaleString()}</p>
                      <button
                        onClick={() => updateQty(item.id, -item.qty)}
                        className="text-xs text-rose-500 hover:underline mt-1 block"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-6 bg-[#F7F7F7] border-t border-[#EAEAEA] space-y-4">
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-[#777777]">
                    <span>Subtotal</span>
                    <span>₹{cartTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Delivery</span>
                    <span>FREE</span>
                  </div>
                  <div className="flex justify-between text-base font-extrabold text-[#171717] pt-2 border-t border-[#EAEAEA]">
                    <span>Total</span>
                    <span>₹{cartTotal.toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={() => setShowCart(false)}
                    className="text-xs font-bold text-[#777777] hover:text-[#171717] underline"
                  >
                    ← Continue Shopping
                  </button>
                  <button
                    onClick={openCheckout}
                    className="px-8 py-3 rounded-full bg-[#171717] hover:bg-black text-white text-xs font-bold uppercase tracking-wider transition-all"
                  >
                    Proceed to Checkout →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 11. CHECKOUT (Image 6 from Reference: Step 1 Address, Step 2 Payment, Step 3 Place Order) ── */}
      {showCheckout && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-[24px] shadow-modal w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 md:p-8">
            <div className="flex justify-between items-center pb-6 border-b border-[#EAEAEA]">
              <div>
                <span className="font-extrabold text-xl tracking-tight text-[#171717]">Checkout</span>
              </div>
              <button
                type="button"
                onClick={() => setShowCheckout(false)}
                className="w-8 h-8 rounded-full bg-[#F7F7F7] flex items-center justify-center text-sm font-bold text-[#171717]"
              >
                ✕
              </button>
            </div>

            {/* Stepper indicator matching Reference (1 Address -> 2 Payment -> 3 Place Order) */}
            <div className="flex items-center justify-center gap-6 py-6 border-b border-[#EAEAEA] text-xs">
              <div className="flex items-center gap-2">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${checkoutStep >= 1 ? "bg-[#171717] text-white" : "bg-gray-200 text-gray-600"}`}>
                  1
                </span>
                <span className="font-bold text-[#171717]">Address</span>
              </div>
              <span className="w-8 h-[1px] bg-[#EAEAEA]"></span>
              <div className="flex items-center gap-2">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${checkoutStep >= 2 ? "bg-[#171717] text-white" : "bg-gray-200 text-gray-600"}`}>
                  2
                </span>
                <span className={checkoutStep >= 2 ? "font-bold text-[#171717]" : "text-[#777777]"}>Payment</span>
              </div>
              <span className="w-8 h-[1px] bg-[#EAEAEA]"></span>
              <div className="flex items-center gap-2">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${checkoutStep >= 3 ? "bg-[#171717] text-white" : "bg-gray-200 text-gray-600"}`}>
                  3
                </span>
                <span className={checkoutStep >= 3 ? "font-bold text-[#171717]" : "text-[#777777]"}>Place Order</span>
              </div>
            </div>

            {checkoutError && (
              <div className="my-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {checkoutError}
              </div>
            )}

            {/* Step 1: Delivery Address Form */}
            {checkoutStep === 1 && (
              <div className="py-6 space-y-4">
                <h4 className="text-sm font-extrabold text-[#171717]">Delivery Address</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-[#777777] mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={checkoutDetails.name}
                      onChange={(e) => setCheckoutDetails({ ...checkoutDetails, name: e.target.value })}
                      placeholder="e.g. John Doe"
                      className="w-full px-4 py-2.5 rounded-xl border border-[#EAEAEA] text-xs text-[#171717] focus:outline-none focus:border-[#171717]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#777777] mb-1">Phone Number</label>
                    <input
                      type="tel"
                      required
                      value={checkoutDetails.phone}
                      onChange={(e) => setCheckoutDetails({ ...checkoutDetails, phone: e.target.value })}
                      placeholder="e.g. 9876543210"
                      className="w-full px-4 py-2.5 rounded-xl border border-[#EAEAEA] text-xs text-[#171717] focus:outline-none focus:border-[#171717]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#777777] mb-1">Address Details</label>
                    <textarea
                      rows={3}
                      required
                      value={checkoutDetails.address}
                      onChange={(e) => setCheckoutDetails({ ...checkoutDetails, address: e.target.value })}
                      placeholder="House/flat, street, area, city, PIN code"
                      className="w-full px-4 py-2.5 rounded-xl border border-[#EAEAEA] text-xs text-[#171717] focus:outline-none focus:border-[#171717] resize-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-[#EAEAEA]">
                  <button
                    type="button"
                    onClick={() => setShowCheckout(false)}
                    className="px-6 py-2.5 rounded-full border border-[#EAEAEA] text-xs font-bold text-[#777777]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!checkoutDetails.name.trim() || !checkoutDetails.phone.trim() || !checkoutDetails.address.trim()) {
                        setCheckoutError("Please fill in all address fields.");
                        return;
                      }
                      setCheckoutError("");
                      setCheckoutStep(2);
                    }}
                    className="px-8 py-2.5 rounded-full bg-[#171717] hover:bg-black text-white text-xs font-bold uppercase tracking-wider"
                  >
                    Continue to Payment →
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Payment Method */}
            {checkoutStep === 2 && (
              <div className="py-6 space-y-4">
                <h4 className="text-sm font-extrabold text-[#171717]">Select Payment Mode</h4>
                <div className="space-y-3">
                  {[
                    { id: "Cash on Delivery", label: "Cash on Delivery (Pay upon arrival)", icon: "💵" },
                    { id: "UPI", label: "UPI Instant Pay (GPay, PhonePe, Paytm)", icon: "📱" },
                    { id: "Credit / Debit Card", label: "Credit / Debit Card", icon: "💳" }
                  ].map((p) => (
                    <label
                      key={p.id}
                      className={`flex items-center gap-3 p-4 rounded-[16px] border cursor-pointer transition-colors ${
                        checkoutDetails.paymentMethod === p.id
                          ? "border-[#171717] bg-[#F7F7F7]"
                          : "border-[#EAEAEA] hover:bg-[#F7F7F7]"
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={p.id}
                        checked={checkoutDetails.paymentMethod === p.id}
                        onChange={(e) => setCheckoutDetails({ ...checkoutDetails, paymentMethod: e.target.value })}
                        className="accent-[#171717]"
                      />
                      <span className="text-lg">{p.icon}</span>
                      <span className="text-xs font-bold text-[#171717]">{p.label}</span>
                    </label>
                  ))}
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-[#EAEAEA]">
                  <button
                    type="button"
                    onClick={() => setCheckoutStep(1)}
                    className="text-xs font-bold text-[#777777] hover:text-[#171717]"
                  >
                    ← Back to Address
                  </button>
                  <button
                    type="button"
                    onClick={() => setCheckoutStep(3)}
                    className="px-8 py-2.5 rounded-full bg-[#171717] hover:bg-black text-white text-xs font-bold uppercase tracking-wider"
                  >
                    Review Order →
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Review & Place Order */}
            {checkoutStep === 3 && (
              <div className="py-6 space-y-5">
                <h4 className="text-sm font-extrabold text-[#171717]">Order Summary</h4>

                <div className="p-4 rounded-[16px] bg-[#F7F7F7] border border-[#EAEAEA] space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#777777]">Deliver To:</span>
                    <span className="font-bold text-[#171717]">{checkoutDetails.name} ({checkoutDetails.phone})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#777777]">Address:</span>
                    <span className="font-medium text-[#171717] max-w-xs text-right truncate">{checkoutDetails.address}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#777777]">Payment:</span>
                    <span className="font-bold text-[#171717]">{checkoutDetails.paymentMethod}</span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs border-t border-[#EAEAEA] pt-4">
                  <div className="flex justify-between text-[#777777]">
                    <span>Items Total ({cartCount})</span>
                    <span>₹{cartTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Shipping Charges</span>
                    <span>FREE</span>
                  </div>
                  <div className="flex justify-between text-base font-extrabold text-[#171717] pt-2 border-t border-[#EAEAEA]">
                    <span>Final Amount</span>
                    <span>₹{cartTotal.toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-[#EAEAEA]">
                  <button
                    type="button"
                    onClick={() => setCheckoutStep(2)}
                    className="text-xs font-bold text-[#777777] hover:text-[#171717]"
                  >
                    ← Back to Payment
                  </button>
                  <button
                    type="button"
                    disabled={ordering}
                    onClick={() => placeOrder()}
                    className="px-8 py-3 rounded-full bg-[#171717] hover:bg-black text-white text-xs font-bold uppercase tracking-wider disabled:opacity-50 transition-all shadow-sm"
                  >
                    {ordering ? "Submitting Order..." : `Place Order (₹${cartTotal.toLocaleString()})`}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Shop;
