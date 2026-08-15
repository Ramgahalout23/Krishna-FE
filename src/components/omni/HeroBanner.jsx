import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight, Sparkles, Clock, Truck, ShieldCheck, Star, Zap, CircleDot } from 'lucide-react';
import { getImageUrl } from '../../utils/formatters';

/* ── Decorative floating particles config ── */
const FLOATING_PARTICLES = [
  { id: 1, Icon: Sparkles, size: 14, top: '12%', left: '8%', delay: 0, duration: 7, opacity: 0.12, color: 'text-amber-400/40' },
  { id: 2, Icon: CircleDot, size: 8, top: '25%', left: '92%', delay: 1.5, duration: 9, opacity: 0.1, color: 'text-white/30' },
  { id: 3, Icon: Zap, size: 16, top: '70%', left: '5%', delay: 0.8, duration: 8, opacity: 0.08, color: 'text-amber-500/30' },
  { id: 4, Icon: Star, size: 10, top: '80%', left: '88%', delay: 2.2, duration: 10, opacity: 0.1, color: 'text-amber-300/30' },
  { id: 5, type: 'circle', size: 6, top: '35%', left: '50%', delay: 3.1, duration: 11, opacity: 0.07, color: 'bg-amber-500/20' },
  { id: 6, type: 'circle', size: 4, top: '55%', left: '15%', delay: 0.5, duration: 8.5, opacity: 0.08, color: 'bg-white/20' },
];

