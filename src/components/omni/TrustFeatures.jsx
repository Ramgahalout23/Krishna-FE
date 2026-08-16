import { Truck, ShieldCheck, Headphones, RotateCcw, Star, Sparkles } from 'lucide-react';

const DEFAULT_FEATURES = [
  { icon: 'Truck', title: 'Free Express Shipping', desc: 'Tracked delivery across India on all qualifying orders.' },
  { icon: 'RotateCcw', title: 'Easy Returns', desc: 'Return items within the return period for a full refund.' },
  { icon: 'ShieldCheck', title: '100% Authentic Products', desc: 'Factory original products with official warranty.' },
  { icon: 'Headphones', title: '24/7 Customer Support', desc: 'Friendly support team ready to assist you day or night.' },
];

const ICON_MAP = {
  Truck: (cn) => <Truck className={cn} />,
  ShieldCheck: (cn) => <ShieldCheck className={cn} />,
  Headphones: (cn) => <Headphones className={cn} />,
  RotateCcw: (cn) => <RotateCcw className={cn} />,
  Star: (cn) => <Star className={cn} />,
  Sparkles: (cn) => <Sparkles className={cn} />,
};

export default function TrustFeatures({ features = DEFAULT_FEATURES }) {
  return (
    <section className="py-10 sm:py-14 bg-cream border-b border-stone-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-8">
          {features.map((f, i) => {
            const IconComponent = ICON_MAP[f.icon] || ICON_MAP.Truck;
            return (
              <div key={i} className="flex items-start gap-4 lg:justify-center lg:text-center lg:flex-col">
                <div className="w-12 h-12 rounded-full bg-white border border-gold/20 text-gold-dark shadow-[0_2px_10px_rgba(28,25,23,0.05)] flex items-center justify-center flex-shrink-0 lg:mx-auto">
                  {IconComponent('w-5 h-5')}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-ink">{f.title}</h4>
                  <p className="text-xs text-stone-500 mt-1 leading-relaxed font-light">{f.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
