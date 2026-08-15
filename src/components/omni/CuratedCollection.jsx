import { Eye, ShoppingBag, Check } from 'lucide-react';
import { getImageUrl, formatCurrency } from '../../utils/formatters';
import useCartStore from '../../store/cartStore';
import { addedToCart } from '../../utils/toast';

export default function CuratedCollection({ products = [], subtitle = 'Curated Picks', title = 'Trending Now', description = '' }) {
  const { addItem } = useCartStore();

  const handleQuickView = (product) => {
    // Navigate to product detail page
    window.location.href = `/products/${product.slug || product.id}`;
  };

  const handleAddToCart = (product) => {
    addItem({ ...product, productId: product.id, quantity: 1 });
    addedToCart(product.name);
  };

  if (products.length === 0) return null;

  const featuredProducts = products.slice(0, 4);

  return (
    <section className="py-10 sm:py-14 bg-white border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-bold text-amber-600 uppercase tracking-widest block mb-1">
              {subtitle}
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
              {title}
            </h2>
            {description && (
              <p className="text-xs sm:text-sm text-stone-500 mt-1 max-w-xl">
                {description}
              </p>
            )}
          </div>
        </div>

        {/* Product Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {featuredProducts.map((product) => {
            const images = product.productimage || product.images || [];
            const imgUrl = images[0]?.url || images[0] || product.imageUrl || null;
            return (
              <div
                key={product.id}
                className="group relative bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300"
              >
                <div className="aspect-[4/5] bg-stone-100 overflow-hidden">
                  <img
                    src={getImageUrl(imgUrl)}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  {/* Hover Actions */}
                  <div className="absolute bottom-3 left-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                    <button
                      onClick={() => handleQuickView(product)}
                      className="flex-1 py-2 bg-white/90 backdrop-blur-sm text-stone-900 text-xs font-bold rounded-xl hover:bg-white transition-colors flex items-center justify-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" /> View
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleAddToCart(product); }}
                      className="flex-1 py-2 bg-amber-500 text-stone-950 text-xs font-bold rounded-xl hover:bg-amber-400 transition-colors flex items-center justify-center gap-1"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" /> Add
                    </button>
                  </div>
                </div>
                <div className="p-3 sm:p-4">
                  <span className="text-[10px] sm:text-xs font-bold text-stone-500 uppercase tracking-wider">
                    {product.categoryLabel || product.category?.name || ''}
                  </span>
                  <h3 className="text-xs sm:text-sm font-extrabold text-stone-900 mt-0.5 line-clamp-1">
                    {product.name}
                  </h3>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-sm sm:text-base font-black text-stone-950">{formatCurrency(product.price)}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleAddToCart(product); }}
                      className="w-8 h-8 rounded-full bg-stone-100 hover:bg-amber-500 hover:text-white text-stone-600 flex items-center justify-center transition-all"
                    >
                      <ShoppingBag className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
