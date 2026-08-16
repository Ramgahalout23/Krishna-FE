import { memo } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { SearchX } from 'lucide-react';
import ProductCard from '../omni/ProductCard';
import { CUSTOM_TEE_SLUG } from '../../utils/constants';

/* ── Skeleton Card: matches the premium borderless ProductCard ── */
function ProductCardSkeleton() {
  return (
    <div className="animate-pulse flex flex-col">
      {/* Image skeleton */}
      <div className="aspect-[4/5] bg-cream rounded-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-cream via-stone-100 to-stone-200/50" />
        {/* Minimal discount badge skeleton */}
        <div className="absolute top-3 left-3 w-12 h-5 rounded-full bg-stone-200/80" />
        {/* Wishlist circle skeleton */}
        <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/70" />
      </div>
      {/* Details skeleton — name + price only, like the clean card */}
      <div className="pt-3 px-0.5 space-y-2">
        <div className="h-3 w-3/4 bg-stone-200 rounded-full" />
        <div className="h-4 w-16 bg-stone-200 rounded-full" />
      </div>
    </div>
  );
}

export default memo(function ProductGrid({ products = [], loading = false }) {
  // Hide the custom t-shirt design product from user listings
  const filteredProducts = products.filter(p => p.slug !== CUSTOM_TEE_SLUG);
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-3 sm:gap-x-6 gap-y-7 sm:gap-y-10">
        {Array.from({ length: 8 }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.04, ease: [0.16, 1, 0.3, 1] }}
          >
            <ProductCardSkeleton />
          </motion.div>
        ))}
      </div>
    );
  }

  if (!filteredProducts.length) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="text-center py-16 md:py-20"
      >
        <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-5 rounded-full bg-cream border border-stone-200 flex items-center justify-center">
          <SearchX size={28} className="md:w-[32px] md:h-[32px] text-stone-400/60" />
        </div>
        <h3 className="font-display font-bold text-lg md:text-xl text-text-primary mb-2">
          {t('products.no_products_found')}
        </h3>
        <p className="text-text-muted text-sm max-w-xs mx-auto leading-relaxed">
          {t('products.try_adjusting_filters')}
        </p>
      </motion.div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-3 sm:gap-x-6 gap-y-7 sm:gap-y-10">
      {filteredProducts.map((p, idx) => (
        <motion.div
          key={p.id}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.6, delay: idx * 0.04, ease: [0.16, 1, 0.3, 1] }}
        >
          <ProductCard product={p} />
        </motion.div>
      ))}
    </div>
  );
});
