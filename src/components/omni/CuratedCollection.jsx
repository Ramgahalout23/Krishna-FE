import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ProductCard from './ProductCard';

export default function CuratedCollection({
  products = [],
  subtitle = 'Curated Picks',
  title = 'Premium Picks',
  description = '',
  onQuickView,
}) {
  const navigate = useNavigate();

  const handleQuickView = (product) => {
    if (onQuickView) {
      onQuickView(product);
      return;
    }
    navigate(`/products/${product.slug || product.id}`);
  };

  if (products.length === 0) return null;

  const featuredProducts = products.slice(0, 4);

  return (
    <section className="py-12 sm:py-16 bg-stone-950 border-b border-stone-800">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="mb-8 sm:mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-2.5 text-[11px] sm:text-xs font-display font-semibold text-amber-400 uppercase tracking-[0.22em]">
              <span className="w-8 sm:w-10 h-px bg-amber-500" />
              {subtitle}
            </span>
            <h2 className="mt-2.5 text-2xl sm:text-4xl font-display font-bold text-white tracking-tight leading-tight">
              {title}
            </h2>
            {description && (
              <p className="text-xs sm:text-sm text-stone-400 mt-2 max-w-xl">
                {description}
              </p>
            )}
          </div>
          <button
            onClick={() => navigate('/products')}
            className="inline-flex items-center gap-1.5 text-xs font-display font-semibold text-stone-300 hover:text-amber-400 uppercase tracking-wider transition-colors self-start sm:self-auto"
          >
            Shop All <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-1.5 sm:gap-6">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} onQuickView={handleQuickView} />
          ))}
        </div>
      </div>
    </section>
  );
}
