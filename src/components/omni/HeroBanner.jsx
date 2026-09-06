import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { getImageUrl } from '../../utils/formatters';

export default function HeroBanner({
  banners = [],
}) {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // ── Default Slides ──
  const defaultSlides = [
    {
      title: 'Welcome to Our Store',
      description: 'Discover premium products curated just for you. Shop the latest trends with free delivery.',
      ctaText: 'Shop Now',
      ctaLink: '/products',
      accentColor: 'from-amber-700 to-stone-950',
      bgImage: '',
      badge: 'New Collection',
    },
    {
      title: 'Amazing Deals Await',
      description: 'Explore exclusive offers on top brands with unbeatable prices and fast shipping.',
      ctaText: 'Explore Deals',
      ctaLink: '/sales',
      accentColor: 'from-stone-800 to-stone-950',
      bgImage: '',
      badge: 'Up to 40% OFF',
    },
    {
      title: 'New Arrivals Weekly',
      description: 'Stay ahead of the curve with our latest collections dropping every week.',
      ctaText: 'View New Arrivals',
      ctaLink: '/products',
      accentColor: 'from-stone-900 to-stone-950',
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
        accentColor: 'from-amber-700 to-stone-950',
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
    setCurrentSlide(idx);
    setTimeout(() => setIsTransitioning(false), 700);
  };

  const nextSlide = () => goToSlide((currentSlide + 1) % slideCount);
  const prevSlide = () => goToSlide((currentSlide - 1 + slideCount) % slideCount);

  // ── Auto-play ──
  useEffect(() => {
    if (slideCount <= 1) return;
    const timer = setInterval(nextSlide, 6000);
    return () => clearInterval(timer);
  }, [slideCount, currentSlide]);

  return (
    <section className="relative bg-ink text-white overflow-hidden">
      {/* ═══════ Background Layer ═══════ */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Background image with slow Ken Burns drift */}
        <div key={`bg-${currentSlide}`} className="absolute inset-0 animate-ken-burns">
          {current.bgImage ? (
            <img
              src={current.bgImage}
              alt={current.title}
              fetchPriority="high"
              decoding="async"
              className={`w-full h-full object-cover object-center ${
                current.displayMode === 'IMAGE_ONLY' ? 'opacity-100' : 'opacity-45'
              }`}
            />
          ) : (
            <div className="w-full h-full bg-stone-950" />
          )}
        </div>

        {/* Elegant warm scrims — deep espresso, not flat black */}
        {current.displayMode !== 'IMAGE_ONLY' && (
          <>
            <div className={`absolute inset-0 bg-gradient-to-r ${current.accentColor} opacity-70 mix-blend-multiply`} />
            <div className="absolute inset-0 bg-gradient-to-t from-[#14110E] via-[#14110E]/55 to-[#14110E]/20" />
            <div className="absolute inset-0 bg-gradient-to-b from-[#14110E]/40 via-transparent to-[#14110E]/60" />
            {/* Warm gold ambient glow */}
            <div className="absolute -top-24 right-[-10%] w-[480px] h-[480px] rounded-full bg-gold/10 blur-[120px] pointer-events-none" />
          </>
        )}
      </div>

      {/* ═══════ Content Layer ═══════ */}
      <div className={`relative max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-14 flex flex-col justify-between ${
        current.displayMode === 'IMAGE_ONLY' ? 'min-h-[170px] sm:min-h-[320px] lg:min-h-[480px]' : 'min-h-[240px] sm:min-h-[380px] lg:min-h-[540px]'
      }`}>

        {current.displayMode !== 'IMAGE_ONLY' && (
          <div key={`content-${currentSlide}`} className="max-w-2xl space-y-3 sm:space-y-4 pt-4 sm:pt-6">
            {/* Refined gold badge */}
            {current.badge && (
              <span
                className="inline-flex items-center gap-2 text-gold-soft text-[11px] sm:text-xs font-medium uppercase tracking-[0.28em] border border-gold/40 rounded-full px-4 py-1.5 backdrop-blur-sm bg-white/[0.04]"
                style={{ opacity: 0, animation: 'textRevealUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.1s forwards' }}
              >
                <span className="w-1 h-1 rounded-full bg-gold" />
                {current.badge}
              </span>
            )}

            {/* Editorial serif headline */}
            <h1
              className="font-editorial text-[34px] leading-[1.08] sm:text-5xl lg:text-6xl font-medium tracking-tight text-white opacity-0"
              style={{ animation: 'textRevealUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.25s forwards' }}
            >
              {current.title}
            </h1>

            {/* Description */}
            <p
              className="text-sm sm:text-base text-stone-200/90 leading-relaxed max-w-xl font-light line-clamp-2 sm:line-clamp-none opacity-0"
              style={{ animation: 'textRevealUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.4s forwards' }}
            >
              {current.description}
            </p>

            {/* Buttons */}
            <div className="pt-1 flex flex-wrap items-center gap-3 opacity-0" style={{ animation: 'textRevealUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.55s forwards' }}>
              <button
                onClick={() => navigate(current.ctaLink)}
                className="group inline-flex items-center gap-2 px-7 py-3.5 bg-gold text-ink text-[12px] font-semibold uppercase tracking-[0.18em] rounded-full shadow-lg shadow-gold/20 transition-all duration-300 hover:bg-gold-soft hover:shadow-gold/40 hover:-translate-y-0.5 active:translate-y-0"
              >
                {current.ctaText}
                <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        )}

        {/* ═══════ Bottom Bar: Slide Nav ═══════ */}
        <div className="pt-4 mt-2 flex items-center justify-end gap-4">
          {/* Elegant thin-line indicators */}
          <div className="hidden sm:flex items-center gap-1.5">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => goToSlide(idx)}
                className={`h-px rounded-full transition-all duration-500 ${
                  currentSlide === idx ? 'w-8 bg-gold' : 'w-4 bg-white/25 hover:bg-white/50'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={prevSlide}
              className="w-8 h-8 rounded-full border border-white/20 hover:border-white/50 hover:bg-white/10 text-white transition-all duration-300 flex items-center justify-center active:scale-95"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={nextSlide}
              className="w-8 h-8 rounded-full border border-white/20 hover:border-white/50 hover:bg-white/10 text-white transition-all duration-300 flex items-center justify-center active:scale-95"
              aria-label="Next slide"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

