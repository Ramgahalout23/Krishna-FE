import { useState, useMemo } from 'react';
import { SlidersHorizontal, X, Grid2x2, List, ArrowUpDown, Sparkles, UtensilsCrossed, Gamepad2, Armchair, Headphones, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useCartStore from '../../store/cartStore';
import ProductCard from './ProductCard';
import { getImageUrl, formatCurrency } from '../../utils/formatters';
import { addedToCart } from '../../utils/toast';

const SORT_OPTIONS = [
  { value: 'featured', label: 'Featured / Best Sellers' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'newest', label: 'New Arrivals' },
];

// Dynamic category tabs — derived from products or passed as prop
const DEFAULT_CATEGORY_TABS = [
  { id: 'all', label: 'All Products', icon: null },
];

// Icon resolver for dynamic category tabs
function getCategoryIcon(id) {
  const iconMap = {
    ethnic: <Sparkles className="w-3.5 h-3.5" />,
    kitchen: <UtensilsCrossed className="w-3.5 h-3.5" />,
    toys: <Gamepad2 className="w-3.5 h-3.5" />,
    home: <Armchair className="w-3.5 h-3.5" />,
    tech: <Headphones className="w-3.5 h-3.5" />,
    lifestyle: <Sparkles className="w-3.5 h-3.5" />,
    fashion: <Sparkles className="w-3.5 h-3.5" />,
    electronics: <Headphones className="w-3.5 h-3.5" />,
    grocery: <UtensilsCrossed className="w-3.5 h-3.5" />,
  };
  return iconMap[id] || <Sparkles className="w-3.5 h-3.5" />;
}

// Build dynamic category tabs from actual products
function buildCategoryTabs(products) {
  if (!products || products.length === 0) return DEFAULT_CATEGORY_TABS;

  const seen = new Map();
  products.forEach((p) => {
    const catId = p.categoryId || p.category?.id || '';
    const catLabel = p.categoryLabel || p.category?.name || '';
    if (catId && !seen.has(catId)) {
      seen.set(catId, { id: catId, label: catLabel, icon: getCategoryIcon(catId) });
    }
  });

  const dynamicTabs = [...seen.values()];
  if (dynamicTabs.length === 0) return DEFAULT_CATEGORY_TABS;
  return [{ id: 'all', label: 'All Products', icon: null }, ...dynamicTabs];
}

export default function ProductGrid({
  products = [],
  onQuickView,
  title = 'Curated Catalog',
  subtitle = 'Explore Products',
  showHeader = true,
  categoryTabs,
}) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('featured');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [maxPrice, setMaxPrice] = useState(5000);
  const [selectedTag, setSelectedTag] = useState(null);
  const { addItem } = useCartStore();

  // Derive category tabs from products if not provided
  const CATEGORY_TABS = categoryTabs || buildCategoryTabs(products);

  // Derive all unique tags from products
  const allTags = useMemo(() => {
    const tagSet = new Set();
    products.forEach((p) => {
      (p.tags || []).forEach((t) => tagSet.add(t));
    });
    return [...tagSet].slice(0, 20); // Limit to 20 tags
  }, [products]);

  // Filter and sort products
  const filtered = useMemo(() => {
    let result = [...products];

    // Category filter
    if (selectedCategory !== 'all') {
      result = result.filter((p) => {
        const cat = p.categoryId || p.category?.id || p.category || '';
        return cat === selectedCategory || p.categoryLabel?.toLowerCase().includes(selectedCategory);
      });
    }

    // In stock filter
    if (inStockOnly) {
      result = result.filter((p) => (p.stockCount || p.quantity || 0) > 0);
    }

    // Price filter
    result = result.filter((p) => p.price <= maxPrice);

    // Tag filter
    if (selectedTag) {
      result = result.filter((p) => (p.tags || []).includes(selectedTag));
    }

    // Sort
    switch (sortBy) {
      case 'price-low':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'newest':
        result.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
        break;
      default:
        result.sort((a, b) => (b.isBestSeller ? 1 : 0) - (a.isBestSeller ? 1 : 0));
    }

    return result;
  }, [products, selectedCategory, sortBy, inStockOnly, maxPrice, selectedTag]);

  const hasActiveFilters = selectedTag || maxPrice < 5000 || inStockOnly;

  const handleResetFilters = () => {
    setSelectedCategory('all');
    setMaxPrice(5000);
    setSelectedTag(null);
    setInStockOnly(false);
    setSortBy('featured');
  };

  const getCategoryLabel = (id) => {
    const cat = CATEGORY_TABS.find(c => c.id === id);
    return cat ? cat.label : id;
  };

  return (
    <section className="py-6 sm:py-12 bg-white" id="catalog-section">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        
        {showHeader && (
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
            <div>
              <span className="text-xs font-display text-amber-600 uppercase tracking-widest block mb-1">{subtitle}</span>
              <h2 className="text-xl sm:text-3xl font-display font-bold text-stone-900 tracking-tight leading-tight">{title}</h2>
            </div>
          </div>
        )}

        {/* Category Tabs with Icons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-6 scrollbar-none">
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedCategory(tab.id)}
              className={`px-3.5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                selectedCategory === tab.id
                  ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Sort & Filter Toolbar */}
        <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 mb-8 flex flex-wrap items-center justify-between gap-4">
          
          <div className="flex flex-wrap items-center gap-3">
            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-3.5 py-2 bg-white hover:bg-stone-100 text-stone-800 text-xs font-semibold rounded-xl border border-stone-200 shadow-sm flex items-center gap-2 transition-colors"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-amber-600" />
              <span>Filters</span>
              {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-amber-500" />}
            </button>

            {/* In-Stock Toggle */}
            <label className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-stone-200 text-xs font-medium text-stone-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="w-3.5 h-3.5 accent-amber-600 rounded"
              />
              <span>In Stock Only</span>
            </label>

            {/* Selected Tag Pill */}
            {selectedTag && (
              <span className="bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
                Tag: {selectedTag}
                <X className="w-3 h-3 cursor-pointer hover:text-amber-700" onClick={() => setSelectedTag(null)} />
              </span>
            )}

            {/* Quick Price Shortcuts */}
            <button
              onClick={() => setMaxPrice(500)}
              className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                maxPrice === 500
                  ? 'bg-stone-900 text-white border-stone-900'
                  : 'bg-white text-stone-700 border-stone-200 hover:border-stone-400'
              }`}
            >
              Under ₹500
            </button>
            <button
              onClick={() => setMaxPrice(1000)}
              className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                maxPrice === 1000
                  ? 'bg-stone-900 text-white border-stone-900'
                  : 'bg-white text-stone-700 border-stone-200 hover:border-stone-400'
              }`}
            >
              Under ₹1,000
            </button>
          </div>

          {/* Right Side: Sort & View Toggle */}
          <div className="flex items-center gap-3 ml-auto">
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-stone-200 text-xs">
              <ArrowUpDown className="w-3.5 h-3.5 text-stone-400" />
              <span className="text-stone-500 font-medium hidden sm:inline">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent font-bold text-stone-800 outline-none cursor-pointer"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Grid/List Toggle */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-stone-200">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg text-xs transition-colors ${
                  viewMode === 'grid' ? 'bg-amber-500 text-stone-950 font-bold' : 'text-stone-500 hover:text-stone-800'
                }`}
                title="Grid View"
              >
                <Grid2x2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('compact')}
                className={`p-1.5 rounded-lg text-xs transition-colors ${
                  viewMode === 'compact' ? 'bg-amber-500 text-stone-950 font-bold' : 'text-stone-500 hover:text-stone-800'
                }`}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Expandable Filter Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-stone-50 border border-stone-200 rounded-2xl p-6 mb-8 overflow-hidden"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Price Range */}
                <div>
                  <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider mb-2">
                    Price Range (Up to ₹{maxPrice})
                  </h4>
                  <input
                    type="range"
                    min="10"
                    max="5000"
                    step="50"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                    className="w-full accent-amber-600"
                  />
                  <div className="flex justify-between text-xs text-stone-500 font-mono mt-1">
                    <span>₹0</span>
                    <span className="font-bold text-amber-700">₹{maxPrice}</span>
                    <span>₹5,000+</span>
                  </div>
                </div>

                {/* Tags */}
                <div className="md:col-span-2">
                  <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider mb-2">
                    Filter By Tags
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {allTags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                          selectedTag === tag
                            ? 'bg-stone-900 text-white border-stone-900'
                            : 'bg-white text-stone-700 border-stone-200 hover:border-amber-500'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                    {allTags.length === 0 && (
                      <span className="text-xs text-stone-400">No tags available for current products</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Reset */}
              <div className="pt-3 border-t border-stone-200 mt-4 flex justify-end">
                <button
                  onClick={handleResetFilters}
                  className="text-xs font-bold text-rose-600 hover:text-rose-800 underline"
                >
                  Reset All Filters
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results Summary */}
        <div className="mb-4 text-xs font-semibold text-stone-500 flex justify-between items-center">
          <span>
            Showing <strong className="text-stone-900">{filtered.length}</strong> items
            {selectedCategory !== 'all' && (
              <span> in <strong className="text-amber-700">{getCategoryLabel(selectedCategory)}</strong></span>
            )}
          </span>
        </div>

        {/* Product Display */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 bg-stone-50 rounded-3xl border border-dashed border-stone-300 p-8">
            <ShoppingBag className="w-12 h-12 text-stone-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-stone-800 mb-1">No products found</h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto mb-4">
              We couldn't find any items matching your current filters.
            </p>
            <button
              onClick={handleResetFilters}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-full shadow transition-all"
            >
              Reset Filters & View All
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-6">
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} onQuickView={onQuickView} />
            ))}
          </div>
        ) : (
          /* Compact List View */
          <div className="space-y-3">
            {filtered.map((product) => {
              const images = product.productimage || product.images || [];
              const imgUrl = product.imageUrl || images[0]?.url || images[0] || null;
              return (
                <div
                  key={product.id}
                  onClick={() => onQuickView && onQuickView(product)}
                  className="bg-white border border-stone-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-amber-500 hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={getImageUrl(imgUrl)}
                      alt={product.name}
                      className="w-20 h-20 object-cover rounded-xl border border-stone-100 flex-shrink-0"
                      loading="lazy"
                      decoding="async"
                    />
                    <div>
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                        {product.categoryLabel || product.category?.name || ''}
                      </span>
                      <h3 className="text-sm font-bold text-stone-900 group-hover:text-amber-700 transition-colors">
                        {product.name}
                      </h3>
                      <p className="text-xs text-stone-500 line-clamp-1 max-w-lg mt-0.5">
                        {product.description || ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-stone-100">
                    <div className="text-right">
                      <span className="text-base font-extrabold text-stone-900">{formatCurrency(product.price)}</span>
                      {product.oldPrice && (
                        <span className="block text-xs text-stone-400 line-through">{formatCurrency(product.oldPrice)}</span>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        addItem({ ...product, productId: product.id, quantity: 1 });
                        addedToCart(product.name);
                      }}
                      className="px-4 py-2 bg-stone-900 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition-colors"
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* NOTE: No "Load More" here — the homepage grid renders everything the
            API returns (featured + new arrivals). Pagination/Load More is handled
            by the dedicated /products page instead. */}
      </div>
    </section>
  );
}
