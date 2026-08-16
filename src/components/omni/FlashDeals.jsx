import { useState, useEffect } from 'react';
import { Flame, Clock } from 'lucide-react';
import ProductCard from './ProductCard';

export default function FlashDeals({
  products = [],
  onQuickView,
  title = 'Flash Deals of the Day',
  badge = 'Limited Time Offers',
  discountLabel = 'Up to 40% OFF',
}) {
  const [timeLeft, setTimeLeft] = useState({ hours: 4, minutes: 28, seconds: 45 });

  // Products are already filtered by parent — just take first 4
  const displayProducts = products.slice(0, 4);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 12, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (displayProducts.length === 0) return null;

  return (
    <section className="py-12 sm:py-20 bg-[#14110E] text-white relative overflow-hidden">
      {/* Warm gold ambient glow */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[640px] h-[320px] rounded-full bg-gold/[0.07] blur-[110px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 mb-8 sm:mb-12 pb-5 border-b border-white/[0.08]">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-full bg-gold/15 border border-gold/30 text-gold-soft flex items-center justify-center">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <span className="text-[10px] sm:text-[11px] font-medium text-gold-soft uppercase tracking-[0.26em]">{badge}</span>
                <span className="bg-gold text-ink text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">{discountLabel}</span>
              </div>
              <h2 className="mt-1 font-editorial text-2xl sm:text-3xl lg:text-4xl font-medium text-white tracking-tight leading-tight">{title}</h2>
            </div>
          </div>

          {/* Countdown */}
          <div className="flex items-center gap-3">
            <Clock className="w-4 h-4 text-gold-soft" />
            <span className="text-[10px] sm:text-xs font-medium uppercase tracking-[0.22em] text-stone-400">
              Deals Refresh In
            </span>
            <div className="flex items-center gap-1.5 font-mono text-sm font-semibold text-gold-soft">
              <span className="bg-white/[0.06] border border-white/15 px-2 py-1 rounded-md min-w-[44px] text-center">{String(timeLeft.hours).padStart(2, '0')}h</span>
              <span className="text-stone-600">:</span>
              <span className="bg-white/[0.06] border border-white/15 px-2 py-1 rounded-md min-w-[44px] text-center">{String(timeLeft.minutes).padStart(2, '0')}m</span>
              <span className="text-stone-600">:</span>
              <span className="bg-white/[0.06] border border-white/15 px-2 py-1 rounded-md min-w-[44px] text-center">{String(timeLeft.seconds).padStart(2, '0')}s</span>
            </div>
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
          {displayProducts.map((product) => (
            <ProductCard key={product.id} product={product} onQuickView={onQuickView} />
          ))}
        </div>
      </div>
    </section>
  );
}
