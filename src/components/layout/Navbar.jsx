import { ShoppingCart, Search, User, Menu, X, Heart, LogOut, Home, ArrowRight, LayoutDashboard, ChevronDown, TrendingUp, Clock, Loader2 } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import NotificationBell from '../common/NotificationBell';
import SearchModal from '../common/SearchModal';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import useAuthStore from '../../store/authStore';
import useCartStore from '../../store/cartStore';
import { useSettings } from '../../store/useSettings';
import { productsAPI } from '../../api/products';
import { categoriesAPI } from '../../api/categories';
import { getImageUrl, formatCurrency } from '../../utils/formatters';
import { useAppInit } from '../../contexts/AppInitContext';
import CurrencySwitcher from '../common/CurrencySwitcher';
import LanguageSwitcher from '../common/LanguageSwitcher';

// ── Premium header — refined, minimal, luxury-inspired ───
const BRAND = '#ffffff';
const BRAND_ACCENT = '#f59e0b';
const TEXT_DARK = '#111111';
const TEXT_MUTED = '#6b7280';
const BORDER_LIGHT = 'rgba(0,0,0,0.06)';

/* ── Navbar Skeleton — shimmer placeholders while app init loads ── */
function SkeletonBar({ className = '' }) {
  return (
    <div className={`animate-pulse rounded-full bg-gray-200/60 ${className}`} />
  );
}

