import { useNavigate } from 'react-router-dom';
import { X, Heart, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useWishlistStore from '../../store/wishlistStore';
import useCartStore from '../../store/cartStore';
import { getImageUrl, formatCurrency } from '../../utils/formatters';
import { wishlistAPI } from '../../api/wishlist';
import { addedToCart, removedFromWishlist } from '../../utils/toast';

export default function WishlistDrawer({ isOpen, onClose }) {
  const navigate = useNavigate();
  const { items: wishlistItems, removeItem } = useWishlistStore();
  const { addItem } = useCartStore();

  const handleAddToCart = (item) => {
    addItem({ ...item, productId: item.productId || item.id, quantity: 1 });
    addedToCart(item.name);
    onClose();
    navigate('/cart');
  };

  const handleRemove = async (item) => {
    const productId = item.productId || item.id;
    try {
      await wishlistAPI.remove(productId);
    } catch {}
    removeItem(productId);
    removedFromWishlist();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-stone-950/60 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-y-0 right-0 max-w-full flex pl-10"
          >
            <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col border-l border-stone-200">
              
              <div className="p-4 sm:p-6 bg-stone-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-rose-400" />
                  <h2 className="text-base font-bold">My Wishlist ({wishlistItems.length})</h2>
                </div>
                <button onClick={onClose} className="p-1.5 rounded-full hover:bg-stone-800 text-stone-400 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                {wishlistItems.length === 0 ? (
                  <div className="text-center py-16 text-stone-400 space-y-3">
                    <Heart className="w-12 h-12 mx-auto text-stone-300" />
                    <p className="text-sm font-semibold text-stone-700">Your wishlist is empty</p>
                    <p className="text-xs text-stone-400">Save items you love to your wishlist.</p>
                    <button onClick={onClose} className="mt-4 px-5 py-2.5 bg-stone-900 hover:bg-amber-600 text-white text-xs font-bold rounded-full transition-colors">
                      Browse Products
                    </button>
                  </div>
                ) : (
                  wishlistItems.map((item) => {
                    const images = item.productimage || item.images || [];
                    const imgUrl = item.imageUrl || images[0]?.url || images[0] || null;
                    return (
                      <div key={item.productId || item.id} className="flex gap-4 items-center bg-stone-50 rounded-2xl p-3 border border-stone-200">
                        <img
                          src={getImageUrl(imgUrl)}
                          alt={item.name}
                          className="w-16 h-16 object-cover rounded-xl border border-stone-200 flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-stone-900 line-clamp-1">{item.name}</h4>
                          <span className="text-xs font-extrabold text-amber-700 block mt-1">{formatCurrency(item.price)}</span>
                          <div className="flex items-center gap-2 mt-2">
                            <button
                              onClick={() => handleAddToCart(item)}
                              className="flex-1 py-1.5 bg-stone-900 hover:bg-amber-600 text-white text-[10px] font-bold rounded-lg transition-colors flex items-center justify-center gap-1"
                            >
                              <ShoppingBag className="w-3 h-3" /> Add to Cart
                            </button>
                            <button
                              onClick={() => handleRemove(item)}
                              className="p-1.5 text-stone-400 hover:text-rose-600 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {wishlistItems.length > 0 && (
                <div className="p-4 sm:p-6 bg-stone-50 border-t border-stone-200">
                  <button
                    onClick={() => { onClose(); navigate('/wishlist'); }}
                    className="w-full py-3 bg-stone-900 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    View Full Wishlist <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
