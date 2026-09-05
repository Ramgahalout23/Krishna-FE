import { useState, useMemo, lazy, Suspense } from 'react';
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
import QuickViewModal from '../../components/omni/QuickViewModal';

// Below-the-fold sections — lazy-loaded so they never block first paint
const BrandStory = lazy(() => import('../../components/omni/BrandStory'));
const Testimonials = lazy(() => import('../../components/omni/Testimonials'));
// Heavy video-reel section — lazy-loaded so it never blocks first paint
const ReelsSection = lazy(() => import('../../components/storefront/ReelsSection'));

/* ── Skeleton Loading ── */
function HomepageSkeleton() {
  return (
    <div className="animate-pulse bg-cream">
      <div className="h-[300px] sm:h-[420px] bg-[#14110E]" />
      <div className="max-w-7xl mx-auto px-4 py-10 space-y-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-stone-200" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-3/4 bg-stone-200 rounded-full" />
                <div className="h-3 w-1/2 bg-stone-200 rounded-full" />
              </div>
            </div>
          ))}
        </div>
        <div className="h-3 w-28 bg-gold/30 rounded-full" />
        <div className="h-9 w-56 bg-stone-200 rounded-full" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="space-y-3">
              <div className="aspect-square bg-stone-200 rounded-2xl" />
              <div className="h-3 w-3/4 bg-stone-200 rounded-full" />
              <div className="h-3 w-1/2 bg-stone-200 rounded-full" />
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
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
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
      className={`relative rounded-2xl overflow-hidden group cursor-pointer bg-ink shadow-[0_2px_10px_rgba(28,25,23,0.08)] transition-all duration-400 hover:shadow-[0_18px_44px_-14px_rgba(28,25,23,0.3)] ${banner.linkUrl ? '' : 'cursor-default'}`}
    >
      <img
        src={imgUrl}
        alt={banner.title || 'Promotional banner'}
        className="w-full h-36 sm:h-44 lg:h-52 object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
        loading="lazy"
      />
      {/* Warm editorial overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#14110E]/85 via-[#14110E]/25 to-transparent" />
      {/* Text content */}
      <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5">
        {banner.title && (
          <h3 className="text-white font-medium text-sm sm:text-base leading-tight drop-shadow-md">
            {banner.title}
          </h3>
        )}
        {banner.description && (
          <p className="text-white/75 text-xs sm:text-sm mt-1 line-clamp-1 drop-shadow-md">
            {banner.description}
          </p>
        )}
        {banner.buttonText && (
          <span className="inline-flex items-center gap-1.5 mt-2 text-[10px] sm:text-[11px] font-medium text-gold-soft uppercase tracking-[0.2em] drop-shadow-md transition-colors duration-300 group-hover:text-white">
            {banner.buttonText} →
          </span>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════
   HOMEPAGE — THREVOLT Premium Editorial Structure
   Hero → Perks → Sale Offers → Featured → Categories
   → Flash Deals → Curated Collections → Best Sellers
   → Brand Story → Testimonials → Reels → Trust Strip
   ════════════════════════════════════════════════ */
export default function HomePage() {
  const navigate = useNavigate();
  const { getSetting } = useSettings();
  const [quickViewProduct, setQuickViewProduct] = useState(null);

  // Dynamic section titles from homepage data or settings
  const sectionTitles = {
    featured: getSetting('homepageFeaturedTitle', 'Featured Products'),
    featuredSubtitle: getSetting('homepageFeaturedSubtitle', 'Trending Now'),
    categoryTitle: getSetting('homepageCategoryTitle', 'Shop By Category'),
    categorySubtitle: getSetting('homepageCategorySubtitle', 'Curated Departments'),
    bestSellerTitle: getSetting('homepageBestSellerTitle', 'Best Sellers'),
    bestSellerSubtitle: getSetting('homepageBestSellerSubtitle', 'Most Viewed Picks'),
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
  const popupBanners = bannersByType['popup'] || [];
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

  // Best sellers — deduped against the featured/new-arrival grids so the
  // same product never appears twice on the page
  const bestSellers = useMemo(() => {
    const raw = homepageRes?.bestSellers || [];
    const list = Array.isArray(raw) ? raw.filter(p => p.status === 'PUBLISHED' || !p.status) : [];
    if (list.length === 0) return [];
    const seen = new Set(allProducts.map(p => p.id));
    const unique = list.filter(p => !seen.has(p.id)).slice(0, 8);
    // Fall back to the full list if deduping leaves too few cards
    return unique.length >= 4 ? unique : list.slice(0, 8);
  }, [homepageRes?.bestSellers, allProducts]);

  // Reviews (from the consolidated homepage payload)
  const reviews = useMemo(() => {
    const data = homepageRes?.reviews || {};
    const list = Array.isArray(data.reviews) ? data.reviews : [];
    return list.slice(0, 3);
  }, [homepageRes?.reviews]);

  // Reels — shoppable video reels (shipped inside the consolidated payload)
  const reelsEnabled = getSetting('reelsEnabled', 'true') !== 'false';
  const reels = useMemo(() => {
    const r = homepageRes?.reels;
    return Array.isArray(r) ? r : [];
  }, [homepageRes?.reels]);

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

  // Curated Collections — all remaining campaign banners merged into one
  // premium showcase (replaces the old scattered banner strips)
  const collectionBanners = useMemo(() => {
    const all = [
      ...(bannersByType['featured'] || []),
      ...(bannersByType['category'] || []),
      ...(bannersByType['new_arrival'] || []),
    ];
    const seen = new Set();
    return all.filter(b => {
      const key = b.id || b.imageUrl || b.title;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, 6);
  }, [bannersByType]);

  const handleBannerNav = (linkUrl) => {
    if (linkUrl) navigate(linkUrl);
  };

  if (isLoading) return <HomepageSkeleton />;
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 bg-cream">
        <span className="text-4xl mb-4">😕</span>
        <h2 className="text-xl font-medium text-ink mb-2">Something went wrong</h2>
        <p className="text-sm text-stone-500 mb-6 max-w-md">{error?.message || 'Could not load the store.'}</p>
        <button onClick={() => refetch()} className="px-7 py-3 bg-ink hover:bg-gold hover:text-ink text-white font-medium text-xs uppercase tracking-[0.18em] rounded-full transition-all duration-300">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream text-ink">
      {/* 1. Hero Banner */}
      <ScrollReveal>
        <HeroBanner banners={banners} hasActiveSales={hasActiveSales} />
      </ScrollReveal>

      {/* 2. Sale Offers — admin-controlled promotions */}
      {saleBanners.length > 0 && (
        <ScrollReveal delay={0.05}>
          <section className="py-8 sm:py-12 bg-white">
            <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
              <div className="mb-6 sm:mb-8">
                <span className="inline-flex items-center gap-3 text-[11px] sm:text-xs font-medium text-gold-dark uppercase tracking-[0.28em]">
                  <span className="w-8 h-px bg-gold" />
                  Today's Offers
                </span>
                <h2 className="mt-2 font-editorial text-2xl sm:text-3xl font-medium text-ink tracking-tight leading-[1.1]">
                  Deals Worth Grabbing
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                {saleBanners.map((banner, idx) => (
                  <BannerCard key={banner.id || idx} banner={banner} onNavigate={handleBannerNav} />
                ))}
              </div>
            </div>
          </section>
        </ScrollReveal>
      )}

      {/* 3. Featured Products */}
      {allProducts.length > 0 && (
        <ScrollReveal delay={0.06}>
          <ProductGrid
            products={allProducts}
            title={sectionTitles.featured}
            subtitle={sectionTitles.featuredSubtitle}
            showHeader={true}
            onQuickView={(p) => setQuickViewProduct(p)}
          />
        </ScrollReveal>
      )}

      {/* 4. Shop By Category */}
      {categories.length > 0 && (
        <ScrollReveal delay={0.08}>
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

      {/* 6. Flash Deals — dark highlight moment */}
      {hasActiveSales && flashDealProducts.length > 0 && (
        <ScrollReveal delay={0.1}>
          <FlashDeals
            products={flashDealProducts}
            onQuickView={(p) => setQuickViewProduct(p)}
            title={sectionTitles.flashDealsTitle}
            badge={sectionTitles.flashDealsBadge}
            discountLabel={sectionTitles.flashDealsDiscount}
          />
        </ScrollReveal>
      )}

      {/* 7. Curated Collections — one editorial showcase for all campaign banners */}
      {collectionBanners.length > 0 && (
        <ScrollReveal delay={0.12}>
          <section className="py-12 sm:py-20 bg-cream">
            <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
              <div className="mb-8 sm:mb-12 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                  <span className="inline-flex items-center gap-3 text-[11px] sm:text-xs font-medium text-gold-dark uppercase tracking-[0.28em]">
                    <span className="w-10 h-px bg-gold" />
                    Curated Collections
                  </span>
                  <h2 className="mt-3 font-editorial text-3xl sm:text-4xl lg:text-5xl font-medium text-ink tracking-tight leading-[1.1]">
                    Explore the Collection
                  </h2>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {collectionBanners.map((banner, idx) => (
                  <BannerCard key={banner.id || idx} banner={banner} onNavigate={handleBannerNav} />
                ))}
              </div>
            </div>
          </section>
        </ScrollReveal>
      )}

      {/* 8. Best Sellers */}
      {bestSellers.length > 0 && (
        <ScrollReveal delay={0.14}>
          <ProductGrid
            products={bestSellers}
            title={sectionTitles.bestSellerTitle}
            subtitle={sectionTitles.bestSellerSubtitle}
            showHeader={true}
            viewAllLink="/products"
            onQuickView={(p) => setQuickViewProduct(p)}
          />
        </ScrollReveal>
      )}

      {/* 9. Brand Story */}
      <ScrollReveal delay={0.16}>
        <Suspense fallback={null}>
          <BrandStory />
        </Suspense>
      </ScrollReveal>

      {/* 6. Customer Reviews */}
      <ScrollReveal delay={0.18}>
        <Suspense fallback={null}>
          <Testimonials
            reviews={reviews}
            title={sectionTitles.testimonialTitle}
            subtitle={sectionTitles.testimonialSubtitle}
          />
        </Suspense>
      </ScrollReveal>

      {/* 7. Reels — shoppable video (lazy-loaded) */}
      {reelsEnabled && reels.length > 0 && (
        <ScrollReveal delay={0.2}>
          <Suspense fallback={null}>
            <ReelsSection reels={reels} />
          </Suspense>
        </ScrollReveal>
      )}

      {/* Quick View Modal */}
      <QuickViewModal
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
      />

      {/* ── POPUP Banner Modal ── */}
      {popupBanner && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/70 backdrop-blur-sm animate-in fade-in duration-300"
          onClick={(e) => { if (e.target === e.currentTarget) setDismissedPopup(true); }}
        >
          <div className="relative max-w-lg w-full bg-white rounded-2xl overflow-hidden shadow-2xl">
            <button
              onClick={() => setDismissedPopup(true)}
              className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-ink/40 hover:bg-ink/60 text-white flex items-center justify-center transition-colors"
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
                    <h3 className="text-lg font-semibold text-ink">{popupBanner.title}</h3>
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
                      className="mt-3 px-6 py-2.5 bg-ink hover:bg-gold hover:text-ink text-white font-medium text-xs uppercase tracking-[0.18em] rounded-full transition-all duration-300"
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
