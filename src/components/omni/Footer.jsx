import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Check, ShieldCheck, Phone, MapPin, Send } from 'lucide-react';
import { useSettings } from '../../store/useSettings';
import { marketingAPI } from '../../api/marketing';
import toast from '../../utils/toast';

export default function Footer() {
  const navigate = useNavigate();
  const { getSetting } = useSettings();
  const siteName = getSetting('storeName', 'Krishna Store');
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
    <footer className="bg-stone-950 text-stone-300 text-xs pt-16 pb-12 border-t border-stone-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Newsletter Banner */}
        <div className="bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 p-8 sm:p-10 rounded-3xl border border-stone-800 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
          <div className="max-w-md space-y-1">
            <span className="text-xs font-bold text-amber-500 uppercase tracking-widest">
              Join VIP Club
            </span>
            <h3 className="text-xl sm:text-2xl font-extrabold text-white">
              Get ₹100 Off Your First Order
            </h3>
            <p className="text-xs text-stone-400">
              Subscribe for exclusive flash deal notifications, new trending drops, and direct WhatsApp offers. Works for new users.
            </p>
          </div>

          <form onSubmit={handleSubscribe} className="w-full md:w-auto flex flex-col sm:flex-row gap-2.5 min-w-[320px]">
            <div className="relative flex-1">
              <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
              <input
                type="email"
                id="newsletter-email"
                name="newsletter-email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                autoComplete="email"
                className="w-full pl-10 pr-4 py-3 bg-stone-950 border border-stone-700 rounded-2xl text-xs text-white placeholder-stone-500 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold uppercase tracking-wider rounded-2xl transition-colors flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-60"
            >
              {submitting ? (
                <><span className="w-4 h-4 border-2 border-stone-950/30 border-t-stone-950 rounded-full animate-spin" /> Subscribing...</>
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
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 via-rose-600 to-amber-700 flex items-center justify-center text-stone-950 font-black text-lg">
                K
              </div>
              <span className="text-xl font-extrabold tracking-tight text-white">
                {siteName}
              </span>
            </div>
            <p className="text-xs text-stone-400 leading-relaxed max-w-sm">
              Your personal online store for sarees, ethnic wear, kitchen appliances, home decor, and smart tech. Delivering happiness across India with Cash on Delivery & Free Shipping.
            </p>
            <div className="space-y-2 text-stone-400 pt-2">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-amber-500" />
                <span>Express Dispatch Center • Mumbai & Delhi NCR, India</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-amber-500" />
                <span>+91 98765 43210 (WhatsApp Support 24/7)</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Quick Links</h4>
            <ul className="space-y-2 text-stone-400">
              <li><Link to="/" className="hover:text-amber-400 transition-colors">Home</Link></li>
              <li><Link to="/products" className="hover:text-amber-400 transition-colors">All Products</Link></li>
              <li><Link to="/sales" className="hover:text-amber-400 transition-colors">Hot Deals</Link></li>
              <li><Link to="/about" className="hover:text-amber-400 transition-colors">About Us</Link></li>
              <li><Link to="/contact" className="hover:text-amber-400 transition-colors">Contact Us</Link></li>
            </ul>
          </div>

          {/* Customer Care */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Customer Care</h4>
            <ul className="space-y-2 text-stone-400">
              <li><Link to="/track-order" className="hover:text-amber-400 transition-colors">Order Tracking</Link></li>
              <li><Link to="/return-policy" className="hover:text-amber-400 transition-colors">Returns & Refunds</Link></li>
              <li><Link to="/privacy-policy" className="hover:text-amber-400 transition-colors">Privacy Policy</Link></li>
              <li><Link to="/contact" className="hover:text-amber-400 transition-colors">Help Center & FAQ</Link></li>
            </ul>
          </div>

          {/* Trust & Payments */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Accepted Payments</h4>
            <div className="grid grid-cols-2 gap-2 text-stone-400 text-[11px]">
              <span className="p-2 bg-stone-900 border border-stone-800 rounded-lg text-center font-bold text-white">VISA</span>
              <span className="p-2 bg-stone-900 border border-stone-800 rounded-lg text-center font-bold text-white">Mastercard</span>
              <span className="p-2 bg-stone-900 border border-stone-800 rounded-lg text-center font-bold text-blue-400">PayPal</span>
              <span className="p-2 bg-stone-900 border border-stone-800 rounded-lg text-center font-bold text-stone-200">Apple Pay</span>
            </div>
            <div className="pt-2 flex items-center gap-1.5 text-[11px] text-emerald-400 font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>Verified Safe Checkout</span>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="pt-8 border-t border-stone-900 flex flex-col sm:flex-row items-center justify-between text-stone-500 gap-4 text-[11px]">
          <p>© {new Date().getFullYear()} {siteName}. All rights reserved.</p>
          <div className="flex gap-4">
            <Link to="/privacy-policy" className="hover:text-stone-300">Privacy Policy</Link>
            <Link to="/return-policy" className="hover:text-stone-300">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
