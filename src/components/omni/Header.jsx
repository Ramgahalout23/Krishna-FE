import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, ShoppingBag, Heart, Menu, X, Truck, ShieldCheck, User } from 'lucide-react';
import SearchModal from '../common/SearchModal';
import WishlistDrawer from './WishlistDrawer';
import { motion, AnimatePresence } from 'framer-motion';
import useCartStore from '../../store/cartStore';
import useAuthStore from '../../store/authStore';
import { useSettings } from '../../store/useSettings';
import { productsAPI } from '../../api/products';
import { getImageUrl, formatCurrency } from '../../utils/formatters';

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { getSetting } = useSettings();
  const { isAuthenticated, user, logout } = useAuthStore();
  const { count: cartCount, subtotal: cartTotal } = useCartStore();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showWishlistDrawer, setShowWishlistDrawer] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef(null);

  const siteName = getSetting('storeName', 'STORE');
  // Light header → prefer the black logo (logoUrl); white logo (logoDarkUrl) is for dark backgrounds
  const logo = getSetting('logoUrl') || getSetting('logoDarkUrl') || null;
  const [logoFailed, setLogoFailed] = useState(false);


  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }
    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await productsAPI.search(searchQuery);
        const products = res.data?.data?.products || res.data?.data || [];
        setSearchResults(Array.isArray(products) ? products.slice(0, 5) : []);
        setShowSearchDropdown(true);
      } catch {
        setSearchResults([]);
      }
      setIsSearching(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Close search dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSearch = (e) => {
    e?.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setShowSearchDropdown(false);
    }
  };

  const handleProductClick = (product) => {
    const slug = product.slug || product.id;
    navigate(`/products/${slug}`);
    setSearchQuery('');
    setShowSearchDropdown(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md shadow-sm border-b border-stone-200/70">
      {/* Top Announcement Bar */}
      <div className="bg-[#14110E] text-stone-200 text-xs py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex flex-row justify-between items-center gap-2">
          <div className="flex items-center gap-4 text-stone-300 min-w-0">
            <span className="flex items-center gap-1.5 text-gold-soft font-medium tracking-wide truncate">
              <Truck className="w-3.5 h-3.5 shrink-0" /> FREE Delivery on All Orders across India
            </span>
            <span className="hidden md:inline text-stone-600">|</span>
            <span className="hidden md:flex items-center gap-1 text-stone-400 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-gold-soft" /> Cash on Delivery (COD) Available
            </span>
          </div>
          <div className="flex items-center gap-3 text-stone-300 shrink-0">
            <span className="hidden sm:inline-block bg-gold/10 border border-gold/25 text-gold-soft px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-[0.14em] uppercase">
              7 Days Free Return
            </span>
          </div>
        </div>
      </div>

      {/* Main Header Row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3.5">
        <div className="flex items-center justify-between gap-4">

          {/* Logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-stone-700 hover:text-gold-dark transition-colors"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            <Link to="/" className="flex items-center gap-2.5 group">
              {logo && !logoFailed ? (
                <div className="h-10 sm:h-12 flex items-center">
                  <img
                    src={getImageUrl(logo)}
                    alt={siteName}
                    onError={() => setLogoFailed(true)}
                    className="h-full w-auto max-w-[180px] object-contain"
                  />
                </div>
              ) : (
                <span className="font-editorial text-[24px] sm:text-[28px] leading-none font-semibold tracking-tight text-ink group-hover:opacity-85 transition-opacity">
                  {siteName}
                  <span className="text-gold">.</span>
                </span>
              )}
            </Link>
          </div>

          {/* Search Bar with Autocomplete */}
          <div className="hidden md:flex flex-1 max-w-xl relative" ref={searchRef}>
            <form onSubmit={handleSearch} className="relative w-full flex items-center">
              <div className="absolute left-3.5 text-stone-400 pointer-events-none">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                id="desktop-search"
                name="desktop-search"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (e.target.value.trim()) setShowSearchDropdown(true);
                }}
                onFocus={() => { if (searchQuery.trim() && searchResults.length > 0) setShowSearchDropdown(true); }}
                placeholder="Search products, toys, kitchen..."
                autoComplete="off"
                className="w-full pl-10 pr-24 py-2.5 bg-cream hover:bg-white focus:bg-white text-stone-900 text-sm rounded-full border border-stone-200/80 focus:border-gold focus:ring-2 focus:ring-gold/15 outline-none transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => { setSearchQuery(''); setShowSearchDropdown(false); }}
                  className="absolute right-20 text-stone-400 hover:text-stone-600 p-1"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button type="submit" className="absolute right-1 px-4 py-1.5 bg-ink hover:bg-gold hover:text-ink text-white text-xs font-semibold rounded-full transition-all duration-300">
                Search
              </button>
            </form>

            {/* Instant Search Dropdown */}
            <AnimatePresence>
              {showSearchDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-xl border border-stone-200/70 z-50 overflow-hidden divide-y divide-stone-100"
                >
                  {isSearching ? (
                    <div className="p-8 text-center text-sm text-stone-400">Searching...</div>
                  ) : searchResults.length > 0 ? (
                    <>
                      <div className="p-2.5 bg-cream text-[11px] font-medium text-stone-500 uppercase tracking-[0.14em] flex justify-between">
                        <span>Matching Products ({searchResults.length})</span>
                      </div>
                      {searchResults.map((p) => {
                        const images = p.productimage || p.images || [];
                        const imgUrl = images[0]?.url || images[0] || '';
                        return (
                          <div
                            key={p.id}
                            onClick={() => handleProductClick(p)}
                            className="flex items-center gap-3 p-3 hover:bg-cream/80 cursor-pointer transition-colors group"
                          >
                            {imgUrl ? (
                              <img
                                src={getImageUrl(imgUrl)}
                                alt={p.name}
                                className="w-11 h-11 object-cover rounded-lg border border-stone-200 group-hover:scale-105 transition-transform"
                              />
                            ) : (
                              <div className="w-11 h-11 rounded-lg bg-stone-100 flex items-center justify-center text-lg">📦</div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h4 className="text-xs font-semibold text-stone-900 truncate group-hover:text-gold-dark transition-colors">
                                {p.name}
                              </h4>
                              <p className="text-[11px] text-stone-500">{p.categoryLabel || p.category?.name || ''}</p>
                            </div>
                            <div className="text-right">
                              <span className="text-xs font-semibold text-stone-900">{formatCurrency(p.price)}</span>
                              {p.oldPrice && (
                                <span className="block text-[10px] text-stone-400 line-through">{formatCurrency(p.oldPrice)}</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </>
                  ) : searchQuery.trim() ? (
                    <div className="p-8 text-center text-sm text-stone-400">No products found</div>
                  ) : null}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Action Icons & Cart */}
          <div className="flex items-center gap-2 sm:gap-3">

            {/* Mobile Search Button (search bar is hidden below md) */}
            <button
              onClick={() => setShowSearchModal(true)}
              className="md:hidden p-2.5 text-stone-700 hover:text-gold-dark hover:bg-cream rounded-full transition-colors"
              aria-label="Search products"
              title="Search"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Wishlist Button */}
            <button
              onClick={() => setShowWishlistDrawer(true)}
              className="relative p-2.5 text-stone-700 hover:text-gold-dark hover:bg-cream rounded-full transition-colors"
              title="Wishlist"
            >
              <Heart className="w-5 h-5" />
            </button>

            {/* User/Account */}
            {isAuthenticated ? (
              <Link
                to={user?.role === 'ADMIN' ? '/admin' : '/profile'}
                className="p-2.5 text-stone-700 hover:text-gold-dark hover:bg-cream rounded-full transition-colors hidden sm:flex"
                title="Account"
              >
                <User className="w-5 h-5" />
              </Link>
            ) : (
              <Link
                to="/login"
                className="hidden sm:inline-flex items-center px-5 py-2 bg-ink hover:bg-gold hover:text-ink text-white text-xs font-semibold rounded-full transition-all duration-300"
              >
                Sign In
              </Link>
            )}

            {/* Cart Button */}
            <button
              onClick={() => { useCartStore.getState().openCart(); }}
              className="group relative p-2.5 bg-ink hover:bg-gold text-white rounded-xl transition-all duration-300 flex items-center gap-2 shadow-sm"
              title="Cart"
            >
              <ShoppingBag className="w-5 h-5 text-gold-soft group-hover:text-ink transition-colors" />
              <div className="hidden sm:flex flex-col text-left leading-none">
                <span className="text-[10px] text-stone-400 group-hover:text-ink/60 font-medium transition-colors">My Cart</span>
                <span className="text-xs font-semibold text-white group-hover:text-ink transition-colors">{formatCurrency(cartTotal)}</span>
              </div>
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-gold text-ink text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

      </div>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-white border-t border-stone-200 px-4 pt-2 pb-6 space-y-3 overflow-hidden"
          >
            <div className="border-t border-stone-100 pt-3 space-y-2">
              {isAuthenticated ? (
                <>
                  <Link to="/profile" className="block px-2 py-2 text-xs font-semibold text-stone-700 hover:text-gold-dark transition-colors">My Account</Link>
                  <Link to="/orders" className="block px-2 py-2 text-xs font-semibold text-stone-700 hover:text-gold-dark transition-colors">My Orders</Link>
                  <button onClick={logout} className="block px-2 py-2 text-xs font-semibold text-red-600 hover:text-red-700">Sign Out</button>
                </>
              ) : (
                <Link to="/login" className="block px-2 py-2 text-xs font-semibold text-gold-dark hover:text-gold transition-colors">Sign In</Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Search Modal */}
      <SearchModal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
      />

      {/* Wishlist Drawer */}
      <WishlistDrawer
        isOpen={showWishlistDrawer}
        onClose={() => setShowWishlistDrawer(false)}
      />

    </header>
  );
}
