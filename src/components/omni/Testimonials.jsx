import { useState, useEffect, useRef, useCallback } from 'react';
import { Star, ShieldCheck, Quote, ChevronLeft, ChevronRight } from 'lucide-react';

const GAP = 24; // px between cards — keep in sync with the track gap

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
    ? reviews.slice(0, 9).map(r => ({
        id: r.id,
        name: r.user?.firstName || r.userName || r.name || 'Verified Customer',
        role: 'Verified Buyer',
        rating: r.rating || 5,
        comment: r.comment || r.review || r.text || '',
        product: typeof r.product === 'object' ? r.product.name : 'Purchased Item',
        avatar: r.user?.avatar || r.userAvatar || '',
      }))
    : defaultReviews;

  const n = displayReviews.length;

  // ── Aggregate rating summary (shown beside the heading) ──
  const avgRating = n > 0
    ? (displayReviews.reduce((s, r) => s + (Number(r.rating) || 5), 0) / n).toFixed(1)
    : '5.0';
  const avatarStack = displayReviews.slice(0, 4).map((r) => ({
    src: r.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(r.name)}&background=B08D4F&color=fff`,
    alt: r.name,
  }));

  /* ════════ Carousel mechanics — transform-based center stage ════════ */
  // Track is the review set rendered three times so the carousel can slide
  // infinitely: the active card always lives in the middle copy, which means a
  // left AND right neighbor peek exist for every review — including the first
  // and last. After each slide lands, we silently (no transition) re-center
  // into the middle copy — the standard invisible-wrap technique.
  const loopReviews = n >= 2 ? [...displayReviews, ...displayReviews, ...displayReviews] : displayReviews;
  const viewportRef = useRef(null);
  const [active, setActive] = useState(n >= 2 ? n : 0); // start centered in the middle copy
  const [instant, setInstant] = useState(n >= 2); // first paint positions instantly
  const [metrics, setMetrics] = useState({ vw: 0, cardW: 0 });
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef(null);
  const hoverRef = useRef(false);
  const interactAtRef = useRef(0);

  // Card width as a fraction of the viewport: a dominant center card that
  // still leaves the neighboring cards visibly peeking at both screen edges
  // (the swipe-ahead affordance), tightening up to an editorial layout on desktop.
  const cardFactor = () => {
    const w = window.innerWidth;
    if (w >= 1024) return 0.38;
    if (w >= 768) return 0.5;
    if (w >= 640) return 0.66;
    // Mobile: ~72vw center card → ~30-40px of each neighbor peeks at the
    // screen edges, telegraphing "swipe for the next review".
    return 0.72;
  };

  const measure = useCallback(() => {
    const el = viewportRef.current;
    if (!el) return;
    setMetrics({ vw: el.clientWidth, cardW: Math.round(el.clientWidth * cardFactor()) });
  }, []);

  useEffect(() => {
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [measure]);

  const goTo = useCallback((idx) => {
    interactAtRef.current = Date.now();
    setInstant(false);
    setActive(idx);
  }, []);

  // Drag / swipe
  const onPointerDown = (e) => {
    dragStart.current = e.clientX;
    setDragging(true);
    interactAtRef.current = Date.now();
  };
  const onPointerMove = (e) => {
    if (!dragging) return;
    setDragX(e.clientX - dragStart.current);
  };
  const endDrag = () => {
    if (!dragging) return;
    const delta = dragX;
    setDragging(false);
    setDragX(0);
    if (Math.abs(delta) > 55) goTo(active + (delta < 0 ? 1 : -1));
    interactAtRef.current = Date.now();
  };

  // Autoplay — pauses on hover, after user interaction (8s), while dragging,
  // and entirely for reduced-motion users.
  useEffect(() => {
    if (n <= 1) return;
    let reduced = false;
    try { reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { /* older browsers */ }
    if (reduced) return;
    const timer = setInterval(() => {
      if (hoverRef.current || dragging || document.hidden) return;
      if (Date.now() - interactAtRef.current < 8000) return;
      setActive((a) => a + 1); // normalized back into the middle copy by the effect below
    }, 5000);
    return () => clearInterval(timer);
  }, [n, dragging]);

  // Silently re-center into the middle copy whenever the active index drifts
  // out of [n, 2n). Runs after the animated slide has visually landed.
  useEffect(() => {
    if (n < 2) return;
    if (active >= n && active < 2 * n) {
      setInstant(false);
      return;
    }
    setInstant(true);
    setActive((((active % n) + n) % n) + n);
  }, [active, n]);

  // Transform: center the active card in the viewport (plus live drag offset)
  const baseOffset = metrics.vw / 2 - (active * (metrics.cardW + GAP) + metrics.cardW / 2);
  const transform = dragging
    ? `translateX(${baseOffset + dragX}px)`
    : `translateX(${baseOffset}px)`;

  if (n === 0) return null;

  return (
    <section className="py-14 sm:py-24 bg-[#14110E] text-white relative overflow-hidden">
      {/* Warm gold ambient glows */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[640px] h-[320px] rounded-full bg-gold/[0.07] blur-[110px] pointer-events-none" />
      <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-[560px] h-[280px] rounded-full bg-gold/[0.05] blur-[100px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ── Header: eyebrow + headline on the left, social-proof summary right ── */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10 sm:mb-14">
          <div>
            <span className="inline-flex items-center gap-3 text-[11px] sm:text-xs font-medium text-gold-soft uppercase tracking-[0.28em]">
              <span className="w-10 h-px bg-gold" />
              {subtitle}
            </span>
            <h2 className="mt-3 font-editorial text-3xl sm:text-4xl lg:text-5xl font-medium text-white tracking-tight leading-[1.1]">
              {title}
            </h2>
          </div>

          {/* Aggregate rating — avatar stack + stars + score */}
          <div className="flex items-center gap-4 shrink-0">
            <div className="flex -space-x-2.5">
              {avatarStack.map((a, i) => (
                <img
                  key={i}
                  src={a.src}
                  alt={a.alt}
                  loading="lazy"
                  className="w-9 h-9 rounded-full object-cover border-2 border-[#14110E]"
                />
              ))}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <div className="flex items-center text-gold">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-3.5 h-3.5 ${i < Math.round(avgRating) ? 'fill-gold' : 'text-stone-600'}`} />
                  ))}
                </div>
                <span className="text-sm font-bold text-white">{avgRating}</span>
              </div>
              <p className="text-[11px] text-stone-400 font-medium mt-0.5">
                {n} verified {n === 1 ? 'review' : 'reviews'}
              </p>
            </div>
          </div>
        </div>

        {/* ═══ Center-stage carousel ═══ */}
        <div
          ref={viewportRef}
          className="relative"
          style={{ touchAction: 'pan-y' }}
          onMouseEnter={() => { hoverRef.current = true; }}
          onMouseLeave={() => { hoverRef.current = false; endDrag(); }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          <div
            className={`flex items-stretch ${dragging || instant ? '' : 'transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]'}`}
            style={{
              transform,
              gap: GAP,
              opacity: metrics.cardW ? 1 : 0,
              cursor: dragging ? 'grabbing' : 'grab',
            }}
          >
            {loopReviews.map((r, idx) => {
              const isActive = idx === active;
              const dist = Math.abs(idx - active); // linear on the tripled track
              return (
                <article
                  key={idx}
                  aria-hidden={!isActive}
                  className={`shrink-0 select-none rounded-3xl overflow-hidden flex flex-col bg-white transition-all duration-500 ease-out ${
                    isActive
                      ? 'shadow-[0_28px_70px_-18px_rgba(0,0,0,0.65)] ring-1 ring-gold/40'
                      : 'shadow-[0_10px_30px_-12px_rgba(0,0,0,0.5)]'
                  }`}
                  style={{
                    width: metrics.cardW || undefined,
                    // Adjacent cards keep full size (no scale) so their edge peek
                    // stays wide on mobile; depth comes from opacity only.
                    transform: isActive || dist === 1 ? 'scale(1)' : 'scale(0.92)',
                    opacity: isActive ? 1 : dist === 1 ? 0.5 : 0.2,
                    pointerEvents: isActive ? 'auto' : 'none',
                  }}
                >
                  {/* Card body */}
                  <div className="p-7 sm:p-8 flex flex-col flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center text-gold">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-4 h-4 ${i < r.rating ? 'fill-gold' : 'fill-stone-200 text-stone-200'}`} />
                        ))}
                      </div>
                      <Quote className={`w-8 h-8 transition-colors duration-500 ${isActive ? 'text-gold/40' : 'text-gold/15'}`} />
                    </div>

                    {/* Uniform text size on every card — differentiating sizes by
                        active-state changes the tallest card in the stretched row,
                        which made the section height jump on each auto-advance. */}
                    <p className="text-[15px] sm:text-base leading-relaxed text-stone-700">
                      “{r.comment}”
                    </p>
                  </div>

                  {/* Card footer — warm cream strip with identity */}
                  <div className="bg-cream border-t border-stone-100 px-7 sm:px-8 py-4 flex items-center gap-3.5">
                    <img
                      src={r.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(r.name)}&background=B08D4F&color=fff`}
                      alt={r.name}
                      loading="lazy"
                      decoding="async"
                      draggable="false"
                      className="w-10 h-10 rounded-full object-cover border border-stone-200 shadow-sm"
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-semibold text-ink flex items-center gap-1.5">
                        <span className="truncate">{r.name}</span>
                        <ShieldCheck className="w-4 h-4 text-gold-dark shrink-0" aria-label="Verified Buyer" />
                      </h4>
                      <span className="text-[11px] text-stone-500 font-medium block truncate">
                        Purchased: <span className="text-gold-dark font-semibold">{r.product}</span>
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Arrows — always visible: compact glass buttons on mobile, larger on desktop */}
          {n > 1 && (
            <>
              <button
                onClick={() => goTo(active - 1)}
                onPointerDown={(e) => e.stopPropagation()}
                aria-label="Previous review"
                className="absolute top-1/2 -translate-y-1/2 left-1.5 sm:-left-3 lg:-left-6 z-20 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white/[0.09] sm:bg-white/[0.07] backdrop-blur-md border border-white/20 sm:border-white/15 flex items-center justify-center text-white sm:text-stone-300 hover:text-gold-soft hover:border-gold/40 hover:scale-105 transition-all active:scale-90 shadow-lg"
              >
                <ChevronLeft size={17} />
              </button>
              <button
                onClick={() => goTo(active + 1)}
                onPointerDown={(e) => e.stopPropagation()}
                aria-label="Next review"
                className="absolute top-1/2 -translate-y-1/2 right-1.5 sm:-right-3 lg:-right-6 z-20 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white/[0.09] sm:bg-white/[0.07] backdrop-blur-md border border-white/20 sm:border-white/15 flex items-center justify-center text-white sm:text-stone-300 hover:text-gold-soft hover:border-gold/40 hover:scale-105 transition-all active:scale-90 shadow-lg"
              >
                <ChevronRight size={17} />
              </button>
            </>
          )}
        </div>

        {/* Dots — gold pill on active */}
        {n > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            {displayReviews.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(n + i)} // middle-copy index for the shortest slide
                aria-label={`Go to review ${i + 1}`}
                className={`rounded-full transition-all duration-400 ${
                  i === (((active % n) + n) % n) ? 'w-7 h-1.5 bg-gold' : 'w-1.5 h-1.5 bg-white/25 hover:bg-white/40'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
