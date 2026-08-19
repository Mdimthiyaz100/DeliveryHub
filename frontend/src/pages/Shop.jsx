import { useState, useEffect } from "react";
import api from "../../api/api";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400";

function Shop() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderIds, setOrderIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [checkoutDetails, setCheckoutDetails] = useState({
    name: localStorage.getItem("userName") || "",
    phone: "",
    address: "",
    paymentMethod: "Cash on Delivery",
  });
  const [checkoutError, setCheckoutError] = useState("");

  useEffect(() => {
    api.get("/products")
      .then((res) => setProducts(res.data || []))
      .catch((err) => console.error("Error fetching products:", err))
      .finally(() => setLoading(false));
  }, []);

  const categories = ["All", ...new Set(products.map((p) => p.category).filter(Boolean))];

  const filteredProducts = products.filter((p) => {
    const matchesQuery = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesQuery && (selectedCategory === "All" || p.category === selectedCategory);
  });

  const updateQty = (productId, delta) => {
    setCart((prev) =>
      prev
        .map((item) => (item.id === productId ? { ...item, qty: item.qty + delta } : item))
        .filter((item) => item.qty > 0)
    );
  };

  const addToCart = (product) => {
    const existing = cart.find((item) => item.id === product.id);
    if (existing) updateQty(product.id, 1);
    else setCart((prev) => [...prev, { ...product, qty: 1 }]);
  };

  const cartTotal = cart.reduce((sum, item) => sum + Number(item.price) * item.qty, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);

  const openCheckout = () => {
    setCheckoutError("");
    setCheckoutDetails((prev) => ({
      ...prev,
      name: prev.name || localStorage.getItem("userName") || "",
    }));
    setShowCheckout(true);
  };

  const placeOrder = async (event) => {
    event.preventDefault();
    if (!cart.length) return;
    const { name, phone, address, paymentMethod } = checkoutDetails;
    if (!name.trim() || !phone.trim() || !address.trim() || !paymentMethod) {
      setCheckoutError("Please complete all delivery and payment details.");
      return;
    }
    setOrdering(true);
    try {
      const orderRequests = cart.map((item) =>
        api.post("/orders", {
          item: item.qty > 1 ? `${item.name} (Qty: ${item.qty})` : item.name,
          amount: Number(item.price) * item.qty,
          name: name.trim(),
          phone: phone.trim(),
          address: address.trim(),
          paymentMethod,
        })
      );
      const responses = await Promise.all(orderRequests);
      setOrderIds(responses.map((res) => res.data.id));
      setCart([]);
      setShowCart(false);
      setShowCheckout(false);
      setOrderSuccess(true);
      setTimeout(() => setOrderSuccess(false), 5000);
    } catch (err) {
      console.error("Error placing order:", err);
      alert("Failed to place order. Please try again.");
    } finally {
      setOrdering(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh] text-gray-500">Loading products...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {orderSuccess && (
        <div className="fixed top-20 right-4 z-50 bg-green-50 border border-green-200 text-green-700 px-5 py-4 rounded-xl shadow-lg flex gap-3 max-w-sm">
          <span className="text-xl">✅</span>
          <div>
            <p className="font-bold text-sm">Order Placed Successfully!</p>
            <p className="text-xs opacity-80">{orderIds.length} order(s) created. Track them in My Orders.</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Shop</h2>
          <p className="text-gray-500 mt-1">Browse and order products</p>
        </div>
        <button onClick={() => setShowCart(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2.5 rounded-lg flex items-center gap-2 shadow-sm transition-colors">
          🛒 Cart {cartCount > 0 && <span className="bg-white text-blue-600 text-xs font-bold px-2 py-0.5 rounded-full">{cartCount}</span>}
        </button>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search products..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
        <div className="flex gap-2 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${selectedCategory === cat ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {filteredProducts.map((product) => {
          const inCart = cart.find((i) => i.id === product.id)?.qty || 0;
          return (
            <div key={product.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
              <div className="relative h-44 bg-gray-100">
                <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" onError={(e) => (e.target.src = FALLBACK_IMAGE)} />
                {product.category && <span className="absolute top-2 left-2 px-2 py-1 bg-blue-600 text-white rounded text-[10px] font-bold uppercase">{product.category}</span>}
                {inCart > 0 && <span className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold text-white bg-green-500">{inCart}</span>}
              </div>
              <div className="p-4">
                <h3 className="font-bold text-gray-800 text-sm mb-1 truncate">{product.name}</h3>
                <p className="text-gray-400 text-xs mb-3 line-clamp-2">{product.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-blue-600">₹{Number(product.price).toLocaleString()}</span>
                  <button onClick={() => addToCart(product)} className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">+ Add</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {!filteredProducts.length && (
        <div className="text-center py-8 text-gray-500 bg-white rounded-xl border border-gray-100">No products found matching your search.</div>
      )}

      {/* Cart Modal */}
      {showCart && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-800">Shopping Cart</h3>
              <button onClick={() => setShowCart(false)} className="text-gray-400 hover:text-gray-600 text-xl font-bold p-1 rounded-lg hover:bg-gray-100 transition-colors">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {!cart.length ? (
                <div className="text-center py-8 text-gray-500">Your cart is empty. Add some products!</div>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <img src={item.image_url} alt={item.name} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" onError={(e) => (e.target.src = FALLBACK_IMAGE)} />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-800 text-sm truncate">{item.name}</h4>
                      <p className="text-xs text-blue-600 font-bold">₹{Number(item.price).toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateQty(item.id, -1)} className="w-7 h-7 rounded bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-sm">−</button>
                      <span className="w-6 text-center text-sm font-bold">{item.qty}</span>
                      <button onClick={() => updateQty(item.id, 1)} className="w-7 h-7 rounded bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-sm">+</button>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-800">₹{(Number(item.price) * item.qty).toLocaleString()}</p>
                      <button onClick={() => updateQty(item.id, -item.qty)} className="text-red-500 hover:text-red-700 text-xs">Remove</button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="border-t border-gray-100 p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 font-medium">Total</span>
                  <span className="text-xl font-bold text-gray-800">₹{cartTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-end gap-3">
                  <button onClick={() => setShowCart(false)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Continue Shopping</button>
                  <button onClick={openCheckout} className="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
                    Proceed to Checkout • ₹{cartTotal.toLocaleString()}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showCheckout && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <div>
                <h3 className="text-xl font-bold text-gray-800">Delivery & Payment Details</h3>
                <p className="text-sm text-gray-500 mt-1">Order total: Rs. {cartTotal.toLocaleString()}</p>
              </div>
              <button type="button" onClick={() => setShowCheckout(false)} className="text-gray-400 hover:text-gray-600 text-xl font-bold p-1">x</button>
            </div>

            <form onSubmit={placeOrder} className="p-6 space-y-4">
              {checkoutError && <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">{checkoutError}</p>}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input required value={checkoutDetails.name} onChange={(e) => setCheckoutDetails({ ...checkoutDetails, name: e.target.value })} placeholder="Your full name" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input required type="tel" value={checkoutDetails.phone} onChange={(e) => setCheckoutDetails({ ...checkoutDetails, phone: e.target.value })} placeholder="e.g. 9876543210" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Address</label>
                <textarea required rows="3" value={checkoutDetails.address} onChange={(e) => setCheckoutDetails({ ...checkoutDetails, address: e.target.value })} placeholder="House/flat, street, area, city, PIN code" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                <select value={checkoutDetails.paymentMethod} onChange={(e) => setCheckoutDetails({ ...checkoutDetails, paymentMethod: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>Cash on Delivery</option>
                  <option>UPI</option>
                  <option>Credit / Debit Card</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button type="button" onClick={() => setShowCheckout(false)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg">Back</button>
                <button type="submit" disabled={ordering} className="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50">
                  {ordering ? "Placing Order..." : "Place Order"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Shop;
