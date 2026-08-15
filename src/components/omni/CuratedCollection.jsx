import ProductCard from './ProductCard';

export default function CuratedCollection({
  products = [],
  subtitle = 'Curated Picks',
  title = 'Trending Now',
  description = '',
  onQuickView,
}) {
  const handleQuickView = (product) => {
    if (onQuickView) {
      onQuickView(product);
      return;
    }
    // Fallback: navigate to the product detail page
    window.location.assign(`/products/${product.slug || product.id}`);
  };

  if (products.length === 0) return null;

  const featuredProducts = products.slice(0, 4);

  return (
    <section className="py-10 sm:py-14 bg-white border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-display text-amber-600 uppercase tracking-widest block mb-1">
              {subtitle}
            </span>
            <h2 className="text-xl sm:text-3xl font-display font-bold text-stone-900 tracking-tight leading-tight">
              {title}
            </h2>
            {description && (
              <p className="text-xs sm:text-sm text-stone-500 mt-1 max-w-xl">
                {description}
              </p>
            )}
          </div>
        </div>

        {/* Premium Product Cards — same component as Featured / Flash Deals */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} onQuickView={handleQuickView} />
          ))}
        </div>
      </div>
    </section>
  );
}
