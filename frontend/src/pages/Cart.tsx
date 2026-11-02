import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart, CartItem } from "../context/CartContext";
import UserSidebar from "../components/common/UserSidebar";
import api from "../../api/api";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80";

function Cart() {
  const navigate = useNavigate();
  const {
    cart,
    cartCount,
    summary,
    loading,
    updateQuantity,
    removeFromCart,
    clearCart,
    moveToWishlist,
  } = useCart();

  // Confirmation modal states
  const [itemToRemove, setItemToRemove] = useState<CartItem | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponError, setCouponError] = useState("");

  // Checkout modal / step
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<1 | 2 | 3>(1); // 1: Address, 2: Payment, 3: Review
  const [ordering, setOrdering] = useState(false);
  const [orderError, setOrderError] = useState("");
  const [orderSuccessIds, setOrderSuccessIds] = useState<number[] | null>(null);

  // Checkout details form state
  const [checkoutDetails, setCheckoutDetails] = useState({
    name: localStorage.getItem("userName") || "",
    phone: localStorage.getItem("userPhone") || "",
    street: "No.12, 2nd Cross, Anna Nagar",
    city: "Chennai",
    state: "Tamil Nadu",
    pincode: "600040",
    paymentMethod: "Cash on Delivery",
  });

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError("");
    if (!couponCode.trim()) return;

    const normalized = couponCode.trim().toUpperCase();
    if (normalized === "TECH10" || normalized === "DELIVERYHUB" || normalized === "WELCOME20") {
      setAppliedCoupon(normalized);
      setCouponCode("");
    } else {
      setCouponError("Invalid coupon code. Try TECH10 or WELCOME20.");
    }
  };

  // Calculations with coupon
  const couponDiscount = appliedCoupon ? Math.round(summary.subtotal * 0.15) : 0;
  const finalPayable = Math.max(0, summary.finalAmount - couponDiscount);

  const handleConfirmRemove = async () => {
    if (itemToRemove) {
      await removeFromCart(itemToRemove.product_id);
      setItemToRemove(null);
    }
  };

  const handleConfirmClear = async () => {
    await clearCart();
    setShowClearConfirm(false);
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cart.length) return;

    const { name, phone, street, city, state, pincode, paymentMethod } = checkoutDetails;
    if (!name.trim() || !phone.trim() || !street.trim()) {
      setOrderError("Please complete all mandatory contact and shipping fields.");
      return;
    }

    try {
      setOrdering(true);
      setOrderError("");
      const fullAddress = `${street}, ${city}, ${state} - ${pincode}`;

      const orderRequests = cart.map((item) =>
        api.post("/orders", {
          item: item.name,
          quantity: item.quantity || 1,
          amount: Number(item.price) * (item.quantity || 1),
          productId: item.product_id,
          name: name.trim(),
          phone: phone.trim(),
          address: fullAddress,
          city,
          state,
          pincode,
          paymentMethod,
        })
      );

      const responses = await Promise.all(orderRequests);
      const generatedIds = responses.map((r) => r.data?.id).filter(Boolean);

      // Successfully confirmed on backend -> clear active cart
      await clearCart();
      setOrderSuccessIds(generatedIds);
    } catch (err: any) {
      console.error("Order submission failed:", err);
      setOrderError(err.response?.data?.message || "Failed to process order. Please try again.");
    } finally {
      setOrdering(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-[#171717] font-sans antialiased flex flex-col justify-between">
      <div>
        <UserSidebar />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          {/* Breadcrumb Navigation */}
          <div className="flex items-center gap-2 text-xs text-[#737373] mb-6">
            <Link to="/shop" className="hover:underline">Home</Link>
            <span>›</span>
            <Link to="/shop" className="hover:underline">Shop</Link>
            <span>›</span>
            <span className="text-[#171717] font-bold">Shopping Cart</span>
          </div>

          {/* Heading */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#EAEAEA] gap-4 mb-8">
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-[#171717] tracking-tight">
                My Shopping Cart
              </h1>
              <p className="text-xs text-[#737373] mt-1">
                {cartCount} {cartCount === 1 ? "item" : "items"} selected for express delivery
              </p>
            </div>

            {cart.length > 0 && (
              <button
                onClick={() => setShowClearConfirm(true)}
                className="self-start sm:self-auto text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span>Clear Cart</span>
              </button>
            )}
          </div>

          {/* Main Content Layout */}
          {loading && cart.length === 0 ? (
            <div className="py-24 text-center text-[#737373]">
              <div className="inline-block w-8 h-8 border-2 border-[#171717] border-t-transparent rounded-full animate-spin mb-3"></div>
              <p className="text-xs font-bold text-[#171717]">Synchronizing customer cart...</p>
            </div>
          ) : cart.length === 0 ? (
            /* Empty Cart View */
            <div className="bg-white rounded-3xl p-12 sm:p-16 text-center border border-[#EAEAEA] shadow-sm max-w-2xl mx-auto my-8">
              <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-[#FAFAFA] border border-[#EAEAEA] flex items-center justify-center text-orange-500 shadow-sm">
                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <h3 className="text-2xl font-extrabold text-[#171717]">Your Cart is Empty</h3>
              <p className="text-xs text-[#737373] mt-2 max-w-sm mx-auto leading-relaxed">
                Looks like you haven't added anything to your cart yet. Explore our curated collections of electronics and audiophile gear.
              </p>
              <div className="pt-8 flex flex-wrap justify-center gap-3">
                <Link
                  to="/shop"
                  className="px-8 py-3 rounded-full bg-[#171717] hover:bg-black text-white text-xs font-bold uppercase tracking-wider transition-all shadow-sm flex items-center gap-2"
                >
                  <span>Start Shopping</span>
                  <span>→</span>
                </Link>
                <Link
                  to="/my-orders?tab=wishlist"
                  className="px-6 py-3 rounded-full border border-[#DCDCDC] text-[#171717] hover:bg-[#FAFAFA] text-xs font-bold transition-all"
                >
                  View Saved Wishlist
                </Link>
              </div>
            </div>
          ) : (
            /* Populated Cart Layout */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
              {/* Left: Cart Items List */}
              <div className="lg:col-span-8 space-y-4">
                {cart.map((item) => {
                  const itemPrice = Number(item.price) || 0;
                  const itemSubtotal = itemPrice * (item.quantity || 1);
                  const isLowStock = (item.stock || 50) < 10;

                  return (
                    <div
                      key={item.product_id}
                      className="bg-white rounded-2xl border border-[#EAEAEA] p-4 sm:p-6 hover:shadow-subtle transition-all duration-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5"
                    >
                      {/* Product Thumbnail & Details */}
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="w-20 h-20 rounded-xl bg-[#FAFAFA] border border-[#EAEAEA] p-2 flex items-center justify-center flex-shrink-0 overflow-hidden">
                          <img
                            src={item.image_url || FALLBACK_IMAGE}
                            alt={item.name}
                            className="w-full h-full object-contain"
                            onError={(e: any) => (e.target.src = FALLBACK_IMAGE)}
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#888888]">
                            {item.category || "Audio & Electronics"}
                          </span>
                          <h4 className="font-bold text-sm text-[#171717] truncate mt-0.5">
                            {item.name}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs font-extrabold text-[#171717]">
                              ₹{itemPrice.toLocaleString()}
                            </span>
                            <span className="text-[11px] text-[#737373]">each</span>
                            <span className="text-gray-300">|</span>
                            <span
                              className={`text-[10px] font-bold ${
                                isLowStock ? "text-amber-600" : "text-emerald-600"
                              }`}
                            >
                              {isLowStock ? `Only ${item.stock} left in stock` : "In Stock"}
                            </span>
                          </div>

                          {/* Mobile Subtotal Indicator */}
                          <div className="sm:hidden mt-2 font-bold text-xs text-[#171717]">
                            Subtotal: ₹{itemSubtotal.toLocaleString()}
                          </div>
                        </div>
                      </div>

                      {/* Right: Quantity Controls, Subtotal & Actions */}
                      <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-[#F0F0F0]">
                        {/* Stepper */}
                        <div className="flex items-center border border-[#DCDCDC] rounded-full p-0.5 bg-[#FAFAFA]">
                          <button
                            onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                            className="w-7 h-7 rounded-full bg-white text-[#171717] font-bold text-xs hover:bg-gray-100 flex items-center justify-center shadow-xs"
                            title="Decrease quantity"
                          >
                            −
                          </button>
                          <span className="w-8 text-center text-xs font-extrabold text-[#171717]">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => {
                              if (item.stock && item.quantity >= item.stock) {
                                alert(`Only ${item.stock} units are currently available.`);
                                return;
                              }
                              updateQuantity(item.product_id, item.quantity + 1);
                            }}
                            className="w-7 h-7 rounded-full bg-white text-[#171717] font-bold text-xs hover:bg-gray-100 flex items-center justify-center shadow-xs"
                            title="Increase quantity"
                          >
                            +
                          </button>
                        </div>

                        {/* Desktop Subtotal */}
                        <div className="hidden sm:block text-right min-w-[90px]">
                          <span className="text-sm font-extrabold text-[#171717]">
                            ₹{itemSubtotal.toLocaleString()}
                          </span>
                        </div>

                        {/* Actions: Move to Wishlist & Remove */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => moveToWishlist(item)}
                            title="Move to Wishlist"
                            className="p-2 rounded-full hover:bg-rose-50 text-[#888888] hover:text-rose-500 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                          </button>

                          <button
                            onClick={() => setItemToRemove(item)}
                            title="Remove from Cart"
                            className="p-2 rounded-full hover:bg-rose-50 text-[#888888] hover:text-rose-600 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Free Shipping Progress Indicator */}
                <div className="p-4 rounded-2xl bg-white border border-[#EAEAEA] flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-xs flex-shrink-0">
                      ⚡
                    </span>
                    <div>
                      <p className="text-xs font-bold text-[#171717]">
                        {summary.subtotal >= 999
                          ? "You qualify for Free Express Delivery!"
                          : `Add ₹${(999 - summary.subtotal).toLocaleString()} more for Free Express Delivery`}
                      </p>
                      <p className="text-[11px] text-[#737373]">
                        Orders over ₹999 receive complimentary 24-48 hr courier dispatch.
                      </p>
                    </div>
                  </div>
                  <Link
                    to="/shop"
                    className="text-xs font-bold text-orange-600 hover:underline whitespace-nowrap hidden sm:inline"
                  >
                    + Add More
                  </Link>
                </div>
              </div>

              {/* Right: Order Summary Card */}
              <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-5">
                <div className="bg-white rounded-3xl border border-[#EAEAEA] p-6 shadow-sm space-y-5">
                  <h3 className="text-base font-extrabold text-[#171717] tracking-tight border-b border-[#F0F0F0] pb-3">
                    Order Summary
                  </h3>

                  {/* Line Items */}
                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between text-[#555555]">
                      <span>Subtotal ({summary.totalQuantity} items)</span>
                      <span className="font-semibold text-[#171717]">
                        ₹{summary.subtotal.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex justify-between text-[#555555]">
                      <span>Promotional Discount (10%)</span>
                      <span className="font-semibold text-emerald-600">
                        −₹{summary.discount.toLocaleString()}
                      </span>
                    </div>

                    {appliedCoupon && (
                      <div className="flex justify-between text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
                        <span>Coupon ({appliedCoupon})</span>
                        <span className="font-bold">−₹{couponDiscount.toLocaleString()}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-[#555555]">
                      <span>Standard Delivery</span>
                      <span className="font-semibold">
                        {summary.deliveryCharge === 0 ? (
                          <span className="text-emerald-600 font-bold uppercase text-[10px]">Free</span>
                        ) : (
                          `₹${summary.deliveryCharge}`
                        )}
                      </span>
                    </div>

                    <div className="flex justify-between text-[#555555]">
                      <span>Estimated Taxes (GST 5%)</span>
                      <span className="font-semibold text-[#171717]">
                        ₹{summary.tax.toLocaleString()}
                      </span>
                    </div>

                    <div className="pt-3 border-t border-[#F0F0F0] flex justify-between items-baseline">
                      <div>
                        <span className="text-sm font-extrabold text-[#171717]">Total Payable</span>
                        <p className="text-[10px] text-[#737373]">Inclusive of all taxes</p>
                      </div>
                      <span className="text-xl font-extrabold text-[#171717]">
                        ₹{finalPayable.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Coupon Form */}
                  <form onSubmit={handleApplyCoupon} className="pt-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        placeholder="Discount code (e.g. TECH10)"
                        className="flex-1 px-3 py-2 rounded-xl border border-[#DCDCDC] text-xs font-medium focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none uppercase"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-xl bg-[#FAFAFA] border border-[#DCDCDC] hover:bg-[#171717] hover:text-white text-xs font-bold transition-colors"
                      >
                        Apply
                      </button>
                    </div>
                    {couponError && (
                      <p className="text-[11px] text-rose-600 font-medium mt-1">{couponError}</p>
                    )}
                  </form>

                  {/* Checkout Button */}
                  <button
                    onClick={() => {
                      setShowCheckout(true);
                      setCheckoutStep(1);
                    }}
                    className="w-full py-3.5 px-6 rounded-full bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-sm flex items-center justify-center gap-2"
                  >
                    <span>Proceed to Checkout</span>
                    <span>→</span>
                  </button>

                  <div className="flex items-center justify-center gap-2 text-[11px] text-[#888888] pt-1">
                    <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span>256-Bit SSL Encrypted Checkout</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Remove Single Item Confirmation Modal */}
      {itemToRemove && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 border border-[#EAEAEA] shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h4 className="font-bold text-base text-[#171717]">Remove this product?</h4>
            <p className="text-xs text-[#737373]">
              Are you sure you want to remove <span className="font-semibold text-[#171717]">"{itemToRemove.name}"</span> from your cart?
            </p>
            <div className="flex gap-3 justify-center pt-2">
              <button
                onClick={() => setItemToRemove(null)}
                className="px-5 py-2 rounded-full border border-[#DCDCDC] text-xs font-bold text-[#555555] hover:bg-[#FAFAFA]"
              >
                Keep Item
              </button>
              <button
                onClick={handleConfirmRemove}
                className="px-5 py-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
              >
                Yes, Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear All Cart Items Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 border border-[#EAEAEA] shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h4 className="font-bold text-base text-[#171717]">Clear entire cart?</h4>
            <p className="text-xs text-[#737373]">
              This will remove all {cartCount} items from your shopping cart.
            </p>
            <div className="flex gap-3 justify-center pt-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-5 py-2 rounded-full border border-[#DCDCDC] text-xs font-bold text-[#555555]"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmClear}
                className="px-5 py-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
              >
                Yes, Clear All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Multi-Stage Checkout Modal ── */}
      {showCheckout && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-[#EAEAEA] max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            {orderSuccessIds ? (
              /* Success Stage */
              <div className="text-center py-6 space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-2xl font-extrabold text-[#171717]">Order Placed Successfully!</h3>
                <p className="text-xs text-[#737373] max-w-sm mx-auto">
                  Thank you for your purchase. We have dispatched order confirmations for{" "}
                  <span className="font-bold text-[#171717]">
                    {orderSuccessIds.map((id) => `#ORD${String(id).padStart(5, "0")}`).join(", ")}
                  </span>
                  .
                </p>
                <div className="pt-4 flex justify-center gap-3">
                  <button
                    onClick={() => {
                      setShowCheckout(false);
                      setOrderSuccessIds(null);
                      navigate("/my-orders?tab=orders");
                    }}
                    className="px-6 py-2.5 rounded-full bg-[#171717] hover:bg-black text-white text-xs font-bold uppercase tracking-wider"
                  >
                    Track in My Orders →
                  </button>
                  <button
                    onClick={() => {
                      setShowCheckout(false);
                      setOrderSuccessIds(null);
                      navigate("/shop");
                    }}
                    className="px-6 py-2.5 rounded-full border border-[#DCDCDC] text-xs font-bold text-[#555555] hover:bg-[#FAFAFA]"
                  >
                    Continue Shopping
                  </button>
                </div>
              </div>
            ) : (
              /* Checkout Form Steps */
              <div>
                {/* Modal Header */}
                <div className="flex items-center justify-between pb-4 border-b border-[#F0F0F0]">
                  <div>
                    <h3 className="text-lg font-bold text-[#171717]">Secure Checkout</h3>
                    <p className="text-xs text-[#737373]">
                      Step {checkoutStep} of 3: {checkoutStep === 1 ? "Delivery Address" : checkoutStep === 2 ? "Payment Option" : "Final Review"}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowCheckout(false)}
                    className="w-8 h-8 rounded-full bg-[#FAFAFA] hover:bg-[#EDEDED] flex items-center justify-center text-[#737373]"
                  >
                    ✕
                  </button>
                </div>

                {orderError && (
                  <div className="mt-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
                    {orderError}
                  </div>
                )}

                {/* Step 1: Shipping Address */}
                {checkoutStep === 1 && (
                  <div className="mt-5 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-[#444444] mb-1">
                          Full Recipient Name <span className="text-orange-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={checkoutDetails.name}
                          onChange={(e) => setCheckoutDetails({ ...checkoutDetails, name: e.target.value })}
                          placeholder="e.g. Rahul Sharma"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCDCDC] text-xs font-medium outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#444444] mb-1">
                          Mobile Phone <span className="text-orange-500">*</span>
                        </label>
                        <input
                          type="tel"
                          required
                          value={checkoutDetails.phone}
                          onChange={(e) => setCheckoutDetails({ ...checkoutDetails, phone: e.target.value })}
                          placeholder="+91 98765 43210"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCDCDC] text-xs font-medium outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#444444] mb-1">
                        Street Address & House/Flat No. <span className="text-orange-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={checkoutDetails.street}
                        onChange={(e) => setCheckoutDetails({ ...checkoutDetails, street: e.target.value })}
                        placeholder="e.g. 402, Lotus Residency, 4th Cross"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCDCDC] text-xs font-medium outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-[#444444] mb-1">City</label>
                        <input
                          type="text"
                          value={checkoutDetails.city}
                          onChange={(e) => setCheckoutDetails({ ...checkoutDetails, city: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-[#DCDCDC] text-xs font-medium outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#444444] mb-1">State</label>
                        <input
                          type="text"
                          value={checkoutDetails.state}
                          onChange={(e) => setCheckoutDetails({ ...checkoutDetails, state: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-[#DCDCDC] text-xs font-medium outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#444444] mb-1">Pincode</label>
                        <input
                          type="text"
                          value={checkoutDetails.pincode}
                          onChange={(e) => setCheckoutDetails({ ...checkoutDetails, pincode: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-[#DCDCDC] text-xs font-medium outline-none"
                        />
                      </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3 border-t border-[#F0F0F0]">
                      <button
                        type="button"
                        onClick={() => setShowCheckout(false)}
                        className="px-5 py-2 rounded-full border border-[#DCDCDC] text-xs font-bold text-[#555555]"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (!checkoutDetails.name || !checkoutDetails.phone || !checkoutDetails.street) {
                            setOrderError("Please complete contact name, phone and street address.");
                            return;
                          }
                          setOrderError("");
                          setCheckoutStep(2);
                        }}
                        className="px-6 py-2 rounded-full bg-[#171717] hover:bg-black text-white text-xs font-bold"
                      >
                        Continue to Payment →
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 2: Payment Method */}
                {checkoutStep === 2 && (
                  <div className="mt-5 space-y-4">
                    <p className="text-xs text-[#737373]">Select how you wish to pay:</p>

                    <div className="space-y-3">
                      {[
                        { id: "Cash on Delivery", label: "Cash on Delivery (COD)", desc: "Pay with cash upon arrival at doorstep." },
                        { id: "UPI", label: "UPI Instant Payment", desc: "Google Pay, PhonePe, Paytm, BHIM" },
                        { id: "Card", label: "Credit or Debit Card", desc: "Visa, Mastercard, RuPay & Corporate cards" },
                      ].map((pm) => (
                        <label
                          key={pm.id}
                          className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${
                            checkoutDetails.paymentMethod === pm.id
                              ? "border-orange-500 bg-orange-50/30 ring-1 ring-orange-500"
                              : "border-[#EAEAEA] hover:border-gray-300"
                          }`}
                        >
                          <input
                            type="radio"
                            name="paymentMethod"
                            checked={checkoutDetails.paymentMethod === pm.id}
                            onChange={() => setCheckoutDetails({ ...checkoutDetails, paymentMethod: pm.id })}
                            className="mt-1 accent-orange-500"
                          />
                          <div>
                            <p className="text-xs font-bold text-[#171717]">{pm.label}</p>
                            <p className="text-[11px] text-[#737373] mt-0.5">{pm.desc}</p>
                          </div>
                        </label>
                      ))}
                    </div>

                    <div className="pt-4 flex justify-between items-center border-t border-[#F0F0F0]">
                      <button
                        type="button"
                        onClick={() => setCheckoutStep(1)}
                        className="px-5 py-2 rounded-full border border-[#DCDCDC] text-xs font-bold text-[#555555]"
                      >
                        ← Back
                      </button>
                      <button
                        type="button"
                        onClick={() => setCheckoutStep(3)}
                        className="px-6 py-2 rounded-full bg-[#171717] hover:bg-black text-white text-xs font-bold"
                      >
                        Review Order →
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 3: Final Review & Confirmation */}
                {checkoutStep === 3 && (
                  <div className="mt-5 space-y-4">
                    <div className="p-4 rounded-2xl bg-[#FAFAFA] border border-[#EAEAEA] text-xs space-y-2">
                      <div className="flex justify-between">
                        <span className="text-[#737373]">Shipping To:</span>
                        <span className="font-semibold text-[#171717]">
                          {checkoutDetails.name} ({checkoutDetails.phone})
                        </span>
                      </div>
                      <p className="text-[#555555]">
                        {checkoutDetails.street}, {checkoutDetails.city}, {checkoutDetails.state} - {checkoutDetails.pincode}
                      </p>
                      <div className="flex justify-between pt-2 border-t border-[#EAEAEA]">
                        <span className="text-[#737373]">Payment Option:</span>
                        <span className="font-semibold text-emerald-700">{checkoutDetails.paymentMethod}</span>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl border border-[#EAEAEA] space-y-2 text-xs">
                      <div className="flex justify-between text-[#555555]">
                        <span>Items Count:</span>
                        <span className="font-bold text-[#171717]">{summary.totalQuantity} items</span>
                      </div>
                      <div className="flex justify-between text-[#555555]">
                        <span>Payable Amount:</span>
                        <span className="text-base font-extrabold text-[#171717]">
                          ₹{finalPayable.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="pt-4 flex justify-between items-center border-t border-[#F0F0F0]">
                      <button
                        type="button"
                        onClick={() => setCheckoutStep(2)}
                        className="px-5 py-2 rounded-full border border-[#DCDCDC] text-xs font-bold text-[#555555]"
                      >
                        ← Back
                      </button>
                      <button
                        type="button"
                        onClick={handlePlaceOrder}
                        disabled={ordering}
                        className="px-7 py-2.5 rounded-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white text-xs font-bold uppercase tracking-wider shadow-sm transition-all"
                      >
                        {ordering ? "Processing Order..." : `Place Order (₹${finalPayable.toLocaleString()})`}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Cart;

