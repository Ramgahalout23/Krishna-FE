import { ArrowRight, UtensilsCrossed, Gamepad2, Armchair, Headphones, Sparkles, Shirt } from 'lucide-react';

const CATEGORIES = [
  {
    id: 'ethnic',
    name: 'Sarees & Ethnic',
    tagline: 'Handloom & designer wear',
    imageUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80',
    iconName: 'Shirt',
    itemCount: 48,
  },
  {
    id: 'kitchen',
    name: 'Kitchen & Dining',
    tagline: 'Cookware, appliances & more',
    imageUrl: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=600&q=80',
    iconName: 'UtensilsCrossed',
    itemCount: 64,
  },
  {
    id: 'toys',
    name: 'Kids & Toys',
    tagline: 'Educational toys & games',
    imageUrl: 'https://images.unsplash.com/photo-1566576912327-bcb2e4e8d1f3?auto=format&fit=crop&w=600&q=80',
    iconName: 'Gamepad2',
    itemCount: 36,
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
    id: 'tech',
    name: 'Electronics',
    tagline: 'Smart gadgets & accessories',
    imageUrl: 'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?auto=format&fit=crop&w=600&q=80',
    iconName: 'Headphones',
    itemCount: 28,
  },
  {
    id: 'lifestyle',
    name: 'Lifestyle',
    tagline: 'Fashion, beauty & more',
    imageUrl: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=600&q=80',
    iconName: 'Sparkles',
    itemCount: 44,
  },
];

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
  const displayCategories = categories.length > 0 ? categories.slice(0, 6) : CATEGORIES;

  return (
    <section className="py-12 sm:py-20 bg-cream">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 sm:mb-12">
          <div>
            <span className="inline-flex items-center gap-3 text-[11px] sm:text-xs font-medium text-gold-dark uppercase tracking-[0.28em]">
              <span className="w-10 h-px bg-gold" />
              {subtitle}
            </span>
            <h2 className="mt-3 font-editorial text-3xl sm:text-4xl lg:text-5xl font-medium text-ink tracking-tight leading-[1.1]">{title}</h2>
          </div>
          <button
            onClick={() => onSelectCategory && onSelectCategory('all')}
            className="group inline-flex items-center gap-2 text-xs font-medium text-stone-600 hover:text-gold-dark uppercase tracking-[0.18em] transition-colors self-start sm:self-auto"
          >
            Explore All Products
            <span className="w-8 h-8 rounded-full border border-stone-300 group-hover:border-gold group-hover:bg-gold group-hover:text-white flex items-center justify-center transition-all duration-300">
              <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
            </span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-5">
          {displayCategories.map((cat) => (
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
                  {getIcon(cat.iconName || 'Sparkles', 'w-14 h-14 text-gold/70')}
                </div>
              )}
              {/* Warm editorial scrim */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#14110E]/95 via-[#14110E]/30 to-transparent" />

              {/* Minimal name + arrow overlay */}
              <div className="absolute inset-x-0 bottom-0 p-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm sm:text-base font-medium text-white tracking-tight transition-colors duration-300 group-hover:text-gold-soft">
                    {cat.name}
                  </h3>
                  <span className="w-8 h-8 shrink-0 rounded-full bg-white/10 border border-white/20 text-white flex items-center justify-center transition-all duration-300 group-hover:bg-gold group-hover:border-gold group-hover:text-ink group-hover:translate-x-0.5">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
