import { Minus, Plus, Star, ChevronDown, Share2, X, ChevronLeft, ChevronRight, Zap, Heart, ShieldCheck, Truck, RotateCcw, ShoppingBag, CheckCircle, ArrowRight, Play, Volume2, ExternalLink } from 'lucide-react';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import { trackProductView, trackAddToCart } from '../../services/tracker';
import useInterval from '../../hooks/useInterval';
import Breadcrumb from '../../components/common/Breadcrumb';
import SEOHead from '../../components/seo/SEOHead';
import { productsAPI } from '../../api/products';

import { seoAPI } from '../../api/seo';
import { reviewsAPI } from '../../api/reviews';
import useCartStore from '../../store/cartStore';
import useWishlistStore from '../../store/wishlistStore';
import useAuthStore from '../../store/authStore';
import { cartAPI } from '../../api/cart';
import { wishlistAPI } from '../../api/wishlist';
import SizeGuideModal from '../../components/product/SizeGuideModal';
import ReviewFormModal from '../../components/product/ReviewFormModal';
import { formatPrice, formatDate, getImageUrl, getProductImages, getVideoUrl } from '../../utils/formatters';
import ReviewImageLightbox from '../../components/product/ReviewImageLightbox';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../../store/useSettings';
import { getColorHex } from '../../utils/constants';
import { promotionsAPI } from '../../api/promotions';
import { ordersAPI } from '../../api/orders';
import FlashSaleCountdown from '../../components/storefront/FlashSaleCountdown';
import OffersSection from '../../components/storefront/OffersSection';
import BundleOffer from '../../components/storefront/BundleOffer';
import ProductCard from '../../components/omni/ProductCard';
import { removedFromWishlist, addedToWishlist, wishlistError, linkCopied } from '../../utils/toast';

/* ═══════════════════════════════════════════════════
   Product Detail Page — OmniStore stone/amber theme
   Tailwind utility classes — matching homepage design
   ═══════════════════════════════════════════════════ */

/* ─── Check if product should show a size guide ───
   Uses the 'category_based_sizing' admin setting to determine
   which category slugs should show the size guide. Falls back
   to an empty list (no size guide) if setting is not configured. */
