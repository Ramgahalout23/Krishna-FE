import { ChevronDown, MapPin, ArrowRight, Truck, RotateCcw, ShieldCheck, MessageCircle, Sparkles, Clock, Heart, Instagram, Facebook, Twitter, Youtube, Send } from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { useSettings } from '../../store/useSettings';
import { getImageUrl } from '../../utils/formatters';

/* ═══════════════════════════════════════════════════════
   PREMIUM FOOTER — Amber (#f59e0b) Themed
   ═══════════════════════════════════════════════════════ */

const ACCENT = '#f59e0b';
const ACCENT_GLOW = 'rgba(245, 158, 11, 0.25)';
const BG_DARK = '#1c1917';
const TEXT_WHITE = 'rgba(255,255,255,1)';
const TEXT_LIGHT = 'rgba(255,255,255,0.8)';
const TEXT_DIM = 'rgba(255,255,255,0.55)';
const TEXT_MUTED = 'rgba(255,255,255,0.35)';
const BORDER_LIGHT = 'rgba(255,255,255,0.08)';
const BORDER_DIM = 'rgba(255,255,255,0.05)';

/* ─────────────────────────────────────────────
   UTILITY: Social Icon SVG
   ───────────────────────────────────────────── */
function SocialIcon({ platform, url }) {
  const icons = {
    IG: <Instagram size={18} />,
    FB: <Facebook size={18} />,
    TW: <Twitter size={18} />,
    YT: <Youtube size={18} />,
  };

  return (
    <motion.a
      href={url || '#'}
      target="_blank"
      rel="noopener noreferrer"
      className="relative flex items-center justify-center w-11 h-11 rounded-xl overflow-hidden"                    style={{ background: 'rgba(255,255,255,0.06)' }}                    whileHover={{ scale: 1.1, background: 'rgba(255,255,255,0.12)' }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 15 }}
    >
      <span className="relative z-10" style={{ color: TEXT_WHITE }}>
        {icons[platform] || <MessageCircle size={18} />}
      </span>
    </motion.a>
  );
}

/* ─────────────────────────────────────────────
   BRAND ASSURANCE — Premium strip with glass icons
   ───────────────────────────────────────────── */
