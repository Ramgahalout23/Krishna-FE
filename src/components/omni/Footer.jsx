import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Check, ShieldCheck, Phone, MapPin, Send } from 'lucide-react';
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
    <footer className="bg-[#14110E] text-stone-300 text-xs pt-16 pb-12 border-t border-white/[0.06] relative overflow-hidden">
      {/* Warm gold ambient glow */}
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[720px] h-[360px] rounded-full bg-gold/[0.05] blur-[120px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">

        {/* Newsletter Banner */}
        <div className="bg-gradient-to-br from-[#1E1915] via-[#201B15] to-[#1C1712] p-8 sm:p-10 rounded-3xl border border-white/[0.08] flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-56 h-56 rounded-full bg-gold/[0.08] blur-[80px] pointer-events-none" />
          <div className="relative max-w-md space-y-1.5">
            <span className="inline-flex items-center gap-2.5 text-[11px] font-medium text-gold-soft uppercase tracking-[0.26em]">
              <span className="w-8 h-px bg-gold/60" />
              Join VIP Club
            </span>
            <h3 className="font-editorial text-2xl sm:text-3xl font-medium text-white tracking-tight">
              Get ₹100 Off Your First Order
            </h3>
            <p className="text-xs text-stone-400 font-light leading-relaxed">
              Subscribe for exclusive flash deal notifications, new arrivals, and direct WhatsApp offers. Works for new users.
            </p>
          </div>

          <form onSubmit={handleSubscribe} className="relative w-full md:w-auto flex flex-col sm:flex-row gap-2.5 min-w-[320px]">
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
              className="px-7 py-3 bg-gold hover:bg-gold-soft text-ink font-semibold uppercase tracking-[0.16em] rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-60 hover:shadow-lg hover:shadow-gold/20 hover:-translate-y-0.5"
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

        {/* Links Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 pt-4">

          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              {footerLogo ? (
                <img src={getImageUrl(footerLogo)} alt={siteName} className="h-9 w-auto max-w-[160px] object-contain" />
              ) : (
                <span className="font-editorial text-xl sm:text-2xl font-semibold tracking-tight text-white">
                  {siteName}
                  <span className="text-gold">.</span>
                </span>
              )}
            </div>
            <p className="text-xs text-stone-400 leading-relaxed max-w-sm font-light">
              Your personal online store for sarees, ethnic wear, kitchen appliances, home decor, and smart tech. Delivering happiness across India with Cash on Delivery & Free Shipping.
            </p>
            <div className="space-y-2 text-stone-400 pt-2">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gold-soft" />
                <span>Express Dispatch Center • Mumbai & Delhi NCR, India</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gold-soft" />
                <span>+91 98765 43210 (WhatsApp Support 24/7)</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-white uppercase tracking-[0.18em]">Quick Links</h4>
            <ul className="space-y-2.5 text-stone-400">
              <li><Link to="/" className="hover:text-gold-soft transition-colors duration-200">Home</Link></li>
              <li><Link to="/products" className="hover:text-gold-soft transition-colors duration-200">All Products</Link></li>
              <li><Link to="/sales" className="hover:text-gold-soft transition-colors duration-200">Hot Deals</Link></li>
              <li><Link to="/about" className="hover:text-gold-soft transition-colors duration-200">About Us</Link></li>
              <li><Link to="/contact" className="hover:text-gold-soft transition-colors duration-200">Contact Us</Link></li>
            </ul>
          </div>

          {/* Customer Care */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-white uppercase tracking-[0.18em]">Customer Care</h4>
            <ul className="space-y-2.5 text-stone-400">
              <li><Link to="/track-order" className="hover:text-gold-soft transition-colors duration-200">Order Tracking</Link></li>
              <li><Link to="/return-policy" className="hover:text-gold-soft transition-colors duration-200">Returns & Refunds</Link></li>
              <li><Link to="/privacy-policy" className="hover:text-gold-soft transition-colors duration-200">Privacy Policy</Link></li>
              <li><Link to="/contact" className="hover:text-gold-soft transition-colors duration-200">Help Center & FAQ</Link></li>
            </ul>
          </div>

          {/* Trust & Payments */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-white uppercase tracking-[0.18em]">Accepted Payments</h4>
            <div className="grid grid-cols-2 gap-2 text-stone-400 text-[11px]">
              <span className="p-2 bg-white/[0.04] border border-white/10 rounded-lg text-center font-semibold text-white">VISA</span>
              <span className="p-2 bg-white/[0.04] border border-white/10 rounded-lg text-center font-semibold text-white">Mastercard</span>
              <span className="p-2 bg-white/[0.04] border border-white/10 rounded-lg text-center font-semibold text-gold-soft">PayPal</span>
              <span className="p-2 bg-white/[0.04] border border-white/10 rounded-lg text-center font-semibold text-stone-200">Apple Pay</span>
            </div>
            <div className="pt-2 flex items-center gap-1.5 text-[11px] text-gold-soft font-medium">
              <ShieldCheck className="w-4 h-4" />
              <span>Verified Safe Checkout</span>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="pt-8 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between text-stone-500 gap-4 text-[11px]">
          <p>© {new Date().getFullYear()} {siteName}. All rights reserved.</p>
          <div className="flex gap-4">
            <Link to="/privacy-policy" className="hover:text-stone-300 transition-colors">Privacy Policy</Link>
            <Link to="/return-policy" className="hover:text-stone-300 transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