function getSizeGuideCategories(settings) {
  const raw = settings?.category_based_sizing;
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function isClothingProduct(product, settings) {
  if (!product) return false;
  if (!product.sizes?.length) return false;
  if (product.is_digital) return false;
  const sizeGuideCats = getSizeGuideCategories(settings);
  if (sizeGuideCats.length === 0) return false;
  const catSlug = typeof product.category === 'object'
    ? product.category?.slug
    : null;
  if (catSlug) return sizeGuideCats.includes(catSlug);
  return false;
}

/* ─── Helpers ─── */
function mapProductReview(review) {
  const user = review.user || {};
  const product = review.product || {};
  const firstName = user.first_name || user.firstName || '';
  const lastName = user.last_name || user.lastName || '';
  return {
    id: review.id,
    name: [firstName, lastName].filter(Boolean).join(' ') || review.name || 'Anonymous',
    avatar: user.avatar || '',
    rating: review.rating || 5,
    title: review.title || '',
    comment: review.comment || '',
    product: product.name || '',
    productSlug: product.slug || '',
    date: review.created_at ? formatDate(review.created_at) : '',
    isVerified: review.is_verified || review.isVerified || false,
    createdAt: review.created_at || review.createdAt || '',
  };
}

function calcStarDistribution(reviews) {
  const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach(r => {
    const star = Math.floor(r.rating || 5);
    if (star >= 1 && star <= 5) dist[star]++;
  });
  return dist;
}

/* ═══════════════════════════════════════════════════
   MAIN PAGE COMPONENT
   ═══════════════════════════════════════════════════ */
export default function ProductDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { settings, getSetting } = useSettings();
  const { addItem, openCart } = useCartStore();
  const { isInWishlist, addItem: addToWL, removeItem: removeFromWL } = useWishlistStore();
  const { isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const storeName = getSetting('storeName', 'Krishna Store');

  // ── State ──
  const [qty, setQty] = useState(1);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [matchedVariant, setMatchedVariant] = useState(null);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [openAccordion, setOpenAccordion] = useState('details');
  const [galleryLightboxOpen, setGalleryLightboxOpen] = useState(false);
  const [galleryLightboxIdx, setGalleryLightboxIdx] = useState(0);
  const [recentPurchase, setRecentPurchase] = useState(null);
  const hasAutoSelected = useRef(false);
  const sentinelRef = useRef(null);
  const mobileGalleryRef = useRef(null);
  const offersRef = useRef(null);
  const realOrdersRef = useRef([]);

  // ── FOMO recent-purchase notifications ──
  useInterval(() => {
    if (Math.random() > 0.85) {
      const realOrders = realOrdersRef.current;
      let name, city;
      if (realOrders.length > 0) {
        const idx = Math.floor(Math.random() * realOrders.length);
        name = realOrders[idx].name;
        city = realOrders[idx].city;
      } else {
        const fallbackNames = ['Alex M.', 'Jordan K.', 'Sam T.', 'Casey R.', 'Riley P.', 'Morgan S.'];
        const fallbackCities = ['New York', 'Los Angeles', 'Chicago', 'Miami', 'Austin', 'Seattle'];
        name = fallbackNames[Math.floor(Math.random() * fallbackNames.length)];
        city = fallbackCities[Math.floor(Math.random() * fallbackCities.length)];
      }
      setRecentPurchase({ name, city, id: Date.now() });
      setTimeout(() => setRecentPurchase(null), 4000);
    }
  }, 4000);

  // ── Fetch recent orders for FOMO ──
  useEffect(() => {
    let cancelled = false;
    ordersAPI.getRecentOrders().then(res => {
      if (cancelled) return;
      const orders = res.data?.data || [];
      if (Array.isArray(orders) && orders.length > 0) {
        realOrdersRef.current = orders.filter(o => o.name && o.city);
      }
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  // ── React Query: Product ──
  const { data: product, isLoading, isError } = useQuery({
    queryKey: ['product', slug],
    queryFn: async () => {
      const res = await productsAPI.getById(slug);
      const prod = res.data?.data || null;
      if (!prod) throw new Error('Product not found');
      return prod;
    },
    staleTime: 0,
  });

  // ── React Query: Reviews ──
  const { data: reviews = [] } = useQuery({
    queryKey: ['product-reviews', product?.id],
    queryFn: () => reviewsAPI.getByProduct(product.id).then(r => {
      const raw = r.data?.data?.reviews || r.data?.data || [];
      return Array.isArray(raw) ? raw.map(mapProductReview) : [];
    }),
    enabled: !!product?.id,
    staleTime: 120000,
  });

  // ── React Query: SEO ──
  const { data: seoMeta = null } = useQuery({
    queryKey: ['product-seo', product?.id],
    queryFn: () => seoAPI.getEntitySEO('product', product.id).then(r => r.data?.data || null).catch(() => null),
    enabled: !!product?.id,
    staleTime: 300000,
  });

  // ── React Query: Flash Sales ──
  const { data: flashPromotions = [] } = useQuery({
    queryKey: ['product-flash-sales', product?.id],
    queryFn: async () => {
      const res = await promotionsAPI.getFlashSales();
      const data = res?.data?.data || [];
      return Array.isArray(data) ? data : [];
    },
    enabled: !!product?.id,
    staleTime: 15000,
  });

  // ── React Query: Store Offers ──
  const { data: storeOffers = [] } = useQuery({
    queryKey: ['store-offers'],
    queryFn: async () => {
      const res = await promotionsAPI.getStoreOffers();
      return Array.isArray(res?.data?.data) ? res.data.data : [];
    },
    staleTime: 60000,
  });

  // ── React Query: Related Products ──
  const { data: relatedProducts = [] } = useQuery({
    queryKey: ['product-related', product?.id],
    queryFn: () => productsAPI.getRelated(product.id).then(r => {
      const data = r.data?.data || [];
      return Array.isArray(data) ? data.filter(p => p.id !== product.id).slice(0, 8) : [];
    }),
    enabled: !!product?.id,
    staleTime: 60000,
  });

  // ── Check if any active promotions/sales exist from backend ──
  const hasActivePromotions = useMemo(() => {
    const promos = Array.isArray(flashPromotions) ? flashPromotions : [];
    return promos.some(p => {
      if (p.isActive === false) return false;
      if (p.status && p.status !== 'ACTIVE') return false;
      const now = new Date();
      const start = p.startDate ? new Date(p.startDate) : null;
      const end = p.endDate ? new Date(p.endDate) : null;
      if (start && now < start) return false;
      if (end && now > end) return false;
      return true;
    });
  }, [flashPromotions]);

  // ── Active Flash Sale ──
  const activeFlashSale = useMemo(() => {
    if (!flashPromotions.length || !product) return null;
    const now = new Date();
    return flashPromotions.find(p => {
      const start = p.startDate ? new Date(p.startDate) : null;
      const end = p.endDate ? new Date(p.endDate) : null;
      if (start && now < start) return false;
      if (end && now > end) return false;
      if (p.status !== 'ACTIVE' && !p.isActive) return false;
      const productIds = p.productIds || p.products?.map(pr => pr.id) || [];
      if (productIds.length > 0) return productIds.includes(product.id);
      const categoryIds = p.categoryIds || p.categories?.map(c => c.id) || [];
      if (categoryIds.length > 0) {
        const catId = typeof product.category === 'object' ? product.category?.id : product.categoryId;
        return categoryIds.includes(catId);
      }
      return true;
    });
  }, [flashPromotions, product]);

  // ── Auto-select first in-stock variant ──
  useEffect(() => {
    if (!product || hasAutoSelected.current) return;
    const variants = product?.variants || product?.productvariant || [];
    if (!variants.length) return;
    const inStockVariant = variants.find(v => (v.quantity || 0) > 0);
    if (!inStockVariant) return;
    const attrs = inStockVariant.attributes || {};
    let nextSize = '';
    let nextColor = '';
    if (product.sizes?.length && attrs.size) nextSize = attrs.size;
    else if (product.sizes?.length) {
      const firstAvailable = product.sizes.find(s =>
        variants.some(v => { const a = v.attributes || {}; return a.size === s && (v.quantity || 0) > 0; })
      );
      if (firstAvailable) nextSize = firstAvailable;
    }
    if (product.colors?.length && attrs.color) nextColor = attrs.color;
    else if (product.colors?.length) {
      const firstAvailable = product.colors.find(c =>
        variants.some(v => { const a = v.attributes || {}; return a.color === c && (v.quantity || 0) > 0; })
      );
      if (firstAvailable) nextColor = firstAvailable;
    }
    if (nextSize) setSelectedSize(nextSize);
    if (nextColor) setSelectedColor(nextColor);
    hasAutoSelected.current = true;
  }, [product]);

  // ── Tracking (view count) ──
  useEffect(() => {
    if (!product) return;
    const catName = typeof product.category === 'object' ? product.category.name : product.category;
    trackProductView(product.id, product.name, catName);
  }, [product]);

  // ── Wishlist server sync ──
  useEffect(() => {
    if (!product?.id || !isAuthenticated) return;
    let cancelled = false;
    wishlistAPI.check(product.id).then((res) => {
      if (cancelled) return;
      const wishlisted = res?.data?.data?.wishlisted;
      if (wishlisted === true) addToWL(product);
      else if (wishlisted === false && isInWishlist(product.id)) removeFromWL(product.id);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [product?.id, isAuthenticated]);

  // ── Reset image index on variant change ──
  useEffect(() => { setSelectedImageIdx(0); }, [selectedColor, selectedSize]);

  // ── Compute matched variant ──
  const variantsList = product?.variants || product?.productvariant || [];
  const needsSize = (product?.sizes?.length || 0) > 0;
  const needsColor = (product?.colors?.length || 0) > 0;
  const hasVariants = needsSize || needsColor;
  const hasAllSelections = (!needsSize || selectedSize) && (!needsColor || selectedColor);

  useEffect(() => {
    if (!product?.id || !hasAllSelections || !hasVariants) {
      setMatchedVariant(null);
      return;
    }
    const variant = variantsList.find(v => {
      const attrs = v.attributes || {};
      return (!needsSize || attrs.size === selectedSize) && (!needsColor || attrs.color === selectedColor);
    }) || null;
    setMatchedVariant(variant);
  }, [selectedSize, selectedColor, product?.id, needsSize, needsColor, hasAllSelections, hasVariants, variantsList]);

  // ── Stock logic ──
  const variantStockMap = useMemo(() => {
    const map = new Map();
    variantsList.forEach(v => {
      const attrs = v.attributes || {};
      const key = `${attrs.size || ''}::${attrs.color || ''}`;
      map.set(key, v.quantity || 0);
    });
    return map;
  }, [variantsList]);

  const isSizeAvailable = useCallback((size) => {
    if (!variantsList.length) return true;
    if (selectedColor) return (variantStockMap.get(`${size}::${selectedColor}`) || 0) > 0;
    return variantsList.some(v => { const a = v.attributes || {}; return a.size === size && (v.quantity || 0) > 0; });
  }, [variantsList, selectedColor, variantStockMap]);

  const isColorAvailable = useCallback((color) => {
    if (!variantsList.length) return true;
    if (selectedSize) return (variantStockMap.get(`${selectedSize}::${color}`) || 0) > 0;
    return variantsList.some(v => { const a = v.attributes || {}; return a.color === color && (v.quantity || 0) > 0; });
  }, [variantsList, selectedSize, variantStockMap]);

  const getSizeStock = useCallback((size) => {
    if (!variantsList.length) return product?.quantity || 0;
    if (selectedColor) return variantStockMap.get(`${size}::${selectedColor}`) || 0;
    const stocks = variantsList.filter(v => (v.attributes || {}).size === size).map(v => v.quantity || 0);
    return stocks.length ? Math.max(...stocks) : 0;
  }, [variantsList, selectedColor, variantStockMap, product]);

  const isSimpleProduct = !needsSize && !needsColor;
  const availableStock = !isSimpleProduct ? (matchedVariant?.quantity ?? 0) : (product?.quantity ?? 0);
  const isStockUnavailable = isSimpleProduct ? (product?.quantity || 0) <= 0 : !variantsList.length || variantsList.every(v => (v.quantity || 0) <= 0);
  const isLowStock = !isStockUnavailable && availableStock > 0 && availableStock <= 5;
  const variantNotFound = !isSimpleProduct && hasAllSelections && !variantsList.some(v => {
    const attrs = v.attributes || {};
    return (!needsSize || attrs.size === selectedSize) && (!needsColor || attrs.color === selectedColor);
  });
  const canAddToCart = hasAllSelections && !isStockUnavailable && !variantNotFound && availableStock > 0 && qty <= Math.max(availableStock, 1);
  const LOW_STOCK_THRESHOLD = 5;

  // ── Gallery images ──
  const galleryImages = useMemo(() => {
    const dedupe = (arr) => [...new Set(arr)];
    if (matchedVariant && Array.isArray(matchedVariant.images) && matchedVariant.images.length > 0) {
      return dedupe(matchedVariant.images.map(img => getImageUrl(img)));
    }
    if (selectedColor && variantsList.length > 0) {
      const colorVariants = variantsList.filter(v => (v.attributes || {}).color === selectedColor);
      const variantImages = colorVariants.flatMap(v => (Array.isArray(v.images) ? v.images : [])).filter(Boolean);
      if (variantImages.length > 0) return dedupe(variantImages.map(img => getImageUrl(img)));
    }
    const images = getProductImages(product || {});
    const urls = images.length > 0 ? images.map(img => getImageUrl(img)) : [getImageUrl(product?.imageUrl || product?.image || '')];
    return dedupe(urls);
  }, [product, matchedVariant, selectedColor, variantsList]);

  // ── Pricing ──
  const effectivePrice = matchedVariant?.price != null ? matchedVariant.price : product?.price || 0;
  const effectiveOldPrice = product?.oldPrice || null;
  const discount = effectiveOldPrice ? Math.round(((effectiveOldPrice - effectivePrice) / effectiveOldPrice) * 100) : null;
  const inWishlist = isInWishlist(product?.id);

  // ── Sticky bar ──
  useEffect(() => {
    const el = sentinelRef.current;
    let wasEverVisible = false;
    const timers = [];
    setShowStickyBar(false);
    const checkPosition = () => {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        wasEverVisible = true;
        setShowStickyBar(false);
      } else if (rect.bottom <= 0 && wasEverVisible) {
        setShowStickyBar(true);
      }
    };
    timers.push(setTimeout(() => checkPosition(), 0));
    timers.push(setTimeout(() => checkPosition(), 500));
    timers.push(setTimeout(() => checkPosition(), 1500));
    window.addEventListener('scroll', checkPosition, { passive: true });
    window.addEventListener('resize', checkPosition, { passive: true });
    return () => {
      timers.forEach(t => clearTimeout(t));
      window.removeEventListener('scroll', checkPosition);
      window.removeEventListener('resize', checkPosition);
      setShowStickyBar(false);
    };
  }, [product]);

  // ── Handlers ──
  const scrollToOffers = useCallback(() => {
    if (window.innerWidth >= 1024) return;
    requestAnimationFrame(() => offersRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }));
  }, []);

  const handleAddToCart = async () => {
    if (isAddingToCart || !canAddToCart) return;
    setIsAddingToCart(true);
    trackAddToCart(product.id, product.name, qty, effectivePrice);
    try {
      addItem({ ...product, productId: product.id, quantity: qty, size: selectedSize, color: selectedColor, variantId: matchedVariant?.id || undefined });
      if (!isAuthenticated) { openCart(); return; }
      await cartAPI.add({ productId: product.id, quantity: qty, size: selectedSize || undefined, color: selectedColor || undefined, variantId: matchedVariant?.id || undefined });
      openCart();
    } catch { openCart(); }
    finally { setIsAddingToCart(false); }
  };

  const handleBuyNow = async () => {
    if (!canAddToCart || isAddingToCart) return;
    setIsAddingToCart(true);
    try {
      addItem({ ...product, productId: product.id, quantity: qty, size: selectedSize, color: selectedColor, variantId: matchedVariant?.id || undefined });
      if (!isAuthenticated) { navigate('/checkout'); return; }
      await cartAPI.add({ productId: product.id, quantity: qty, size: selectedSize || undefined, color: selectedColor || undefined, variantId: matchedVariant?.id || undefined });
      navigate('/checkout');
    } catch { navigate('/checkout'); }
    finally { setIsAddingToCart(false); }
  };

  const handleWishlist = async () => {
    if (inWishlist) removeFromWL(product.id);
    else addToWL(product);
    if (!isAuthenticated) {
      inWishlist ? removedFromWishlist() : addedToWishlist();
      return;
    }
    try {
      if (inWishlist) { await wishlistAPI.remove(product.id); removedFromWishlist(); }
      else { await wishlistAPI.add({ productId: product.id }); addedToWishlist(); }
    } catch {
      inWishlist ? addToWL(product) : removeFromWL(product.id);
      wishlistError();
    }
  };

  const handleShare = useCallback(async () => {
    const url = window.location.href;
    const title = product?.name || 'Check this out';
    if (navigator.share) {
      try { await navigator.share({ title, url, text: `Check out ${title} at ${storeName}` }); } catch {}
    } else {
      try { await navigator.clipboard.writeText(url); linkCopied(); } catch {}
    }
  }, [product, storeName]);

  const handleReviewSubmitted = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['product-reviews', product?.id] });
  }, [queryClient, product?.id]);

  const toggleAccordion = (section) => setOpenAccordion(openAccordion === section ? '' : section);

  const formatRating = useCallback((rating, fallback = '4.8') => {
    if (rating == null) return fallback;
    const num = Number(rating);
    return !isNaN(num) ? num.toFixed(1) : fallback;
  }, []);

  const reviewDistribution = useMemo(() => calcStarDistribution(reviews), [reviews]);
  const avgRating = useMemo(() => {
    if (!reviews.length) return 0;
    return reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  }, [reviews]);

  /* ═══════════════════════════════════════
     LOADING STATE
     ═══════════════════════════════════════ */
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          <div>
            <div className="w-full aspect-[3/4] bg-stone-100 rounded-2xl skeleton-pulse" />
            <div className="flex gap-2 mt-3">
              {[1,2,3,4].map(i => (
                <div key={i} className="w-16 h-16 bg-stone-100 rounded-xl skeleton-pulse" />
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <div className="h-4 w-24 bg-stone-100 rounded skeleton-pulse" />
            <div className="h-8 w-3/4 bg-stone-100 rounded-lg skeleton-pulse" />
            <div className="h-5 w-1/2 bg-stone-100 rounded skeleton-pulse" />
            <div className="h-10 w-40 bg-stone-100 rounded-xl skeleton-pulse" />
            <div className="h-4 w-3/5 bg-stone-100 rounded skeleton-pulse" />
            <div className="h-4 w-2/5 bg-stone-100 rounded skeleton-pulse" />
            <div className="h-12 w-full bg-stone-100 rounded-xl skeleton-pulse" />
            <div className="h-12 w-full bg-stone-100 rounded-xl skeleton-pulse" />
            <div className="h-32 w-full bg-stone-100 rounded-xl skeleton-pulse" />
          </div>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════
     NOT FOUND STATE
     ═══════════════════════════════════════ */
  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-stone-100 flex items-center justify-center">
            <X size={28} className="text-stone-400" strokeWidth={1.5} />
          </div>
          <h2 className="text-2xl font-black text-stone-900 mb-2">Not Found</h2>
          <p className="text-sm text-stone-500 leading-relaxed mb-6">
            This product doesn't exist or has been removed.
          </p>
          <button
            onClick={() => navigate('/products')}
            className="bg-ink hover:bg-gold hover:text-ink text-white text-xs font-semibold uppercase tracking-[0.16em] px-8 py-3.5 rounded-full transition-all shadow-sm hover:shadow-md"
          >
            Browse Products
          </button>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════
     RENDER
     ═══════════════════════════════════════ */
  const firstImage = galleryImages[0] || '';

  return (
    <div className="min-h-screen bg-white" style={{ paddingBottom: showStickyBar ? 76 : 0 }}>
      {/* SEO */}
      <SEOHead
        title={seoMeta?.metaTitle || `${product.name} — ${storeName}`}
        description={seoMeta?.metaDescription || product.seoDescription || product.shortDescription || product.description}
        keywords={seoMeta?.metaKeywords || product.seoKeywords || ''}
        image={seoMeta?.ogImage || firstImage}
        ogTitle={seoMeta?.ogTitle}
        ogDescription={seoMeta?.ogDescription}
        canonicalUrl={seoMeta?.canonicalUrl || `${window.location.origin}/products/${product.slug || product.id}`}
      />

      <style>{`
        @keyframes skeleton-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .skeleton-pulse {
          animation: skeleton-pulse 1.5s ease-in-out infinite;
        }
        /* ── Floating Product Video ── */
        .fpv-bubble {
          position: fixed;
          left: 20px;
          bottom: 24px;
          z-index: 70;
          width: 68px;
          aspect-ratio: 9 / 16;
          border-radius: 18px;
          padding: 0;
          border: none;
          background: #141416;
          cursor: grab;
          touch-action: none;
          user-select: none;
          -webkit-user-select: none;
          box-shadow: 0 10px 30px rgba(0,0,0,0.35), 0 0 0 2px rgba(255,255,255,0.92), 0 0 0 3.5px rgba(0,0,0,0.16);
          transition: box-shadow 0.25s ease, transform 0.25s ease, opacity 0.25s ease;
          animation: fpv-bubble-in 0.7s cubic-bezier(0.22, 1, 0.36, 1) 0.6s backwards;
        }
        .fpv-bubble:hover {
          box-shadow: 0 14px 38px rgba(0,0,0,0.4), 0 0 0 2px rgba(255,255,255,0.92), 0 0 0 3.5px rgba(0,0,0,0.16);
          transform: scale(1.05);
        }
        .fpv-bubble:active {
          transform: scale(0.97);
          cursor: grabbing;
        }
        .fpv-bubble-dragging {
          cursor: grabbing;
          transform: scale(1.06);
          box-shadow: 0 18px 44px rgba(0,0,0,0.45), 0 0 0 2px rgba(255,255,255,0.92), 0 0 0 3.5px rgba(0,0,0,0.16);
          transition: box-shadow 0.15s ease;
        }
        .fpv-bubble-hidden {
          opacity: 0;
          pointer-events: none;
        }
        @keyframes fpv-bubble-in {
          0% { opacity: 0; transform: translateY(20px) scale(0.5); }
          60% { opacity: 1; transform: translateY(-3px) scale(1.06); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .fpv-ring {
          position: absolute;
          inset: -6px;
          border-radius: 22px;
          border: 2px solid rgba(255,255,255,0.5);
          animation: fpv-ring 2.4s ease-out infinite;
          pointer-events: none;
        }
        .fpv-ring-delay { animation-delay: 1.2s; }
        @keyframes fpv-ring {
          0% { transform: scale(0.95); opacity: 0.8; }
          100% { transform: scale(1.25); opacity: 0; }
        }
        .fpv-bubble-media {
          position: absolute;
          inset: 0;
          border-radius: 18px;
          overflow: hidden;
          background: #000;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .fpv-bubble-video {
          width: 100%;
          height: 100%;
          object-fit: cover;
          pointer-events: none;
        }
        .fpv-bubble-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .fpv-bubble-fallback {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(20,20,22,0.45);
        }
        .fpv-bubble-play {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0,0,0,0.25);
        }
        .fpv-bubble-badge {
          position: absolute;
          right: 6px;
          bottom: 6px;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #ffffff;
          color: #000;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 10px rgba(0,0,0,0.35);
          z-index: 2;
          transition: transform 0.2s ease;
        }
        .fpv-bubble:hover .fpv-bubble-badge { transform: scale(1.12); }
        .fpv-reels-tag {
          position: absolute;
          top: 6px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 3;
          font-family: 'Space Grotesk', sans-serif;
          font-size: 6.5px;
          font-weight: 800;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #fff;
          background: rgba(0,0,0,0.45);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          border: 1px solid rgba(255,255,255,0.25);
          padding: 2px 7px;
          border-radius: 999px;
          pointer-events: none;
          white-space: nowrap;
        }
        .fpv-dismiss-btn {
          position: absolute;
          top: 4px;
          right: 4px;
          z-index: 4;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: none;
          background: rgba(0,0,0,0.55);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          padding: 0;
          transition: background 0.2s ease, transform 0.2s ease, opacity 0.2s ease;
        }
        .fpv-dismiss-btn:hover {
          background: rgba(0,0,0,0.85);
          transform: scale(1.1);
        }
        .floating-video-panel {
          position: fixed;
          left: 20px;
          bottom: 88px;
          z-index: 71;
          width: min(220px, calc(100vw - 32px));
          max-height: calc(100vh - 96px);
          display: flex;
          flex-direction: column;
          background: #141416;
          color: #fff;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 24px 60px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.08);
        }
        .floating-video-panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 10px 12px;
          border-bottom: 1px solid rgba(255,255,255,0.08);
          font-family: 'Space Grotesk', sans-serif;
          flex-shrink: 0;
          cursor: grab;
          touch-action: none;
          user-select: none;
          -webkit-user-select: none;
        }
        .floating-video-panel-header.fpv-header-dragging,
        .floating-video-panel-header:active { cursor: grabbing; }
        .floating-video-panel-body {
          flex: 1 1 auto;
          min-height: 0;
          aspect-ratio: 9 / 16;
          width: 100%;
          max-height: calc(100vh - 150px);
          background: #000;
        }
        .fpv-header-link { color: rgba(255,255,255,0.75); transition: color 0.2s; }
        .fpv-header-link:hover { color: #ffffff; }
        .fpv-close-btn {
          background: rgba(255,255,255,0.12);
          border: none;
          color: #fff;
          width: 28px;
          height: 28px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.2s;
        }
        .fpv-close-btn:hover { background: rgba(255,255,255,0.25); }
        @media (max-width: 767px) {
          .fpv-bubble {
            left: 14px;
            bottom: 92px;
            width: 54px;
          }
          .floating-video-panel {
            left: 12px;
            bottom: 150px;
            width: min(280px, calc(100vw - 24px));
            max-height: calc(100vh - 160px);
          }
          .floating-video-panel-body {
            max-height: calc(100vh - 215px);
          }
        }
      `}</style>

      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 pt-4 pb-0">
        <nav className="flex items-center gap-1.5 text-xs text-stone-400 tracking-wide overflow-x-auto whitespace-nowrap scrollbar-none">
          <a href="/" className="hover:text-gold-dark transition-colors">Home</a>
          <span className="text-stone-300">/</span>
          <a
            href={typeof product.category === 'object' && product.category.slug ? `/products?category=${product.category.slug}` : '/products'}
            className="hover:text-gold-dark transition-colors"
          >
            {typeof product.category === 'object' ? product.category.name : product.category || 'Products'}
          </a>
          <span className="text-stone-300">/</span>
          <span className="text-stone-600 font-medium truncate max-w-[200px]">{product.name}</span>
        </nav>
      </div>

      {/* ═══ MAIN LAYOUT ═══ */}
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-0 lg:gap-10 lg:py-6 lg:pb-10">

        {/* ─── GALLERY COLUMN ─── */}
        <div className="lg:sticky lg:top-28 self-start">
          <div className="relative">
            {/* Main Image */}
            <div
              className="relative bg-cream rounded-3xl overflow-hidden cursor-zoom-in shadow-[0_2px_12px_rgba(28,25,23,0.06)]"
              onClick={() => { setGalleryLightboxIdx(selectedImageIdx); setGalleryLightboxOpen(true); }}
            >
              <img
                src={galleryImages[selectedImageIdx] || firstImage}
                alt={product.name}
                className="w-full aspect-[4/5] sm:aspect-[3/4] object-cover transition-transform duration-500 hover:scale-105"
              />

              {/* Discount Badge */}
              {discount && (
                <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
                  <span className="bg-ink/80 backdrop-blur-sm text-white text-[10px] font-medium tracking-[0.14em] px-2.5 py-1 rounded-full shadow-md">
                    {discount}% OFF
                  </span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="absolute top-3 right-3 z-10 flex flex-col gap-2">
                <button
                  className={`w-9 h-9 rounded-full backdrop-blur-md transition-all shadow-md flex items-center justify-center ${
                    inWishlist
                      ? 'bg-rose-500 text-white scale-105'
                      : 'bg-white/90 hover:bg-white text-stone-600 hover:text-rose-500 hover:scale-110'
                  }`}
                  onClick={(e) => { e.stopPropagation(); handleWishlist(); }}
                  title="Wishlist"
                >
                  <Heart size={16} strokeWidth={1.5} className={inWishlist ? 'fill-current' : ''} />
                </button>
                <button
                  className="w-9 h-9 rounded-full bg-white/90 hover:bg-white text-stone-600 hover:text-gold-dark backdrop-blur-md transition-all shadow-md hover:scale-110 flex items-center justify-center"
                  onClick={(e) => { e.stopPropagation(); handleShare(); }}
                  title="Share"
                >
                  <Share2 size={16} strokeWidth={1.5} />
                </button>
              </div>

              {/* Image Counter */}
              <div className="absolute bottom-3 right-3 z-10 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-md tracking-wide">
                {selectedImageIdx + 1} / {galleryImages.length}
              </div>
            </div>

            {/* Thumbnails */}
            {galleryImages.length > 1 && (
              <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-none pb-1">
                {galleryImages.map((src, i) => (
                  <button
                    key={i}
                    className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                      i === selectedImageIdx
                        ? 'border-gold opacity-100 shadow-md'
                        : 'border-stone-200 opacity-60 hover:opacity-85'
                    }`}
                    onClick={() => {
                      setSelectedImageIdx(i);
                      mobileGalleryRef.current?.children[i]?.scrollIntoView({ behavior: 'smooth', inline: 'start' });
                    }}
                  >
                    <img src={src} alt="" loading="lazy" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ─── INFO COLUMN ─── */}
        <div className="pt-4 lg:pt-0">
          <div className="space-y-0">

            {/* Brand & Category */}
            <div className="inline-flex items-center gap-2.5 text-[11px] sm:text-xs font-medium uppercase tracking-[0.28em] text-gold-dark mb-1">
              <span className="w-10 h-px bg-gold" />
              {typeof product.category === 'object' ? product.category.name : product.category || 'Premium Collection'}
            </div>

            {/* Product Title */}
            <h1 className="font-editorial text-3xl md:text-4xl lg:text-5xl font-medium text-ink tracking-tight leading-[1.1] mb-3">
              {product.name}
            </h1>

            {/* Rating Row */}
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={14}
                    fill={i < Math.floor(product.rating ?? 5) ? '#B08D4F' : 'none'}
                    color={i < Math.floor(product.rating ?? 5) ? '#B08D4F' : '#d6d3d1'}
                    strokeWidth={1}
                  />
                ))}
              </div>
              <span className="text-sm text-stone-500 font-medium">{formatRating(product.rating)}</span>
              {reviews.length > 0 && (
                <span
                  className="text-xs text-stone-400 underline cursor-pointer hover:text-gold-dark transition-colors"
                  onClick={() => {
                    document.getElementById('pd-reviews')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  {reviews.length} Reviews
                </span>
              )}
            </div>

            {/* Price Row */}
            {/* Price — clean premium light block (matches product-card pricing) */}
            <div className="mb-5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-2xl md:text-3xl font-semibold text-ink tracking-tight leading-none">
                  {formatPrice(effectivePrice)}
                </span>
                {effectiveOldPrice && (
                  <span className="text-xs md:text-sm text-stone-400 line-through font-medium">
                    {formatPrice(effectiveOldPrice)}
                  </span>
                )}
                {effectiveOldPrice && discount > 0 && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-ink text-white text-[10px] font-medium tracking-[0.12em]">
                    {discount}% off
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1.5 text-[11px]">
                {effectiveOldPrice && discount > 0 && (
                  <span className="font-semibold text-gold-dark">Save {formatPrice(effectiveOldPrice - effectivePrice)}</span>
                )}
                <span className="text-stone-400">inclusive of all taxes</span>
              </div>
            </div>

            {/* Flash Sale */}
            {activeFlashSale && activeFlashSale.endDate && (
              <div className="flex items-center gap-3 p-3 bg-rose-50 border border-rose-200 rounded-xl mb-4">
                <div className="w-9 h-9 rounded-full bg-rose-600 flex items-center justify-center text-white flex-shrink-0">
                  <Zap size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-rose-600 uppercase tracking-wide">Flash Sale</div>
                  <div className="text-[11px] text-stone-500 mt-0.5">{activeFlashSale.title || 'Limited time offer'}</div>
                </div>
                <div className="flex-shrink-0">
                  <FlashSaleCountdown endDate={activeFlashSale.endDate} label="" compact />
                </div>
              </div>
            )}

            {/* Color Selection */}
            {product.colors?.length > 0 && (
              <div className="mb-5">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                    Color: <span className="text-stone-800 font-bold">{selectedColor || 'Select'}</span>
                  </span>
                </div>
                <div className="flex gap-2.5 flex-wrap">
                  {product.colors.map((c) => {
                    const isOOS = variantsList.length > 0 && !isColorAvailable(c);
                    const isActive = selectedColor === c;
                    return (
                      <button
                        key={c}
                        className={`w-9 h-9 rounded-full p-0.5 border-2 transition-all ${
                          isActive
                            ? 'border-stone-900 shadow-md scale-110'
                            : isOOS
                              ? 'border-stone-200 opacity-35 cursor-not-allowed'
                              : 'border-stone-200 hover:border-stone-500'
                        }`}
                        onClick={() => { if (isOOS) return; setSelectedColor(c); scrollToOffers(); }}
                        disabled={isOOS}
                        title={isOOS ? `${c} - Out of Stock` : c}
                      >
                        <span
                          className="block w-full h-full rounded-full border border-black/10 relative overflow-hidden"
                          style={{ background: getColorHex(c) }}
                        >
                          {isOOS && (
                            <span className="absolute inset-0 flex items-center justify-center">
                              <X size={12} color="#999" strokeWidth={2} />
                            </span>
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Size Selection */}
            {product.sizes?.length > 0 && (
              <div className="mb-5">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                    Size: <span className="text-stone-800 font-bold">{selectedSize || 'Select'}</span>
                  </span>
                  {isClothingProduct(product, settings) && (
                    <button
                      className="text-xs font-medium text-gold-dark bg-gold/10 border border-gold/20 px-3 py-1 rounded-full hover:bg-gold/15 transition-colors"
                      onClick={() => setShowSizeGuide(true)}
                    >
                      Size Guide
                    </button>
                  )}
                </div>
                <div className="flex gap-2 flex-wrap">
                  {product.sizes.map((s) => {
                    const isOOS = variantsList.length > 0 && !isSizeAvailable(s);
                    const isActive = selectedSize === s;
                    const isLow = getSizeStock(s) > 0 && getSizeStock(s) <= LOW_STOCK_THRESHOLD;
                    return (
                      <button
                        key={s}
                        className={`min-w-[44px] h-11 px-4 text-sm font-medium rounded-xl transition-all ${
                          isActive
                            ? 'bg-stone-900 border-stone-900 text-white shadow-sm'
                            : isOOS
                              ? 'border border-stone-200 text-stone-300 line-through cursor-not-allowed bg-stone-50'
                              : isLow
                                ? 'border border-gold bg-white text-stone-800 hover:border-stone-900'
                                : 'border border-stone-200 bg-white text-stone-800 hover:border-stone-900'
                        }`}
                        onClick={() => { if (isOOS) return; setSelectedSize(s); scrollToOffers(); }}
                        disabled={isOOS}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
                <div className="text-[11px] text-stone-400 mt-1.5">Runs true to size · Relaxed fit</div>
              </div>
            )}

            {/* Stock Status */}
            {!isStockUnavailable && (
              <div className="flex items-center gap-2 text-sm text-emerald-700 mb-4">
                <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                <span>{isLowStock ? `Only ${availableStock} left in stock` : 'In Stock'}</span>
              </div>
            )}
            {isStockUnavailable && (
              <div className="flex items-center gap-2 text-sm text-stone-400 mb-4">
                <span className="w-2 h-2 bg-stone-300 rounded-full" />
                <span>Currently Unavailable</span>
              </div>
            )}
            {variantNotFound && hasAllSelections && !isSimpleProduct && (
              <div className="flex items-center gap-2 text-xs text-rose-600 bg-rose-50 px-3 py-2 rounded-xl mb-3">
                <X size={14} /> This combination is not available. Please select a different option.
              </div>
            )}

            {/* Offers Section — only when backend has active sales */}
            <div ref={offersRef} className="mb-5">
              {hasActivePromotions && storeOffers.length > 0 && (
                <OffersSection promotions={storeOffers} />
              )}
              {getSetting('bundleOfferEnabled', 'true') !== 'false' && (
                <BundleOffer basePrice={effectivePrice} onSelectTier={(minQty) => setQty(minQty)} selectedQty={qty} isInStock={!isStockUnavailable} />
              )}
            </div>

            {/* CTA Section */}
            <div ref={sentinelRef} className="flex flex-col gap-3 mb-5">
              {!isStockUnavailable && (
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Qty</span>
                  <div className="flex items-center border border-stone-200 rounded-xl overflow-hidden">
                    <button
                      className="w-10 h-11 flex items-center justify-center text-stone-600 hover:bg-stone-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      onClick={() => setQty(Math.max(1, qty - 1))}
                      disabled={qty <= 1}
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-10 text-center text-sm font-semibold text-stone-800">{qty}</span>
                    <button
                      className="w-10 h-11 flex items-center justify-center text-stone-600 hover:bg-stone-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      onClick={() => setQty(qty + 1)}
                      disabled={qty >= Math.max(availableStock, 1)}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              )}
              <div className="flex gap-2.5">
                <button
                  className="flex-1 h-12 rounded-xl text-sm font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 bg-gold hover:bg-gold-soft text-ink shadow-md shadow-gold/20 hover:shadow-lg active:scale-[0.99] disabled:bg-stone-200 disabled:text-stone-400 disabled:cursor-not-allowed disabled:shadow-none"
                  onClick={handleAddToCart}
                  disabled={!canAddToCart || isAddingToCart}
                >
                  {isAddingToCart ? 'Adding...' : isStockUnavailable ? 'Out of Stock' : !hasAllSelections ? 'Select Options' : <><ShoppingBag size={16} /> Add to Cart</>}
                </button>
                <button
                  className="w-12 h-12 border border-stone-200 rounded-xl flex items-center justify-center bg-white text-stone-500 hover:border-rose-300 hover:text-rose-500 hover:bg-rose-50 transition-all"
                  onClick={handleWishlist}
                  title="Wishlist"
                >
                  <Heart size={18} strokeWidth={1.5} fill={inWishlist ? '#e11d48' : 'none'} color={inWishlist ? '#e11d48' : undefined} />
                </button>
                <button
                  className="w-12 h-12 border border-stone-200 rounded-full flex items-center justify-center bg-white text-stone-500 hover:border-gold/40 hover:text-gold-dark hover:bg-gold/5 transition-all"
                  onClick={handleShare}
                  title="Share"
                >
                  <Share2 size={18} strokeWidth={1.5} />
                </button>
              </div>
              <button
                className="w-full h-12 rounded-full text-xs font-semibold uppercase tracking-[0.16em] transition-all bg-ink text-white hover:bg-gold hover:text-ink active:scale-[0.99] disabled:bg-stone-200 disabled:text-stone-400 disabled:cursor-not-allowed disabled:shadow-none shadow-md"
                onClick={handleBuyNow}
                disabled={!canAddToCart || isAddingToCart}
              >
                Buy It Now
              </button>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { icon: Truck, label: 'Free Express Shipping', sub: `On orders above ${formatPrice(499)}` },
                { icon: RotateCcw, label: '7-Day Returns', sub: 'Hassle-free return policy' },
                { icon: ShieldCheck, label: 'Secure Checkout', sub: '100% protected payments' },
              ].map((item) => {
                const IconComp = item.icon;
                return (
                  <div key={item.label} className="flex items-start gap-3 p-3 rounded-2xl bg-cream border border-stone-100 transition-all hover:border-gold/30 hover:shadow-sm hover:-translate-y-0.5">
                    <div className="p-2.5 bg-white rounded-xl shadow-sm border border-stone-200 flex-shrink-0">
                      <IconComp size={16} className="text-gold-dark" strokeWidth={1.5} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-stone-900 mb-0.5">{item.label}</div>
                      <div className="text-[10px] text-stone-500 leading-snug">{item.sub}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Details Accordion */}
            <div className="border-t border-stone-200 mb-6">
              {/* Product Details */}
              <div className="border-b border-stone-200">
                <button
                  className="w-full flex items-center justify-between py-4 bg-transparent border-none cursor-pointer text-sm font-semibold text-stone-800 hover:text-gold-dark transition-colors"
                  onClick={() => toggleAccordion('details')}
                >
                  Product Details
                  <ChevronDown size={16} className={`text-stone-400 transition-transform duration-300 ${openAccordion === 'details' ? 'rotate-180' : ''}`} />
                </button>
                <div className={`overflow-hidden transition-all duration-350 ${openAccordion === 'details' ? 'max-h-[2000px] pb-5' : 'max-h-0'}`}>
                  <div className="text-sm text-stone-500 leading-relaxed space-y-2">
                    <p>{product.description || 'No description available.'}</p>
                    {product.shortDescription && <p>{product.shortDescription}</p>}
                  </div>
                  {product.attributes && Object.keys(product.attributes).length > 0 && (
                    <table className="w-full border-collapse mt-3">
                      <tbody>
                        {Object.entries(product.attributes).map(([key, val]) => (
                          <tr key={key} className="border-b border-stone-100">
                            <td className="py-2 pr-4 text-sm text-stone-500 font-medium w-[120px]">{key.charAt(0).toUpperCase() + key.slice(1)}</td>
                            <td className="py-2 text-sm text-stone-800">{val}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              {/* Shipping Info */}
              <div className="border-b border-stone-200">
                <button
                  className="w-full flex items-center justify-between py-4 bg-transparent border-none cursor-pointer text-sm font-semibold text-stone-800 hover:text-gold-dark transition-colors"
                  onClick={() => toggleAccordion('shipping')}
                >
                  Shipping & Returns
                  <ChevronDown size={16} className={`text-stone-400 transition-transform duration-300 ${openAccordion === 'shipping' ? 'rotate-180' : ''}`} />
                </button>
                <div className={`overflow-hidden transition-all duration-350 ${openAccordion === 'shipping' ? 'max-h-[2000px] pb-5' : 'max-h-0'}`}>
                  <div className="text-sm text-stone-500 leading-relaxed space-y-1.5">
                    <p>• Free shipping on orders above {formatPrice(499)}</p>
                    <p>• Standard delivery: 3-5 business days</p>
                    <p>• Easy 7-day return policy — no questions asked</p>
                    <p>• Cash on Delivery available</p>
                  </div>
                </div>
              </div>

              {/* Care Instructions */}
              <div className="border-b border-stone-200">
                <button
                  className="w-full flex items-center justify-between py-4 bg-transparent border-none cursor-pointer text-sm font-semibold text-stone-800 hover:text-gold-dark transition-colors"
                  onClick={() => toggleAccordion('care')}
                >
                  Care Instructions
                  <ChevronDown size={16} className={`text-stone-400 transition-transform duration-300 ${openAccordion === 'care' ? 'rotate-180' : ''}`} />
                </button>
                <div className={`overflow-hidden transition-all duration-350 ${openAccordion === 'care' ? 'max-h-[2000px] pb-5' : 'max-h-0'}`}>
                  <div className="text-sm text-stone-500 leading-relaxed space-y-1.5">
                    <p>• Machine wash cold with like colors</p>
                    <p>• Do not bleach</p>
                    <p>• Tumble dry low or hang to dry</p>
                    <p>• Iron on low heat if needed</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ═══ CUSTOMER REVIEWS SECTION ═══ */}
      <div className="max-w-7xl mx-auto px-4 py-8">
          <div id="pd-reviews" className="mb-8">
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <div>
              <span className="inline-flex items-center gap-2.5 text-[11px] sm:text-xs font-medium text-gold-dark uppercase tracking-[0.28em]">
                <span className="w-10 h-px bg-gold" />
                Customer Feedback
              </span>
              <h2 className="mt-3 font-editorial text-2xl sm:text-3xl font-medium text-ink tracking-tight leading-[1.1]">Customer Reviews ({reviews.length})</h2>
            </div>
            <div className="flex gap-2">
              {isAuthenticated && (
                <button
                  className="text-xs font-semibold px-4 py-2 rounded-full bg-ink hover:bg-gold hover:text-ink text-white transition-all shadow-sm"
                  onClick={() => setShowReviewModal(true)}
                >
                  Write a Review
                </button>
              )}
            </div>
          </div>

          {reviews.length > 0 ? (
            <>
              {/* Rating Summary */}
              <div className="flex gap-6 p-5 bg-cream border border-stone-200/70 rounded-2xl mb-5 items-center">
                <div className="text-center min-w-[100px]">
                  <div className="text-5xl font-editorial font-semibold text-ink leading-none">{avgRating.toFixed(1)}</div>
                  <div className="flex gap-0.5 justify-center my-1">
                    {[1,2,3,4,5].map(i => (
                      <Star key={i} size={14} fill={i <= Math.round(avgRating) ? '#B08D4F' : 'none'} color={i <= Math.round(avgRating) ? '#B08D4F' : '#d6d3d1'} strokeWidth={1} />
                    ))}
                  </div>
                  <div className="text-xs text-stone-400">{reviews.length} reviews</div>
                </div>
                <div className="flex-1 flex flex-col gap-1.5">
                  {[5,4,3,2,1].map(star => {
                    const count = reviewDistribution[star] || 0;
                    const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                    return (
                      <div key={star} className="flex items-center gap-2 text-xs text-stone-400">
                        <span className="w-4">{star}★</span>
                        <div className="flex-1 h-1.5 rounded-full bg-stone-100 overflow-hidden">
                          <div className="h-full rounded-full bg-gold transition-all duration-500" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="w-6 text-right font-medium">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Review Cards */}
              {reviews.slice(0, showAllReviews ? reviews.length : 5).map((review, idx) => {
                const initials = (review.name || 'A').charAt(0).toUpperCase();
                const colors = ['#e63946', '#457b9d', '#2a9d8f', '#f4a261', '#1d3557'];
                const avatarColor = colors[idx % colors.length];
                return (
                  <div
                    key={review.id || idx}
                    className="p-4 bg-white border border-stone-200/90 rounded-2xl mb-3 shadow-sm transition-all hover:shadow-md hover:border-stone-300"
                  >
                    <div className="flex items-center gap-2.5 mb-2.5">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm text-white flex-shrink-0"
                        style={{ background: avatarColor }}
                      >
                        {initials}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-stone-800">{review.name}</div>
                        <div className="text-[11px] text-stone-400">{review.date}</div>
                      </div>
                    </div>
                    <div className="flex gap-0.5 mb-2">
                      {[1,2,3,4,5].map(i => (
                        <Star key={i} size={12} fill={i <= review.rating ? '#B08D4F' : 'none'} color={i <= review.rating ? '#B08D4F' : '#d6d3d1'} strokeWidth={1} />
                      ))}
                    </div>
                    {review.title && <div className="text-sm font-semibold text-stone-800 mb-1">{review.title}</div>}
                    {review.comment && <div className="text-sm text-stone-500 leading-relaxed">{review.comment}</div>}
                    {review.isVerified && (
                      <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-semibold mt-2">
                        <CheckCircle size={12} /> Verified Purchase
                      </div>
                    )}
                    {review.product && (
                      <div className="inline-flex items-center gap-1 text-[11px] text-stone-400 bg-stone-50 px-2.5 py-1 rounded mt-2">
                        <ShoppingBag size={11} /> {review.product}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* View All / Show Less */}
              {reviews.length > 5 && (
                <button
                  className="w-full text-center text-xs font-semibold text-stone-700 bg-cream border border-stone-200/80 hover:bg-gold/10 hover:border-gold/30 hover:text-gold-dark rounded-full py-3 mt-2 transition-all"
                  onClick={() => setShowAllReviews(!showAllReviews)}
                >
                  {showAllReviews ? 'Show Less' : `View All ${reviews.length} Reviews`}
                </button>
              )}
            </>
          ) : (
            <div className="text-center py-10 text-stone-400">
              <Star size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm mb-3">No reviews yet. Be the first to review this product!</p>
              {isAuthenticated && (
                <button
                  className="text-xs font-semibold px-4 py-2 rounded-full bg-ink hover:bg-gold hover:text-ink text-white transition-all shadow-sm"
                  onClick={() => setShowReviewModal(true)}
                >
                  Write a Review
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ═══ RELATED PRODUCTS ═══ */}
      {relatedProducts.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="mb-10">
            <div className="flex items-center justify-between mb-5">
              <div>
                <span className="inline-flex items-center gap-2.5 text-[11px] sm:text-xs font-medium text-gold-dark uppercase tracking-[0.28em]">
                  <span className="w-10 h-px bg-gold" />
                  Customers Also Bought
                </span>
                <h2 className="mt-3 font-editorial text-2xl sm:text-3xl font-medium text-ink tracking-tight leading-[1.1]">You May Also Like</h2>
              </div>
              <button
                className="text-xs font-medium text-gold-dark hover:text-gold flex items-center gap-1 transition-all hover:gap-2"
                onClick={() => navigate('/products')}
              >
                View All <ArrowRight size={14} />
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-3 sm:gap-x-6 gap-y-7 sm:gap-y-10">
              {relatedProducts.slice(0, 4).map((prod) => (
                <ProductCard key={prod.id} product={prod} navigate={navigate} />
              ))}
            </div>
          </div>
        </div>
      )}


      {/* ═══ STICKY BOTTOM BAR ═══ */}
      <div className={`fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-stone-200 px-4 py-2.5 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] transition-transform duration-350 ${
        showStickyBar ? 'translate-y-0' : 'translate-y-full'
      }`}
        style={{ paddingBottom: 'max(10px, env(safe-area-inset-bottom, 10px))' }}
      >
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <img
            src={firstImage}
            alt=""
            className="w-11 h-11 rounded-xl object-cover border border-stone-200 flex-shrink-0 hidden md:block"
          />
          <div className="flex-1 min-w-0 hidden md:block">
            <div className="text-xs font-semibold text-stone-800 truncate">{product.name}</div>
            <div className="text-sm font-extrabold text-stone-950">{formatPrice(effectivePrice)}</div>
          </div>

          {/* Sticky Size Select */}
          {product.sizes?.length > 0 && (
            <div className="relative">
              <select
                className="h-9 text-xs font-medium rounded-xl border border-stone-200 bg-white text-stone-700 pl-2.5 pr-7 cursor-pointer appearance-none outline-none hover:border-stone-400 focus:border-gold transition-colors"
                value={selectedSize}
                onChange={(e) => setSelectedSize(e.target.value)}
              >
                <option value="">Size</option>
                {product.sizes.map(s => {
                  const isOOS = variantsList.length > 0 && !isSizeAvailable(s);
                  return (
                    <option key={s} value={s} disabled={isOOS}>
                      {s} {isOOS ? '(OOS)' : ''}
                    </option>
                  );
                })}
              </select>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                <ChevronDown size={12} className="text-stone-400" />
              </div>
            </div>
          )}

          {/* Sticky Color Select */}
          {product.colors?.length > 0 && (
            <div className="relative">
              <select
                className="h-9 text-xs font-medium rounded-xl border border-stone-200 bg-white text-stone-700 pl-2.5 pr-7 cursor-pointer appearance-none outline-none hover:border-stone-400 focus:border-gold transition-colors"
                value={selectedColor}
                onChange={(e) => setSelectedColor(e.target.value)}
              >
                <option value="">Color</option>
                {product.colors.map(c => {
                  const isOOS = variantsList.length > 0 && !isColorAvailable(c);
                  return (
                    <option key={c} value={c} disabled={isOOS}>
                      {c} {isOOS ? '(OOS)' : ''}
                    </option>
                  );
                })}
              </select>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                <ChevronDown size={12} className="text-stone-400" />
              </div>
            </div>
          )}

          <button
            className="h-10 px-6 rounded-full text-xs font-semibold uppercase tracking-[0.14em] transition-all bg-gold hover:bg-gold-soft text-ink shadow-md shadow-gold/20 whitespace-nowrap disabled:bg-stone-200 disabled:text-stone-400 disabled:cursor-not-allowed disabled:shadow-none"
            onClick={handleAddToCart}
            disabled={!canAddToCart || isAddingToCart}
          >
            {isAddingToCart ? 'Adding...' : isStockUnavailable ? 'Sold Out' : !hasAllSelections ? 'Select' : 'Add to Bag'}
          </button>
        </div>
      </div>

      {/* ═══ FOMO NOTIFICATION ═══ */}
      <AnimatePresence>
        {recentPurchase && (
          <motion.div
            className="fixed bottom-20 left-4 z-50 max-w-xs"
            initial={{ opacity: 0, y: 40, x: -20 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: 20, x: -20 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex items-center gap-2.5 px-4 py-3 bg-stone-900 rounded-2xl text-white shadow-xl">
              <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0">
                <ShoppingBag size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold">{recentPurchase.name}</div>
                <div className="text-[10px] opacity-70 mt-0.5">Purchased from {recentPurchase.city} recently</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ MODALS ═══ */}
      {showSizeGuide && isClothingProduct(product, settings) && <SizeGuideModal onClose={() => setShowSizeGuide(false)} />}

      {showReviewModal && (
        <ReviewFormModal
          productId={product.id}
          isOpen={showReviewModal}
          onClose={() => setShowReviewModal(false)}
          onSuccess={handleReviewSubmitted}
        />
      )}

      {/* ═══ LIGHTBOX ═══ */}
      {galleryLightboxOpen && (
        <div className="fixed inset-0 z-[1000] bg-black/92 flex items-center justify-center" onClick={() => setGalleryLightboxOpen(false)}>
          <button
            className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all"
            onClick={() => setGalleryLightboxOpen(false)}
          >
            <X size={20} />
          </button>

          {galleryImages.length > 1 && (
            <>
              <button
                className="absolute top-1/2 -translate-y-1/2 left-5 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all"
                onClick={(e) => {
                  e.stopPropagation();
                  setGalleryLightboxIdx(prev => (prev - 1 + galleryImages.length) % galleryImages.length);
                }}
              >
                <ChevronLeft size={20} />
              </button>
              <button
                className="absolute top-1/2 -translate-y-1/2 right-5 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all"
                onClick={(e) => {
                  e.stopPropagation();
                  setGalleryLightboxIdx(prev => (prev + 1) % galleryImages.length);
                }}
              >
                <ChevronRight size={20} />
              </button>
            </>
          )}

          <img
            src={galleryImages[galleryLightboxIdx]}
            alt=""
            className="max-w-[90vw] max-h-[90vh] object-contain cursor-default"
            onClick={(e) => e.stopPropagation()}
          />

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/60 text-sm tracking-wide">
            {galleryLightboxIdx + 1} / {galleryImages.length}
          </div>
        </div>
      )}

      {/* Floating product video player (only when admin uploaded a video) */}
      <FloatingProductVideo key={product.id} product={product} poster={galleryImages[0]} />
    </div>
  );
}

/* ════════════════════════════════════════ */
/* Floating Product Video Player          */
/* ════════════════════════════════════════ */
function FloatingProductVideo({ product, poster }) {
  const [open, setOpen] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [dragging, setDragging] = useState(false);
  // Dismissal is session-only (in memory): it hides the bubble for the current
  // page view only, so refreshing the page brings it back.
  const [dismissed, setDismissed] = useState(false);
  const bubbleRef = useRef(null);
  const previewVideoRef = useRef(null);
  const dragState = useRef(null);
  const wasDragRef = useRef(false);
  const panelRef = useRef(null);
  const panelRootRef = useRef(null);
  const panelDragState = useRef(null);
  const [panelDragging, setPanelDragging] = useState(false);
  const [panelPos, setPanelPos] = useState(null);
  const videoUrl = product?.videoUrl || product?.video_url;

  // Keep the preview video muted so browsers allow autoplay
  useEffect(() => {
    if (previewVideoRef.current) previewVideoRef.current.muted = true;
  }, [videoUrl]);

  // Close the player on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setOpen(false);
        previewVideoRef.current?.play().catch(() => {});
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  // YouTube / Vimeo embed detection (external links open in a new tab)
  const youTubeId = (() => {
    if (!videoUrl) return null;
    const m = videoUrl.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
    return m?.[1] || null;
  })();
  const vimeoId = (() => {
    if (!videoUrl) return null;
    const m = videoUrl.match(/vimeo\.com\/(\d+)/);
    return m?.[1] || null;
  })();
  const isExternalEmbed = Boolean(youTubeId || vimeoId);
  const embedSrc = youTubeId
    ? `https://www.youtube.com/embed/${youTubeId}?autoplay=1&rel=0`
    : vimeoId
      ? `https://player.vimeo.com/video/${vimeoId}?autoplay=1`
      : null;

  if (!videoUrl || dismissed) return null;

  const openPlayer = () => {
    setVideoError(false);
    setOpen(true);
    previewVideoRef.current?.pause();
  };

  const closePlayer = () => {
    setOpen(false);
    previewVideoRef.current?.play().catch(() => {});
  };

  const dismissVideo = () => {
    setDismissed(true);
  };

  // ── Drag & drop the bubble ──
  const onPointerDown = (e) => {
    if (e.button !== 0) return;
    wasDragRef.current = false;
    const el = bubbleRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    dragState.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      baseLeft: rect.left,
      baseTop: rect.top,
    };
    el.setPointerCapture(e.pointerId);
    // Drop the hover/entrance transform so the grab scale doesn't pop mid-drag
    el.style.transform = 'none';
    setDragging(true);
  };

  const onPointerMove = (e) => {
    const st = dragState.current;
    const el = bubbleRef.current;
    if (!st || !el || st.pointerId !== e.pointerId) return;
    const dx = e.clientX - st.startX;
    const dy = e.clientY - st.startY;
    if (Math.abs(dx) + Math.abs(dy) > 6) wasDragRef.current = true;
    if (!wasDragRef.current) return;
    el.style.left = `${st.baseLeft + dx}px`;
    el.style.top = `${st.baseTop + dy}px`;
    el.style.right = 'auto';
  };

  const onPointerUp = () => {
    const st = dragState.current;
    const el = bubbleRef.current;
    dragState.current = null;
    setDragging(false);
    if (!st || !el) return;
    // A plain click (no drag) must not re-position the bubble
    if (!wasDragRef.current) {
      el.style.transform = '';
      return;
    }
    const rect = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const w = rect.width;
    const h = rect.height;
    const top = Math.min(Math.max(rect.top, 12), vh - h - 12);
    const snapToLeft = rect.left + w / 2 < vw / 2;
    el.style.transition = 'left 0.3s cubic-bezier(0.22, 1, 0.36, 1), top 0.3s cubic-bezier(0.22, 1, 0.36, 1)';
    el.style.left = snapToLeft ? '14px' : `${vw - w - 14}px`;
    el.style.right = 'auto';
    el.style.top = `${top}px`;
    // Restore hover scaling now that dragging is done
    el.style.transform = '';
    window.setTimeout(() => { if (el) el.style.transition = ''; }, 320);
  };

  // ── Drag & drop the player panel (grab the header) ──
  const onPanelPointerDown = (e) => {
    if (e.button !== 0) return;
    const el = panelRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    panelDragState.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      baseLeft: rect.left,
      baseTop: rect.top,
    };
    el.setPointerCapture(e.pointerId);
    setPanelDragging(true);
  };

  const onPanelPointerMove = (e) => {
    const st = panelDragState.current;
    const el = panelRef.current;
    if (!st || !el || st.pointerId !== e.pointerId) return;
    const dx = e.clientX - st.startX;
    const dy = e.clientY - st.startY;
    if (Math.abs(dx) + Math.abs(dy) < 3) return;
    const rootRect = (panelRootRef.current || el).getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const left = Math.min(Math.max(st.baseLeft + dx, 8), Math.max(8, vw - rootRect.width - 8));
    const top = Math.min(Math.max(st.baseTop + dy, 8), Math.max(8, vh - rootRect.height - 8));
    setPanelPos({ left, top });
  };

  const onPanelPointerUp = () => {
    panelDragState.current = null;
    setPanelDragging(false);
  };

  const handleBubbleClick = () => {
    if (wasDragRef.current) { wasDragRef.current = false; return; }
    openPlayer();
  };

  return (
    <>
      {/* Floating video bubble — live muted preview, draggable, click to expand */}
      <div
        ref={bubbleRef}
        className={`fpv-bubble${dragging ? ' fpv-bubble-dragging' : ''}${open ? ' fpv-bubble-hidden' : ''}`}
        role="button"
        tabIndex={0}
        aria-label="Watch product video"
        onClick={handleBubbleClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openPlayer(); }
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <span className="fpv-ring" />
        <span className="fpv-ring fpv-ring-delay" />
        <span className="fpv-bubble-media">
          {isExternalEmbed || videoError ? (
            <span className="fpv-bubble-fallback">
              {poster ? <img src={poster} alt="" className="fpv-bubble-img" /> : null}
              <span className="fpv-bubble-play"><Play size={22} fill="#fff" /></span>
            </span>
          ) : (
            <video
              ref={previewVideoRef}
              src={getVideoUrl(videoUrl)}
              poster={poster || undefined}
              muted
              loop
              autoPlay
              playsInline
              preload="metadata"
              className="fpv-bubble-video"
              onError={() => setVideoError(true)}
            />
          )}
        </span>
        <span className="fpv-bubble-badge"><Play size={10} fill="#000" /></span>
        <span className="fpv-reels-tag">Reels</span>
        <button
          type="button"
          className="fpv-dismiss-btn"
          aria-label="Dismiss video preview"
          title="Dismiss video preview"
          onClick={(e) => { e.stopPropagation(); dismissVideo(); }}
          onPointerDown={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <X size={10} strokeWidth={2.5} />
        </button>
      </div>

      {/* Floating player panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 260, damping: 26 }}
            ref={panelRootRef}
            className="floating-video-panel"
            style={panelPos ? { left: `${panelPos.left}px`, top: `${panelPos.top}px`, right: 'auto', bottom: 'auto' } : undefined}
            role="dialog"
            aria-label="Product video player"
          >
            <div
              ref={panelRef}
              className={`floating-video-panel-header${panelDragging ? ' fpv-header-dragging' : ''}`}
              onPointerDown={onPanelPointerDown}
              onPointerMove={onPanelPointerMove}
              onPointerUp={onPanelPointerUp}
              onPointerCancel={onPanelPointerUp}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                <Volume2 size={14} strokeWidth={2} />
                <span style={{ fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {product?.name || 'Product Video'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {isExternalEmbed && (
                  <a
                    href={videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="fpv-header-link"
                    style={{ display: 'flex', alignItems: 'center', padding: 6, borderRadius: 8 }}
                    aria-label="Open video in new tab"
                    onPointerDown={(e) => e.stopPropagation()}
                  >
                    <ExternalLink size={15} />
                  </a>
                )}
                <button
                  onClick={closePlayer}
                  className="fpv-close-btn"
                  aria-label="Close video player"
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            <div className="floating-video-panel-body">
              {isExternalEmbed ? (
                <iframe
                  src={embedSrc}
                  title="Product video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{ width: '100%', height: '100%', border: 'none' }}
                />
              ) : videoError ? (
                <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'rgba(255,255,255,0.7)', padding: 24, textAlign: 'center' }}>
                  <X size={24} />
                  <p style={{ fontSize: 12, lineHeight: 1.5 }}>This video could not be played.</p>
                  <a
                    href={getVideoUrl(videoUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#fff', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', textDecoration: 'underline' }}
                  >
                    Open video instead
                  </a>
                </div>
              ) : (
                <video
                  src={getVideoUrl(videoUrl)}
                  poster={poster || undefined}
                  controls
                  autoPlay
                  playsInline
                  style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#000' }}
                  onError={() => setVideoError(true)}
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