function BrandAssurance({ features }) {
  const [slideIndex, setSlideIndex] = useState(0);
  const nextSlide = useCallback(() => {
    setSlideIndex((prev) => (prev + 2 >= features.length ? 0 : prev + 2));
  }, [features.length]);

  useEffect(() => {
    if (features.length <= 2) return;
    const timer = setInterval(nextSlide, 4000);
    return () => clearInterval(timer);
  }, [nextSlide, features.length]);

  return (
    <div style={{ background: 'rgba(0,0,0,0.25)', borderBottom: `1px solid ${BORDER_LIGHT}` }}>
      {/* Top accent line */}
      <div className="h-[2px] w-full" style={{ background: `linear-gradient(90deg, transparent, ${ACCENT}, transparent)` }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* MOBILE: 2 rotating items */}
        <div className="md:hidden overflow-hidden py-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={slideIndex}
              initial={{ opacity: 0, x: 25 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -25 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="grid grid-cols-2 gap-3"
            >
              {features.slice(slideIndex, slideIndex + 2).map((item, idx) => (
                <FeatureCard key={idx} item={item} />
              ))}
            </motion.div>
          </AnimatePresence>
          <div className="flex justify-center gap-1.5 mt-3">
            {Array.from({ length: Math.ceil(features.length / 2) }).map((_, idx) => (
              <motion.button
                key={idx}
                className="rounded-full"
                style={{ background: idx === Math.floor(slideIndex / 2) ? ACCENT : 'rgba(255,255,255,0.2)' }}
                animate={{ width: idx === Math.floor(slideIndex / 2) ? 20 : 6, height: 6 }}
                onClick={() => setSlideIndex(idx * 2)}
                aria-label={`Slide ${idx + 1}`}
                layout
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              />
            ))}
          </div>
        </div>

        {/* DESKTOP: 4 items in a row */}
        <div className="hidden md:grid md:grid-cols-4">
          {features.map((item, idx) => (
            <div
              key={idx}
              className="group relative flex items-center gap-4 py-8 px-6 transition-all duration-300 cursor-default"
              style={{ borderRight: idx < 3 ? `1px solid ${BORDER_LIGHT}` : 'none' }}
            >
              <div className="relative">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3"
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                  }}
                >
                  <item.icon size={22} style={{ color: ACCENT }} />
                </div>
              </div>
              <div>
                <div className="text-sm font-semibold leading-tight mb-0.5" style={{ color: TEXT_WHITE }}>
                  {item.title}
                </div>
                <div className="text-xs leading-relaxed" style={{ color: TEXT_DIM }}>
                  {item.desc}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   FEATURE CARD — Reusable for mobile
   ───────────────────────────────────────────── */
function FeatureCard({ item }) {
  return (
    <div
      className="flex items-center gap-3 px-4 py-4 rounded-2xl transition-all duration-300"
      style={{
        background: 'rgba(255,255,255,0.08)',
        border: '1px solid rgba(255,255,255,0.1)',
        backdropFilter: 'blur(10px)',
      }}
    >
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(255,184,0,0.2)' }}>
        <item.icon size={18} style={{ color: ACCENT }} />
      </div>
      <div className="min-w-0">
        <div className="text-[11px] font-semibold leading-tight truncate" style={{ color: TEXT_WHITE }}>
          {item.title}
        </div>
        <div className="text-[9px] mt-0.5 truncate leading-relaxed" style={{ color: TEXT_DIM }}>
          {item.desc}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MOBILE ACCORDION — Refined with yellow accent
   ───────────────────────────────────────────── */
function MobileAccordion({ title, children }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div style={{ borderBottom: `1px solid ${BORDER_DIM}` }}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        className="flex items-center justify-between w-full py-4 px-0 text-xs font-semibold uppercase tracking-[0.12em] cursor-pointer select-none bg-transparent border-none"
        style={{ color: TEXT_LIGHT }}
      >
        {title}
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          style={{ color: isOpen ? ACCENT : TEXT_MUTED }}
        >
          <ChevronDown size={14} />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="pb-4 px-0 flex flex-col gap-3 text-sm" style={{ color: TEXT_DIM }}>
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─────────────────────────────────────────────
   NAV LINK — Reusable styled link
   ───────────────────────────────────────────── */
function NavLink({ to, children, className = '' }) {
  const [hovered, setHovered] = useState(false);
  const content = (
    <span
      className="relative inline-block transition-all duration-200"
      style={{ color: hovered ? TEXT_WHITE : TEXT_DIM }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children}
      <span
        className="absolute -bottom-0.5 left-0 h-px transition-all duration-300 ease-out"
        style={{
          background: ACCENT,
          width: hovered ? '100%' : 0,
          opacity: 0.7,
        }}
      />
    </span>
  );

  if (to) {
    return <Link to={to} className={`w-fit ${className}`}>{content}</Link>;
  }
  return <span className={`cursor-pointer w-fit ${className}`}>{content}</span>;
}

/* ─────────────────────────────────────────────
   SECTION REVEAL — Fade-in-up on viewport entry
   ───────────────────────────────────────────── */
function SectionReveal({ children, delay = 0, className = '' }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-40px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN FOOTER
   ═══════════════════════════════════════════════════════ */
export default function Footer() {
  const { t } = useTranslation();
  const { getSetting } = useSettings();
  const siteName = getSetting('storeName', 'Krishna Store');
  const brandTagline = getSetting('footerBrandTagline', "India's premium destination for spiritual and lifestyle products. Quality craftsmanship, divine designs, and unbeatable value.");
  const settingsLogo = getSetting('logoDarkUrl') || getSetting('logoUrl') || null;
  const storeAddress = getSetting('storeAddress', 'Bangalore, Karnataka, India');
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(storeAddress)}`;
  const freeShippingThreshold = Number(getSetting('freeShippingThreshold', '499'));

  const socialLinks = [
    { platform: 'IG', url: getSetting('instagram', '#') },
    { platform: 'FB', url: getSetting('facebook', '#') },
    { platform: 'TW', url: getSetting('twitter', '#') },
    { platform: 'YT', url: getSetting('youtube', '#') },
  ];

  const features = [
    { icon: Truck, title: t('footer.free_shipping'), desc: t('footer.above_amount', { amount: `₹${freeShippingThreshold}` }) },
    { icon: RotateCcw, title: t('footer.easy_returns'), desc: t('footer.returns_days', '7-day return policy') },
    { icon: ShieldCheck, title: t('footer.secure_payment'), desc: t('footer.secure_transactions', '100% secure transactions') },
    { icon: MessageCircle, title: t('footer.support_247'), desc: t('footer.dedicated_support', 'Dedicated customer service') },
  ];

  const paymentMethods = ['Visa', 'MC', 'UPI', 'RZP', 'COD'];
  const [hoveredLegal, setHoveredLegal] = useState(null);

  const shopLinks = [
    { to: '/products?category=oversized', label: t('footer.shop.oversized') },
    { to: '/products?category=graphic', label: t('footer.shop.graphic') },
    { to: '/products?category=polo', label: t('footer.shop.polo') },
    { to: '/products?category=plain', label: t('footer.shop.plain') },
    { to: '/products?category=combo', label: t('footer.shop.combo') },
  ];

  const helpLinks = [
    { to: '/track-order', label: t('footer.help.track') },
    { to: '/about', label: t('footer.help.about') },
    { to: '/contact', label: t('footer.help.contact') },
  ];

  const infoLinks = [
    { key: 'size_guide', label: t('footer.help.size_guide') },
    { key: 'shipping_info', label: t('footer.help.shipping_info') },
    { to: '/return-policy', label: t('footer.help.returns') },
    { to: '/privacy-policy', label: t('footer.help.privacy') },
  ];

  return (
    <footer className="mt-auto pb-[70px] md:pb-0" style={{ background: BG_DARK, color: TEXT_DIM, position: 'relative', overflow: 'hidden' }}>
      {/* Decorative gradient overlay at top */}
      <div className="absolute inset-x-0 top-0 h-32 pointer-events-none" style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.15) 0%, transparent 100%)' }} />

      {/* ═══ BRAND ASSURANCE STRIP ═══ */}
      <SectionReveal delay={0}>
        <BrandAssurance features={features} />
      </SectionReveal>

      {/* ═══ MAIN FOOTER CONTENT ═══ */}
      <SectionReveal delay={0.1}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">

        {/* ── MOBILE LAYOUT ── */}
        <div className="md:hidden py-8">
          {/* Brand top section */}
          <div className="text-center pb-6" style={{ borderBottom: `1px solid ${BORDER_LIGHT}` }}>
            <Link to="/" className="inline-flex items-center justify-center mb-4 group">
              {settingsLogo ? (
                <motion.div
                  className="h-10 flex items-center"
                  whileHover={{ scale: 1.03 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 10 }}
                >
                  <img loading="lazy" src={getImageUrl(settingsLogo)}
                    alt={siteName}
                    className="h-full w-auto max-w-[180px] object-contain brightness-0 invert"
                    onError={(e) => { e.target.style.display = 'none'; }} />
                </motion.div>
              ) : (
                <span className="font-display text-2xl font-bold tracking-tight" style={{ color: TEXT_WHITE }}>
                  {siteName}
                </span>
              )}
            </Link>
            <p className="text-xs leading-relaxed max-w-xs mx-auto mb-5" style={{ color: TEXT_DIM }}>
              {brandTagline}
            </p>
            <div className="flex justify-center gap-3 mb-4">
              {socialLinks.map((social, idx) => (
                <SocialIcon key={idx} platform={social.platform} url={social.url} />
              ))}
            </div>
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 text-xs transition-colors duration-200 group"
              style={{ color: TEXT_DIM }}
            >
              <MapPin size={12} />
              <span className="transition-colors duration-200 group-hover:text-white">{storeAddress}</span>
            </a>
          </div>

          {/* Accordion links */}
          <div className="pt-2">
            <MobileAccordion title={t('footer.shop')}>
              {shopLinks.map((link, idx) => (
                <Link key={idx} to={link.to} className="transition-all duration-200 hover:text-white w-fit hover:pl-1">
                  {link.label}
                </Link>
              ))}
            </MobileAccordion>
            <MobileAccordion title={t('footer.help')}>
              {helpLinks.map((link, idx) => (
                <Link key={idx} to={link.to} className="transition-all duration-200 hover:text-white w-fit hover:pl-1">
                  {link.label}
                </Link>
              ))}
              {infoLinks.map((item, idx) => (
                item.to ? (
                  <Link key={idx} to={item.to} className="transition-all duration-200 hover:text-white w-fit hover:pl-1">
                    {item.label}
                  </Link>
                ) : (
                  <span key={idx} className="transition-all duration-200 hover:text-white w-fit hover:pl-1 cursor-pointer">
                    {item.label}
                  </span>
                )
              ))}
            </MobileAccordion>
          </div>

          {/* Mobile newsletter */}
          <div
            className="rounded-2xl p-5 mt-6"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={14} style={{ color: ACCENT }} />
              <h4 className="text-xs font-semibold uppercase tracking-wider" style={{ color: TEXT_WHITE }}>
                {t('footer.newsletter.title')}
              </h4>
            </div>
            <p className="text-xs mb-4" style={{ color: TEXT_DIM }}>
              {t('footer.newsletter.subtitle')}
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                id="footer-email-mobile"
                name="email"
                placeholder={t('footer.newsletter.placeholder')}
                className="flex-1 rounded-xl px-4 py-3 text-xs focus:outline-none transition-all duration-200 min-w-0"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: TEXT_WHITE,
                }}
                autoComplete="email"
              />
              <motion.button
                className="px-5 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 whitespace-nowrap"
                style={{ background: ACCENT, color: '#1A1A2E' }}
                whileHover={{ scale: 1.03, boxShadow: `0 4px 20px ${ACCENT_GLOW}` }}
                whileTap={{ scale: 0.97 }}
              >
                {t('footer.newsletter.join')} <ArrowRight size={14} />
              </motion.button>
            </div>
          </div>
        </div>

        {/* ── DESKTOP LAYOUT ── */}
        <div className="hidden md:grid md:grid-cols-12 gap-0 py-16">
          {/* Brand Column — spans 4 */}
          <motion.div
            className="col-span-4 pr-12"
            style={{ borderRight: `1px solid ${BORDER_LIGHT}` }}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <Link to="/" className="inline-flex items-center mb-6 group">
              {settingsLogo ? (
                <motion.div
                  className="h-12 sm:h-14 flex items-center"
                  whileHover={{ scale: 1.03 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 10 }}
                >
                  <img loading="lazy" src={getImageUrl(settingsLogo)}
                    alt={siteName}
                    className="h-full w-auto max-w-[220px] object-contain brightness-0 invert"
                    onError={(e) => { e.target.style.display = 'none'; }} />
                </motion.div>
              ) : (
                <span className="font-display text-3xl font-bold tracking-tight" style={{ color: TEXT_WHITE }}>
                  {siteName}
                </span>
              )}
            </Link>

            <p className="text-sm leading-relaxed mb-6 max-w-sm" style={{ color: TEXT_DIM }}>
              {brandTagline}
            </p>

            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-2.5 mb-6 transition-colors duration-200 group"
              style={{ color: TEXT_DIM }}
            >
              <MapPin size={15} className="shrink-0 mt-0.5" />
              <span className="text-sm leading-relaxed transition-colors duration-200 group-hover:text-white">
                {storeAddress}
              </span>
            </a>

            <div className="flex gap-3">
              {socialLinks.map((social, idx) => (
                <SocialIcon key={idx} platform={social.platform} url={social.url} />
              ))}
            </div>
          </motion.div>

          {/* Shop Links — spans 2 */}
          <motion.div
            className="col-span-2 pl-10"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.5, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <h4 className="text-xs font-bold mb-7 uppercase tracking-[0.15em]" style={{ color: ACCENT }}>
              {t('footer.shop')}
            </h4>
            <div className="flex flex-col gap-3.5 text-sm">
              {shopLinks.map((link, idx) => (
                <NavLink key={idx} to={link.to}>{link.label}</NavLink>
              ))}
            </div>
          </motion.div>

          {/* Help Links — spans 2 */}
          <motion.div
            className="col-span-2 pl-10"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.5, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <h4 className="text-xs font-bold mb-7 uppercase tracking-[0.15em]" style={{ color: ACCENT }}>
              {t('footer.help')}
            </h4>
            <div className="flex flex-col gap-3.5 text-sm">
              {helpLinks.map((link, idx) => (
                <NavLink key={idx} to={link.to}>{link.label}</NavLink>
              ))}
              <div className="h-2" />
              {infoLinks.map((item, idx) => (
                <NavLink key={idx} to={item.to}>{item.label}</NavLink>
              ))}
            </div>
          </motion.div>

          {/* Newsletter — spans 4 */}
          <motion.div
            className="col-span-4 pl-10"
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.5, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <div
              className="rounded-2xl p-8 h-full"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,184,0,0.2)' }}>
                  <Sparkles size={16} style={{ color: ACCENT }} />
                </div>
                <h4 className="text-sm font-bold uppercase tracking-wider" style={{ color: TEXT_WHITE }}>
                  {t('footer.newsletter.title')}
                </h4>
              </div>
              <p className="text-sm leading-relaxed mb-5" style={{ color: TEXT_DIM }}>
                {t('footer.newsletter.desktop_subtitle')}
              </p>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <input
                    type="email"
                    id="footer-email-desktop"
                    name="email"
                    placeholder={t('footer.newsletter.placeholder_desktop')}
                    className="w-full rounded-xl px-4 py-3.5 text-sm focus:outline-none transition-all duration-200"
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      color: TEXT_WHITE,
                    }}
                    autoComplete="email"
                    onFocus={(e) => { e.target.style.borderColor = ACCENT; }}
                    onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.15)'; }}
                  />
                </div>
                <motion.button
                  className="px-7 py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 whitespace-nowrap"
                  style={{ background: ACCENT, color: '#1A1A2E', boxShadow: `0 4px 20px ${ACCENT_GLOW}` }}
                  whileHover={{ scale: 1.03, boxShadow: `0 6px 30px ${ACCENT_GLOW}` }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Send size={16} />
                  {t('footer.newsletter.join')}
                </motion.button>
              </div>
              <p className="text-[11px] mt-3 flex items-center gap-1.5" style={{ color: TEXT_MUTED }}>
                <Clock size={11} />
                No spam, unsubscribe anytime.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
      </SectionReveal>

      {/* ═══ BOTTOM BAR ═══ */}
      <SectionReveal delay={0.2}>
      <div style={{ borderTop: `1px solid ${BORDER_LIGHT}`, background: 'rgba(0,0,0,0.2)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 md:py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 md:gap-6">
            {/* Copyright */}
            <div className="flex items-center gap-2.5 order-3 md:order-1">
              <Heart size={12} fill={ACCENT} color={ACCENT} />
              <span className="text-[11px] md:text-xs tracking-wide" style={{ color: TEXT_DIM }}>
                © {new Date().getFullYear()} {siteName}. {t('footer.bottom.made_with')}{' '}
                <span style={{ color: ACCENT }}>♥</span>
              </span>
            </div>

            {/* Legal links */}
            <div className="flex items-center gap-5 md:gap-7 order-2">
              {[
                { key: 'privacy', label: t('footer.bottom.privacy') },
                { key: 'terms', label: t('footer.bottom.terms') },
                { key: 'return_policy', label: t('footer.bottom.return_policy') },
              ].map((link, idx) => {
                const active = hoveredLegal === link.key;
                return (
                  <button
                    key={idx}
                    className="text-[11px] md:text-xs transition-all duration-300 relative bg-transparent border-none cursor-pointer"
                    style={{
                      color: active ? TEXT_WHITE : TEXT_MUTED,
                    }}
                    onMouseEnter={() => setHoveredLegal(link.key)}
                    onMouseLeave={() => setHoveredLegal(null)}
                  >
                    <span className="transition-colors duration-200">{link.label}</span>
                    <span
                      className="absolute -bottom-0.5 left-0 transition-all duration-300 ease-out"
                      style={{
                        background: ACCENT,
                        height: 1,
                        width: active ? '100%' : 0,
                        opacity: 0.7,
                      }}
                    />
                  </button>
                );
              })}
            </div>

            {/* Payment methods */}
            <div className="flex items-center gap-2 order-1 md:order-3">
              <div className="flex items-center gap-2">
                {paymentMethods.map((method, idx) => (
                  <span
                    key={idx}
                    className="text-[9px] md:text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all duration-200 hover:scale-105"
                    style={{
                      color: TEXT_DIM,
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    {method}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      </SectionReveal>
    </footer>
  );
}
