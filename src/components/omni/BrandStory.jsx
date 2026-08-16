import { Truck, BadgeCheck, ShieldCheck, RotateCcw, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../../store/useSettings';

const BENEFITS = [
  { icon: Truck, title: 'Free Express Shipping', desc: 'Dispatched within 48 hours, tracked across India.' },
  { icon: RotateCcw, title: 'Easy Returns', desc: 'Return items within the return period for a full refund.' },
  { icon: BadgeCheck, title: '100% Authentic', desc: 'Factory-original product with official warranty.' },
  { icon: ShieldCheck, title: 'Cash on Delivery', desc: 'Pay when it arrives. Zero-risk shopping.' },
];

const STATS = [
  { value: '15K+', label: 'Happy Customers' },
  { value: '4.8★', label: 'Average Rating' },
  { value: '48h', label: 'Dispatch Time' },
];

export default function BrandStory({ image = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=900' }) {
  const navigate = useNavigate();
  const { getSetting } = useSettings();
  const storeName = getSetting('storeName', 'Our Store');
  const brandTagline = getSetting('brandTagline', 'Premium Quality, Fair Prices');

  return (
    <section className="py-12 sm:py-24 bg-white relative overflow-hidden">
      {/* Subtle warm corner glow */}
      <div className="absolute top-0 right-0 w-[420px] h-[420px] rounded-full bg-gold/[0.05] blur-[100px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Copy */}
          <div>
            <span className="inline-flex items-center gap-3 text-[11px] sm:text-xs font-medium text-gold-dark uppercase tracking-[0.28em]">
              <span className="w-10 h-px bg-gold" />
              The {storeName} Standard
            </span>
            <h2 className="mt-4 font-editorial text-3xl sm:text-4xl lg:text-5xl font-medium text-ink tracking-tight leading-[1.1]">
              Everything you need, all in one store
            </h2>
            <p className="mt-5 text-sm sm:text-base text-stone-600 leading-relaxed max-w-lg font-light">
              {brandTagline}. From toys and pooja essentials to fashion and everyday needs —
              every product is quality-checked and delivered to your door, cash on delivery.
            </p>

            <div className="mt-8 grid sm:grid-cols-2 gap-x-8 gap-y-6">
              {BENEFITS.map((b) => (
                <div key={b.title} className="flex items-start gap-4">
                  <div className="p-2.5 rounded-full bg-cream border border-gold/20 text-gold-dark flex-shrink-0">
                    <b.icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-ink">{b.title}</h4>
                    <p className="text-xs text-stone-500 mt-1 leading-relaxed">{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => navigate('/products')}
              className="mt-9 group inline-flex items-center gap-2.5 px-7 py-3.5 bg-ink text-white text-xs font-semibold uppercase tracking-[0.18em] rounded-full transition-all duration-300 hover:bg-gold hover:text-ink hover:shadow-lg hover:shadow-gold/25 hover:-translate-y-0.5"
            >
              Shop the Collection
              <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
            </button>
          </div>

          {/* Image + floating stats */}
          <div className="relative">
            {/* Gold frame accent */}
            <div className="absolute -inset-3 rounded-[28px] border border-gold/25 pointer-events-none" />
            <div className="rounded-2xl overflow-hidden shadow-[0_24px_60px_-20px_rgba(28,25,23,0.35)] aspect-[4/3]">
              <img
                src={image}
                alt={`${storeName} products`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            <div className="absolute -bottom-6 left-4 sm:left-6 right-4 sm:right-auto bg-white rounded-2xl border border-stone-200 shadow-[0_16px_40px_-12px_rgba(28,25,23,0.2)] p-4 sm:p-5 grid grid-cols-3 gap-3 min-w-[260px]">
              {STATS.map((s) => (
                <div key={s.label} className="text-center">
                  <div className="text-lg sm:text-xl font-editorial font-semibold text-ink">{s.value}</div>
                  <div className="text-[9px] sm:text-[10px] uppercase tracking-wider text-stone-500 mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
