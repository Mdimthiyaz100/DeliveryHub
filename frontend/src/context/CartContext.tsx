import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import api from "../../api/api";

export interface CartItem {
  id?: number;
  product_id: number;
  name: string;
  price: number | string;
  image_url?: string;
  category?: string;
  quantity: number;
  stock?: number;
  variant_id?: number | null;
}

export interface OrderSummary {
  subtotal: number;
  totalQuantity: number;
  deliveryCharge: number;
  discount: number;
  tax: number;
  finalAmount: number;
}

interface CartContextType {
  cart: CartItem[];
  cartCount: number;
  summary: OrderSummary;
  loading: boolean;
  addToCart: (product: any, quantity?: number) => Promise<void>;
  updateQuantity: (productId: number, quantity: number) => Promise<void>;
  removeFromCart: (productId: number) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
  moveToWishlist: (item: CartItem) => Promise<void>;
}

const defaultSummary: OrderSummary = {
  subtotal: 0,
  totalQuantity: 0,
  deliveryCharge: 0,
  discount: 0,
  tax: 0,
  finalAmount: 0,
};

const CartContext = createContext<CartContextType | undefined>(undefined);

function calculateClientSummary(items: CartItem[]): OrderSummary {
  let subtotal = 0;
  let totalQuantity = 0;

  for (const item of items) {
    const rawPrice = item.price;
    const price = typeof rawPrice === "number" ? rawPrice : Number(String(rawPrice || "").replace(/[^0-9.]/g, "")) || 0;
    const rawQty = item.quantity;
    const qty = Number(rawQty) || 1;
    subtotal += price * qty;
    totalQuantity += qty;
  }

  const deliveryCharge = subtotal >= 999 || subtotal === 0 ? 0 : 99;
  const discount = Math.round(subtotal * 0.10);
  const tax = Math.round(subtotal * 0.05);
  const finalAmount = Math.max(0, subtotal - discount + deliveryCharge + tax);

  return {
    subtotal,
    totalQuantity,
    deliveryCharge,
    discount,
    tax,
    finalAmount,
  };
}

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem("deliveryhub_cart");
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) return [];
      return parsed.map((item: any) => ({
        id: item.id,
        product_id: item.product_id || item.id,
        name: item.name || "Item",
        price: typeof item.price === "number" ? item.price : Number(String(item.price || "").replace(/[^0-9.]/g, "")) || 0,
        image_url: item.image_url,
        category: item.category,
        quantity: Number(item.quantity || item.qty) || 1,
        stock: Number(item.stock) || 50,
        variant_id: item.variant_id || null,
      }));
    } catch {
      return [];
    }
  });

  const [summary, setSummary] = useState<OrderSummary>(() => calculateClientSummary(cart));
  const [loading, setLoading] = useState(false);

  // Sync to local storage
  const syncLocalStorage = (items: CartItem[]) => {
    try {
      localStorage.setItem("deliveryhub_cart", JSON.stringify(items));
      // Dispatch storage event to keep tabs and separate headers responsive
      window.dispatchEvent(new Event("deliveryhub_cart_updated"));
    } catch (e) {
      console.error(e);
    }
  };

  const refreshCart = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      // Guest mode
      const local = JSON.parse(localStorage.getItem("deliveryhub_cart") || "[]");
      setCart(local);
      setSummary(calculateClientSummary(local));
      return;
    }

    try {
      setLoading(true);
      const res = await api.get("/cart");
      if (res.data?.items) {
        const mapped = res.data.items.map((i: any) => ({
          id: i.id,
          product_id: i.product_id,
          name: i.name,
          price: i.price,
          image_url: i.image_url,
          category: i.category,
          quantity: i.quantity,
          stock: i.stock || 50,
          variant_id: i.variant_id,
        }));
        setCart(mapped);
        setSummary(res.data.summary || calculateClientSummary(mapped));
        syncLocalStorage(mapped);
      }
    } catch (err) {
      console.error("Cart refresh failed:", err);
      // Fallback to local
      const local = JSON.parse(localStorage.getItem("deliveryhub_cart") || "[]");
      setCart(local);
      setSummary(calculateClientSummary(local));
    } finally {
      setLoading(false);
    }
  }, []);

  // Merge guest cart on login / initial mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    const localItems = JSON.parse(localStorage.getItem("deliveryhub_cart") || "[]");

    if (token && localItems.length > 0) {
      api
        .post("/cart/merge", {
          guestItems: localItems.map((i: any) => ({
            productId: i.product_id || i.id,
            quantity: i.quantity || i.qty || 1,
            variantId: i.variant_id || null,
          })),
        })
        .then(() => refreshCart())
        .catch(() => refreshCart());
    } else {
      refreshCart();
    }
  }, [refreshCart]);

  // Listen to custom cart update events across windows
  useEffect(() => {
    const handleUpdate = () => {
      try {
        const saved = localStorage.getItem("deliveryhub_cart");
        const parsed = saved ? JSON.parse(saved) : [];
        const local = Array.isArray(parsed)
          ? parsed.map((item: any) => ({
              id: item.id,
              product_id: item.product_id || item.id,
              name: item.name || "Item",
              price: typeof item.price === "number" ? item.price : Number(String(item.price || "").replace(/[^0-9.]/g, "")) || 0,
              image_url: item.image_url,
              category: item.category,
              quantity: Number(item.quantity || item.qty) || 1,
              stock: Number(item.stock) || 50,
              variant_id: item.variant_id || null,
            }))
          : [];
        setCart(local);
        setSummary(calculateClientSummary(local));
      } catch (e) {
        console.error(e);
      }
    };
    window.addEventListener("deliveryhub_cart_updated", handleUpdate);
    return () => window.removeEventListener("deliveryhub_cart_updated", handleUpdate);
  }, []);

  const addToCart = async (product: any, quantity = 1) => {
    const token = localStorage.getItem("token");
    const pId = product.id || product.product_id;

    if (token) {
      try {
        const res = await api.post("/cart/add", {
          productId: pId,
          quantity,
        });
        if (res.data?.items) {
          const mapped = res.data.items.map((i: any) => ({
            id: i.id,
            product_id: i.product_id,
            name: i.name,
            price: i.price,
            image_url: i.image_url,
            category: i.category,
            quantity: i.quantity,
            stock: i.stock || 50,
            variant_id: i.variant_id,
          }));
          setCart(mapped);
          setSummary(res.data.summary || calculateClientSummary(mapped));
          syncLocalStorage(mapped);
          return;
        }
      } catch (err) {
        console.error("Server addToCart failed, fallback to local:", err);
      }
    }

    // Guest fallback
    setCart((prev) => {
      const existing = prev.find((item) => item.product_id === pId);
      const cleanPrice = typeof product.price === "number" ? product.price : Number(String(product.price || "").replace(/[^0-9.]/g, "")) || 0;
      const cleanQty = Number(quantity) || 1;
      let updated: CartItem[];
      if (existing) {
        updated = prev.map((item) =>
          item.product_id === pId ? { ...item, quantity: item.quantity + cleanQty } : item
        );
      } else {
        updated = [
          ...prev,
          {
            product_id: pId,
            name: product.name,
            price: cleanPrice,
            image_url: product.image_url,
            category: product.category,
            quantity: cleanQty,
            stock: product.stock || 50,
          },
        ];
      }
      syncLocalStorage(updated);
      setSummary(calculateClientSummary(updated));
      return updated;
    });
  };

  const updateQuantity = async (productId: number, quantity: number) => {
    if (quantity <= 0) {
      await removeFromCart(productId);
      return;
    }

    const token = localStorage.getItem("token");
    if (token) {
      try {
        const res = await api.put("/cart/quantity", {
          productId,
          quantity,
        });
        if (res.data?.items) {
          const mapped = res.data.items.map((i: any) => ({
            id: i.id,
            product_id: i.product_id,
            name: i.name,
            price: i.price,
            image_url: i.image_url,
            category: i.category,
            quantity: i.quantity,
            stock: i.stock || 50,
            variant_id: i.variant_id,
          }));
          setCart(mapped);
          setSummary(res.data.summary || calculateClientSummary(mapped));
          syncLocalStorage(mapped);
          return;
        }
      } catch (err) {
        console.error("Server updateQuantity failed:", err);
      }
    }

    // Guest fallback
    setCart((prev) => {
      const updated = prev.map((item) =>
        item.product_id === productId ? { ...item, quantity } : item
      );
      syncLocalStorage(updated);
      setSummary(calculateClientSummary(updated));
      return updated;
    });
  };

  const removeFromCart = async (productId: number) => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const res = await api.delete(`/cart/item/${productId}`);
        if (res.data?.items) {
          const mapped = res.data.items.map((i: any) => ({
            id: i.id,
            product_id: i.product_id,
            name: i.name,
            price: i.price,
            image_url: i.image_url,
            category: i.category,
            quantity: i.quantity,
            stock: i.stock || 50,
            variant_id: i.variant_id,
          }));
          setCart(mapped);
          setSummary(res.data.summary || calculateClientSummary(mapped));
          syncLocalStorage(mapped);
          return;
        }
      } catch (err) {
        console.error("Server removeFromCart failed:", err);
      }
    }

    // Guest fallback
    setCart((prev) => {
      const updated = prev.filter((item) => item.product_id !== productId);
      syncLocalStorage(updated);
      setSummary(calculateClientSummary(updated));
      return updated;
    });
  };

  const clearCart = async () => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        await api.delete("/cart/clear");
      } catch (err) {
        console.error("Server clearCart failed:", err);
      }
    }
    setCart([]);
    setSummary(defaultSummary);
    syncLocalStorage([]);
  };

  const moveToWishlist = async (item: CartItem) => {
    try {
      const saved = localStorage.getItem("deliveryhub_wishlist");
      const currentWishlist = saved ? JSON.parse(saved) : [];
      const pId = item.product_id;
      if (!currentWishlist.some((w: any) => w.id === pId)) {
        currentWishlist.push({
          id: pId,
          name: item.name,
          price: item.price,
          image_url: item.image_url,
          category: item.category,
        });
        localStorage.setItem("deliveryhub_wishlist", JSON.stringify(currentWishlist));
      }
    } catch (e) {
      console.error(e);
    }
    await removeFromCart(item.product_id);
  };

  const cartCount = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        cartCount,
        summary,
        loading,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        refreshCart,
        moveToWishlist,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

