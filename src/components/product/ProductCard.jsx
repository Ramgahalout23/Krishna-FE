import { ShoppingBag, Plus, Minus, X, Heart, Star, Truck } from 'lucide-react';
import { useState, useMemo, useCallback, useEffect, useRef, memo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

;
import { useTranslation } from 'react-i18next';
import useWishlistStore from '../../store/wishlistStore';
import useCartStore from '../../store/cartStore';
import { formatCurrency, slugify, getImageUrl, getProductImage, getProductImages, getProductHoverImage } from '../../utils/formatters';
import { getColorHex } from '../../utils/constants';
import { computeStockStatus } from '../../utils/stockHelpers';
import { wishlistAPI } from '../../api/wishlist';
import { cartAPI } from '../../api/cart';
import useAuthStore from '../../store/authStore';
import { buildHighlights, getStyleTagline } from '../../utils/productHelpers.jsx';
import toast, { addedToCart } from '../../utils/toast';

/* ── Main ProductCard ── */
function ProductCard({ product, className = '' }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { isInWishlist, addItem: addToWL, removeItem: removeFromWL } = useWishlistStore();
  const addToCart = useCartStore((s) => s.addItem);
  const inWishlist = isInWishlist(product.id);
  const productSlug = product.slug || slugify(product.name);

  /* ── Quick Add State ── */
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [qty, setQty] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showHighlights, setShowHighlights] = useState(false);
  const highlightsTimeoutRef = useRef(null);


  /* ── Variants ── */
  const productImages = getProductImages(product);
  const hoverImageUrl = getProductHoverImage(product);
  const hasHoverImage = (!!hoverImageUrl && hoverImageUrl !== productImages[0]) || !!productImages[1];
  const variants = product.variants || product.productvariant;
  const hasVariants = Array.isArray(variants) && variants.length > 0;

  const { colors, sizes } = useMemo(() => {
    const cSet = new Set();
    const sSet = new Set();
    if (hasVariants) {
      variants.forEach((v) => {
        if (v.attributes) {
          if (v.attributes.color) cSet.add(v.attributes.color);
          if (v.attributes.size) sSet.add(v.attributes.size);
        }
      });
    }
    // Fallback: direct arrays on product (mock format)
    const colorArr = cSet.size > 0 ? [...cSet] : (Array.isArray(product.colors) ? product.colors : []);
    const sizeArr = sSet.size > 0 ? [...sSet] : (Array.isArray(product.sizes) ? product.sizes : []);
    return { colors: colorArr, sizes: sizeArr };
  }, [hasVariants, variants, product.colors, product.sizes]);

  const hasSelectableOptions = colors.length > 0 || sizes.length > 0;

  /* ── OOS colors/sizes ── */
  const { oosColors, oosSizes } = useMemo(() => {
    if (!hasVariants) return { oosColors: new Set(), oosSizes: new Set() };
    const oc = new Set();
    const os = new Set();
    colors.forEach((c) => {
      const hasInStock = variants.some(
        (v) => v.attributes?.color === c && (v.quantity || 0) > 0
      );
      if (!hasInStock) oc.add(c);
    });
    sizes.forEach((s) => {
      const hasInStock = variants.some(
        (v) => v.attributes?.size === s && (v.quantity || 0) > 0
      );
      if (!hasInStock) os.add(s);
    });
    return { oosColors: oc, oosSizes: os };
  }, [hasVariants, variants, colors, sizes]);

  /* ── Matched variant for selected color+size ── */
  const matchedVariant = useMemo(() => {
    if (!hasVariants || !selectedColor || !selectedSize) return null;
    return variants.find(
      (v) =>
        v.attributes?.color === selectedColor &&
        v.attributes?.size === selectedSize
    ) || null;
  }, [hasVariants, variants, selectedColor, selectedSize]);

  /* ── Auto-first variant for no-selection quick add ── */
  const firstAvailVariant = useMemo(() => {
    if (!hasVariants) return null;
    return variants.find((v) => (v.quantity || 0) > 0) || variants[0] || null;
  }, [hasVariants, variants]);

  const displayPrice = matchedVariant?.price ?? product.price;
  const hasAllSelections = (!colors.length || selectedColor) && (!sizes.length || selectedSize);
  const canAdd = hasVariants && hasSelectableOptions
    ? (hasAllSelections && matchedVariant && (matchedVariant.quantity || 0) > 0)
    : hasVariants
      ? (firstAvailVariant && (firstAvailVariant.quantity || 0) > 0)
      : ((product.quantity ?? 0) > 0);

  const handleWishlist = async (e) => {
    e.stopPropagation();
    try {
      if (inWishlist) {
        await wishlistAPI.remove(product.id);
        removeFromWL(product.id);
        toast.success(t('product.removed_wishlist'));
      } else {
        await wishlistAPI.add({ productId: product.id });
        addToWL(product);
        toast.success(t('product.added_wishlist'));
      }
    } catch {
      inWishlist ? removeFromWL(product.id) : addToWL(product);
    }
  };

  /* ── Reset selections when panel closes ── */
  const closePanel = useCallback(() => {
    setShowQuickAdd(false);
    setSelectedColor('');
    setSelectedSize('');
    setQty(1);
  }, []);

  const handleImageMouseEnter = () => {
    setIsHovered(true);
    if (!showQuickAdd) {
      highlightsTimeoutRef.current = setTimeout(() => setShowHighlights(true), 150);
    }
  };

  const handleImageMouseLeave = () => {
    setIsHovered(false);
    if (highlightsTimeoutRef.current) {
      clearTimeout(highlightsTimeoutRef.current);
      highlightsTimeoutRef.current = null;
    }
    setShowHighlights(false);
  };

  /* ── Quick Add: directly to cart ── */
  const handleQuickAdd = useCallback(async (e) => {
    e.stopPropagation();
    if (isAdding) return;

    // Non-variant products: add directly to cart, no panel needed
    if (!hasVariants) {
      setIsAdding(true);
      try {
        addToCart({
          id: product.id,
          productId: product.id,
          name: product.name,
          price: product.price,
          image: getProductImage(product),
          quantity: qty,
        });
        if (isAuthenticated) {
          await cartAPI.add({ productId: product.id, quantity: qty }).catch(() => {});
        }
        addedToCart(product.name);
      } finally {
        setIsAdding(false);
      }
      return;
    }

    // Variants with no selectable attributes → add first available directly
    if (hasVariants && !hasSelectableOptions) {
      if (!firstAvailVariant) return;
      setIsAdding(true);
      try {
        addToCart({
          id: product.id,
          productId: product.id,
          name: product.name,
          price: firstAvailVariant.price ?? product.price,
          image: getProductImage(product),
          quantity: qty,
          variantId: firstAvailVariant.id,
        });
        if (isAuthenticated) {
          await cartAPI.add({ productId: product.id, quantity: qty }).catch(() => {});
        }
        addedToCart(product.name);
      } finally {
        setIsAdding(false);
      }
      return;
    }

    // If user already selected color+size from inline swatches → add directly
    if (hasAllSelections && matchedVariant && (matchedVariant.quantity || 0) > 0) {
      setIsAdding(true);
      try {
        addToCart({
          id: product.id,
          productId: product.id,
          name: product.name,
          price: matchedVariant.price ?? product.price,
          image: getProductImage(product),
          quantity: qty,
          size: selectedSize,
          color: selectedColor,
          variantId: matchedVariant.id,
        });
        if (isAuthenticated) {
          await cartAPI.add({
            productId: product.id,
            quantity: qty,
            size: selectedSize,
            color: selectedColor,
          }).catch(() => {});
        }
        addedToCart(product.name);
        setShowQuickAdd(false);
      } finally {
        setIsAdding(false);
      }
      return;
    }

    // Variants: auto-select first available variant, then show panel
    const firstAvailable = (product.variants || product.productvariant || []).find((v) => (v.quantity || 0) > 0);
    if (firstAvailable?.attributes) {
      if (firstAvailable.attributes.color && colors.length) {
        setSelectedColor(firstAvailable.attributes.color);
      }
      if (firstAvailable.attributes.size && sizes.length) {
        setSelectedSize(firstAvailable.attributes.size);
      }
    }

    setShowQuickAdd(true);
    setShowHighlights(false);
  }, [hasVariants, hasAllSelections, hasSelectableOptions, matchedVariant, firstAvailVariant, product, qty, selectedColor, selectedSize, addToCart, isAdding, isAuthenticated, colors, sizes]);

  /* ── Add from panel (after selections made) ── */
  const handlePanelAdd = useCallback(async () => {
    if (isAdding || !hasAllSelections || !canAdd) return;
    setIsAdding(true);
    try {
      if (hasVariants) {
        // Use matched variant or first available
        const useVariant = matchedVariant || firstAvailVariant;
        addToCart({
          id: product.id,
          productId: product.id,
          name: product.name,
          price: useVariant?.price ?? product.price,
          image: getProductImage(product),
          quantity: qty,
          size: selectedSize,
          color: selectedColor,
          variantId: useVariant?.id,
        });
        if (isAuthenticated) {
          await cartAPI.add({
            productId: product.id,
            quantity: qty,
            size: selectedSize,
            color: selectedColor,
          }).catch(() => {});
        }
      } else {
        addToCart({
          id: product.id,
          productId: product.id,
          name: product.name,
          price: product.price,
          image: getProductImage(product),
          quantity: qty,
        });
        if (isAuthenticated) {
          await cartAPI.add({ productId: product.id, quantity: qty }).catch(() => {});
        }
      }
      addedToCart(product.name);
      closePanel();
    } finally {
      setIsAdding(false);
    }
  }, [hasVariants, hasAllSelections, canAdd, matchedVariant, firstAvailVariant, product, qty, selectedColor, selectedSize, addToCart, isAdding, closePanel, isAuthenticated]);

  /* ── Prevent body scroll when mobile bottom sheet is open ── */
  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    if (showQuickAdd && isMobile) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [showQuickAdd]);

  const discount = product.oldPrice ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100) : null;
  const { isOutOfStock, isLowStock, effectiveStockQty } = computeStockStatus(product);

  const highlights = useMemo(() => buildHighlights(product, true), [product]);
  const styleTagline = useMemo(() => getStyleTagline(product), [product]);

  // Computed "New" badge — based on badge field, isNew flag, or recent creation
  const isNew = useMemo(() => {
    if (product.badge === 'New') return true;
    if (product.isNew) return true;
    if (product.createdAt) {
      const thirtyDays = 30 * 24 * 60 * 60 * 1000;
      return Date.now() - new Date(product.createdAt).getTime() < thirtyDays;
    }
    return false;
  }, [product.badge, product.isNew, product.createdAt]);

  // Badge priority: Out of Stock > Low Stock > Sale (discount % pill) > New > custom badge
  let topLeftBadge = null;
  if (isOutOfStock) {
    topLeftBadge = { label: t('product.out_of_stock'), className: 'bg-danger text-white' };
  } else if (isLowStock) {
    topLeftBadge = { label: t('product.low_stock', { count: effectiveStockQty }), className: 'bg-deal text-white' };
  } else if (isNew) {
    topLeftBadge = { label: t('product.new_badge'), className: 'bg-primary text-white' };
  } else if (product.badge) {
    const badgeClass = (product.badge === 'Bestseller' || product.badge === 'Hot' || product.badge === 'Trending')
      ? 'bg-charcoal text-white'
      : product.badge === 'Limited'
      ? 'bg-secondary text-white'
      : 'bg-text-muted/20 text-text-secondary';
    topLeftBadge = { label: product.badge, className: badgeClass };
  }

  // ══════════════════════════════════════════════
  // FLIPKART/MYNTRA-STYLE RATING DISPLAY
  // ══════════════════════════════════════════════
  const rating = product.rating || product.averageRating || null;
  const ratingCount = product.reviewCount || product.numReviews || null;

  return (
    <>
      {/* ══════════════════════════════════════════════
           PRODUCT CARD — Flipkart/Myntra Premium Style
           • Always-visible Add button
           • Always-visible Wishlist (Myntra style)
           • Flipkart-style pricing with discount %
           • Free delivery tag
           • Brand name display
           • Rating stars inline
           ══════════════════════════════════════════════ */}
      <div
        className={`product-card group bg-white ${className} rounded-lg border border-border/50 hover:border-border overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer flex flex-col h-full`}
        onClick={() => navigate(`/products/${productSlug}`)}
      >
        {/* ════ Image Container ════ */}
        <div
          className="relative aspect-[3/4] max-sm:aspect-[4/5] bg-surface overflow-hidden shrink-0"
          onMouseEnter={handleImageMouseEnter}
          onMouseLeave={handleImageMouseLeave}
        >
          {/* ── Badges ── */}
          {/* Discount % Badge — Flipkart style (top-left, prominent orange) */}
          {!isOutOfStock && discount && (
            <div className="absolute top-2 left-2 z-10 bg-deal text-white text-[10px] max-sm:text-[9px] font-bold px-1.5 py-0.5 rounded-sm leading-tight">
              {discount}% OFF
            </div>
          )}

          {/* New / Other Badge — only when no discount */}
          {!discount && topLeftBadge && (
            <div className={`absolute top-2 left-2 z-10 text-[9px] max-sm:text-[8px] font-bold px-1.5 py-0.5 uppercase tracking-wider rounded-sm ${topLeftBadge.className}`}>
              {topLeftBadge.label}
            </div>
          )}

          {/* ── Wishlist — Always Visible (Myntra style) ── */}
          <button
            onClick={handleWishlist}
            className={`absolute top-2 right-2 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
              inWishlist
              ? 'bg-danger text-white shadow-md scale-110'
              : 'bg-white/80 hover:bg-white text-text-muted hover:text-accent shadow-sm hover:shadow-md'
            }`}
          >
            <Heart size={14} fill={inWishlist ? 'currentColor' : 'none'} />
          </button>

          {/* ── Image Stack ── */}
          <div className="product-img-stack">
            {productImages.length > 0 ? (
              <>
                <img
                  src={getImageUrl(productImages[0])}
                  alt={product.name}
                  loading="lazy"
                  onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }}
                  className={`product-img-layer w-full h-full object-cover transition-all duration-500 ${isOutOfStock ? 'grayscale opacity-60' : ''} ${!isHovered || !hasHoverImage ? 'active' : ''}`}
                />
                {hasHoverImage && (
                  <img
                    src={getImageUrl(hoverImageUrl || productImages[1] || null)}
                    alt={`${product.name} - hover view`}
                    loading="lazy"
                    onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }}
                    className={`product-img-layer w-full h-full object-cover transition-all duration-500 ${isOutOfStock ? 'grayscale opacity-60' : ''} ${isHovered ? 'active' : ''}`}
                  />
                )}
              </>
            ) : (
              <div className={`w-full h-full flex items-center justify-center text-6xl transition-all duration-500 ${isOutOfStock ? 'opacity-20' : 'opacity-40'}`}>
                📦
              </div>
            )}
          </div>

          {/* ── Image indicator dots ── */}
          {hasHoverImage && (
            <div className="product-img-dots">
              <div className={`product-img-dot ${!isHovered ? 'active' : ''}`} />
              <div className={`product-img-dot ${isHovered ? 'active' : ''}`} />
            </div>
          )}

          {/* ── Out of Stock overlay ── */}
          {isOutOfStock && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/5">
              <div className="bg-white/90 backdrop-blur-sm text-text-primary text-[10px] font-bold uppercase tracking-[0.15em] px-3 py-1.5 rounded-sm shadow-lg">
                {t('product.sold_out')}
              </div>
            </div>
          )}

          {/* ── Highlights Overlay (only when hovering image) ── */}
          <AnimatePresence>
            {!showQuickAdd && showHighlights && highlights.length > 0 && (
              <motion.div
                key="highlights-overlay"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-0 z-20 flex flex-col justify-end bg-gradient-to-t from-black/85 via-black/40 to-transparent p-2.5"
                onClick={(e) => e.stopPropagation()}
              >
                <p className="text-white/90 text-[9px] font-medium leading-tight mb-1.5 line-clamp-2">
                  {styleTagline}
                </p>
                <div className="flex flex-wrap gap-1">
                  {highlights.slice(0, 4).map((h, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-white/15 backdrop-blur-sm text-white text-[7px] font-semibold uppercase tracking-wider"
                    >
                      {h.icon}
                      {h.value}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>



          {/* ── Desktop Quick-Add Panel (slides up, replaces image) ── */}
          <div className="hidden md:block absolute inset-0 z-30 pointer-events-none">
            <AnimatePresence>
              {showQuickAdd && (
                <motion.div
                  key="desktop-quick-add"
                  initial={{ y: '100%', opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: '100%', opacity: 0 }}
                  transition={{ type: 'spring', duration: 0.4, bounce: 0.15 }}
                  className="absolute inset-0 pointer-events-auto"
                  onClick={closePanel}
                >
                <div className="absolute inset-0 bg-black/5" />
                <div
                  className="absolute inset-x-0 bottom-0 bg-white/95 backdrop-blur-md border-t border-border/80 shadow-xl max-h-full flex flex-col"
                  onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="flex items-center justify-between px-3 pt-2.5 pb-1.5 shrink-0">
                  <div className="flex items-center gap-2">
                    <ShoppingBag size={13} />
                    <span className="text-[11px] font-bold text-text-primary uppercase tracking-wider">{t('product.quick_add')}</span>
                  </div>
                  <button onClick={closePanel} className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-surface transition-all duration-150 active:scale-[0.85]">
                    <X size={13} />
                  </button>
                </div>

                {/* Scrollable options area */}
                <div className="flex-1 overflow-y-auto px-3 no-scrollbar">
                  <div className="space-y-2 pb-2.5">
                    {/* Product Name */}
                    <p className="text-[11px] font-medium text-text-primary truncate leading-tight">{product.name}</p>

                    {/* Colors */}
                    {colors.length > 0 && (
                      <div>
                        <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1">
                          Color{selectedColor ? <span className="text-text-primary ml-1 font-bold">· {selectedColor}</span> : ''}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {colors.map((c) => {
                            const isOOS = oosColors.has(c);
                            const isSelected = selectedColor === c;
                            return (
                              <button
                                key={c}
                                disabled={isOOS}
                                onClick={() => setSelectedColor(c)}
                                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-150 ${
                                  isSelected
                                    ? 'border-primary scale-110 shadow-sm'
                                    : isOOS
                                    ? 'border-border opacity-30 cursor-not-allowed'
                                    : 'border-transparent hover:border-border'
                                }`}
                                title={c}
                              >
                                <div
                                  className={`w-[14px] h-[14px] rounded-full border border-black/10 ${isOOS ? 'opacity-50' : ''}`}
                                  style={{ background: getColorHex(c) }}
                                />
                                {isOOS && (
                                  <span className="absolute inset-0 flex items-center justify-center">
                                    <svg viewBox="0 0 24 24" className="w-full h-full text-red-400 opacity-70" fill="none" stroke="currentColor" strokeWidth="1.5">
                                      <line x1="4" y1="4" x2="20" y2="20" />
                                    </svg>
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Sizes */}
                    {sizes.length > 0 && (
                      <div>
                        <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1">
                          Size{selectedSize ? <span className="text-text-primary ml-1 font-bold">· {selectedSize}</span> : ''}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {sizes.map((s) => {
                            const isOOS = oosSizes.has(s);
                            const isSelected = selectedSize === s;
                            return (
                              <button
                                key={s}
                                disabled={isOOS}
                                onClick={() => setSelectedSize(s)}
                                className={`px-2 py-1 text-[10px] font-bold rounded-[3px] transition-all duration-150 ${
                                  isOOS
                                    ? 'opacity-25 cursor-not-allowed text-text-muted bg-surface line-through'
                                    : isSelected                        ? 'bg-primary text-white shadow-sm scale-[1.02]'
                                      : 'bg-surface text-text-secondary hover:bg-surface-dim hover:text-text-primary'
                                }`}
                              >
                                {s}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Quantity + Add to Cart */}
                <div className="shrink-0 px-3 pb-3 border-t border-border">
                  <div className="flex items-center gap-2 pt-1">
                    {/* Qty Stepper */}
                    <div className="flex items-center border border-border rounded-[3px] overflow-hidden shrink-0">
                      <button
                        onClick={() => setQty(Math.max(1, qty - 1))}
                        disabled={qty <= 1}
                        className="w-7 h-7 flex items-center justify-center text-text-secondary hover:bg-surface transition-all duration-150 active:scale-[0.88] disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Minus size={11} />
                      </button>
                      <motion.span
                        key={qty}
                        initial={{ y: 4, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.12, ease: 'easeOut' }}
                        className="w-7 h-7 flex items-center justify-center text-[12px] font-bold text-text-primary bg-surface border-x border-border"
                      >{qty}</motion.span>
                      <button
                        onClick={() => setQty(qty + 1)}
                        className="w-7 h-7 flex items-center justify-center text-text-secondary hover:bg-surface transition-all duration-150 active:scale-[0.88]"
                      >
                        <Plus size={11} />
                      </button>
                    </div>

                    {/* Add to Cart */}
                    <button
                      onClick={handlePanelAdd}
                      disabled={!canAdd || isAdding}
                      className={`flex-1 h-8 flex items-center justify-center gap-1.5 text-[10px] font-bold rounded-[3px] transition-all duration-150 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed ${
                        canAdd && !isAdding
                          ? 'bg-primary text-white hover:bg-primary-dark'
                          : 'bg-surface text-text-muted'
                      }`}
                    >
                      {isAdding ? (
                        <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : !hasAllSelections ? (
                        <span>{t('product.select') || 'Select'}</span>
                      ) : !matchedVariant && hasVariants && hasSelectableOptions ? (
                        <span>{t('product.unavailable') || 'Unavailable'}</span>
                      ) : !canAdd ? (
                        <span>{t('product.sold_out') || 'Sold Out'}</span>
                      ) : (
                        <AnimatePresence mode="popLayout">
                          <motion.span
                            key={displayPrice * qty}
                            initial={{ y: 6, opacity: 0, scale: 0.95 }}
                            animate={{ y: 0, opacity: 1, scale: 1 }}
                            exit={{ y: -6, opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.15, ease: 'easeOut' }}
                            className="inline-flex items-center gap-1.5 whitespace-nowrap"
                          >
                            <ShoppingBag size={11} />
                            <span>{t('product.add_price', { price: formatCurrency(displayPrice * qty) })}</span>
                          </motion.span>
                        </AnimatePresence>
                      )}
                    </button>
                  </div>
                </div>
              </div>
              </motion.div>
            )}
          </AnimatePresence>
          </div>
        </div>

        {/* ════ Details Section — Premium Compact Style ════ */}
        <div className={`px-2 sm:px-2.5 py-1.5 sm:py-2 flex flex-col flex-1 transition-all duration-300 ${isOutOfStock ? 'opacity-50' : ''}`}>
          {/* ── Brand / Store Name ── */}
          {(product.storeName || product.brand) && (
            <p className="text-[9px] max-sm:text-[8px] font-semibold text-text-muted uppercase tracking-wider mb-0 line-clamp-1">
              {product.storeName || product.brand?.name || product.brand}
            </p>
          )}

          {/* ── Product Name ── */}
          <h3 className="text-xs sm:text-[13px] font-semibold text-text-primary line-clamp-2 leading-snug mb-0.5">
            {product.name}
          </h3>

          {/* ── Rating Stars — Flipkart Style ── */}
          {rating && (
            <div className="flex items-center gap-1 mb-0.5">
              <span className="inline-flex items-center gap-0.5 bg-ratings text-white text-[8px] font-bold px-1 py-[1px] rounded-sm leading-tight">
                {typeof rating === 'number' ? rating.toFixed(1) : rating}
                <Star size={7} fill="currentColor" className="text-white" />
              </span>
              {ratingCount && (
                <span className="text-[9px] text-text-muted">
                  ({ratingCount})
                </span>
              )}
            </div>
          )}

          {/* ── Price Section — Flipkart Style ── */}
          <div className="flex items-baseline gap-1 mt-auto">
            <span className="text-sm md:text-base font-bold text-text-primary">
              {formatCurrency(product.price)}
            </span>
            {product.oldPrice && (
              <>
                <span className="text-[10px] md:text-xs text-text-muted line-through">
                  {formatCurrency(product.oldPrice)}
                </span>
                <span className="text-[9px] md:text-[10px] font-bold text-ratings">
                  {discount}% off
                </span>
              </>
            )}
          </div>

          {/* ── Free Delivery + Add to Cart row ── */}
          <div className="flex items-center justify-between gap-1 mt-0.5">
            <div className="flex items-center gap-1">
              <Truck size={10} className="text-text-muted" />
              <span className="text-[9px] sm:text-[10px] text-text-muted font-medium">Free Delivery</span>
            </div>
            {/* ── Always-Visible Add to Cart Button ── */}
            {!isOutOfStock && (
              <button
                onClick={handleQuickAdd}
                disabled={isAdding}
                className="px-2.5 sm:px-3 py-1 sm:py-1.5 flex items-center justify-center gap-1 bg-primary text-white text-[9px] sm:text-[10px] font-bold uppercase tracking-wider rounded-sm hover:bg-primary-dark hover:shadow-sm transition-all duration-200 active:scale-[0.98] disabled:opacity-60 shrink-0 min-h-[28px] sm:min-h-[32px]"
              >
                {isAdding ? (
                  <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <><ShoppingBag size={10} /><span>{t('product.add_to_cart') || 'Add'}</span></>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
           MOBILE BOTTOM SHEET — Portaled to body
           ══════════════════════════════════════════════ */}
      {createPortal(
        <div className="md:hidden">
          <AnimatePresence>
            {showQuickAdd && (
              <motion.div
                key="mobile-quick-add"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-[9999]"
                onClick={closePanel}
              >
                {/* Backdrop */}
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

                {/* Bottom Sheet */}
                <motion.div
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  transition={{ type: 'spring', duration: 0.45, bounce: 0.25 }}
                  className="absolute bottom-0 inset-x-0 max-h-[80vh] bg-white rounded-t-xl shadow-2xl flex flex-col overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Drag Handle */}
                  <div className="flex justify-center pt-3 pb-1 shrink-0">
                    <div className="w-10 h-1 rounded-full bg-text-muted/20" />
                  </div>

                  {/* Header */}
                  <div className="flex items-center justify-between px-4 pb-2 shrink-0">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
                        <ShoppingBag size={14} className="text-white" />
                      </div>
                      <span className="text-sm font-bold text-text-primary">{t('product.quick_add')}</span>
                    </div>
                    <button
                      onClick={closePanel}
                      className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-surface transition-all duration-150 active:scale-[0.85]"
                    >
                      <X size={15} />
                    </button>
                  </div>

                  {/* Product Info Row */}
                  <div className="flex items-center gap-3 px-4 pb-3 border-b border-border shrink-0">
                    <div className="w-14 h-14 rounded-lg bg-surface overflow-hidden shrink-0">
                      {(() => {
                        const thumbUrl = getImageUrl(getProductImage(product));
                        return thumbUrl ? (
                          <img loading="lazy" src={thumbUrl} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>
                        );
                      })()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">{product.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-base font-bold text-text-primary">{formatCurrency(displayPrice)}</span>
                        {product.oldPrice && (
                          <span className="text-xs text-text-muted line-through">{formatCurrency(product.oldPrice)}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Scrollable Options */}
                  <div className="flex-1 overflow-y-auto px-4 no-scrollbar">
                    <div className="py-3 space-y-3">
                      {/* Colors */}
                      {colors.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                            Color · <span className="text-text-primary">{selectedColor || 'Select'}</span>
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {colors.map((c) => {
                              const isOOS = oosColors.has(c);
                              const isSelected = selectedColor === c;
                              return (
                                <button
                                  key={c}
                                  disabled={isOOS}
                                  onClick={() => setSelectedColor(c)}
                                className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-150 ${
                                  isSelected
                                    ? 'border-primary scale-110 shadow-sm'
                                    : isOOS
                                    ? 'border-border opacity-30 cursor-not-allowed'
                                    : 'border-transparent hover:border-border'
                                    }`}
                                    title={c}
                                  >
                                    <div
                                      className={`w-[22px] h-[22px] rounded-full border border-black/10 ${isOOS ? 'opacity-50' : ''}`}
                                      style={{ background: getColorHex(c) }}
                                    />
                                    {isOOS && (
                                      <span className="absolute inset-0 flex items-center justify-center">
                                        <svg viewBox="0 0 24 24" className="w-full h-full text-red-400 opacity-70" fill="none" stroke="currentColor" strokeWidth="1.5">
                                          <line x1="4" y1="4" x2="20" y2="20" />
                                        </svg>
                                      </span>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                      {/* Sizes */}
                      {sizes.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                            Size · <span className="text-text-primary">{selectedSize || 'Select'}</span>
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {sizes.map((s) => {
                              const isOOS = oosSizes.has(s);
                              const isSelected = selectedSize === s;
                              return (
                                <button
                                  key={s}
                                  disabled={isOOS}
                                  onClick={() => setSelectedSize(s)}
                                  className={`px-3 py-2 text-xs font-bold rounded-lg transition-all duration-150 ${
                                    isOOS
                                    ? 'opacity-25 cursor-not-allowed text-text-muted bg-surface line-through'
                                    : isSelected
                                    ? 'bg-primary text-white shadow-sm scale-[1.02]'
                                    : 'bg-surface text-text-secondary hover:bg-surface-dim hover:text-text-primary'
                                    }`}
                                >
                                  {s}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Sticky Bottom: Qty + Add to Cart */}
                  <div className="shrink-0 px-4 pb-5 pt-3 border-t border-border bg-white">
                    <div className="flex items-center gap-3">
                      {/* Qty Stepper */}
                      <div className="flex items-center border border-border rounded-lg overflow-hidden shrink-0">
                        <button
                          onClick={() => setQty(Math.max(1, qty - 1))}
                          disabled={qty <= 1}
                          className="w-10 h-10 flex items-center justify-center text-text-secondary hover:bg-surface transition-all duration-150 active:scale-[0.88] disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Minus size={13} />
                        </button>
                        <motion.span
                          key={qty}
                          initial={{ y: 4, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ duration: 0.12, ease: 'easeOut' }}
                          className="w-10 h-10 flex items-center justify-center text-sm font-bold text-text-primary bg-surface border-x border-border"
                        >{qty}</motion.span>
                        <button
                          onClick={() => setQty(qty + 1)}
                          className="w-10 h-10 flex items-center justify-center text-text-secondary hover:bg-surface transition-all duration-150 active:scale-[0.88]"
                        >
                          <Plus size={13} />
                        </button>
                      </div>

                      {/* Add to Cart */}
                      <button
                        onClick={handlePanelAdd}
                        disabled={!canAdd || isAdding}
                        className={`flex-1 h-11 flex items-center justify-center gap-2 text-xs font-bold rounded-lg transition-all duration-150 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed ${
                          canAdd && !isAdding
                          ? 'bg-primary text-white hover:bg-primary-dark'
                          : 'bg-surface text-text-muted'
                        }`}
                      >
                        {isAdding ? (
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : !hasAllSelections ? (
                          <span>{t('product.select') || 'Select'}</span>
                        ) : !matchedVariant && hasVariants && hasSelectableOptions ? (
                          <span>{t('product.unavailable') || 'Unavailable'}</span>
                        ) : !canAdd ? (
                          <span>{t('product.sold_out') || 'Sold Out'}</span>
                        ) : (
                          <AnimatePresence mode="popLayout">
                            <motion.span
                              key={displayPrice * qty}
                              initial={{ y: 6, opacity: 0, scale: 0.95 }}
                              animate={{ y: 0, opacity: 1, scale: 1 }}
                              exit={{ y: -6, opacity: 0, scale: 0.95 }}
                              transition={{ duration: 0.15, ease: 'easeOut' }}
                              className="inline-flex items-center gap-1.5 whitespace-nowrap"
                            >
                              <ShoppingBag size={13} />
                              <span>{t('product.add_price', { price: formatCurrency(displayPrice * qty) })}</span>
                            </motion.span>
                          </AnimatePresence>
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>,
        document.body
      )}
    </>
  );
}

export default memo(ProductCard);
