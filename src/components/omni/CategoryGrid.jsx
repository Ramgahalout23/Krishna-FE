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

function getIcon(iconName) {
  switch (iconName) {
    case 'Shirt': return <Shirt className="w-5 h-5 text-rose-600" />;
    case 'UtensilsCrossed': return <UtensilsCrossed className="w-5 h-5 text-amber-600" />;
    case 'Gamepad2': return <Gamepad2 className="w-5 h-5 text-amber-600" />;
    case 'Armchair': return <Armchair className="w-5 h-5 text-emerald-600" />;
    case 'Headphones': return <Headphones className="w-5 h-5 text-sky-600" />;
    default: return <Sparkles className="w-5 h-5 text-rose-500" />;
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
    <section className="py-8 sm:py-12 bg-stone-50 border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 sm:mb-10">
          <div>
            <span className="inline-flex items-center gap-2.5 text-[11px] sm:text-xs font-display font-semibold text-amber-600 uppercase tracking-[0.22em]">
              <span className="w-8 sm:w-10 h-px bg-amber-500" />
              {subtitle}
            </span>
            <h2 className="mt-2.5 text-2xl sm:text-4xl font-display font-bold text-stone-900 tracking-tight leading-tight">{title}</h2>
          </div>
          <button
            onClick={() => onSelectCategory && onSelectCategory('all')}
            className="text-xs font-display font-semibold text-stone-700 hover:text-amber-600 flex items-center gap-1.5 transition-colors self-start sm:self-auto uppercase tracking-wider"
          >
            Explore All Products <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-4">
          {displayCategories.map((cat) => (
            <div
              key={cat.id || cat.slug}
              onClick={() => onSelectCategory && onSelectCategory(cat.slug || cat.id)}
              className="group relative aspect-[4/5] overflow-hidden rounded-2xl bg-stone-900 border border-stone-200 transition-all duration-300 cursor-pointer hover:shadow-lg hover:border-amber-400"
            >
              <img
                src={cat.imageUrl || cat.image || ''}
                alt={cat.name}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.07]"
                loading="lazy"
              />
              {/* Warm scrim for the editorial overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-stone-950/25 to-transparent" />

              {/* Glass icon chip */}
              <div className="absolute top-3 left-3 bg-white/10 backdrop-blur-md border border-white/20 p-2 rounded-xl shadow-md">
                {getIcon(cat.iconName || 'Sparkles')}
              </div>

              <span className="absolute top-3 right-3 bg-stone-950/60 backdrop-blur-sm border border-white/15 text-white text-[10px] font-semibold px-2.5 py-1 rounded-full">
                {cat.itemCount || cat._count?.products || 0} items
              </span>

              {/* Name + tagline overlay */}
              <div className="absolute inset-x-0 bottom-0 p-3.5">
                <h3 className="text-sm sm:text-base font-display font-bold text-white tracking-tight group-hover:text-amber-300 transition-colors">
                  {cat.name}
                </h3>
                <div className="mt-1.5 flex items-center justify-between gap-2">
                  <p className="text-[10px] sm:text-[11px] text-stone-300/90 line-clamp-1">
                    {cat.tagline || 'Shop the collection'}
                  </p>
                  <span className="w-6 h-6 shrink-0 rounded-full bg-white/10 border border-white/20 text-white flex items-center justify-center transition-all duration-300 group-hover:bg-amber-500 group-hover:border-amber-500 group-hover:text-stone-950">
                    <ArrowRight className="w-3 h-3" />
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
