import { memo } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { SearchX } from 'lucide-react';
import ProductCard from '../omni/ProductCard';
import { CUSTOM_TEE_SLUG } from '../../utils/constants';

/* ── Skeleton Card: matches new Flipkart-style ProductCard ── */
function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-border/50 overflow-hidden animate-pulse">
      {/* Image skeleton */}
      <div className="aspect-[3/4] max-sm:aspect-[4/5] bg-surface relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-surface via-surface-dim to-surface" />
        {/* Wishlist dot skeleton */}
        <div className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/50" />
        {/* Add button skeleton */}
        <div className="absolute bottom-2 inset-x-2 h-8 md:h-9 rounded-sm bg-white/50" />
      </div>
      {/* Details skeleton */}
      <div className="px-2.5 py-2 md:px-3 md:py-2.5 space-y-2">
        {/* Brand */}
        <div className="h-2.5 w-16 bg-surface-dim rounded" />
        {/* Product name */}
        <div className="h-3 w-full bg-surface-dim rounded" />
        <div className="h-3 w-3/4 bg-surface-dim rounded" />
        {/* Rating */}
        <div className="flex items-center gap-1">
          <div className="h-3.5 w-8 bg-deal/30 rounded-sm" />
          <div className="h-2.5 w-8 bg-surface-dim rounded" />
        </div>
        {/* Price */}
        <div className="flex items-center gap-2 pt-1">
          <div className="h-4 w-16 bg-surface-dim rounded" />
          <div className="h-3 w-12 bg-surface-dim rounded" />
        </div>
        {/* Free delivery */}
        <div className="h-2 w-20 bg-surface-dim rounded mt-1" />
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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
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
        <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-5 rounded-full bg-surface border border-border flex items-center justify-center">
          <SearchX size={28} className="md:w-[32px] md:h-[32px] text-text-muted/60" />
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
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
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