export default function HeroBanner({
  banners = [],
  hasActiveSales = false,
  trustFeatures = [
    { icon: 'Truck', label: 'Fast Express Shipping', color: 'text-amber-500' },
    { icon: 'ShieldCheck', label: 'Official Factory Warranties', color: 'text-emerald-400' },
    { icon: 'Star', label: '15,000+ Happy Customers', color: 'text-amber-400' },
    { icon: 'Sparkles', label: '100% Guaranteed Quality', color: 'text-amber-400' },
  ],
}) {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [timeLeft, setTimeLeft] = useState({ hours: 4, minutes: 28, seconds: 45 });
  const [isTransitioning, setIsTransitioning] = useState(false);

  // ── Countdown Timer ──
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

  // ── Default Slides ──
  const defaultSlides = [
    {
      title: 'Welcome to Our Store',
      description: 'Discover premium products curated just for you. Shop the latest trends with free delivery.',
      ctaText: 'Shop Now',
      ctaLink: '/products',
      accentColor: 'from-amber-600 to-amber-900',
      bgImage: '',
      badge: 'New Collection',
    },
    {
      title: 'Amazing Deals Await',
      description: 'Explore exclusive offers on top brands with unbeatable prices and fast shipping.',
      ctaText: 'Explore Deals',
      ctaLink: '/sales',
      accentColor: 'from-sky-700 to-blue-900',
      bgImage: '',
      badge: 'Up to 40% OFF',
    },
    {
      title: 'New Arrivals Weekly',
      description: 'Stay ahead of the curve with our latest collections dropping every week.',
      ctaText: 'View New Arrivals',
      ctaLink: '/products',
      accentColor: 'from-emerald-700 to-stone-900',
      bgImage: '',
      badge: 'New Arrivals',
    },
  ];

  // ── Build Slides ──
  const slides = banners.length > 0
    ? banners.map(b => ({
        title: b.title || 'Welcome to Our Store',
        description: b.subtitle || b.description || '',
        ctaText: b.cta || b.buttonText || 'Shop Now',
        ctaLink: b.linkUrl || '/products',
        accentColor: 'from-amber-600 to-amber-900',
        bgImage: getImageUrl(b.imageUrl || b.image || ''),
        badge: b.tagline || '',
        displayMode: b.displayMode || 'DEFAULT',
      }))
    : defaultSlides;

  const slideCount = slides.length;
  const current = slides[currentSlide];

  // ── Navigation ──
  const goToSlide = (idx) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    // React setState natively handles both direct values and updater functions
    setCurrentSlide(idx);
    setTimeout(() => setIsTransitioning(false), 700);
  };

  // Use functional updater to avoid stale closure bugs with auto-play
  const nextSlide = () => goToSlide((prev) => (prev + 1) % slideCount);
  const prevSlide = () => goToSlide((prev) => (prev - 1 + slideCount) % slideCount);

  // ── Auto-play ──
  useEffect(() => {
    if (slideCount <= 1) return;
    const timer = setInterval(nextSlide, 6000);
    return () => clearInterval(timer);
  }, [slideCount, currentSlide]);

  return (
    <section className="relative bg-stone-900 text-white overflow-hidden">
      {/* ═══════ Background Layer ═══════ */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Background Image with Ken Burns zoom */}
        <div
          key={`bg-${currentSlide}`}
          className="absolute inset-0 animate-ken-burns"
        >
          {current.bgImage ? (
            <img
              src={current.bgImage}
              alt={current.title}
              // Hero image is the LCP element — load it eagerly and mark it
              // high priority so it paints before below-the-fold content.
              fetchPriority="high"
              decoding="async"
              className={`w-full h-full object-cover object-center ${
                current.displayMode === 'IMAGE_ONLY' ? 'opacity-100' : 'opacity-40'
              }`}
            />
          ) : (
            <div className="w-full h-full bg-stone-950" />
          )}
        </div>

        {/* Gradient overlays — skip for IMAGE_ONLY banners so the image shows clean */}
        {current.displayMode !== 'IMAGE_ONLY' && (
          <>
            <div className={`absolute inset-0 bg-gradient-to-r ${current.accentColor} opacity-75 mix-blend-multiply`} />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-900/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-b from-stone-950/30 via-transparent to-stone-950/50" />

            {/* ── Decorative Floating Particles ── */}
            {FLOATING_PARTICLES.map((p) => (
              <div
                key={p.id}
                className="absolute pointer-events-none"
                style={{
                  top: p.top,
                  left: p.left,
                  animation: `floatParticle ${p.duration}s ease-in-out ${p.delay}s infinite`,
                  opacity: p.opacity,
                }}
              >
                {p.type === 'circle' ? (
                  <div className={`rounded-full ${p.color}`} style={{ width: p.size, height: p.size }} />
                ) : (
                  <p.Icon className={`${p.color}`} style={{ width: p.size, height: p.size }} />
                )}
              </div>
            ))}

            {/* Subtle radial glow overlay */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full bg-amber-500/5 blur-[100px] pointer-events-none" />
          </>
        )}
      </div>

      {/* ═══════ Content Layer ═══════ */}
      <div className={`relative max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 lg:py-10 flex flex-col justify-between ${
        current.displayMode === 'IMAGE_ONLY' ? 'min-h-[220px] sm:min-h-[340px] lg:min-h-[480px]' : 'min-h-[260px] sm:min-h-[380px] lg:min-h-[500px]'
      }`}>

        {/* ── Text Content — hidden for IMAGE_ONLY banners ── */}
        {current.displayMode !== 'IMAGE_ONLY' && (
          <div key={`content-${currentSlide}`} className="max-w-2xl space-y-1.5 sm:space-y-2">
            {/* Badge — shimmer effect with inline styles for combined animation */}
            {current.badge && (
              <span
                className="inline-flex items-center gap-1.5 bg-amber-500/20 backdrop-blur-md border border-amber-400/30 text-amber-300 px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-display tracking-wide"
                style={{
                  opacity: 0,
                  animation: 'shimmerSlow 3s ease-in-out infinite, textRevealUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.1s forwards',
                }}
              >
                <Sparkles className="w-3 h-3 text-amber-400 animate-spin-slow" />
                <span>{current.badge}</span>
              </span>
            )}

            {/* Title */}
            <h1
              className="text-2xl sm:text-4xl lg:text-5xl font-display font-bold tracking-tight text-white leading-tight drop-shadow-sm animate-text-reveal-stagger-2 opacity-0"
            >
              {current.title}
            </h1>

            {/* Description */}
            <p
              className="text-xs sm:text-sm text-stone-200 leading-relaxed max-w-xl line-clamp-2 sm:line-clamp-none animate-text-reveal-stagger-3 opacity-0"
            >
              {current.description}
            </p>

            {/* Buttons */}
            <div className="pt-1 flex flex-wrap items-center gap-2 animate-text-reveal-stagger-4 opacity-0">
              <button
                onClick={() => navigate(current.ctaLink)}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-[11px] uppercase tracking-wider rounded-full shadow-lg transition-all flex items-center gap-1.5 group animate-pulse-glow"
              >
                {current.ctaText}
                <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </button>
              {hasActiveSales && (
                <button
                  onClick={() => navigate('/sales')}
                  className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white font-semibold text-[11px] rounded-full border border-white/20 backdrop-blur-sm transition-colors"
                >
                  Featured Deals
                </button>
              )}
            </div>
          </div>
        )}

        {/* ═══════ Bottom Bar: Timer & Slide Nav ═══════ */}
        <div className="pt-3 mt-3 border-t border-white/10 flex items-center justify-between gap-2">

          {/* Flash Sale Timer */}
          {hasActiveSales && (
            <div className="flex items-center gap-2 bg-stone-950/70 border border-white/15 px-3 py-1.5 rounded-xl backdrop-blur-md">
              <div className="p-1 bg-amber-500/20 text-amber-400 rounded-md">
                <Clock className="w-3.5 h-3.5" />
              </div>
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Flash Sale:</span>
                <div className="text-[11px] sm:text-xs font-bold font-mono text-white flex items-center gap-1">
                  <span className="bg-stone-800 px-1.5 py-0.5 rounded text-amber-400">{String(timeLeft.hours).padStart(2, '0')}h</span>
                  :
                  <span className="bg-stone-800 px-1.5 py-0.5 rounded text-amber-400">{String(timeLeft.minutes).padStart(2, '0')}m</span>
                  :
                  <span className="bg-stone-800 px-1.5 py-0.5 rounded text-amber-400">{String(timeLeft.seconds).padStart(2, '0')}s</span>
                </div>
              </div>
            </div>
          )}

          {/* Slide Navigation */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => goToSlide(idx)}
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    currentSlide === idx ? 'w-6 bg-amber-400 shadow-sm shadow-amber-400/50' : 'w-1.5 bg-white/30 hover:bg-white/50'
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={prevSlide}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all hover:scale-110 active:scale-95"
                aria-label="Previous"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={nextSlide}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all hover:scale-110 active:scale-95"
                aria-label="Next"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════ Trust Strip — hidden for IMAGE_ONLY banners ═══════ */}
      {current.displayMode !== 'IMAGE_ONLY' && (
        <div className="relative bg-stone-950/80 backdrop-blur-md border-t border-stone-800 py-2 text-stone-300 text-[11px]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-2 text-center sm:text-left">
            {trustFeatures.map((feat, idx) => {
              const IconComponent = {
                Truck, ShieldCheck, Star, Sparkles,
              }[feat.icon] || Truck;
              return (
                <div
                  key={idx}
                  className="flex items-center justify-center sm:justify-start gap-1.5 group"
                >
                  <IconComponent className={`w-3.5 h-3.5 ${feat.color || 'text-amber-500'} transition-transform duration-300 group-hover:scale-110`} />
                  <span className="transition-colors duration-300 group-hover:text-white">{feat.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
