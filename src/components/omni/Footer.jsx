import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Check, ShieldCheck, Phone, MapPin, Send, Instagram, Facebook, Youtube, Twitter, MessageCircle, ArrowRight } from 'lucide-react';
import { useSettings } from '../../store/useSettings';
import { marketingAPI } from '../../api/marketing';
import { getImageUrl } from '../../utils/formatters';
import toast from '../../utils/toast';

export default function Footer() {
  const { getSetting } = useSettings();
  const siteName = getSetting('storeName', 'Krishna Store');
  // Dark footer → white logo (logoDarkUrl) is the correct variant; fall back to text wordmark
  const footerLogo = getSetting('logoDarkUrl') || null;
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // ── Social links come from admin Settings → Branding (instagram/facebook/
  // twitter/youtube) and Settings → Chat (whatsappButtonNumber/Message).
  // Networks with no URL configured are hidden rather than shown as dead '#'.
  const socials = [
    { icon: Instagram, label: 'Instagram', url: getSetting('instagram', '') },
    { icon: Facebook, label: 'Facebook', url: getSetting('facebook', '') },
    { icon: Twitter, label: 'Twitter', url: getSetting('twitter', '') },
    { icon: Youtube, label: 'YouTube', url: getSetting('youtube', '') },
  ].filter((s) => typeof s.url === 'string' && s.url.trim() && s.url !== '#');

  const waNumber = String(getSetting('whatsappButtonNumber', '') || getSetting('shippingQueryMobile', '')).replace(/[^0-9]/g, '');
  const waMessage = encodeURIComponent(getSetting('whatsappButtonMessage', 'Hi, I need help with my order'));
  if (waNumber.length >= 10) {
    socials.push({ icon: MessageCircle, label: 'WhatsApp', url: `https://wa.me/${waNumber}?text=${waMessage}` });
  }
  // Support phone — from settings with a graceful fallback
  const supportPhone = String(getSetting('shippingQueryMobile', '') || getSetting('whatsappButtonNumber', '') || '+91 98765 43210');

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    try {
      await marketingAPI.subscribe({ email: email.trim() });
      setSubscribed(true);
      toast.success('🎉 Subscribed! Check your email for ₹100 off.');
      setTimeout(() => {
        setSubscribed(false);
        setEmail('');
      }, 4000);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Something went wrong. Try again.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <footer className="bg-[#14110E] text-stone-300 text-xs pt-16 pb-10 border-t border-white/[0.06] relative overflow-hidden">
      {/* Warm gold ambient glow */}
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[720px] h-[360px] rounded-full bg-gold/[0.05] blur-[120px] pointer-events-none" />

      {/* Gold hairline crown — a thin light-catching edge at the very top */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">

        {/* ── Newsletter Banner ── */}
        <div className="bg-gradient-to-br from-[#1E1915] via-[#201B15] to-[#1C1712] p-7 sm:p-10 rounded-3xl border border-white/[0.08] flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-56 h-56 rounded-full bg-gold/[0.08] blur-[80px] pointer-events-none" />
          <div className="absolute -bottom-16 -left-10 w-48 h-48 rounded-full bg-gold/[0.05] blur-[70px] pointer-events-none" />
          <div className="relative max-w-md space-y-1.5 text-center md:text-left">
            <span className="inline-flex items-center gap-2.5 text-[11px] font-medium text-gold-soft uppercase tracking-[0.26em]">
              <span className="w-8 h-px bg-gold/60" />
              Join VIP Club
            </span>
            <h3 className="font-editorial text-2xl sm:text-3xl font-medium text-white tracking-tight">
              Get ₹100 Off Your First Order
            </h3>
            <p className="text-xs text-stone-400 font-light leading-relaxed">
              Subscribe for exclusive flash deal notifications, new arrivals, and direct WhatsApp offers.
            </p>
          </div>

          <form onSubmit={handleSubscribe} className="relative w-full md:w-auto flex flex-col sm:flex-row gap-2.5 min-w-[280px] sm:min-w-[320px]">
            <div className="relative flex-1">
              <Mail className="w-4 h-4 text-gold-soft absolute left-3.5 top-3.5" />
              <input
                type="email"
                id="newsletter-email"
                name="newsletter-email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                autoComplete="email"
                className="w-full pl-10 pr-4 py-3 bg-[#14110E] border border-white/10 rounded-2xl text-xs text-white placeholder-stone-500 outline-none focus:border-gold/60 focus:ring-2 focus:ring-gold/15 transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="px-7 py-3 bg-gold hover:bg-gold-soft text-ink font-semibold uppercase tracking-[0.16em] rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-60 hover:shadow-lg hover:shadow-gold/20 hover:-translate-y-0.5 active:scale-[0.98]"
            >
              {submitting ? (
                <><span className="w-4 h-4 border-2 border-ink/30 border-t-ink rounded-full animate-spin" /> Subscribing...</>
              ) : subscribed ? (
                <><Check className="w-4 h-4" /> Subscribed!</>
              ) : (
                <>Subscribe <Send className="w-3.5 h-3.5" /></>
              )}
            </button>
          </form>
        </div>

        {/* ── Links Grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10 sm:gap-8 pt-4">

          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-5">
            <div className="flex items-center gap-2.5">
              {footerLogo ? (
                <img src={getImageUrl(footerLogo)} alt={siteName} className="h-9 w-auto max-w-[160px] object-contain" />
              ) : (
                <span className="font-editorial text-2xl font-semibold tracking-tight text-white">
                  {siteName}
                  <span className="text-gold">.</span>
                </span>
              )}
            </div>
            <p className="text-xs text-stone-400 leading-relaxed max-w-sm font-light">
              Your everyday mart for toys & games, electronics, home & kitchen, fitness and daily essentials —
              quality-checked products delivered across India with Cash on Delivery & Free Shipping.
            </p>

            {/* Social row — only configured networks render */}
            {socials.length > 0 && (
            <div className="flex items-center gap-2.5 pt-1">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="w-9 h-9 rounded-full bg-white/[0.05] border border-white/10 flex items-center justify-center text-stone-400 transition-all duration-300 hover:bg-gold hover:border-gold hover:text-ink hover:-translate-y-0.5 hover:shadow-lg hover:shadow-gold/20"
                >
                  <s.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
            )}

            <div className="space-y-2.5 text-stone-400 pt-2">
              <div className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-gold-soft shrink-0" />
                <span>Express Dispatch Center • Mumbai & Delhi NCR, India</span>
              </div>
              <a href={`tel:${supportPhone.replace(/[^0-9+]/g, '')}`} className="flex items-center gap-2.5 py-2 -my-2 hover:text-gold-soft transition-colors">
                <Phone className="w-4 h-4 text-gold-soft shrink-0" />
                <span>{supportPhone} (Support 24/7)</span>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-xs font-semibold text-white uppercase tracking-[0.18em] flex items-center gap-2">
              Quick Links
              <span className="flex-1 h-px bg-gradient-to-r from-gold/40 to-transparent" />
            </h4>
            <ul className="space-y-1 text-stone-400">
              {[
                { to: '/', label: 'Home' },
                { to: '/products', label: 'All Products' },
                { to: '/sales', label: 'Hot Deals' },
                { to: '/about', label: 'About Us' },
                { to: '/contact', label: 'Contact Us' },
              ].map((l) => (
                <li key={l.label}>
                  <Link to={l.to} className="group inline-flex items-center gap-2 py-1.5 hover:text-gold-soft transition-colors duration-200">
                    <ArrowRight className="w-3 h-3 text-gold/0 -translate-x-1 group-hover:text-gold group-hover:translate-x-0 transition-all duration-200" />
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Care */}
          <div className="space-y-4">
            <h4 className="text-xs font-semibold text-white uppercase tracking-[0.18em] flex items-center gap-2">
              Customer Care
              <span className="flex-1 h-px bg-gradient-to-r from-gold/40 to-transparent" />
            </h4>
            <ul className="space-y-1 text-stone-400">
              {[
                { to: '/track-order', label: 'Order Tracking' },
                { to: '/return-policy', label: 'Returns & Refunds' },
                { to: '/privacy-policy', label: 'Privacy Policy' },
                { to: '/contact', label: 'Help Center & FAQ' },
              ].map((l) => (
                <li key={l.label}>
                  <Link to={l.to} className="group inline-flex items-center gap-2 py-1.5 hover:text-gold-soft transition-colors duration-200">
                    <ArrowRight className="w-3 h-3 text-gold/0 -translate-x-1 group-hover:text-gold group-hover:translate-x-0 transition-all duration-200" />
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Trust & Payments */}
          <div className="space-y-4">
            <h4 className="text-xs font-semibold text-white uppercase tracking-[0.18em] flex items-center gap-2">
              We Accept
              <span className="flex-1 h-px bg-gradient-to-r from-gold/40 to-transparent" />
            </h4>
            <div className="grid grid-cols-3 gap-2">
              {['UPI', 'Paytm', 'PhonePe', 'RuPay', 'VISA', 'Mastercard'].map((p) => (
                <span
                  key={p}
                  className="p-2 bg-white/[0.04] border border-white/10 rounded-lg text-center text-[11px] font-semibold text-white hover:border-gold/40 hover:bg-white/[0.07] transition-all duration-200"
                >
                  {p}
                </span>
              ))}
            </div>
            <div className="space-y-2 pt-1">
              <div className="flex items-center gap-1.5 text-[11px] text-gold-soft font-medium">
                <ShieldCheck className="w-4 h-4" />
                <span>COD Available · Verified Safe Checkout</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-stone-500">
                <Check className="w-3.5 h-3.5 text-gold" />
                <span>7-day easy returns on all orders</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Copyright bar — single row, no extra buttons (Subscribe is the only bottom CTA) ── */}
        <div className="pt-6 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-3 text-stone-500 text-[11px]">
          <p className="text-center sm:text-left leading-tight">
            © {new Date().getFullYear()} {siteName}
            <span className="hidden sm:inline"> · All rights reserved · Crafted with care in India 🇮🇳</span>
          </p>

          <div className="flex items-center gap-4">
            <Link to="/privacy-policy" className="py-1 hover:text-stone-300 transition-colors">Privacy</Link>
            <Link to="/return-policy" className="py-1 hover:text-stone-300 transition-colors">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
