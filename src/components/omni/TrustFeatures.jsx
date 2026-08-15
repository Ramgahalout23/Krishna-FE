import { Truck, ShieldCheck, Headphones, RotateCcw, Star, Sparkles } from 'lucide-react';

const DEFAULT_FEATURES = [
  { icon: 'Truck', title: 'Free Express Shipping', desc: 'On all orders above a certain value. Tracked delivery across India.' },
  { icon: 'RotateCcw', title: 'Easy Returns', desc: 'Not satisfied? Return items within the return period for full refund.' },
  { icon: 'ShieldCheck', title: '100% Authentic Products', desc: 'Factory original products with official manufacturer warranty.' },
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
    <section className="py-10 bg-white border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => {
            const IconComponent = ICON_MAP[f.icon] || ICON_MAP.Truck;
            return (
              <div key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-stone-50 border border-stone-100">
                <div className="p-3 bg-white rounded-xl shadow-sm border border-stone-200 flex-shrink-0">
                  {IconComponent('w-6 h-6 text-amber-600')}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-stone-900">{f.title}</h4>
                  <p className="text-[11px] text-stone-500 mt-0.5 leading-snug">{f.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