function NavbarSkeleton() {
  return (
    <header className="sticky top-0 z-sticky flex flex-col" style={{ 
      background: '#ffffff',
      borderBottom: '1px solid rgba(0,0,0,0.05)'
    }}>
      <nav>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16 gap-4">

            {/* Mobile left — skeleton icons */}
            <div className="flex items-center gap-1.5 lg:hidden">
              <SkeletonBar className="w-9 h-9 rounded-xl" />
              <SkeletonBar className="w-9 h-9 rounded-xl" />
            </div>

            {/* Logo skeleton */}
            <SkeletonBar className="h-9 sm:h-11 w-[120px] sm:w-[150px]" />

            {/* Desktop search bar skeleton */}
            <div className="hidden lg:flex items-center flex-1 max-w-2xl mx-6">
              <div className="relative w-full flex items-center">
                <SkeletonBar className="h-[42px] w-[120px] rounded-l-xl" />
                <SkeletonBar className="h-[42px] flex-1 rounded-none mx-0" />
                <SkeletonBar className="h-[42px] w-[90px] rounded-r-xl" />
              </div>
            </div>

            {/* Right actions skeleton */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <div className="hidden lg:flex items-center gap-1.5">
                <SkeletonBar className="w-8 h-8 rounded-lg" />
                <SkeletonBar className="w-8 h-8 rounded-lg" />
                <SkeletonBar className="w-10 h-10 rounded-xl" />
              </div>
              <SkeletonBar className="w-10 h-10 rounded-xl" />
              <SkeletonBar className="w-10 h-10 rounded-xl" />
            </div>
          </div>
        </div>
      </nav>

      {/* Secondary nav skeleton */}
      <div className="hidden lg:block" style={{ borderTop: '1px solid rgba(0,0,0,0.05)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-10 gap-3">
            <SkeletonBar className="h-4 w-12" />
            <SkeletonBar className="h-4 w-16" />
            <SkeletonBar className="h-4 w-14" />
            <SkeletonBar className="h-4 w-20" />
            <div className="flex-1" />
            <SkeletonBar className="h-4 w-24" />
            <SkeletonBar className="h-4 w-16" />
          </div>
        </div>
      </div>
    </header>
  );
}

export default function Navbar() {
  const { t } = useTranslation();
  const { isAuthenticated, user, logout } = useAuthStore();
  const { count } = useCartStore();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = isAuthenticated && (user?.role === 'ADMIN' || localStorage.getItem('adminToken'));
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [showAccount, setShowAccount] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const searchRef = useRef(null);
  const searchInputRef = useRef(null);

  // ── Search Bar State ──
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [categories, setCategories] = useState([]);
  const categoryDropdownRef = useRef(null);
  const suggestionsRef = useRef(null);

  const { getSetting } = useSettings();
  const siteName = getSetting('storeName', 'THREVOLT');
  const logo = getSetting('logoDarkUrl') || getSetting('logoUrl') || null;

  // Use consolidated app-init data for nav — replaces 2 individual API calls
  const { data: appInitData, loading: appInitLoading } = useAppInit();
  const activePromotions = appInitData?.promotions || [];
  const customPages = appInitData?.pages || [];
  const keySettings = appInitData?.keySettings || {};
  const hasActivePromotions = activePromotions.length > 0;

  // Sync brand colors from settings onto CSS custom properties
  useEffect(() => {
    const primary = getSetting('primaryColor');
    const secondary = getSetting('secondaryColor');
    if (primary) document.documentElement.style.setProperty('--primary', primary);
    if (secondary) document.documentElement.style.setProperty('--secondary', secondary);
  }, [getSetting]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // ── Fetch Categories for Search Dropdown ──
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await categoriesAPI.getAll();
        const cats = res.data?.data || res.data || [];
        setCategories(Array.isArray(cats) ? cats : []);
      } catch {
        setCategories([]);
      }
    };
    fetchCategories();
  }, []);

  // ── Debounced Search Suggestions ──
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchSuggestions([]);
      setShowSuggestions(false);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await productsAPI.search(searchQuery);
        const products = res.data?.data?.products || res.data?.data || [];
        setSearchSuggestions(Array.isArray(products) ? products.slice(0, 8) : []);
        setShowSuggestions(true);
      } catch {
        setSearchSuggestions([]);
      }
      setIsSearching(false);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // ── Close suggestions/category dropdown on outside click ──
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSuggestions(false);
        setSearchFocused(false);
      }
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(e.target)) {
        setShowCategoryDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e) => {
    e?.preventDefault();
    const q = searchQuery.trim();
    if (q) {
      saveRecentSearch(q);
      const categoryParam = selectedCategory !== 'all' ? `&category=${selectedCategory}` : '';
      navigate(`/products?q=${encodeURIComponent(q)}${categoryParam}`);
      setSearchQuery('');
      setShowSuggestions(false);
      searchInputRef.current?.blur();
    }
  };

  const handleSuggestionClick = (suggestion) => {
    const slug = suggestion.slug || '';
    if (slug) {
      navigate(`/products/${slug}`);
    } else {
      navigate(`/products?q=${encodeURIComponent(suggestion.name || suggestion)}`);
    }
    setSearchQuery('');
    setShowSuggestions(false);
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions || searchSuggestions.length === 0) {
      if (e.key === 'Enter') handleSearch(e);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedSuggestionIndex(prev => 
        prev < searchSuggestions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedSuggestionIndex(prev => 
        prev > 0 ? prev - 1 : searchSuggestions.length - 1
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedSuggestionIndex >= 0 && searchSuggestions[selectedSuggestionIndex]) {
        handleSuggestionClick(searchSuggestions[selectedSuggestionIndex]);
      } else {
        handleSearch(e);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      searchInputRef.current?.blur();
    }
  };

  const handleCategorySelect = (category) => {
    setSelectedCategory(category.id || 'all');
    setShowCategoryDropdown(false);
  };

  const TRENDING_SEARCHES = [
    'Oversized T-Shirt',
    'Graphic Tees',
    'White Polo',
    'Black Hoodie',
    'Cotton Crew Neck',
    'Streetwear',
  ];

  // Recent searches from localStorage
  const [recentSearches, setRecentSearches] = useState([]);
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('recentSearches') || '[]');
      setRecentSearches(saved.slice(0, 5));
    } catch { setRecentSearches([]); }
  }, []);

  const saveRecentSearch = (query) => {
    try {
      const saved = JSON.parse(localStorage.getItem('recentSearches') || '[]');
      const updated = [query, ...saved.filter(s => s !== query)].slice(0, 5);
      localStorage.setItem('recentSearches', JSON.stringify(updated));
      setRecentSearches(updated);
    } catch {}
  };

  const selectedCategoryName = selectedCategory === 'all' 
    ? 'All Categories' 
    : (categories.find(c => c.id === selectedCategory)?.name || 'All Categories');

  // ── Show skeleton while app-init data loads ──
  if (appInitLoading) {
    return <NavbarSkeleton />;
  }

  return (
    <header 
      className="sticky top-0 z-sticky transition-all duration-500 flex flex-col"
      style={{
        background: BRAND,
        boxShadow: scrolled 
          ? '0 4px 24px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)' 
          : 'none',
        borderBottom: scrolled ? 'none' : `1px solid ${BORDER_LIGHT}`,
      }}
    >
      {/* Main Navbar */}
      <nav>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16 gap-4">

            {/* Mobile Left — Menu + Search (hidden on desktop) */}
            <div className="flex items-center lg:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-600 hover:text-gray-900 transition-all duration-200 hover:bg-gray-50 rounded-xl"
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? <X size={21} /> : <Menu size={21} />}
              </button>
              <button
                onClick={() => setShowSearchModal(true)}
                className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-600 hover:text-gray-900 transition-all duration-200 rounded-xl hover:bg-gray-50"
                aria-label="Search"
              >
                <Search size={19} />
              </button>
            </div>

            {/* Logo — centered, more prominent */}
            <Link to="/" className="flex items-center flex-shrink-0 group py-1">
              {logo ? (
                <div className="h-10 sm:h-12 flex items-center transition-all duration-300 group-hover:scale-[1.02]">
                  <img 
                    src={getImageUrl(logo)} 
                    alt={siteName} 
                    className="h-full w-auto max-w-[180px] object-contain" 
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                </div>
              ) : (
                <span className="font-display text-xl sm:text-2xl font-bold tracking-tight transition-all duration-300 group-hover:opacity-80">
                  <span style={{ color: TEXT_DARK }}>{siteName || 'STORE'}</span>
                </span>
              )}
            </Link>

            {/* ── Desktop: Search Bar — premium refined ── */}
            <div className="hidden lg:flex items-center flex-1 max-w-2xl mx-6" ref={searchRef}>
              <form onSubmit={handleSearch} className="relative w-full flex items-center">
                {/* Category Dropdown (left side) */}
                <div className="relative" ref={categoryDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                    className="flex items-center gap-1.5 px-4 py-2.5 text-[11px] font-semibold tracking-wider uppercase text-gray-500 bg-gray-50/80 rounded-l-xl border border-r-0 border-gray-200/80 hover:bg-gray-100/80 transition-all duration-200 min-w-[120px] justify-between whitespace-nowrap"
                  >
                    <span className="truncate">{selectedCategoryName}</span>
                    <ChevronDown size={12} className={`transition-transform duration-300 ${showCategoryDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {showCategoryDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.97 }}
                        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-dropdown"
                      >
                        <div className="max-h-64 overflow-y-auto py-1.5">
                          <button
                            type="button"
                            onClick={() => handleCategorySelect({ id: 'all' })}
                            className={`w-full text-left px-4 py-2.5 text-sm transition-all duration-150 ${
                              selectedCategory === 'all' 
                                ? 'bg-gray-50 text-gray-900 font-semibold' 
                                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                            }`}
                          >
                            All Categories
                          </button>
                          {categories.map(cat => (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => handleCategorySelect(cat)}
                              className={`w-full text-left px-4 py-2.5 text-sm transition-all duration-150 ${
                                selectedCategory === cat.id 
                                  ? 'bg-gray-50 text-gray-900 font-semibold' 
                                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                              }`}
                            >
                              <span className="flex items-center gap-2.5">
                                {cat.icon && <span className="text-base">{cat.icon}</span>}
                                {cat.name}
                              </span>
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Search Input */}
                <div className="relative flex-1">
                  <input
                    ref={searchInputRef}
                    type="text"
                    role="combobox"
                    aria-expanded={showSuggestions && (searchFocused || searchQuery.trim()) ? 'true' : 'false'}
                    aria-controls="search-suggestions-listbox"
                    aria-activedescendant={selectedSuggestionIndex >= 0 ? `suggestion-${selectedSuggestionIndex}` : undefined}
                    aria-autocomplete="list"
                    placeholder={t('search.placeholder') || 'Search for products...'}
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setSelectedSuggestionIndex(-1);
                      if (e.target.value.trim()) {
                        setShowSuggestions(true);
                      }
                    }}
                    onFocus={() => {
                      setSearchFocused(true);
                      if (searchQuery.trim() && searchSuggestions.length > 0) {
                        setShowSuggestions(true);
                      }
                    }}
                    onKeyDown={handleKeyDown}
                    className="w-full py-2.5 pl-5 pr-11 text-sm bg-gray-50/80 text-gray-900 placeholder:text-gray-400 outline-none transition-all duration-200 border border-gray-200/80"
                    style={{
                      borderLeft: 'none',
                      borderRight: 'none',
                    }}
                    autoComplete="off"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => { setSearchQuery(''); setShowSuggestions(false); searchInputRef.current?.focus(); }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100/80 transition-all duration-200"
                      aria-label="Clear search"
                    >
                      <X size={13} />
                    </button>
                  )}

                  {/* Search suggestions dropdown */}
                  <AnimatePresence>
                    {showSuggestions && (searchFocused || searchQuery.trim()) && (
                      <motion.div
                        ref={suggestionsRef}
                        id="search-suggestions-listbox"
                        role="listbox"
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-dropdown"
                      >
                        {isSearching ? (
                          <div className="flex items-center justify-center py-10">
                            <Loader2 size={22} className="animate-spin text-gray-300" />
                          </div>
                        ) : searchSuggestions.length > 0 ? (
                          <div className="py-1">
                            {searchSuggestions.map((product, idx) => {
                              const images = product.productimage || product.images || [];
                              const imgUrl = images[0]?.url || images[0] || null;
                              const price = product.price || 0;
                              return (
                                <button
                                  key={product.id || idx}
                                  id={`suggestion-${idx}`}
                                  role="option"
                                  aria-selected={idx === selectedSuggestionIndex}
                                  type="button"
                                  onClick={() => handleSuggestionClick(product)}
                                  onMouseEnter={() => setSelectedSuggestionIndex(idx)}
                                  className={`w-full flex items-center gap-3.5 px-4 py-3 text-sm transition-all duration-150 ${
                                    idx === selectedSuggestionIndex 
                                      ? 'bg-gray-50/80' 
                                      : 'hover:bg-gray-50/50'
                                  }`}
                                >
                                  {imgUrl ? (
                                    <div className="w-10 h-13 rounded-lg bg-gray-50 overflow-hidden flex-shrink-0 border border-gray-100">
                                      <img 
                                        src={getImageUrl(imgUrl)} 
                                        alt={product.name} 
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                  ) : (
                                    <div className="w-10 h-13 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0 text-lg">
                                      👕
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0 text-left">
                                    <p className="text-gray-900 font-medium truncate leading-snug">{product.name}</p>
                                    <p className="text-xs text-gray-400 mt-0.5 font-medium">
                                      {formatCurrency(price)}
                                    </p>
                                  </div>
                                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-gray-300 group-hover/suggestion:bg-gray-100 transition-colors">
                                    <ArrowRight size={13} />
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        ) : searchQuery.trim() ? (
                          <div className="flex flex-col items-center py-10 px-6 text-center">
                            <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-3">
                              <Search size={22} className="text-gray-300" />
                            </div>
                            <p className="text-sm text-gray-500 font-medium">No results found for <span className="text-gray-800">"{searchQuery}"</span></p>
                            <p className="text-xs text-gray-400 mt-1.5">Try different keywords or browse categories</p>
                          </div>
                        ) : (
                          <div className="p-5 space-y-5">
                            {recentSearches.length > 0 && (
                              <div>
                                <div className="flex items-center gap-2 mb-3">
                                  <Clock size={13} className="text-gray-400" />
                                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-[0.15em]">Recent</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {recentSearches.map((term, i) => (
                                    <button
                                      key={i}
                                      type="button"
                                      onClick={() => {
                                        saveRecentSearch(term);
                                        setSearchQuery(term);
                                        navigate(`/products?q=${encodeURIComponent(term)}`);
                                        setShowSuggestions(false);
                                      }}
                                      className="px-3 py-1.5 rounded-lg bg-gray-50/80 border border-gray-100 text-[11px] font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-all duration-200"
                                    >
                                      {term}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                            <div>
                              <div className="flex items-center gap-2 mb-3">
                                <TrendingUp size={13} className="text-gray-400" />
                                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-[0.15em]">Trending</span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {TRENDING_SEARCHES.map((term, i) => (
                                  <button
                                    key={i}
                                    type="button"
                                    onClick={() => {
                                      saveRecentSearch(term);
                                      setSearchQuery(term);
                                      navigate(`/products?q=${encodeURIComponent(term)}`);
                                      setShowSuggestions(false);
                                    }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50/80 border border-gray-100 text-[11px] font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-all duration-200"
                                  >
                                    <TrendingUp size={11} className="text-gray-300" />
                                    {term}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Search Button — premium accent */}
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2.5 font-semibold text-sm rounded-r-xl bg-stone-900 text-white hover:bg-amber-600 transition-all duration-300 active:scale-[0.97] border border-l-0 border-stone-900 shadow-sm hover:shadow-md"
                >
                  <Search size={15} />
                  <span className="hidden xl:inline">Search</span>
                </button>
              </form>
            </div>

            {/* Right Actions — Premium refined */}
            <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
              {/* Desktop Only — Currency, Language, Wishlist */}
              <div className="hidden lg:flex items-center gap-0.5">
                {getSetting('currencySwitcherEnabled', 'true') !== 'false' && <CurrencySwitcher variant="navbar" />}
                {getSetting('languageSwitcherEnabled', 'true') !== 'false' && <LanguageSwitcher variant="navbar" />}
                <Link 
                  to="/wishlist" 
                  className="relative p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-500 hover:text-gray-900 transition-all duration-200 rounded-xl hover:bg-gray-50/80"
                >
                  <Heart size={19} />
                </Link>
              </div>

              {(isAuthenticated || isAdmin) && <NotificationBell />}

              {/* Account */}
              {(isAuthenticated || isAdmin) ? (
                <div
                  className="relative"
                  onMouseEnter={() => setShowAccount(true)}
                  onMouseLeave={() => setShowAccount(false)}
                >
                  <button className="flex items-center gap-2 px-2.5 sm:px-3 py-2.5 min-h-[44px] rounded-xl text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50/80 transition-all duration-200">
                    <User size={19} />
                    <span className="hidden lg:inline">{isAdmin ? t('nav.admin') : (user?.firstName || t('nav.account'))}</span>
                  </button>

                  <AnimatePresence>
                    {showAccount && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.97 }}
                        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-xl border border-gray-100 min-w-[220px] overflow-hidden z-dropdown"
                      >
                        <div className="p-5 text-white" style={{ background: 'linear-gradient(135deg, #292524 0%, #44403c 100%)' }}>
                          <div className="font-semibold text-sm">{isAdmin ? 'Admin' : (user?.firstName || 'User')}</div>
                          <div className="text-xs text-white/70 mt-0.5">{user?.email || 'Admin User'}</div>
                        </div>
                        <div className="py-1.5">
                          {isAdmin ? (
                            <Link to="/admin" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all duration-150">
                              <LayoutDashboard size={15} className="text-gray-400" />
                              {t('nav.dashboard')}
                            </Link>
                          ) : (
                            <>
                              <Link to="/profile" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all duration-150">
                                <User size={15} className="text-gray-400" />
                                {t('nav.my_profile')}
                              </Link>
                              <Link to="/orders" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all duration-150">
                                <ShoppingCart size={15} className="text-gray-400" />
                                {t('nav.my_orders')}
                              </Link>
                              <Link to="/addresses" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all duration-150">
                                <Home size={15} className="text-gray-400" />
                                {t('nav.addresses')}
                              </Link>
                            </>
                          )}
                        </div>
                        <div className="border-t border-gray-100">
                          <button onClick={async () => {await logout(); localStorage.removeItem('adminToken'); navigate('/');
                            }} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition-all duration-150">
                            <LogOut size={15} />
                            {t('nav.sign_out')}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="lg:hidden p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-500 hover:text-gray-900 transition-all duration-200 rounded-xl hover:bg-gray-50/80"
                  >
                    <User size={19} />
                  </Link>
                  <Link
                    to="/login"
                    className="hidden lg:inline-flex items-center px-6 py-2 rounded-xl text-sm font-semibold bg-stone-900 text-white hover:bg-amber-600 transition-all duration-300 shadow-sm hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
                  >
                    {t('nav.sign_in')}
                  </Link>
                </>
              )}

              {/* Cart — premium badge */}
              <button
                id="cart-btn"
                data-cart-btn
                onClick={() => navigate('/cart')}
                className="relative flex items-center gap-2 p-2.5 min-h-[44px] text-gray-500 hover:text-gray-900 transition-all duration-200 rounded-xl hover:bg-gray-50/80"
              >
                <ShoppingCart size={19} />
                {count > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-amber-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full animate-badge-pop shadow-md">
                    {count > 9 ? '9+' : count}
                  </span>
                )}
                <span className="hidden lg:inline text-sm font-medium">{t('nav.cart')}</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Secondary Navigation — Premium minimal links with entrance animation ── */}
      <motion.div 
        className="hidden lg:block"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.15 }}
        style={{ 
          background: '#ffffff', 
          borderTop: '1px solid rgba(0,0,0,0.05)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <LayoutGroup>
          <div className="flex items-center h-10 gap-0 overflow-x-auto no-scrollbar">
            {[
              { to: '/', label: 'Home' },
              { to: '/products', label: 'Products' },
              ...(hasActivePromotions ? [{ to: '/sales', label: 'Offers' }] : []),
              ...(customPages.slice(0, 4).map(p => ({ to: `/pages/${p.slug}`, label: p.title }))),
            ].map((link, idx) => {
              const isActive = location.pathname === link.to || 
                (link.to === '/products' && location.pathname.startsWith('/products'));
              return (
                <motion.div
                  key={link.to}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ 
                    duration: 0.35, 
                    delay: 0.2 + idx * 0.06,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                >
                  <Link
                    to={link.to}
                    className={`relative px-4 py-2.5 text-[12px] font-medium tracking-wide transition-all duration-200 inline-block ${
                      isActive
                        ? 'text-gray-900'
                        : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    {link.label === 'Offers' ? (                        <span className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                        Offers
                      </span>
                    ) : link.label}
                    {/* Active indicator — refined bottom line */}
                    {isActive && (
                      <motion.div
                        layoutId="navIndicator"
                        className="absolute bottom-0 left-3 right-3 h-[2px] rounded-full"
                        style={{ background: '#f59e0b' }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    )}
                  </Link>
                </motion.div>
              );
            })}
            
            {/* Flex spacer to push LIVE badge to right edge */}
            <div className="flex-1" />
            
            {hasActivePromotions && (
              <motion.span 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 text-[10px] font-semibold text-amber-600 whitespace-nowrap"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                LIVE
              </motion.span>
            )}
          </div>
          </LayoutGroup>
        </div>
      </motion.div>

      {/* Mobile Menu — Premium bottom sheet */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              key="menu-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 z-40 lg:hidden"
              style={{
                background: 'rgba(0, 0, 0, 0.5)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
              }}
              onClick={() => setIsMobileMenuOpen(false)}
            />

            <motion.div
              key="menu-panel"
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', stiffness: 450, damping: 35, mass: 0.9 }}
              className="fixed bottom-0 left-0 right-0 z-50 lg:hidden rounded-t-[32px] overflow-hidden"
              style={{
                maxHeight: '85dvh',
                background: '#ffffff',
                boxShadow: '0 -12px 60px rgba(0,0,0,0.1)',
              }}
            >
              {/* Handle bar */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-gray-300/60" />
              </div>

              {/* Close */}
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 bg-gray-100/80 hover:bg-gray-200"
              >
                <X size={15} className="text-gray-500" />
              </button>

              <div className="px-6 pt-2 pb-[max(1.5rem,env(safe-area-inset-bottom,0px))] overflow-y-auto"
                style={{ maxHeight: 'calc(85dvh - 40px)', overscrollBehavior: 'contain' }}>

                <div className="space-y-4">
                  {/* Profile Section */}
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05, type: 'spring', stiffness: 300, damping: 28 }}
                  >
                    <div className="flex items-center gap-3.5 pb-4 border-b border-gray-100">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
                        style={{
                          background: isAuthenticated
                            ? 'linear-gradient(135deg, #292524 0%, #44403c 100%)'
                            : '#f0f0f0',
                        }}
                      >
                        <User size={19} className={isAuthenticated ? 'text-white' : 'text-gray-400'} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-gray-900 font-semibold text-sm truncate">
                          {isAuthenticated ? (user?.firstName || 'User') : 'Guest'}
                        </div>
                        <div className="text-gray-400 text-xs truncate mt-0.5">
                          {isAuthenticated ? (user?.email || '') : 'Sign in for personalized experience'}
                        </div>
                      </div>
                      {!isAuthenticated && !isAdmin && (
                        <Link
                          to="/login"
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="px-5 py-2 rounded-full text-[11px] font-bold transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm"
                          style={{
                            background: 'linear-gradient(135deg, #292524 0%, #44403c 100%)',
                            color: '#fff',
                          }}
                        >
                          Sign In
                        </Link>
                      )}
                    </div>
                  </motion.div>

                  {/* Navigation Links */}
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, type: 'spring', stiffness: 300, damping: 28 }}
                  >
                    <div className="flex flex-col gap-0.5">
                      {isAdmin && (
                        <Link
                          to="/admin"
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-200 hover:bg-gray-50 active:scale-[0.98] text-gray-700"
                        >
                          <span className="w-9 h-9 rounded-xl flex items-center justify-center bg-gray-100/80">
                            <LayoutDashboard size={16} className="text-gray-500" />
                          </span>
                          <span className="flex-1">Admin Dashboard</span>
                          <ArrowRight size={14} className="text-gray-300" />
                        </Link>
                      )}

                      {[
                        { to: '/', label: 'Home', icon: Home },
                        { to: '/products', label: 'Products', icon: Search },
                        { to: '/wishlist', label: 'Wishlist', icon: Heart },
                        { to: '/cart', label: 'Cart', icon: ShoppingCart },
                      ].map((link) => {
                        const Icon = link.icon;
                        const isLinkActive = location.pathname === link.to;
                        return (
                          <Link
                            key={link.to}
                            to={link.to}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-200 hover:bg-gray-50 active:scale-[0.98]"
                            style={{ color: isLinkActive ? '#f59e0b' : '#4b5563' }}
                          >
                            <span className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ 
                              background: isLinkActive ? 'rgba(245,158,11,0.08)' : '#f5f5f5' 
                            }}>
                              <Icon size={16} className={isLinkActive ? 'text-amber-500' : 'text-gray-400'} />
                            </span>
                            <span className="flex-1">{link.label}</span>
                            {link.to === '/cart' && count > 0 && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-white shadow-sm">
                                {count > 9 ? '9+' : count}
                              </span>
                            )}
                          </Link>
                        );
                      })}

                      {hasActivePromotions && (
                        <Link
                          to="/sales"
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-200 hover:bg-amber-50 active:scale-[0.98]"
                          style={{ color: '#f59e0b' }}
                        >
                          <span className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(245, 158, 11, 0.08)' }}>
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                          </span>
                          <span className="flex-1 font-semibold">Offers</span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-600">LIVE</span>
                        </Link>
                      )}

                      {/* Custom Pages with refined style */}
                      {customPages.slice(0, 5).map((page) => (
                        <Link
                          key={page.slug}
                          to={`/pages/${page.slug}`}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-200 hover:bg-gray-50 active:scale-[0.98]"
                          style={{ color: '#4b5563' }}
                        >
                          <span className="w-9 h-9 rounded-xl flex items-center justify-center bg-gray-100/80">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                              <polyline points="14 2 14 8 20 8" />
                            </svg>
                          </span>
                          {page.title}
                        </Link>
                      ))}
                    </div>
                  </motion.div>

                  {/* Bottom Stack */}
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15, type: 'spring', stiffness: 300, damping: 28 }}
                  >
                    <div className="pt-4 border-t border-gray-100 space-y-3">
                      <div className="flex items-center gap-2 px-4">
                        {getSetting('currencySwitcherEnabled', 'true') !== 'false' && <CurrencySwitcher variant="mobile" />}
                        {getSetting('languageSwitcherEnabled', 'true') !== 'false' && <LanguageSwitcher variant="mobile" />}
                      </div>
                      {(isAuthenticated || isAdmin) && (
                        <button
                          onClick={async () => {
                            await logout();
                            localStorage.removeItem('adminToken');
                            navigate('/');
                          }}
                          className="flex items-center gap-3.5 w-full px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-200 hover:bg-red-50 active:scale-[0.98]"
                          style={{ color: '#ef4444' }}
                        >
                          <span className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#fef2f2' }}>
                            <LogOut size={15} />
                          </span>
                          Sign Out
                        </button>
                      )}
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Search Modal */}
      <SearchModal isOpen={showSearchModal} onClose={() => setShowSearchModal(false)} />

    </header>
  );
}
