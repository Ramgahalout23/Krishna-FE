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
  tone = 'white', // 'white' | 'cream' — lets the homepage alternate section backgrounds
}) {
  const navigate = useNavigate();
  if (!products || products.length === 0) return null;

  return (
    <section className={`py-12 sm:py-20 ${tone === 'cream' ? 'bg-cream' : 'bg-white'}`} id="catalog-section">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        {showHeader && (
          <div className="mb-8 sm:mb-12 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-3 text-[11px] sm:text-xs font-medium text-gold-dark uppercase tracking-[0.28em]">
                <span className="w-10 h-px bg-gold" />
                {subtitle}
              </span>
              <h2 className="mt-3 font-editorial text-3xl sm:text-4xl lg:text-5xl font-medium text-ink tracking-tight leading-[1.1]">
                {title}
              </h2>
            </div>
            <button
              onClick={() => navigate(viewAllLink)}
              className="group inline-flex items-center gap-2 text-xs font-medium text-stone-600 hover:text-gold-dark uppercase tracking-[0.18em] transition-colors self-start sm:self-auto"
            >
              View All
              <span className="w-8 h-8 rounded-full border border-stone-300 group-hover:border-gold group-hover:bg-gold group-hover:text-white flex items-center justify-center transition-all duration-300">
                <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
              </span>
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-3 sm:gap-x-6 gap-y-7 sm:gap-y-10">
          {products.slice(0, 12).map((product) => (
            <ProductCard key={product.id} product={product} onQuickView={onQuickView} />
          ))}
        </div>
      </div>
    </section>
  );
}
