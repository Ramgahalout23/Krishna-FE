import { useState } from 'react';
import { ArrowRight, UtensilsCrossed, Gamepad2, Armchair, Headphones, Sparkles, Shirt } from 'lucide-react';

const CATEGORIES = [
  {
    id: 'toys',
    name: 'Toys & Games',
    tagline: 'Play, learn & collect',
    imageUrl: 'https://images.unsplash.com/photo-1566576912327-bcb2e4e8d1f3?auto=format&fit=crop&w=600&q=80',
    iconName: 'Gamepad2',
    itemCount: 36,
  },
  {
    id: 'electronics',
    name: 'Electronics',
    tagline: 'Smart gadgets & audio',
    imageUrl: 'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?auto=format&fit=crop&w=600&q=80',
    iconName: 'Headphones',
    itemCount: 28,
  },
  {
    id: 'kitchen',
    name: 'Home & Kitchen',
    tagline: 'Cookware & organizers',
    imageUrl: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=600&q=80',
    iconName: 'UtensilsCrossed',
    itemCount: 64,
  },
  {
    id: 'sports',
    name: 'Sports & Fitness',
    tagline: 'Train anywhere',
    imageUrl: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=600&q=80',
    iconName: 'Sparkles',
    itemCount: 44,
  },
  {
    id: 'home',
    name: 'Home & Bedding',
    tagline: 'Furnishings & decor',
    imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=600&q=80',
    iconName: 'Armchair',
    itemCount: 52,
  },
  {
    id: 'lifestyle',
    name: 'Everyday Essentials',
    tagline: 'Daily-use picks',
    imageUrl: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=600&q=80',
    iconName: 'Shirt',
    itemCount: 48,
  },
];

const PAGE_SIZE = 12;

function getIcon(iconName, className = 'w-5 h-5') {
  switch (iconName) {
    case 'Shirt': return <Shirt className={`${className} text-gold-dark`} />;
    case 'UtensilsCrossed': return <UtensilsCrossed className={`${className} text-gold-dark`} />;
    case 'Gamepad2': return <Gamepad2 className={`${className} text-gold-dark`} />;
    case 'Armchair': return <Armchair className={`${className} text-gold-dark`} />;
    case 'Headphones': return <Headphones className={`${className} text-gold-dark`} />;
    default: return <Sparkles className={`${className} text-gold-dark`} />;
  }
}

export default function CategoryGrid({
  categories = [],
  onSelectCategory,
  title = 'Shop By Category',
  subtitle = 'Curated Departments',
}) {
  const [showAll, setShowAll] = useState(false);
  const source = categories.length > 0 ? categories : CATEGORIES;
  const visible = showAll ? source : source.slice(0, PAGE_SIZE);
  const hasMore = source.length > PAGE_SIZE;

  return (
    <section className="py-12 sm:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 sm:mb-12">
          <div>
            <span className="inline-flex items-center gap-3 text-[11px] sm:text-xs font-medium text-gold-dark uppercase tracking-[0.28em]">
              <span className="w-10 h-px bg-gold" />
              {subtitle}
            </span>
            <h2 className="mt-3 font-editorial text-3xl sm:text-4xl lg:text-5xl font-medium text-ink tracking-tight leading-[1.1]">{title}</h2>
          </div>
          {hasMore && (
            <button
              onClick={() => setShowAll(v => !v)}
              className="group inline-flex items-center gap-2 text-xs font-medium text-stone-600 hover:text-gold-dark uppercase tracking-[0.18em] transition-colors self-start sm:self-auto"
            >
              {showAll ? 'Show Less' : `View All ${source.length} Categories`}
              <span className="w-8 h-8 rounded-full border border-stone-300 group-hover:border-gold group-hover:bg-gold group-hover:text-white flex items-center justify-center transition-all duration-300">
                <ArrowRight className={`w-3.5 h-3.5 transition-transform duration-300 ${showAll ? '-rotate-90' : 'rotate-90'} group-hover:translate-x-0.5`} />
              </span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-5">
          {visible.map((cat) => {
            const count = cat.products_count || cat.itemCount;
            return (
              <div
                key={cat.id || cat.slug}
                onClick={() => onSelectCategory && onSelectCategory(cat.slug || cat.id)}
                className="group relative aspect-[4/5] overflow-hidden rounded-2xl bg-ink cursor-pointer shadow-[0_2px_8px_rgba(28,25,23,0.08)] transition-all duration-400 hover:shadow-[0_18px_40px_-10px_rgba(28,25,23,0.3)]"
              >
                {cat.imageUrl || cat.image ? (
                  <img
                    src={cat.imageUrl || cat.image}
                    alt={cat.name}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.08]"
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-ink">
                    {getIcon(cat.iconName || 'Sparkles', 'w-10 h-10 sm:w-14 sm:h-14 text-gold/70')}
                  </div>
                )}
                {/* Warm editorial scrim */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#14110E]/95 via-[#14110E]/30 to-transparent" />

                {/* Minimal name + arrow overlay */}
                <div className="absolute inset-x-0 bottom-0 p-2.5 sm:p-4">
                  {count ? (
                    <span className="hidden sm:inline-block mb-1.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-gold-soft">
                      {count} products
                    </span>
                  ) : null}
                  <div className="flex items-center justify-between gap-1.5 sm:gap-2">
                    <h3 className="text-[11px] sm:text-base font-medium text-white tracking-tight leading-tight transition-colors duration-300 group-hover:text-gold-soft line-clamp-2">
                      {cat.name}
                    </h3>
                    <span className="w-6 h-6 sm:w-8 sm:h-8 shrink-0 rounded-full bg-white/10 border border-white/20 text-white flex items-center justify-center transition-all duration-300 group-hover:bg-gold group-hover:border-gold group-hover:text-ink group-hover:translate-x-0.5">
                      <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Mobile "view all" — full-width pill under the grid */}
        {hasMore && (
          <button
            onClick={() => setShowAll(v => !v)}
            className="sm:hidden mt-5 w-full py-3 bg-white border border-stone-200 rounded-full text-xs font-semibold uppercase tracking-[0.18em] text-ink hover:border-gold hover:text-gold-dark transition-colors"
          >
            {showAll ? 'Show Less' : `View All ${source.length} Categories`}
          </button>
        )}
      </div>
    </section>
  );
}
