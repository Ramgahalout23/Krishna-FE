import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ProductCard from './ProductCard';

export default function ProductGrid({
  products = [],
  onQuickView,
  title = 'Featured Products',
  subtitle = 'Trending Now',
  showHeader = true,
  viewAllLink = '/products',
}) {
  const navigate = useNavigate();
  if (!products || products.length === 0) return null;

  return (
    <section className="py-10 sm:py-16 bg-white" id="catalog-section">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        {showHeader && (
          <div className="mb-8 sm:mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-2.5 text-[11px] sm:text-xs font-display font-semibold text-amber-600 uppercase tracking-[0.22em]">
                <span className="w-8 sm:w-10 h-px bg-amber-500" />
                {subtitle}
              </span>
              <h2 className="mt-2.5 text-2xl sm:text-4xl font-display font-bold text-stone-900 tracking-tight leading-tight">
                {title}
              </h2>
            </div>
            <button
              onClick={() => navigate(viewAllLink)}
              className="inline-flex items-center gap-1.5 text-xs font-display font-semibold text-stone-700 hover:text-amber-600 uppercase tracking-wider transition-colors self-start sm:self-auto"
            >
              View All <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-1.5 sm:gap-6">
          {products.slice(0, 12).map((product) => (
            <ProductCard key={product.id} product={product} onQuickView={onQuickView} />
          ))}
        </div>
      </div>
    </section>
  );
}
