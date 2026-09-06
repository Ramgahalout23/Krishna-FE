import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Store, Heart, ShoppingBag } from 'lucide-react';
import useCartStore from '../../store/cartStore';
import useWishlistStore from '../../store/wishlistStore';

export default function MobileNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { count: cartCount } = useCartStore();
  const { count: wishlistCount } = useWishlistStore();

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + (path === '/' ? '' : '/'));

  return (
    <div className="fixed bottom-0 inset-x-0 bg-cream/95 backdrop-blur-md border-t border-stone-200/70 py-2.5 px-6 z-40 sm:hidden flex items-center justify-around shadow-[0_-8px_30px_rgba(28,25,23,0.06)] safe-area-bottom">
      <button
        onClick={() => navigate('/')}
        className={`flex flex-col items-center gap-0.5 min-w-[56px] transition-colors duration-200 ${isActive('/') && !isActive('/products') ? 'text-gold-dark' : 'text-stone-500 hover:text-gold-dark'}`}
      >
        <Home className="w-[22px] h-[22px]" />
        <span className="text-[10px] font-semibold">Home</span>
      </button>
      <button
        onClick={() => navigate('/products')}
        className={`flex flex-col items-center gap-0.5 min-w-[56px] transition-colors duration-200 ${isActive('/products') ? 'text-gold-dark' : 'text-stone-500 hover:text-gold-dark'}`}
      >
        <Store className="w-[22px] h-[22px]" />
        <span className="text-[10px] font-semibold">Catalog</span>
      </button>
      <button
        onClick={() => navigate('/wishlist')}
        className="relative flex flex-col items-center gap-0.5 min-w-[56px] text-stone-500 hover:text-gold-dark transition-colors duration-200"
      >
        <Heart className="w-[22px] h-[22px]" />
        {wishlistCount > 0 && (
          <span className="absolute -top-1 right-1 bg-rose-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
            {wishlistCount > 9 ? '9+' : wishlistCount}
          </span>
        )}
        <span className="text-[10px] font-semibold">Wishlist</span>
      </button>
      <button
        onClick={() => navigate('/cart')}
        className="relative flex flex-col items-center gap-0.5 min-w-[56px] text-stone-800 hover:text-gold-dark transition-colors duration-200"
      >
        <ShoppingBag className="w-[22px] h-[22px]" />
        {cartCount > 0 && (
          <span className="absolute -top-1 right-0 bg-gold text-ink text-[9px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center border border-white">
            {cartCount > 9 ? '9+' : cartCount}
          </span>
        )}
        <span className="text-[10px] font-extrabold">Cart</span>
      </button>
    </div>
  );
}
