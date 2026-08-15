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
    <section className="py-12 sm:py-20 bg-white border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Copy */}
          <div>
            <span className="inline-flex items-center gap-2.5 text-[11px] sm:text-xs font-display font-semibold text-amber-600 uppercase tracking-[0.22em]">
              <span className="w-8 sm:w-10 h-px bg-amber-500" />
              The {storeName} Standard
            </span>
            <h2 className="mt-3 text-2xl sm:text-4xl font-display font-bold text-stone-900 tracking-tight leading-tight">
              Everything you need, all in one store
            </h2>
            <p className="mt-4 text-sm text-stone-600 leading-relaxed max-w-lg">
              {brandTagline}. From toys and pooja essentials to fashion and everyday needs —
              every product is quality-checked and delivered to your door, cash on delivery.
            </p>

            <div className="mt-7 grid sm:grid-cols-2 gap-x-8 gap-y-5">
              {BENEFITS.map((b) => (
                <div key={b.title} className="flex items-start gap-3.5">
                  <div className="p-2.5 rounded-full bg-white border border-stone-200 text-amber-600 flex-shrink-0 shadow-sm">
                    <b.icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-display font-bold text-stone-900">{b.title}</h4>
                    <p className="text-xs text-stone-500 mt-0.5 leading-relaxed">{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => navigate('/products')}
              className="mt-8 inline-flex items-center gap-2 px-6 py-3 bg-stone-950 hover:bg-amber-500 text-white hover:text-stone-950 text-xs font-display font-semibold uppercase tracking-wider rounded-full transition-colors"
            >
              Shop the Collection <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Image + floating stats */}
          <div className="relative">
            <div className="rounded-2xl overflow-hidden border border-stone-200 shadow-xl aspect-[4/3]">
              <img
                src={image}
                alt={`${storeName} products`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            <div className="absolute -bottom-5 left-4 sm:left-6 right-4 sm:right-auto bg-white rounded-2xl border border-stone-200 shadow-xl p-4 sm:p-5 grid grid-cols-3 gap-3">
              {STATS.map((s) => (
                <div key={s.label} className="text-center">
                  <div className="text-lg sm:text-xl font-display font-bold text-stone-950">{s.value}</div>
                  <div className="text-[9px] sm:text-[10px] uppercase tracking-wider text-stone-500 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
