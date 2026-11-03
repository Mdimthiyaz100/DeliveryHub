import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../../api/api";
import { useCart } from "../context/CartContext";

interface ProductSpecification {
  id: number;
  specification_name: string;
  specification_value: string;
  display_order: number;
}

interface ProductImage {
  id: number;
  product_id: number;
  image_url: string;
  is_primary: number;
  display_order: number;
  color_name?: string;
}

interface ProductVariant {
  id: number;
  product_id: number;
  variant_name: string;
  color_code: string;
  color_name: string;
  sku: string;
  price?: number;
  stock: number;
  image_url?: string;
}

interface ProductDetail {
  id: number;
  name: string;
  slug?: string;
  brand?: string;
  category: string;
  category_id?: number;
  description: string;
  short_description?: string;
  price: number | string;
  original_price?: number | string;
  discount_percentage?: number;
  stock: number;
  rating?: number | string;
  review_count?: number;
  sku?: string;
  image_url: string;
  images?: ProductImage[];
  specifications?: ProductSpecification[];
  variants?: ProductVariant[];
}

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Gallery state
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [isZoomed, setIsZoomed] = useState<boolean>(false);
  const [zoomCoords, setZoomCoords] = useState<{ x: number; y: number }>({ x: 50, y: 50 });

  // Purchase state
  const [quantity, setQuantity] = useState<number>(1);
  const [engravingText, setEngravingText] = useState<string>("");
  const [showEngraving, setShowEngraving] = useState<boolean>(false);
  const [addedToast, setAddedToast] = useState<boolean>(false);
  const [wishlisted, setWishlisted] = useState<boolean>(false);

  // Fetch product data
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });

    api
      .get(`/products/${id}`)
      .then((res) => {
        const prod = res.data;
        if (!prod) {
          setError("Product not found");
          return;
        }
        setProduct(prod);
        setActiveImageIndex(0);
        if (prod.variants && prod.variants.length > 0) {
          setSelectedVariant(prod.variants[0]);
        } else {
          setSelectedVariant(null);
        }

        // Fetch related products
        api
          .get(`/products/${prod.id}/related?category=${encodeURIComponent(prod.category || "")}`)
          .then((relRes) => {
            setRelatedProducts(relRes.data || []);
          })
          .catch(() => {
            setRelatedProducts([]);
          });
      })
      .catch((err) => {
        console.error("Failed to load product:", err);
        setError("Product not found or unavailable.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  // Gallery images array
  const galleryImages: string[] = React.useMemo(() => {
    if (!product) return [];
    if (product.images && product.images.length > 0) {
      return product.images.map((img) => img.image_url);
    }
    return [product.image_url];
  }, [product]);

  // Update image when variant changes
  const handleVariantSelect = (variant: ProductVariant) => {
    setSelectedVariant(variant);
    if (variant.image_url) {
      const idx = galleryImages.findIndex((img) => img === variant.image_url);
      if (idx !== -1) {
        setActiveImageIndex(idx);
      }
    }
  };

  const handleNextImage = () => {
    if (galleryImages.length <= 1) return;
    setActiveImageIndex((prev) => (prev + 1) % galleryImages.length);
  };

  const handlePrevImage = () => {
    if (galleryImages.length <= 1) return;
    setActiveImageIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomCoords({ x, y });
  };

  const handleAddToCart = (redirect = false) => {
    if (!product) return;
    const currentPrice = selectedVariant?.price || Number(product.price);
    const itemToAdd = {
      id: product.id,
      product_id: product.id,
      name: product.name + (selectedVariant ? ` - ${selectedVariant.color_name || selectedVariant.variant_name}` : ""),
      price: currentPrice,
      image_url: galleryImages[activeImageIndex] || product.image_url,
      category: product.category,
      stock: selectedVariant?.stock ?? product.stock,
      variant_id: selectedVariant?.id,
    };

    addToCart(itemToAdd, quantity);

    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 2500);

    if (redirect) {
      navigate("/cart");
    }
  };

  const availableStock = selectedVariant ? selectedVariant.stock : product?.stock ?? 0;
  const isOutOfStock = availableStock <= 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-3 border-[#171717] border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-semibold tracking-wider text-[#777777] uppercase">Loading Product Details...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-[70vh] bg-white flex flex-col items-center justify-center px-4 text-center">
        <div className="w-20 h-20 bg-[#F7F7F7] border border-[#EAEAEA] rounded-full flex items-center justify-center text-3xl mb-6 shadow-sm">
          🔍
        </div>
        <h2 className="text-2xl font-black text-[#171717] mb-2 tracking-tight">Product Not Found</h2>
        <p className="text-sm text-[#777777] max-w-md mb-8">
          The requested product ID could not be retrieved from the catalog or may have been archived.
        </p>
        <Link
          to="/shop"
          className="px-8 py-3 bg-[#171717] hover:bg-black text-white text-xs font-bold uppercase tracking-widest rounded-full transition-all hover:shadow-lg"
        >
          Return to Marketplace
        </Link>
      </div>
    );
  }

  const currentPrice = selectedVariant?.price ? Number(selectedVariant.price) : Number(product.price);
  const origPrice = product.original_price ? Number(product.original_price) : null;
  const discount = product.discount_percentage || (origPrice ? Math.round(((origPrice - currentPrice) / origPrice) * 100) : 0);

  return (
    <div className="min-h-screen bg-white text-[#171717] font-sans antialiased selection:bg-[#171717] selection:text-white">
      {/* ── Top Floating Toast Alert ── */}
      {addedToast && (
        <div className="fixed top-6 right-6 z-50 bg-[#171717] text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-top duration-300 border border-neutral-800">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
            ✓
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider">Item Added to Bag</p>
            <p className="text-[11px] text-neutral-400">
              {quantity} × {product.name}
            </p>
          </div>
          <button
            onClick={() => navigate("/cart")}
            className="ml-3 px-3 py-1.5 bg-white text-[#171717] text-xs font-extrabold rounded-lg hover:bg-neutral-100 transition-colors"
          >
            View Bag
          </button>
        </div>
      )}

      {/* ── Breadcrumb & Category Bar ── */}
      <div className="border-b border-[#F0F0F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between text-xs text-[#777777]">
          <div className="flex items-center gap-2 flex-wrap">
            <Link to="/shop" className="hover:text-[#171717] transition-colors">
              All Products
            </Link>
            <span>›</span>
            <Link to={`/shop?category=${encodeURIComponent(product.category)}`} className="hover:text-[#171717] transition-colors">
              {product.category}
            </Link>
            <span>›</span>
            <span className="text-[#171717] font-medium truncate max-w-[200px] sm:max-w-xs">{product.name}</span>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/shop" className="text-xs font-semibold hover:text-[#171717] hidden sm:block">
              ← Back to Shop
            </Link>
          </div>
        </div>
      </div>

      {/* ── Main PDP Hero Section (Master & Dynamic Layout) ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* ════ LEFT COLUMN: Gallery & Zoomable Imagery ════ */}
          <div className="lg:col-span-7 flex flex-col items-center">
            {/* Primary Image Container */}
            <div
              className="relative w-full aspect-square max-w-[540px] flex items-center justify-center bg-white rounded-3xl overflow-hidden cursor-crosshair group"
              onMouseEnter={() => setIsZoomed(true)}
              onMouseLeave={() => setIsZoomed(false)}
              onMouseMove={handleMouseMove}
            >
              <img
                src={galleryImages[activeImageIndex] || product.image_url}
                alt={product.name}
                className={`w-full h-full object-contain transition-transform duration-200 select-none ${
                  isZoomed ? "scale-150 origin-top-left" : "scale-100"
                }`}
                style={
                  isZoomed
                    ? {
                        transformOrigin: `${zoomCoords.x}% ${zoomCoords.y}%`,
                      }
                    : undefined
                }
              />

              {/* Prev Image Button */}
              {galleryImages.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrevImage();
                  }}
                  className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 border border-[#EAEAEA] flex items-center justify-center text-sm font-bold text-[#171717] shadow-sm hover:scale-105 transition-all opacity-80 hover:opacity-100 z-10"
                  aria-label="Previous image"
                >
                  ‹
                </button>
              )}

              {/* Next Image Button */}
              {galleryImages.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNextImage();
                  }}
                  className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 border border-[#EAEAEA] flex items-center justify-center text-sm font-bold text-[#171717] shadow-sm hover:scale-105 transition-all opacity-80 hover:opacity-100 z-10"
                  aria-label="Next image"
                >
                  ›
                </button>
              )}

              {/* Stock Badge Overlay */}
              {isOutOfStock && (
                <span className="absolute top-4 left-4 z-10 bg-neutral-900 text-white text-[11px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full">
                  Sold Out
                </span>
              )}
            </div>

            {/* Thumbnail Strip */}
            {galleryImages.length > 1 && (
              <div className="flex items-center justify-center gap-3 sm:gap-4 mt-8 flex-wrap">
                {galleryImages.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#FAFAFA] border p-2 flex items-center justify-center overflow-hidden transition-all duration-200 ${
                      activeImageIndex === idx
                        ? "border-[#171717] shadow-md scale-105 ring-1 ring-[#171717]"
                        : "border-[#EAEAEA] hover:border-neutral-400 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img src={imgUrl} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-contain" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ════ RIGHT COLUMN: Product Details & Purchase Actions ════ */}
          <div className="lg:col-span-5 flex flex-col space-y-6">
            {/* Title & Brand */}
            <div>
              {product.brand && (
                <p className="text-xs uppercase tracking-widest font-black text-neutral-400 mb-1">
                  {product.brand}
                </p>
              )}
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#171717] leading-tight">
                {product.name}
              </h1>
              {product.short_description && (
                <p className="text-sm sm:text-base text-[#777777] mt-1 font-normal">
                  {product.short_description}
                </p>
              )}
            </div>

            {/* Pricing Section */}
            <div className="flex items-center gap-3 pt-1 border-b border-[#F0F0F0] pb-5">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#171717]">
                ₹{currentPrice.toLocaleString()}
              </span>

              {origPrice && origPrice > currentPrice && (
                <span className="text-base text-[#777777] line-through">
                  ₹{origPrice.toLocaleString()}
                </span>
              )}

              {discount > 0 && (
                <span className="bg-orange-500/10 text-orange-600 text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                  Save {discount}%
                </span>
              )}

              {isOutOfStock ? (
                <span className="ml-auto bg-neutral-200 text-neutral-700 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                  Sold Out
                </span>
              ) : (
                <span className="ml-auto flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  In Stock ({availableStock} units)
                </span>
              )}
            </div>

            {/* Colorways / Variants Selector (Master & Dynamic Pill Circles) */}
            {product.variants && product.variants.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-[#171717]">
                    Color{" "}
                    <span className="font-normal text-[#777777]">
                      ({selectedVariant ? selectedVariant.color_name || selectedVariant.variant_name : "Select color"})
                    </span>
                  </span>
                  {selectedVariant && (
                    <span className="text-[11px] text-neutral-400 font-mono">{selectedVariant.sku}</span>
                  )}
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  {product.variants.map((v) => {
                    const isSelected = selectedVariant?.id === v.id;
                    return (
                      <button
                        key={v.id}
                        onClick={() => handleVariantSelect(v)}
                        title={v.color_name || v.variant_name}
                        className={`w-9 h-9 rounded-full border-2 transition-all p-0.5 flex items-center justify-center relative ${
                          isSelected ? "border-[#171717] scale-110 shadow-sm" : "border-transparent hover:scale-105"
                        }`}
                      >
                        <span
                          className="w-full h-full rounded-full border border-black/10 block shadow-inner"
                          style={{ backgroundColor: v.color_code || "#171717" }}
                        />
                        {v.stock === 0 && (
                          <span className="absolute inset-0 flex items-center justify-center">
                            <span className="w-full h-[1.5px] bg-red-500 rotate-45 block"></span>
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Optional Custom Engraving Box (Styled like reference) */}
            <div className="border border-[#EAEAEA] rounded-2xl p-4 bg-[#FAFAFA]/50 space-y-3">
              <div className="flex items-center justify-between cursor-pointer" onClick={() => setShowEngraving(!showEngraving)}>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#171717]">Custom Laser Engraving</span>
                  <span className="text-[10px] text-emerald-600 font-extrabold uppercase px-1.5 py-0.5 bg-emerald-50 rounded">
                    Free
                  </span>
                </div>
                <button
                  type="button"
                  className="text-xs font-bold text-neutral-500 hover:text-black transition-colors"
                >
                  {showEngraving ? "Remove" : "+ Add"}
                </button>
              </div>

              {showEngraving && (
                <div className="pt-2 animate-in fade-in duration-200">
                  <input
                    type="text"
                    maxLength={24}
                    placeholder="Enter up to 24 characters (e.g., Name or Initials)"
                    value={engravingText}
                    onChange={(e) => setEngravingText(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-white border border-[#EAEAEA] rounded-xl focus:outline-none focus:border-[#171717]"
                  />
                  <p className="text-[10px] text-neutral-400 mt-1">Laser engraved precisely onto the anodized surface.</p>
                </div>
              )}
            </div>

            {/* Quantity Selector & Action Buttons */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-4">
                {/* Quantity Controls */}
                <div className="flex items-center border border-[#EAEAEA] rounded-full bg-white px-2 py-1 shadow-sm">
                  <button
                    disabled={quantity <= 1 || isOutOfStock}
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-[#171717] hover:bg-neutral-100 disabled:opacity-30 transition-colors"
                  >
                    −
                  </button>
                  <span className="w-10 text-center font-extrabold text-xs text-[#171717]">{quantity}</span>
                  <button
                    disabled={quantity >= availableStock || isOutOfStock}
                    onClick={() => setQuantity((q) => Math.min(availableStock, q + 1))}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-[#171717] hover:bg-neutral-100 disabled:opacity-30 transition-colors"
                  >
                    +
                  </button>
                </div>

                {/* Add to Wishlist Button */}
                <button
                  onClick={() => setWishlisted(!wishlisted)}
                  className={`w-11 h-11 rounded-full border border-[#EAEAEA] flex items-center justify-center text-lg transition-all ${
                    wishlisted ? "bg-rose-50 border-rose-200 text-rose-500" : "bg-white text-neutral-500 hover:text-black hover:border-black"
                  }`}
                  title={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
                >
                  {wishlisted ? "♥" : "♡"}
                </button>
              </div>

              {/* Primary Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  disabled={isOutOfStock}
                  onClick={() => handleAddToCart(false)}
                  className={`flex-1 py-4 px-6 rounded-full text-xs font-black uppercase tracking-widest transition-all duration-300 shadow-sm flex items-center justify-center gap-2 ${
                    isOutOfStock
                      ? "bg-neutral-200 text-neutral-400 cursor-not-allowed"
                      : "bg-[#171717] hover:bg-black text-white hover:shadow-lg active:scale-[0.98]"
                  }`}
                >
                  {isOutOfStock ? "Sold Out" : "Add to Bag"}
                </button>

                {!isOutOfStock && (
                  <button
                    onClick={() => handleAddToCart(true)}
                    className="flex-1 py-4 px-6 rounded-full text-xs font-black uppercase tracking-widest bg-orange-600 hover:bg-orange-700 text-white transition-all duration-300 shadow-sm hover:shadow-lg active:scale-[0.98]"
                  >
                    Buy Now
                  </button>
                )}
              </div>
            </div>

            {/* Quick Feature Pillars (Iconographic Reference Grid from Screenshot) */}
            <div className="grid grid-cols-2 gap-y-4 gap-x-6 pt-6 border-t border-[#F0F0F0]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#F7F7F7] flex items-center justify-center text-neutral-700 text-base">
                  ⚡
                </div>
                <div>
                  <p className="text-xs font-bold text-[#171717]">Fast Charging</p>
                  <p className="text-[11px] text-[#777777]">15 min = 6 hrs playback</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#F7F7F7] flex items-center justify-center text-neutral-700 text-base">
                  🛡️
                </div>
                <div>
                  <p className="text-xs font-bold text-[#171717]">1 Year Warranty</p>
                  <p className="text-[11px] text-[#777777]">Official brand guarantee</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#F7F7F7] flex items-center justify-center text-neutral-700 text-base">
                  🚚
                </div>
                <div>
                  <p className="text-xs font-bold text-[#171717]">Free Express Delivery</p>
                  <p className="text-[11px] text-[#777777]">Within 24–48 hours</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#F7F7F7] flex items-center justify-center text-neutral-700 text-base">
                  🔄
                </div>
                <div>
                  <p className="text-xs font-bold text-[#171717]">7-Day Easy Returns</p>
                  <p className="text-[11px] text-[#777777]">Hassle-free replacement</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 8. TECHNICAL SPECIFICATIONS & EXTENSIVE DESCRIPTION ── */}
      <section className="bg-[#FAFAFA] border-t border-b border-[#EAEAEA] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Section Heading */}
          <div className="max-w-3xl">
            <h2 className="text-2xl sm:text-3xl font-black text-[#171717] tracking-tight">
              Product Overview &amp; Specifications
            </h2>
            <p className="text-sm text-[#777777] mt-2 leading-relaxed">
              {product.description}
            </p>
          </div>

          {/* Specifications Table Grid */}
          {product.specifications && product.specifications.length > 0 && (
            <div className="bg-white rounded-3xl border border-[#EAEAEA] p-6 sm:p-10 shadow-sm">
              <h3 className="text-base font-extrabold text-[#171717] mb-6 tracking-tight flex items-center gap-2">
                <span>Technical Specifications</span>
                <span className="text-xs font-normal text-neutral-400 font-mono">
                  ({product.specifications.length} verified specs)
                </span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                {product.specifications.map((spec) => (
                  <div
                    key={spec.id}
                    className="flex items-baseline justify-between py-3 border-b border-[#F0F0F0] text-xs"
                  >
                    <span className="font-bold text-[#171717] w-1/2">{spec.specification_name}</span>
                    <span className="text-[#777777] w-1/2 text-right font-medium">{spec.specification_value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── 9. RELATED PRODUCTS CAROUSEL / GRID ── */}
      {relatedProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-[#171717] tracking-tight">
                Related in {product.category}
              </h2>
              <p className="text-xs text-[#777777] mt-1">Discover complementary gear from the collection</p>
            </div>
            <Link
              to={`/shop?category=${encodeURIComponent(product.category)}`}
              className="text-xs font-extrabold text-[#171717] hover:underline"
            >
              View Category →
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {relatedProducts.map((rel) => (
              <div
                key={rel.id}
                onClick={() => navigate(`/product/${rel.id}`)}
                className="bg-white border border-[#EAEAEA] rounded-3xl p-5 hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col justify-between group"
              >
                <div className="aspect-square bg-[#F7F7F7] rounded-2xl p-4 flex items-center justify-center overflow-hidden mb-4">
                  <img
                    src={rel.image_url}
                    alt={rel.name}
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div>
                  {rel.brand && (
                    <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider block">
                      {rel.brand}
                    </span>
                  )}
                  <h4 className="text-xs font-bold text-[#171717] group-hover:text-orange-600 transition-colors line-clamp-1 mt-0.5">
                    {rel.name}
                  </h4>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm font-black text-[#171717]">
                      ₹{Number(rel.price).toLocaleString()}
                    </span>
                    <span className="text-[11px] font-bold text-orange-500">
                      ★ {rel.rating || "4.8"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

