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
    <div className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-stone-200 py-2 px-4 z-40 sm:hidden flex items-center justify-around shadow-lg safe-area-bottom">
      <button
        onClick={() => navigate('/')}
        className={`flex flex-col items-center gap-0.5 ${isActive('/') && !isActive('/products') ? 'text-amber-600' : 'text-stone-600 hover:text-amber-600'}`}
      >
        <Home className="w-5 h-5" />
        <span className="text-[10px] font-semibold">Home</span>
      </button>
      <button
        onClick={() => navigate('/products')}
        className={`flex flex-col items-center gap-0.5 ${isActive('/products') ? 'text-amber-600' : 'text-stone-600 hover:text-amber-600'}`}
      >
        <Store className="w-5 h-5" />
        <span className="text-[10px] font-semibold">Catalog</span>
      </button>
      <button
        onClick={() => navigate('/wishlist')}
        className="relative flex flex-col items-center gap-0.5 text-stone-600 hover:text-amber-600"
      >
        <Heart className="w-5 h-5" />
        {wishlistCount > 0 && (
          <span className="absolute -top-1 right-1 bg-rose-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
            {wishlistCount > 9 ? '9+' : wishlistCount}
          </span>
        )}
        <span className="text-[10px] font-semibold">Wishlist</span>
      </button>
      <button
        onClick={() => navigate('/cart')}
        className="relative flex flex-col items-center gap-0.5 text-stone-900 hover:text-amber-600"
      >
        <ShoppingBag className="w-5 h-5" />
        {cartCount > 0 && (
          <span className="absolute -top-1 right-0 bg-amber-500 text-stone-950 text-[9px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center border border-white">
            {cartCount > 9 ? '9+' : cartCount}
          </span>
        )}
        <span className="text-[10px] font-extrabold">Cart</span>
      </button>
    </div>
  );
}
