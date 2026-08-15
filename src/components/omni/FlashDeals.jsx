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
    <section className="py-8 sm:py-12 bg-gradient-to-b from-stone-900 to-stone-950 text-white border-y border-stone-800">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5 pb-3 border-b border-stone-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-rose-600/20 border border-rose-500/30 rounded-xl text-rose-500 animate-pulse">
              <Flame className="w-5 h-5" />
            </div>
            <div className="space-y-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] sm:text-xs font-display text-rose-500 uppercase tracking-widest">{badge}</span>
                <span className="bg-rose-500 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full">{discountLabel}</span>
              </div>
              <h2 className="text-lg sm:text-2xl font-display font-bold text-white tracking-tight leading-tight">{title}</h2>
            </div>
          </div>

          {/* Countdown */}
          <div className="flex items-center gap-2 bg-stone-900/90 border border-stone-700/80 px-3 py-1.5 rounded-xl">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[10px] sm:text-xs text-stone-400 font-medium">Deals Refresh In:</span>
            <div className="text-[10px] sm:text-xs font-bold font-mono text-amber-400 flex items-center gap-0.5">
              <span className="bg-stone-800 px-1.5 py-0.5 rounded border border-stone-700">{String(timeLeft.hours).padStart(2, '0')}h</span>
              <span className="text-stone-600">:</span>
              <span className="bg-stone-800 px-1.5 py-0.5 rounded border border-stone-700">{String(timeLeft.minutes).padStart(2, '0')}m</span>
              <span className="text-stone-600">:</span>
              <span className="bg-stone-800 px-1.5 py-0.5 rounded border border-stone-700">{String(timeLeft.seconds).padStart(2, '0')}s</span>
            </div>
          </div>
        </div>

        {/* Product Grid — same as Featured Products style */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-1.5 sm:gap-5">
          {displayProducts.map((product) => (
            <ProductCard key={product.id} product={product} onQuickView={onQuickView} />
          ))}
        </div>
      </div>
    </section>
  );
}
