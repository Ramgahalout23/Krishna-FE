import { Truck, BadgeCheck, ShieldCheck, RotateCcw, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
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
  { value: '4.8★', label: 'Avg. Rating' },
  { value: '48h', label: 'Dispatch Time' },
];

// Staggered reveal — items rise in sequence as the section scrolls into view
const stack = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.1 } },
};
const rise = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
};

export default function BrandStory({ image = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=900' }) {
  const navigate = useNavigate();
  const { getSetting } = useSettings();
  const storeName = getSetting('storeName', 'Our Store');
  const brandTagline = getSetting('brandTagline', 'Premium Quality, Fair Prices');

  return (
    <section className="py-14 sm:py-24 bg-white relative overflow-hidden">
      {/* Warm ambient glows */}
      <div className="absolute top-0 right-0 w-[420px] h-[420px] rounded-full bg-gold/[0.06] blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[360px] h-[360px] rounded-full bg-gold/[0.04] blur-[90px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-20 items-center">
          {/* ── Visual — FIRST on mobile, right on desktop ── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="relative order-1 lg:order-2"
          >
            {/* Offset gold frame — an intentional editorial mount */}
            <div className="absolute -top-3 -right-3 sm:-top-4 sm:-right-4 w-full h-full rounded-[24px] border border-gold/40 pointer-events-none" />
            <div className="group relative rounded-[24px] overflow-hidden shadow-[0_28px_70px_-24px_rgba(28,25,23,0.4)] aspect-[4/3]">
              <img
                src={image}
                alt={`${storeName} products`}
                className="w-full h-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.04]"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#14110E]/35 via-transparent to-transparent pointer-events-none" />
              <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 bg-white/90 backdrop-blur-md rounded-full px-3.5 py-1.5 shadow-md">
                <ShieldCheck className="w-3.5 h-3.5 text-gold-dark" />
                <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink">Quality Checked</span>
              </div>
            </div>

            {/* Stats — in-flow on mobile, floating card on desktop */}
            <div className="mt-5 lg:mt-0 lg:absolute lg:-bottom-8 lg:left-6 bg-white rounded-2xl border border-stone-200/80 shadow-[0_18px_44px_-14px_rgba(28,25,23,0.22)] p-4 sm:p-5 grid grid-cols-3 gap-2 sm:gap-3 lg:min-w-[320px] divide-x divide-stone-100">
              {STATS.map((s) => (
                <div key={s.label} className="text-center px-1">
                  <div className="text-lg sm:text-2xl font-editorial font-semibold text-ink leading-none">{s.value}</div>
                  <div className="text-[9px] sm:text-[10px] uppercase tracking-wider text-stone-500 mt-1.5">{s.label}</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* ── Copy ── */}
          <motion.div
            variants={stack}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-60px' }}
            className="order-2 lg:order-1 text-center lg:text-left"
          >
            <motion.span variants={rise} className="inline-flex items-center gap-3 text-[11px] sm:text-xs font-medium text-gold-dark uppercase tracking-[0.28em]">
              <span className="w-10 h-px bg-gold" />
              The {storeName} Standard
            </motion.span>

            <motion.h2 variants={rise} className="mt-4 font-editorial text-[32px] sm:text-4xl lg:text-5xl font-medium text-ink tracking-tight leading-[1.12]">
              Everything you need,
              <br className="hidden sm:block" /> all in{' '}
              <em className="italic text-gold-dark">one store</em>
            </motion.h2>

            <motion.p variants={rise} className="mt-5 text-sm sm:text-base text-stone-600 leading-relaxed max-w-lg mx-auto lg:mx-0 font-light">
              {brandTagline}. From toys and pooja essentials to fashion and everyday needs —
              every product is quality-checked and delivered to your door, cash on delivery.
            </motion.p>

            {/* Promise cards — numbered, bordered, hover-lift */}
            <motion.div variants={rise} className="mt-8 grid sm:grid-cols-2 gap-3 sm:gap-4 text-left">
              {BENEFITS.map((b, i) => (
                <div
                  key={b.title}
                  className="group relative bg-white rounded-2xl border border-stone-200/70 p-4 sm:p-5 transition-all duration-300 hover:border-gold/45 hover:shadow-[0_16px_40px_-16px_rgba(28,25,23,0.2)] hover:-translate-y-0.5"
                >
                  <span className="absolute top-3.5 right-4 font-mono text-[10px] font-semibold text-gold/60 tracking-[0.2em] group-hover:text-gold-dark transition-colors duration-300">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-gold/[0.08] border border-gold/25 text-gold-dark flex items-center justify-center mb-3 transition-all duration-300 group-hover:bg-gold group-hover:text-ink group-hover:shadow-[0_6px_16px_-4px_rgba(201,169,110,0.55)]">
                    <b.icon className="w-[18px] h-[18px]" />
                  </div>
                  <h4 className="text-sm font-semibold text-ink">{b.title}</h4>
                  <p className="text-xs text-stone-500 mt-1 leading-relaxed">{b.desc}</p>
                </div>
              ))}
            </motion.div>

            <motion.div variants={rise} className="mt-8 flex flex-col sm:flex-row items-center gap-4 sm:gap-5">
              <button
                onClick={() => navigate('/products')}
                className="group w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 sm:py-3.5 bg-ink text-white text-xs font-semibold uppercase tracking-[0.18em] rounded-full transition-all duration-300 hover:bg-gold hover:text-ink hover:shadow-lg hover:shadow-gold/25 hover:-translate-y-0.5 active:scale-[0.98]"
              >
                Shop the Collection
                <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
              </button>
              <span className="inline-flex items-center gap-1.5 text-[11px] text-stone-500 font-medium">
                <span className="flex items-center text-gold">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-3 h-3 fill-gold" viewBox="0 0 20 20"><path d="M9.05 2.93c.3-.92 1.6-.92 1.9 0l1.07 3.29a1 1 0 00.95.69h3.46c.97 0 1.37 1.24.59 1.81l-2.8 2.03a1 1 0 00-.36 1.12l1.07 3.29c.3.92-.76 1.69-1.54 1.12l-2.8-2.03a1 1 0 00-1.18 0l-2.8 2.03c-.78.57-1.84-.2-1.54-1.12l1.07-3.29a1 1 0 00-.36-1.12L2.98 8.72c-.78-.57-.38-1.81.59-1.81h3.46a1 1 0 00.95-.69l1.07-3.29z" /></svg>
                  ))}
                </span>
                Rated 4.8 by 15,000+ shoppers
              </span>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
