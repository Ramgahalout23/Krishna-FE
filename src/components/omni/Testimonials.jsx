import { Star, ShieldCheck, Quote } from 'lucide-react';

export default function Testimonials({
  reviews = [],
  title = 'Loved By Thousands of Happy Shoppers',
  subtitle = 'Real Customer Feedback',
}) {
  // Default testimonials if no reviews from API — generic, locale-friendly
  const defaultReviews = [
    {
      id: '1',
      name: 'Verified Customer',
      role: 'Verified Buyer',
      rating: 5,
      comment: 'The quality exceeded all expectations. Fast delivery and excellent packaging. Will definitely order again!',
      product: 'Recent Purchase',
      avatar: '',
    },
    {
      id: '2',
      name: 'Happy Shopper',
      role: 'Verified Buyer',
      rating: 5,
      comment: 'Outstanding quality at an affordable price. The free delivery and COD option made it super convenient.',
      product: 'Recent Purchase',
      avatar: '',
    },
    {
      id: '3',
      name: 'Satisfied Customer',
      role: 'Verified Buyer',
      rating: 5,
      comment: 'Ordering was seamless and delivery took only two days! This is now my go-to store for all home and lifestyle products.',
      product: 'Recent Purchase',
      avatar: '',
    },
  ];

  const displayReviews = reviews.length > 0
    ? reviews.slice(0, 3).map(r => ({
        id: r.id,
        name: r.user?.firstName || r.userName || r.name || 'Verified Customer',
        role: 'Verified Buyer',
        rating: r.rating || 5,
        comment: r.comment || r.review || r.text || '',
        product: typeof r.product === 'object' ? r.product.name : 'Purchased Item',
        avatar: r.user?.avatar || r.userAvatar || '',
      }))
    : defaultReviews;

  return (
    <section className="py-14 sm:py-24 bg-cream relative overflow-hidden">
      {/* Warm ambient glow */}
      <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-[560px] h-[280px] rounded-full bg-gold/[0.06] blur-[100px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <span className="inline-flex items-center justify-center gap-3 text-[11px] sm:text-xs font-medium text-gold-dark uppercase tracking-[0.28em]">
            <span className="w-10 h-px bg-gold" />
            {subtitle}
            <span className="w-10 h-px bg-gold" />
          </span>
          <h2 className="mt-4 font-editorial text-3xl sm:text-4xl lg:text-5xl font-medium text-ink tracking-tight leading-[1.1]">
            {title}
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 mt-3 font-light">
            Verified buyer reviews across all our product categories.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {displayReviews.map((r) => (
            <div
              key={r.id}
              className="bg-white rounded-2xl p-7 sm:p-8 border border-stone-200/60 shadow-[0_2px_12px_rgba(28,25,23,0.05)] hover:shadow-[0_18px_44px_-14px_rgba(28,25,23,0.16)] hover:-translate-y-1 transition-all duration-300 relative flex flex-col justify-between"
            >
              <Quote className="w-9 h-9 text-gold/20 absolute top-7 right-7" />

              <div>
                <div className="flex items-center text-gold mb-4">
                  {[...Array(r.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-gold" />
                  ))}
                </div>
                <p className="text-sm text-stone-700 leading-relaxed mb-5">
                  "{r.comment}"
                </p>
              </div>

              <div className="pt-5 border-t border-stone-100 flex items-center gap-3.5">
                <img
                  src={r.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(r.name)}&background=B08D4F&color=fff`}
                  alt={r.name}
                  loading="lazy"
                  decoding="async"
                  className="w-11 h-11 rounded-full object-cover border border-stone-200"
                />
                <div>
                  <h4 className="text-sm font-semibold text-ink flex items-center gap-1.5">
                    {r.name}
                    <ShieldCheck className="w-4 h-4 text-gold-dark" title="Verified Buyer" />
                  </h4>
                  <span className="text-[11px] text-stone-400 font-medium block">{r.role}</span>
                  <span className="text-[11px] text-gold-dark font-medium block mt-0.5">
                    Purchased: {r.product}
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
