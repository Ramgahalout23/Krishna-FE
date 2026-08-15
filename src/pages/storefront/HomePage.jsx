import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useSettings } from '../../store/useSettings';
import { homepageAPI } from '../../api/homepage';
import '../../styles/omni.css';

import { X } from 'lucide-react';
import { getImageUrl } from '../../utils/formatters';
import HeroBanner from '../../components/omni/HeroBanner';
import FlashDeals from '../../components/omni/FlashDeals';
import CategoryGrid from '../../components/omni/CategoryGrid';
import ProductGrid from '../../components/omni/ProductGrid';
import CuratedCollection from '../../components/omni/CuratedCollection';
import Testimonials from '../../components/omni/Testimonials';
import TrustFeatures from '../../components/omni/TrustFeatures';
import QuickViewModal from '../../components/omni/QuickViewModal';

/* ── Skeleton Loading ── */
function HomepageSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-[300px] sm:h-[400px] bg-stone-200" />
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <div className="h-8 w-48 bg-stone-200 rounded-lg" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="space-y-3">
              <div className="aspect-square bg-stone-200 rounded-2xl" />
              <div className="h-4 w-3/4 bg-stone-200 rounded" />
              <div className="h-4 w-1/2 bg-stone-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Scroll Reveal ── */
function ScrollReveal({ children, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

/* ── Banner Card (standalone for performance) ── */
function BannerCard({ banner, onNavigate }) {
  const url = banner.imageUrl || banner.image || '';
  if (!url) return null;
  const imgUrl = getImageUrl(url);

  return (
    <div
      onClick={() => {
        if (banner.linkUrl && onNavigate) onNavigate(banner.linkUrl);
      }}
      className={`relative rounded-2xl overflow-hidden group cursor-pointer ${banner.linkUrl ? '' : 'cursor-default'}`}
    >
      <img
        src={imgUrl}
        alt={banner.title || 'Promotional banner'}
        className="w-full h-32 sm:h-40 lg:h-48 object-cover transition-transform duration-500 group-hover:scale-105"
        loading="lazy"
      />
      {/* Dark overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
      {/* Text content */}
      <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
        {banner.title && (
          <h3 className="text-white font-bold text-sm sm:text-base leading-tight drop-shadow-md">
            {banner.title}
          </h3>
        )}
        {banner.description && (
          <p className="text-white/80 text-xs sm:text-sm mt-0.5 line-clamp-1 drop-shadow-md">
            {banner.description}
          </p>
        )}
        {banner.buttonText && (
          <span className="inline-block mt-1.5 text-[10px] sm:text-xs font-semibold text-amber-400 uppercase tracking-wider drop-shadow-md">
            {banner.buttonText} →
          </span>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════
   HOMEPAGE — OmniStore Design
   ════════════════════════════════════════════════ */
export default function HomePage() {
  const navigate = useNavigate();
  const { getSetting } = useSettings();
  const [quickViewProduct, setQuickViewProduct] = useState(null);

  // Dynamic section titles from homepage data or settings
  const sectionTitles = {
    featured: getSetting('homepageFeaturedTitle', 'Featured Products'),
    featuredSubtitle: getSetting('homepageFeaturedSubtitle', 'Trending Now'),
    curated: getSetting('homepageCuratedTitle', 'Premium Picks'),
    curatedSubtitle: getSetting('homepageCuratedSubtitle', 'Curated Picks'),
    flashDealsTitle: getSetting('homepageFlashDealsTitle', 'Flash Deals of the Day'),
    flashDealsBadge: getSetting('homepageFlashDealsBadge', 'Limited Time Offers'),
    flashDealsDiscount: getSetting('homepageFlashDealsDiscount', 'Up to 40% OFF'),
    categoryTitle: getSetting('homepageCategoryTitle', 'Shop By Category'),
    categorySubtitle: getSetting('homepageCategorySubtitle', 'Curated Departments'),
    testimonialTitle: getSetting('homepageTestimonialTitle', 'Loved By Thousands of Happy Shoppers'),
    testimonialSubtitle: getSetting('homepageTestimonialSubtitle', 'Real Customer Feedback'),
  };

  // Fetch homepage data
  const { data: homepageRes, isLoading, error, refetch } = useQuery({
    queryKey: ['homepage'],
    queryFn: () => homepageAPI.getAll().then(r => r.data?.data || r.data || {}),
    staleTime: 60000,
    retry: 2,
  });

  // NOTE: Categories, reviews and promotions all ship inside the consolidated
  // /homepage response (server-side cached for 5 min), so no separate
  // requests are needed here — that removes 3 extra network round-trips.

  // ── Banners grouped by type ──
  // (The flat hero 'banners' key was removed from the API — use bannersByType.hero.)
  const banners = useMemo(() => {
    const b = homepageRes?.bannersByType?.hero || [];
    return Array.isArray(b) ? b.filter(bn => {
      if (typeof bn.isActive === 'boolean') return bn.isActive === true;
      if (typeof bn.isActive === 'number') return bn.isActive === 1;
      if (typeof bn.isActive === 'string') return bn.isActive === '1' || bn.isActive === 'true';
      return false;
    }) : [];
  }, [homepageRes?.bannersByType?.hero]);

  // Banners by type from the grouped API response
  const bannersByType = useMemo(() => {
    return homepageRes?.bannersByType || {};
  }, [homepageRes?.bannersByType]);

  // Specific banner groups
  const saleBanners = bannersByType['sale'] || [];
  const categoryBanners = bannersByType['category'] || [];
  const popupBanners = bannersByType['popup'] || [];
  const featuredBanners = bannersByType['featured'] || [];
  const newArrivalBanners = bannersByType['new_arrival'] || [];
  const [dismissedPopup, setDismissedPopup] = useState(false);
  const popupBanner = popupBanners.length > 0 && !dismissedPopup ? popupBanners[0] : null;

  const featured = useMemo(() => {
    const f = homepageRes?.featured || [];
    return Array.isArray(f) ? f.filter(p => p.status === 'PUBLISHED' || !p.status).slice(0, 12) : [];
  }, [homepageRes?.featured]);

  const newArrivals = useMemo(() => {
    const na = homepageRes?.newArrivals || [];
    return Array.isArray(na) ? na.filter(p => p.status === 'PUBLISHED' || !p.status).slice(0, 12) : [];
  }, [homepageRes?.newArrivals]);

  const categories = useMemo(() => {
    const all = homepageRes?.categories;
    return Array.isArray(all) ? all.slice(0, 6) : [];
  }, [homepageRes?.categories]);

  // All products combined
  const allProducts = useMemo(() => {
    const combined = [...featured, ...newArrivals];
    return combined.filter((p, i, arr) => arr.findIndex(x => x.id === p.id) === i);
  }, [featured, newArrivals]);

  // Reviews (from the consolidated homepage payload)
  const reviews = useMemo(() => {
    const data = homepageRes?.reviews || {};
    const list = Array.isArray(data.reviews) ? data.reviews : [];
    return list.slice(0, 3);
  }, [homepageRes?.reviews]);

  // Determine if there are active sales/promotions (from the homepage payload)
  const activePromotions = useMemo(() => {
    const promos = homepageRes?.promotions;
    return (Array.isArray(promos) ? promos : []).filter(p => {
      if (p.isActive === false) return false;
      if (p.status && p.status !== 'ACTIVE') return false;
      return true;
    });
  }, [homepageRes?.promotions]);

  const hasActiveSales = activePromotions.length > 0;

  // Flash deal products — only from products that are actual flash deals
  const flashDealProducts = useMemo(() => {
    return allProducts.filter((p) => p.isFlashDeal || p.discountPercentage || p.oldPrice);
  }, [allProducts]);

  const handleBannerNav = (linkUrl) => {
    if (linkUrl) navigate(linkUrl);
  };

  if (isLoading) return <HomepageSkeleton />;
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
        <span className="text-4xl mb-4">😕</span>
        <h2 className="text-xl font-bold text-stone-900 mb-2">Something went wrong</h2>
        <p className="text-sm text-stone-500 mb-6 max-w-md">{error?.message || 'Could not load the store.'}</p>
        <button onClick={() => refetch()} className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-full transition-colors">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900">
      {/* Hero Banner with Trust Strip */}
      <ScrollReveal>
        <HeroBanner banners={banners} hasActiveSales={hasActiveSales} />
      </ScrollReveal>

      {/* ── SALE Banners Strip ── */}
      {saleBanners.length > 0 && (
        <ScrollReveal delay={0.03}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {saleBanners.map((banner, idx) => (
                <BannerCard key={banner.id || idx} banner={banner} onNavigate={handleBannerNav} />
              ))}
            </div>
          </div>
        </ScrollReveal>
      )}

      {/* Flash Deals — only show when there are active sales from backend */}
      {hasActiveSales && flashDealProducts.length > 0 && (
        <ScrollReveal delay={0.05}>
          <FlashDeals
            products={flashDealProducts}
            onQuickView={(p) => setQuickViewProduct(p)}
            title={sectionTitles.flashDealsTitle}
            badge={sectionTitles.flashDealsBadge}
            discountLabel={sectionTitles.flashDealsDiscount}
          />
        </ScrollReveal>
      )}

      {/* ── FEATURED Banners Strip ── */}
      {featuredBanners.length > 0 && (
        <ScrollReveal delay={0.06}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {featuredBanners.map((banner, idx) => (
                <BannerCard key={banner.id || idx} banner={banner} onNavigate={handleBannerNav} />
              ))}
            </div>
          </div>
        </ScrollReveal>
      )}

      {/* Product Grid - Featured Products */}
      {allProducts.length > 0 && (
        <ScrollReveal delay={0.08}>
          <ProductGrid
            products={allProducts}
            title={sectionTitles.featured}
            subtitle={sectionTitles.featuredSubtitle}
            showHeader={true}
            onQuickView={(p) => setQuickViewProduct(p)}
          />
        </ScrollReveal>
      )}

      {/* ── CATEGORY Banners Strip ── */}
      {categoryBanners.length > 0 && (
        <ScrollReveal delay={0.095}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {categoryBanners.map((banner, idx) => (
                <BannerCard key={banner.id || idx} banner={banner} onNavigate={handleBannerNav} />
              ))}
            </div>
          </div>
        </ScrollReveal>
      )}

      {/* Shop By Category */}
      {categories.length > 0 && (
        <ScrollReveal delay={0.1}>
          <CategoryGrid
            categories={categories}
            onSelectCategory={(cat) => {
              if (cat === 'all') navigate('/products');
              else navigate(`/products?category=${cat}`);
            }}
            title={sectionTitles.categoryTitle}
            subtitle={sectionTitles.categorySubtitle}
          />
        </ScrollReveal>
      )}

      {/* ── NEW ARRIVAL Banners Strip ── */}
      {newArrivalBanners.length > 0 && (
        <ScrollReveal delay={0.11}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {newArrivalBanners.map((banner, idx) => (
                <BannerCard key={banner.id || idx} banner={banner} onNavigate={handleBannerNav} />
              ))}
            </div>
          </div>
        </ScrollReveal>
      )}

      {/* Curated Collection */}
      {allProducts.length > 0 && (
        <ScrollReveal delay={0.12}>
          <CuratedCollection
            products={allProducts}
            title={sectionTitles.curated}
            subtitle={sectionTitles.curatedSubtitle}
          />
        </ScrollReveal>
      )}

      {/* Customer Reviews */}
      <ScrollReveal delay={0.14}>
        <Testimonials
          reviews={reviews}
          title={sectionTitles.testimonialTitle}
          subtitle={sectionTitles.testimonialSubtitle}
        />
      </ScrollReveal>

      {/* Trust Features */}
      <ScrollReveal delay={0.16}>
        <TrustFeatures />
      </ScrollReveal>

      {/* Quick View Modal */}
      <QuickViewModal
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
      />

      {/* ── POPUP Banner Modal ── */}
      {popupBanner && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
          onClick={(e) => { if (e.target === e.currentTarget) setDismissedPopup(true); }}
        >
          <div className="relative max-w-lg w-full bg-white rounded-2xl overflow-hidden shadow-2xl">
            <button
              onClick={() => setDismissedPopup(true)}
              className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors"
              aria-label="Close popup"
            >
              <X size={16} />
            </button>
            <div
              onClick={() => {
                if (popupBanner.linkUrl) {
                  navigate(popupBanner.linkUrl);
                  setDismissedPopup(true);
                }
              }}
              className={`${popupBanner.linkUrl ? 'cursor-pointer' : ''}`}
            >
              <img
                src={getImageUrl(popupBanner.imageUrl || popupBanner.image || '')}
                alt={popupBanner.title || 'Special offer'}
                className="w-full h-auto max-h-[70vh] object-contain"
              />
              {(popupBanner.title || popupBanner.description) && (
                <div className="p-4 sm:p-6">
                  {popupBanner.title && (
                    <h3 className="text-lg font-bold text-stone-900">{popupBanner.title}</h3>
                  )}
                  {popupBanner.description && (
                    <p className="text-sm text-stone-600 mt-1">{popupBanner.description}</p>
                  )}
                  {popupBanner.buttonText && (
                    <button
                      onClick={() => {
                        if (popupBanner.linkUrl) {
                          navigate(popupBanner.linkUrl);
                          setDismissedPopup(true);
                        }
                      }}
                      className="mt-3 px-5 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs uppercase tracking-wider rounded-full transition-colors"
                    >
                      {popupBanner.buttonText}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
