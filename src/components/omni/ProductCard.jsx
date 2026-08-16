import { useState, useMemo, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Eye, Plus, Check, Share2, ShoppingBag, X, Minus } from 'lucide-react';
import useCartStore from '../../store/cartStore';
import useWishlistStore from '../../store/wishlistStore';
import useAuthStore from '../../store/authStore';
import { getImageUrl, formatPrice } from '../../utils/formatters';
import { getColorHex, isLightColor } from '../../utils/constants';
import { wishlistAPI } from '../../api/wishlist';
import { cartAPI } from '../../api/cart';
import { addedToCart, addedToWishlist, removedFromWishlist } from '../../utils/toast';

export default function ProductCard({ product, onQuickView }) {
  const navigate = useNavigate();
  const { addItem } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const { isInWishlist, addItem: addToWL, removeItem: removeFromWL } = useWishlistStore();
  const [currentImgIndex, setCurrentImgIndex] = useState(0);
  const [isAddedAnim, setIsAddedAnim] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  // ── Quick-add state ──
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [qty, setQty] = useState(1);
  const [isAdding, setIsAdding] = useState(false);

  const images = product.productimage || product.images || [];
  const imgUrl = images.length > 0 ? (images[0]?.url || images[0]) : (product.imageUrl || null);
  const hoverImgUrl = images.length > 1 ? (images[1]?.url || images[1]) : '';
  const inWishlist = isInWishlist(product.id);
  const productPath = `/products/${product.slug || product.id}`;

  // ── Variants ──
  const variants = useMemo(() => (Array.isArray(product.variants) ? product.variants : []), [product.variants]);
  const hasVariants = variants.length > 0;

  const { colors, sizes } = useMemo(() => {
    const cSet = new Set();
    const sSet = new Set();
    if (hasVariants) {
      variants.forEach((v) => {
        const attrs = v.attributes || {};
        if (attrs.color) cSet.add(attrs.color);
        if (attrs.size) sSet.add(attrs.size);
      });
    }
    return {
      colors: cSet.size > 0 ? [...cSet] : (Array.isArray(product.colors) ? product.colors : []),
      sizes: sSet.size > 0 ? [...sSet] : (Array.isArray(product.sizes) ? product.sizes : []),
    };
  }, [hasVariants, variants, product.colors, product.sizes]);

  const hasSelectableOptions = colors.length > 0 || sizes.length > 0;

  // Out-of-stock colors/sizes (computed from variant stock)
  const { oosColors, oosSizes } = useMemo(() => {
    if (!hasVariants) return { oosColors: new Set(), oosSizes: new Set() };
    const oc = new Set();
    const os = new Set();
    colors.forEach((c) => {
      if (!variants.some((v) => v.attributes?.color === c && Number(v.quantity || 0) > 0)) oc.add(c);
    });
    sizes.forEach((s) => {
      if (!variants.some((v) => v.attributes?.size === s && Number(v.quantity || 0) > 0)) os.add(s);
    });
    return { oosColors: oc, oosSizes: os };
  }, [hasVariants, variants, colors, sizes]);

  // Matched variant for the selected color + size
  const matchedVariant = useMemo(() => {
    if (!hasVariants || !selectedColor || !selectedSize) return null;
    return variants.find(
      (v) => v.attributes?.color === selectedColor && v.attributes?.size === selectedSize
    ) || null;
  }, [hasVariants, variants, selectedColor, selectedSize]);

  // First in-stock variant (fallback add)
  const firstAvailVariant = useMemo(() => {
    if (!hasVariants) return null;
    return variants.find((v) => Number(v.quantity || 0) > 0) || variants[0] || null;
  }, [hasVariants, variants]);

  const displayPrice = Number(matchedVariant?.price ?? product.price ?? 0);
  const hasAllSelections = (!colors.length || selectedColor) && (!sizes.length || selectedSize);

  const canAdd = hasVariants && hasSelectableOptions
    ? (hasAllSelections && matchedVariant && Number(matchedVariant.quantity || 0) > 0)
    : hasVariants
      ? (firstAvailVariant && Number(firstAvailVariant.quantity || 0) > 0)
      : Number(product.quantity ?? 0) > 0;

  // Robust price/discount — API sends camelCase (oldPrice) or snake_case (old_price)
  const oldPrice = product.oldPrice ?? product.old_price;
  const price = Number(product.price ?? 0);
  const discount = oldPrice
    ? Math.round(((Number(oldPrice) - price) / Number(oldPrice)) * 100)
    : product.discountPercentage;

  // Stock awareness — only trust explicit numeric stock fields
  const rawStock = product.quantity ?? product.stockCount ?? product.stock;
  const hasStockField = rawStock !== undefined && rawStock !== null;
  const stockQty = hasStockField ? Number(rawStock) : null;
  const isOutOfStock = hasStockField && !Number.isNaN(stockQty) && stockQty <= 0;
  const isLowStock = !isOutOfStock && hasStockField && !Number.isNaN(stockQty) && stockQty > 0 && stockQty <= 5;

  // ── Add to cart (local + server sync for authenticated users) ──
  const doAdd = useCallback((variant, overrides = {}) => {
    const size = overrides.size ?? selectedSize;
    const color = overrides.color ?? selectedColor;
    const q = overrides.qty ?? qty;
    const useVariant = variant || matchedVariant || firstAvailVariant || null;
    addItem({
      ...product,
      productId: product.id,
      quantity: q,
      price: useVariant?.price ?? product.price,
      size: size || undefined,
      color: color || undefined,
      variantId: useVariant?.id || undefined,
      variantStock: useVariant?.quantity ?? undefined,
    });
    if (isAuthenticated) {
      cartAPI.add({
        productId: product.id,
        quantity: q,
        size: size || undefined,
        color: color || undefined,
        variantId: useVariant?.id || undefined,
      }).catch(() => {});
    }
    addedToCart(product.name);
    setIsAddedAnim(true);
    setTimeout(() => setIsAddedAnim(false), 1200);
  }, [addItem, isAuthenticated, matchedVariant, firstAvailVariant, product, selectedSize, selectedColor, qty]);

  // Close panel + reset selections
  const closePanel = useCallback(() => {
    setShowQuickAdd(false);
    setSelectedColor('');
    setSelectedSize('');
    setQty(1);
  }, []);

  // ── Quick-add trigger: direct add for simple products, panel for variants ──
  const handleQuickAdd = useCallback((e) => {
    e.stopPropagation();
    if (isOutOfStock || isAdding) return;

    // No variants → add directly
    if (!hasVariants) {
      doAdd(null);
      return;
    }
    // Variants but no selectable options → add first available directly
    if (!hasSelectableOptions) {
      if (firstAvailVariant && Number(firstAvailVariant.quantity || 0) > 0) doAdd(firstAvailVariant);
      return;
    }
    // Pre-select the first in-stock color/size, then open the quick-add panel
    const fa = variants.find((v) => Number(v.quantity || 0) > 0) || variants[0];
    if (fa?.attributes?.color && colors.length) setSelectedColor(fa.attributes.color);
    if (fa?.attributes?.size && sizes.length) setSelectedSize(fa.attributes.size);
    setShowQuickAdd(true);
  }, [isOutOfStock, isAdding, hasVariants, hasSelectableOptions, firstAvailVariant, variants, colors, sizes, doAdd]);

  // Add from the panel after selections are made
  const handlePanelAdd = useCallback(() => {
    if (isAdding || !hasAllSelections || !canAdd) return;
    setIsAdding(true);
    try {
      doAdd(null);
      closePanel();
    } finally {
      setIsAdding(false);
    }
  }, [isAdding, hasAllSelections, canAdd, doAdd, closePanel]);

  // Lock body scroll while the mobile bottom sheet is open
  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    if (showQuickAdd && isMobile) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [showQuickAdd]);

  const handleWishlist = async (e) => {
    e.stopPropagation();
    try {
      if (inWishlist) {
        await wishlistAPI.remove(product.id);
        removeFromWL(product.id);
        removedFromWishlist();
      } else {
        await wishlistAPI.add({ productId: product.id });
        addToWL(product);
        addedToWishlist();
      }
    } catch {
      inWishlist ? removeFromWL(product.id) : addToWL(product);
    }
  };

  const handleWhatsappShare = (e) => {
    e.stopPropagation();
    const shareText = `*${product.name}*\n\n🔥 Offer Price: ₹${product.price} (MRP: ₹${oldPrice || product.price * 2})\n🚚 Free Delivery + Cash on Delivery Available!\n\nOrder Now: ${window.location.origin}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    }
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`, '_blank');
  };

  // ── Shared quick-add options markup (desktop panel + mobile sheet) ──
  const renderOptions = (isSheet) => (
    <>
      {/* Colors */}
      {colors.length > 0 && (
        <div>
          <p className={`flex items-center justify-between ${isSheet ? 'text-xs' : 'text-[10px]'} font-semibold text-stone-500 uppercase tracking-wider`}>
            <span>Color{selectedColor ? <span className="text-ink ml-1 font-bold normal-case">{selectedColor}</span> : ''}</span>
          </p>
          <div className="flex flex-wrap gap-2 mt-2">
            {colors.map((c) => {
              const oos = oosColors.has(c);
              const isSelected = selectedColor === c;
              return (
                <button
                  key={c}
                  type="button"
                  disabled={oos}
                  onClick={(e) => { e.stopPropagation(); setSelectedColor(c); }}
                  className={`relative w-7 h-7 sm:w-6 sm:h-6 rounded-full overflow-hidden border flex items-center justify-center transition-all duration-150 active:scale-90 ${
                    isSelected
                      ? 'border-gold ring-2 ring-gold/30 scale-110 shadow-sm'
                      : oos
                        ? 'border-stone-200 opacity-30 cursor-not-allowed'
                        : 'border-stone-300 hover:border-gold/60'
                  }`}
                  title={c}
                >
                  <span
                    className={`w-full h-full ${isLightColor(c) ? '' : ''}`}
                    style={{ background: getColorHex(c) }}
                  />
                  {oos && (
                    <span className="absolute inset-0 flex items-center justify-center">
                      <span className="w-px h-4 bg-red-400 rotate-45" />
                    </span>
                  )}
                  {isSelected && (
                    <span className="absolute inset-0 flex items-center justify-center">
                      <Check size={12} className={`${isLightColor(c) ? 'text-stone-700' : 'text-white'}`} strokeWidth={3} />
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
          <p className={`flex items-center justify-between ${isSheet ? 'text-xs' : 'text-[10px]'} font-semibold text-stone-500 uppercase tracking-wider`}>
            <span>Size{selectedSize ? <span className="text-ink ml-1 font-bold normal-case">{selectedSize}</span> : ''}</span>
          </p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {sizes.map((s) => {
              const oos = oosSizes.has(s);
              const isSelected = selectedSize === s;
              return (
                <button
                  key={s}
                  type="button"
                  disabled={oos}
                  onClick={(e) => { e.stopPropagation(); setSelectedSize(s); }}
                  className={`min-w-9 h-8 px-2.5 text-[11px] font-bold rounded-full transition-all duration-150 active:scale-95 ${
                    oos
                      ? 'opacity-25 cursor-not-allowed text-stone-400 bg-stone-100 line-through'
                      : isSelected
                        ? 'bg-ink text-white shadow-sm scale-[1.03]'
                        : 'bg-white text-stone-600 border border-stone-200 hover:border-gold/50 hover:text-gold-dark'
                  }`}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Quantity + Add */}
      <div className="flex items-center gap-2.5">
        <div className="flex items-center bg-white rounded-full border border-stone-200 overflow-hidden shrink-0">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setQty(Math.max(1, qty - 1)); }}
            disabled={qty <= 1}
            className="w-8 h-8 flex items-center justify-center text-stone-500 hover:text-gold-dark hover:bg-cream transition-all disabled:opacity-30"
          >
            <Minus size={13} strokeWidth={1.75} />
          </button>
          <span className="w-7 text-center text-sm font-semibold text-ink">{qty}</span>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setQty(qty + 1); }}
            className="w-8 h-8 flex items-center justify-center text-stone-500 hover:text-gold-dark hover:bg-cream transition-all"
          >
            <Plus size={13} strokeWidth={1.75} />
          </button>
        </div>

        <button
          type="button"
          onClick={handlePanelAdd}
          disabled={!canAdd || isAdding}
          className={`flex-1 h-9 rounded-full text-[11px] font-bold uppercase tracking-[0.12em] flex items-center justify-center gap-1.5 transition-all duration-200 active:scale-[0.97] disabled:opacity-45 disabled:cursor-not-allowed ${
            canAdd && !isAdding
              ? 'bg-gold text-ink hover:bg-gold-soft shadow-md shadow-gold/25'
              : 'bg-stone-100 text-stone-400'
          }`}
        >
          {isAdding ? (
            <span className="w-3.5 h-3.5 border-2 border-gold-dark/30 border-t-gold-dark rounded-full animate-spin" />
          ) : !hasAllSelections ? (
            'Select'
          ) : !matchedVariant ? (
            'Unavailable'
          ) : (
            <>
              <ShoppingBag size={12} />
              <span>Add {formatPrice(displayPrice * qty)}</span>
            </>
          )}
        </button>
      </div>
    </>
  );

  return (
    <div
      className="group relative bg-white cursor-pointer flex flex-col h-full"
      onMouseEnter={() => hoverImgUrl && setCurrentImgIndex(1)}
      onMouseLeave={() => setCurrentImgIndex(0)}
      onClick={() => navigate(productPath)}
    >
      {/* ════ Image — full-bleed, borderless ════ */}
      <div className="relative aspect-[4/5] bg-cream overflow-hidden rounded-xl">
        <Link to={productPath} aria-label={product.name} onClick={(e) => e.stopPropagation()}>
          <img
            src={getImageUrl(currentImgIndex === 1 && hoverImgUrl ? hoverImgUrl : imgUrl)}
            alt={product.name}
            className={`absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.05] ${isOutOfStock ? 'grayscale opacity-60' : ''}`}
            loading="lazy"
            decoding="async"
          />
        </Link>

        {/* Minimal single badge */}
        {!isOutOfStock && discount > 0 ? (
          <span className="absolute top-3 left-3 z-10 inline-flex items-center bg-ink/75 backdrop-blur-sm text-white text-[9px] font-medium tracking-[0.14em] px-2.5 py-1 rounded-full">
            −{discount}%
          </span>
        ) : isOutOfStock ? (
          <span className="absolute top-3 left-3 z-10 inline-flex items-center bg-white/90 backdrop-blur-sm text-ink text-[9px] font-medium tracking-[0.14em] px-2.5 py-1 rounded-full">
            Sold Out
          </span>
        ) : null}

        {/* Actions — wishlist always (mobile) / reveal on hover (desktop) */}
        <div className="absolute top-3 right-3 z-10 flex flex-col gap-2">
          <button
            onClick={handleWishlist}
            aria-label={inWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
            className={`w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm border flex items-center justify-center shadow-sm transition-all duration-300 sm:translate-x-1 sm:opacity-0 sm:group-hover:translate-x-0 sm:group-hover:opacity-100 sm:pointer-events-none sm:group-hover:pointer-events-auto ${
              inWishlist
                ? 'border-gold text-gold'
                : 'border-stone-100 text-stone-500 hover:text-rose-500 hover:scale-110'
            }`}
          >
            <Heart key={inWishlist ? 'in' : 'out'} className={`w-3.5 h-3.5 ${inWishlist ? 'fill-current animate-[badgePop_.35s_ease]' : ''}`} />
          </button>
          <button
            onClick={handleWhatsappShare}
            aria-label="Share on WhatsApp"
            className="hidden sm:flex w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm border border-stone-100 text-stone-500 shadow-sm transition-all duration-300 hover:text-emerald-600 hover:scale-110 sm:translate-x-1 sm:opacity-0 sm:group-hover:translate-x-0 sm:group-hover:opacity-100 sm:pointer-events-none sm:group-hover:pointer-events-auto"
          >
            <Share2 className="w-3.5 h-3.5 mx-auto" />
          </button>
        </div>

        {/* Mobile quick-add — opens the quick-add sheet for variants, direct add otherwise */}
        <button
          onClick={handleQuickAdd}
          disabled={isOutOfStock}
          aria-label={hasVariants && hasSelectableOptions ? 'Quick add' : 'Add to cart'}
          className={`sm:hidden absolute bottom-3 right-3 z-10 w-9 h-9 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 active:scale-90 ${
            isOutOfStock
              ? 'bg-white/70 text-stone-400 cursor-not-allowed'
              : isAddedAnim
                ? 'bg-emerald-600 text-white'
                : 'bg-ink text-white hover:bg-gold hover:text-ink'
          }`}
        >
          {isAddedAnim ? <Check className="w-4 h-4" /> : hasVariants && hasSelectableOptions ? <ShoppingBag className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
        </button>

        {/* Desktop hover bar — Quick Add (variants) / Add to Cart + Quick View */}
        <div className="absolute inset-x-3 bottom-3 z-10 hidden sm:flex items-center gap-2 translate-y-3 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
          <button
            onClick={handleQuickAdd}
            disabled={isOutOfStock}
            className={`flex-1 py-2.5 rounded-full backdrop-blur-md text-[11px] font-medium tracking-[0.14em] uppercase flex items-center justify-center gap-1.5 transition-colors duration-300 ${
              isOutOfStock
                ? 'bg-white/70 text-stone-500 cursor-not-allowed'
                : isAddedAnim
                  ? 'bg-emerald-600 text-white'
                  : 'bg-ink/90 text-white hover:bg-gold hover:text-ink'
            }`}
          >
            {isAddedAnim ? <><Check className="w-3.5 h-3.5" /> Added</> : isOutOfStock ? 'Sold Out' : hasVariants && hasSelectableOptions ? 'Quick Add' : 'Add to Cart'}
          </button>
          {onQuickView && (
            <button
              onClick={(e) => { e.stopPropagation(); onQuickView(product); }}
              aria-label="Quick view"
              className="w-10 h-10 rounded-full bg-white/95 text-ink border border-white/40 shadow-md flex items-center justify-center transition-all duration-200 hover:bg-gold hover:text-ink"
            >
              <Eye className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* ── Desktop: inline quick-add panel (slides up inside the card) ── */}
        <AnimatePresence>
          {showQuickAdd && (
            <motion.div
              key="desktop-quick-add"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="absolute inset-0 z-20 hidden md:block"
              onClick={closePanel}
            >
              <div className="absolute inset-0 bg-ink/30 backdrop-blur-[1px]" />
              <motion.div
                initial={{ y: '100%', opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: '100%', opacity: 0 }}
                transition={{ type: 'spring', duration: 0.4, bounce: 0.15 }}
                className="absolute inset-x-2 bottom-2 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-stone-100 p-3.5"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-ink uppercase tracking-[0.14em]">
                    <ShoppingBag size={12} className="text-gold-dark" />
                    Quick Add
                  </span>
                  <button
                    type="button"
                    onClick={closePanel}
                    className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-all"
                  >
                    <X size={13} />
                  </button>
                </div>
                <p className="text-[11px] font-medium text-stone-900 truncate leading-tight mb-2.5">{product.name}</p>
                <div className="space-y-2.5">
                  {renderOptions(false)}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ════ Product Info — clean & airy ════ */}
      <div className="pt-3 px-0.5 flex flex-col flex-1">
        <Link to={productPath} onClick={(e) => e.stopPropagation()} className="focus:outline-none">
          <h3 className="text-[13px] font-medium text-stone-800 leading-snug line-clamp-2 transition-colors duration-200 group-hover:text-gold-dark">
            {product.name}
          </h3>
        </Link>

        {isLowStock && (
          <span className="mt-1 text-[10px] font-medium text-rose-600">Only {stockQty} left</span>
        )}

        <div className="mt-1.5 flex items-baseline gap-2 flex-wrap">
          <span className="text-[15px] font-semibold tracking-tight text-ink">
            {formatPrice(price)}
          </span>
          {oldPrice && (
            <span className="text-xs text-stone-400 line-through font-normal">
              {formatPrice(oldPrice)}
            </span>
          )}
        </div>

        {/* Variant preview — color swatches & sizes */}
        {(product.colors?.length > 1 || product.sizes?.length > 0 || colors.length > 1 || sizes.length > 0) && (
          <div className="mt-2 flex items-center justify-between gap-2">
            {(colors.length > 1 || (colors.length === 1 && sizes.length === 0)) && (
              <div className="flex items-center gap-1.5">
                {colors.slice(0, 4).map((c) => (
                  <span
                    key={c}
                    title={c}
                    className={`w-4 h-4 rounded-full border ${isLightColor(c) ? 'border-stone-300' : 'border-black/10'}`}
                    style={{ background: getColorHex(c) }}
                  />
                ))}
                {colors.length > 4 && (
                  <span className="text-[9px] font-medium text-stone-400">+{colors.length - 4}</span>
                )}
              </div>
            )}
            {sizes.length > 0 && (
              <div className="flex items-center gap-1">
                {sizes.slice(0, 4).map((s) => (
                  <span key={s} className="text-[9px] font-semibold uppercase tracking-wide text-stone-400">{s}</span>
                ))}
                {sizes.length > 4 && (
                  <span className="text-[9px] font-medium text-stone-400">+{sizes.length - 4}</span>
                )}
              </div>
            )}
          </div>
        )}

        {copiedShare && (
          <div className="mt-2 text-[10px] font-medium text-emerald-700 text-center bg-emerald-50 rounded-full py-1 border border-emerald-200">
            WhatsApp Link Copied!
          </div>
        )}
      </div>

      {/* ════ Mobile: quick-add bottom sheet (portaled to body) ════ */}
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
                <div className="absolute inset-0 bg-ink/50 backdrop-blur-sm" />

                <motion.div
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  transition={{ type: 'spring', duration: 0.45, bounce: 0.25 }}
                  className="absolute bottom-0 inset-x-0 max-h-[80vh] bg-white rounded-t-2xl shadow-2xl flex flex-col overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Drag handle */}
                  <div className="flex justify-center pt-3 pb-1 shrink-0">
                    <div className="w-10 h-1 rounded-full bg-stone-300/70" />
                  </div>

                  {/* Header */}
                  <div className="flex items-center justify-between px-4 pb-2 shrink-0">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-ink flex items-center justify-center">
                        <ShoppingBag size={14} className="text-gold-soft" />
                      </div>
                      <span className="text-sm font-bold text-ink">Quick Add</span>
                    </div>
                    <button
                      onClick={closePanel}
                      className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-stone-100 transition-all active:scale-[0.85]"
                    >
                      <X size={15} />
                    </button>
                  </div>

                  {/* Product info row */}
                  <div className="flex items-center gap-3 px-4 pb-3 border-b border-stone-100 shrink-0">
                    <div className="w-14 h-14 rounded-xl bg-cream overflow-hidden shrink-0 border border-stone-100">
                      {imgUrl ? (
                        <img loading="lazy" src={getImageUrl(imgUrl)} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">👕</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-ink truncate">{product.name}</p>
                      <p className="text-base font-semibold text-ink mt-0.5">{formatPrice(displayPrice)}</p>
                    </div>
                  </div>

                  {/* Scrollable options */}
                  <div className="flex-1 overflow-y-auto px-4 py-3">
                    <div className="space-y-3">
                      {renderOptions(true)}
                    </div>
                  </div>

                  {/* Safe area bottom padding */}
                  <div className="shrink-0" style={{ paddingBottom: 'env(safe-area-inset-bottom, 12px)' }} />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>,
        document.body
      )}
    </div>
  );
}
