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
    <section className="py-12 sm:py-16 bg-white border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-0 lg:divide-x lg:divide-stone-200">
          {features.map((f, i) => {
            const IconComponent = ICON_MAP[f.icon] || ICON_MAP.Truck;
            return (
              <div key={i} className="flex items-start lg:items-center gap-4 lg:px-8 lg:flex-col lg:text-center">
                <div className="p-3 rounded-full bg-stone-50 border border-stone-200 text-amber-600 flex-shrink-0">
                  {IconComponent('w-5 h-5')}
                </div>
                <div>
                  <h4 className="text-sm font-display font-bold text-stone-900">{f.title}</h4>
                  <p className="text-xs text-stone-500 mt-1 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
