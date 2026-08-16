import { Minus, Plus, ShoppingBag, AlertTriangle, RefreshCw, Zap, Trash2, ArrowRight, ArrowLeft, Heart } from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';

import SEOHead from '../../components/seo/SEOHead';
import Breadcrumb from '../../components/common/Breadcrumb';
import { trackRemoveFromCart } from '../../services/tracker';
import useCartStore from '../../store/cartStore';
import useWishlistStore from '../../store/wishlistStore';
import useAuthStore from '../../store/authStore';
import { useSettings } from '../../store/useSettings';
import { cartAPI } from '../../api/cart';
import { wishlistAPI } from '../../api/wishlist';
import { promotionsAPI } from '../../api/promotions';
import { formatCurrency, slugify, getImageUrl } from '../../utils/formatters';
import { showError, showSuccess, removedFromCart, addedToWishlist } from '../../utils/toast';
import CartPageSkeleton from '../../components/ui/CartItemSkeleton';

export default function CartPage() {
  const { t } = useTranslation();
  const { items, subtotal, updateQuantity, removeItem, clearCart, setItems } = useCartStore();
  const { addItem: addToWishlist } = useWishlistStore();
  const { isAuthenticated } = useAuthStore();
  const { getSetting } = useSettings();
  const navigate = useNavigate();
  const [savingForLater, setSavingForLater] = useState(new Set());
  const storeName = getSetting('storeName', 'Krishna Store');
  const freeShippingThreshold = Number(getSetting('freeShippingThreshold', '499'));
  const shippingFlatRate = Number(getSetting('shippingFlatRate', '50'));
  const currency = getSetting('currency', 'INR');

  // ── Fetch active promotions for flash sale badges ──
  const { data: promotionsData } = useQuery({
    queryKey: ['active-promotions'],
    queryFn: async () => {
      const res = await promotionsAPI.getFlashSales();
      return res.data?.data || res.data || [];
    },
    staleTime: 60000,
    retry: false,
  });

  // ── Fetch store offer cards (Smart Deal, Prepaid Offer, etc.) ──
  const { data: storeOffers = [] } = useQuery({
    queryKey: ['store-offers'],
    queryFn: async () => {
      const res = await promotionsAPI.getStoreOffers();
      const data = res?.data?.data || [];
      return Array.isArray(data) ? data : [];
    },
    staleTime: 60000,
  });

  // Build flash sale product and category lookup maps
  const flashSaleProductIds = useMemo(() => {
    const promos = Array.isArray(promotionsData) ? promotionsData : [];
    const productIds = new Set();
    const categorySlugs = new Set();
    promos.forEach((promo) => {
      if (!promo.isActive) return;
      (promo.products || []).forEach((p) => productIds.add(p.id));
      (promo.categories || []).forEach((c) => categorySlugs.add(c.slug || c.id));
    });
    return { productIds, categorySlugs };
  }, [promotionsData]);

  // Fetch server cart on mount to ensure local state is in sync (skip for guest users)
  const { isLoading: loadingCart } = useQuery({
    queryKey: ['cart'],
    queryFn: async () => {
      const res = await cartAPI.get();
      const data = res.data?.data || res.data;
      if (data?.items?.length > 0) {
        setItems(data.items);
      }
      return data;
    },
    enabled: isAuthenticated,
    staleTime: 0,
    retry: false,
  });

  if (loadingCart) {
    return <CartPageSkeleton />;
  }

  // Separate available and OOS items
  const availableItems = items.filter((item) => {
    const stock = item.variantStock ?? item.productStock;
    return stock === null || stock === undefined || stock > 0;
  });
  const outOfStockItems = items.filter((item) => {
    const stock = item.variantStock ?? item.productStock;
    return stock !== null && stock !== undefined && stock <= 0;
  });
  const hasOutOfStockItems = outOfStockItems.length > 0;

  // Calculate totals from available items only
  const availableSubtotal = availableItems.reduce(
    (sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0
  );
  const availableCount = availableItems.reduce((sum, item) => sum + (item.quantity || 1), 0);

  // Calculate auto-applied store offer discounts.
  // Mirrors backend FlashSaleService logic: picks the BEST single offer, does NOT stack.
  // Uses plain IIFE instead of useMemo to avoid React hooks ordering issues after conditional early return.
  const { autoDiscount, autoDiscountOffers } = (() => {
    const offers = Array.isArray(storeOffers) ? storeOffers : [];
    let bestDiscount = 0;
    let bestOffer = null;

    offers.forEach((offer) => {
      if (offer.isActive === false) return;
      if (offer.status && offer.status !== 'ACTIVE') return;
      if (!offer.discount || offer.discount <= 0) return;

      const discountAmount = availableSubtotal * (offer.discount / 100);
      if (discountAmount > bestDiscount) {
        bestDiscount = discountAmount;
        bestOffer = {
          id: offer.id,
          title: offer.title,
          badge: offer.offerBadge || 'OFFER',
          highlight: offer.offerHighlight || offer.title,
          tagline: offer.offerTagline,
          discountLabel: `-${formatCurrency(discountAmount)}`,
          discountAmount,
        };
      }
    });

    return {
      autoDiscount: Math.round(bestDiscount * 100) / 100,
      autoDiscountOffers: bestOffer ? [bestOffer] : [],
    };
  })();

  const shipping = availableSubtotal >= freeShippingThreshold ? 0 : shippingFlatRate;
  const afterDiscount = Math.max(0, availableSubtotal - autoDiscount);
  const total = afterDiscount + shipping;

  // ── Event handlers ──

  const handleQuantityChange = async (item, newQty) => {
    if (newQty < 1 || newQty > 10) return;
    const itemKey = item.cartItemId || item.id;
    const prevQty = item.quantity;
    updateQuantity(itemKey, newQty);
    if (!isAuthenticated) return;
    try {
      await cartAPI.updateItem(itemKey, { quantity: newQty });
    } catch (err) {
      updateQuantity(itemKey, prevQty);
      const message = err?.response?.data?.message || err?.message || 'Could not update quantity';
      showError(message);
    }
  };

  const handleRemove = async (item) => {
    trackRemoveFromCart(item.productId || item.id, item.name);
    const itemKey = item.cartItemId || item.id;
    removeItem(itemKey);
    if (!isAuthenticated) {
      removedFromCart();
      return;
    }
    try {
      await cartAPI.removeItem(itemKey);
      removedFromCart();
    } catch (err) {
      const status = err?.response?.status;
      if (status === 404) return;
      const message = err?.response?.data?.message || err?.message || 'Could not remove item';
      showError(message);
    }
  };

  const handleSaveForLater = async (item) => {
    const productId = item.productId || item.id;
    const itemKey = item.cartItemId || item.id;

    if (savingForLater.has(itemKey)) return;
    setSavingForLater(prev => new Set(prev).add(itemKey));

    try {
      // Add to wishlist
      if (isAuthenticated) {
        try { await wishlistAPI.add({ productId }); } catch {}
      }
      addToWishlist({ ...item, productId });
      // Remove from cart
      removeItem(itemKey);
      if (isAuthenticated) {
        try { await cartAPI.removeItem(itemKey); } catch {}
      }
      showSuccess(
        <span className="inline-flex items-center gap-1.5">
          <Heart size={14} />
          Saved to wishlist
        </span>
      );
    } finally {
      setSavingForLater(prev => {
        const next = new Set(prev);
        next.delete(itemKey);
        return next;
      });
    }
  };

  // ── Render helpers ──
  const isFlashSaleItem = (item) => {
    if (flashSaleProductIds.productIds.has(item.productId || item.product_id || item.id)) return true;
    if (item.categorySlug || item.category_slug || item.category?.slug) {
      return flashSaleProductIds.categorySlugs.has(item.categorySlug || item.category_slug || item.category?.slug);
    }
    return false;
  };

  const renderCartItem = (item, isOOS) => {
    const itemKey = item.cartItemId || item.id;
    const isSaving = savingForLater.has(itemKey);
    const onFlashSale = isFlashSaleItem(item);

    return (
      <div key={itemKey} className={`flex gap-3 sm:gap-4 p-3 sm:p-5 bg-white rounded-2xl border transition-all duration-300 ${isOOS ? 'border-red-200 bg-red-50/40' : 'border-stone-200/70 shadow-[0_2px_12px_rgba(28,25,23,0.04)] hover:border-gold/30 hover:shadow-md'}`}>
        {/* Product Image */}
        <Link to={`/products/${item.slug || slugify(item.name)}`} className="w-20 sm:w-24 h-20 sm:h-24 sm:w-28 sm:h-28 bg-white rounded-xl sm:rounded-2xl border border-stone-100 overflow-hidden flex-shrink-0">
          {item.imageUrl ? (
            <img loading="lazy" src={getImageUrl(item.imageUrl)} alt={item.name} className={`w-full h-full object-cover hover:scale-110 transition-transform duration-500 ${isOOS ? 'grayscale opacity-60' : ''}`} />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl">{item.image || '👕'}</div>
          )}
        </Link>

        {/* Product Details */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex justify-between gap-4">
            <div className="min-w-0">
              <Link to={`/products/${item.slug || slugify(item.name)}`} className="font-medium text-ink hover:text-gold-dark transition-colors line-clamp-2">
                {item.name}
              </Link>
              {onFlashSale && !isOOS && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gold-dark bg-gold/10 px-2.5 py-0.5 rounded-full mt-1.5 border border-gold/20">
                  <Zap size={12} />
                  {t('cart.flash_sale')}
                </span>
              )}
              {(item.size || item.color) && (
                <p className="text-sm text-stone-500 mt-1">
                  {[item.size && `Size: ${item.size}`, item.color && `Color: ${item.color}`].filter(Boolean).join(' · ')}
                </p>
              )}
              {isOOS ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-600 bg-red-50/70 px-2.5 py-0.5 rounded-full mt-1.5 border border-red-200/70">
                  <AlertTriangle size={12} />
                  {t('cart.out_of_stock')}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 mt-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {t('cart.in_stock')}
                </span>
              )}
            </div>
            <button
              onClick={() => handleRemove(item)}
              className="p-2 text-stone-400 hover:text-red-500 transition-colors shrink-0"
              aria-label={`Remove ${item.name}`}
            >
              <Trash2 size={18} />
            </button>
          </div>

          <div className="flex items-center justify-between mt-auto pt-2">
            {/* Quantity Controls - disabled for OOS */}
            <div className={`flex items-center overflow-hidden bg-white rounded-full border transition-colors ${isOOS ? 'border-red-200 bg-red-50/50' : 'border-stone-200'}`}>
              <button
                onClick={() => handleQuantityChange(item, item.quantity - 1)}
                className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-cream hover:text-gold-dark transition-colors disabled:opacity-30"
                disabled={item.quantity <= 1}
              >
                <Minus size={15} strokeWidth={1.75} />
              </button>
              <span className={`px-3 font-semibold text-sm ${isOOS ? 'text-red-400' : 'text-ink'}`}>{item.quantity}</span>
              <button
                onClick={() => handleQuantityChange(item, item.quantity + 1)}
                className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-cream hover:text-gold-dark transition-colors"
                disabled={item.quantity >= 10 || isOOS}
              >
                <Plus size={15} strokeWidth={1.75} />
              </button>
            </div>

            {/* Price + Save for Later */}
            <div className="flex items-center gap-3">
              {isOOS && (
                <button
                  onClick={() => handleSaveForLater(item)}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-gold-dark transition-colors disabled:opacity-50"
                >
                  {isSaving ? (
                    <RefreshCw size={14} />
                  ) : (
                    <Heart size={14} />
                  )}
                  <span className="hidden sm:inline">{t('cart.save')}</span>
                </button>
              )}
              <div className="text-right">
                {item.oldPrice && item.oldPrice > item.price && (
                  <p className="text-sm text-stone-400 line-through">{formatCurrency(item.oldPrice * item.quantity)}</p>
                )}
                <p className={`text-lg font-semibold ${isOOS ? 'text-stone-400' : onFlashSale ? 'text-gold-dark' : 'text-ink'}`}>
                  {formatCurrency(item.price * item.quantity)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ── Empty state ──
  if (!items.length) {
    return (
      <div className="page-content bg-cream flex-1">
        <SEOHead
          title={`Shopping Cart | ${storeName}`}
          description={t('cart.seo_desc', { store: storeName, amount: formatCurrency(freeShippingThreshold, currency) })}
          noIndex={true}
        />
        <div className="max-w-lg mx-auto px-4 pt-6 sm:pt-8">
          <Breadcrumb
            items={[    {label: t('nav.home'), href: '/' }, { label: t('checkout.cart') }]}
            variant="light"
            className="justify-center mb-8"
          />
        </div>
        <div className="max-w-lg mx-auto px-4 pb-20 text-center">
          <div className="w-24 h-24 bg-white border border-gold/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_2px_12px_rgba(28,25,23,0.05)]">
            <ShoppingBag size={44} strokeWidth={1.5} className="text-gold-dark" />
          </div>
          <h2 className="font-editorial text-3xl font-medium text-ink mb-3 tracking-tight">{t('cart.empty')}</h2>
          <p className="text-stone-500 mb-8">{t('cart.empty_desc')}</p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 bg-ink text-white px-8 py-3.5 rounded-full font-semibold hover:bg-gold hover:text-ink transition-colors shadow-lg shadow-stone-900/10 text-xs uppercase tracking-[0.18em]"
          >
            {t('cart.start_shopping')} <ArrowRight size={20} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content bg-cream flex-1">
      <SEOHead
        title={`Shopping Cart | ${storeName}`}
        description={t('cart.seo_desc', { store: storeName, amount: formatCurrency(freeShippingThreshold, currency) })}
        noIndex={true}
      />
      <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
        <Breadcrumb
          items={[    {label: t('nav.home'), href: '/' }, { label: t('checkout.cart') }]}
          variant="light"
          className="mb-4 sm:mb-6"
        />
        <div className="mb-6 sm:mb-8">
          <span className="inline-flex items-center gap-2.5 text-[11px] sm:text-xs font-medium text-gold-dark uppercase tracking-[0.28em]">
            <span className="w-10 h-px bg-gold" />
            Your Bag
          </span>
          <h1 className="mt-3 font-editorial text-3xl sm:text-4xl font-medium text-ink tracking-tight leading-[1.1]">
            {t('cart.title')} ({items.length} {items.length === 1 ? t('cart.item') : t('cart.items')})
          </h1>
        </div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {/* ── Left Column: Cart Items ── */}
          <div className="md:col-span-2 space-y-6">
            {/* Available Items */}
            {availableItems.length > 0 && (
              <div>
                {hasOutOfStockItems && (
                  <h3 className="text-[11px] font-semibold text-stone-500 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    {t('cart.available')} ({availableItems.length})
                  </h3>
                )}
                <div className="space-y-3">
                  {availableItems.map(item => renderCartItem(item, false))}
                </div>
              </div>
            )}

            {/* Unavailable Items */}
            {hasOutOfStockItems && (
              <div>                  <h3 className="text-[11px] font-semibold text-stone-500 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                    {t('cart.unavailable')} ({outOfStockItems.length})
                  </h3>
                <div className="space-y-3">
                  {outOfStockItems.map(item => renderCartItem(item, true))}
                </div>
              </div>
            )}

            {/* Continue Shopping */}
            <Link to="/products" className="group inline-flex items-center gap-2 text-stone-500 hover:text-gold-dark transition-colors text-sm font-medium">
              <ArrowLeft size={18} className="transition-transform duration-300 group-hover:-translate-x-0.5" />
              {t('cart.continue_shopping')}
            </Link>
          </div>

          {/* ── Right Column: Order Summary ── */}
          <div className="lg:sticky lg:top-8 h-fit">
            <div className="relative overflow-hidden bg-ink rounded-2xl p-6 border border-stone-800 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.5)]">
              <div className="absolute -top-20 -right-20 w-56 h-56 rounded-full bg-gold/15 blur-3xl pointer-events-none" />
              <span className="relative inline-flex items-center gap-2.5 text-[11px] font-medium text-gold-soft uppercase tracking-[0.28em]">
                <span className="w-10 h-px bg-gold" />
                Summary
              </span>
              <h2 className="relative mt-1.5 font-editorial text-2xl font-medium text-white tracking-tight mb-6">{t('cart.order_summary')}</h2>

              {/* Auto-applied store offer cards */}
              {autoDiscountOffers.length > 0 && (
                <div className="flex flex-col gap-1.5 mb-3">
                  {autoDiscountOffers.map((offer) => (
                    <div
                      key={offer.id}
                      className="flex items-center justify-between px-3 py-2.5 bg-white/[0.04] border border-gold/20 rounded-lg"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[10px] font-bold text-ink bg-gold px-1.5 py-0.5 rounded shrink-0">
                          {offer.badge}
                        </span>
                        <span className="text-xs font-semibold text-white/90 truncate">
                          {offer.highlight}
                        </span>
                      </div>
                      <span className="text-[10px] text-gold-soft font-medium shrink-0 ml-2">
                        {offer.discountLabel}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-3 border-t border-stone-800 pt-4">
                <div className="flex justify-between">
                  <span className="text-stone-400">{t('cart.subtotal', { count: availableCount })}</span>
                  <span className="text-white font-medium">{formatCurrency(availableSubtotal)}</span>
                </div>
                {autoDiscount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-stone-500 text-sm font-medium">Store Offers</span>
                    <span className="text-gold-soft text-sm font-medium">-{formatCurrency(autoDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-stone-400">{t('cart.shipping')}</span>
                  <span className="text-white">
                    {shipping === 0 ? (
                      <span className="text-gold-soft font-semibold">{t('cart.free')}</span>
                    ) : (
                      formatCurrency(shipping)
                    )}
                  </span>
                </div>
                {freeShippingThreshold > 0 && availableSubtotal > 0 && availableSubtotal < freeShippingThreshold && (
                  <p className="text-xs text-gold-soft font-medium">
                    {t('cart.add_free_shipping', { amount: formatCurrency(freeShippingThreshold - availableSubtotal, currency) })}
                  </p>
                )}

                {/* OOS notice */}
                {hasOutOfStockItems && (
                  <div className="flex items-start gap-2 pt-2 pb-1">
                    <AlertTriangle size={14} className="text-gold-soft shrink-0 mt-0.5" />
                    <p className="text-xs text-gold-soft/90 leading-relaxed">
                      {outOfStockItems.length === 1
                        ? t('cart.oos_single')
                        : t('cart.oos_multiple', { count: outOfStockItems.length })}
                      {' '}{t('cart.save_wishlist_check')}
                    </p>
                  </div>
                )}

                <div className="flex justify-between pt-3 border-t border-stone-800">
                  <span className="font-semibold text-white text-lg">{t('cart.total')}</span>
                  <span className="font-bold text-gold-soft text-xl">{formatCurrency(total)}</span>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                onClick={() => {
                  if (availableItems.length === 0) {
                    showError('All items are out of stock. Save them to your wishlist and check back later.');
                    return;
                  }
                  navigate('/checkout');
                }}
                className={`w-full py-3.5 rounded-full text-xs font-semibold uppercase tracking-[0.18em] transition-all duration-300 mt-6 flex items-center justify-center gap-2 shadow-lg ${
                  availableItems.length === 0
                    ? 'bg-white/10 text-white/40 cursor-not-allowed'
                    : 'bg-gold text-ink hover:bg-gold-soft shadow-gold/25 hover:shadow-xl hover:shadow-gold/30 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]'
                }`}
              >                  {availableItems.length === 0 ? (
                  <><AlertTriangle size={18} /> {t('cart.all_unavailable')}</>
                ) : (
                  <><ArrowRight size={20} /> {t('cart.proceed_checkout')}</>
                )}
              </button>

              {/* Trust Info */}
              <div className="mt-6 text-center text-xs text-stone-400">
                <p>{t('cart.secure_checkout_text')} • {t('cart.free_delivery_text')} • {t('cart.easy_returns_text')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
