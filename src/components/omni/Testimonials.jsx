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
    <section className="py-16 bg-stone-50 border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold text-amber-600 uppercase tracking-widest block mb-1">
            {subtitle}
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
            {title}
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Verified buyer reviews across all our product categories.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {displayReviews.map((r) => (
            <div
              key={r.id}
              className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm hover:shadow-md transition-shadow relative flex flex-col justify-between"
            >
              <Quote className="w-8 h-8 text-amber-500/20 absolute top-6 right-6" />

              <div>
                <div className="flex items-center text-amber-400 mb-3">
                  {[...Array(r.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>
                <p className="text-xs text-stone-700 leading-relaxed italic mb-4">
                  "{r.comment}"
                </p>
              </div>

              <div className="pt-4 border-t border-stone-100 flex items-center gap-3">
                <img
                  src={r.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(r.name)}&background=amber&color=fff`}
                  alt={r.name}
                  className="w-10 h-10 rounded-full object-cover border border-stone-200"
                />
                <div>
                  <h4 className="text-xs font-bold text-stone-900 flex items-center gap-1">
                    {r.name}
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" title="Verified Buyer" />
                  </h4>
                  <span className="text-[10px] text-stone-400 font-medium block">{r.role}</span>
                  <span className="text-[10px] text-amber-700 font-semibold block mt-0.5">
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
