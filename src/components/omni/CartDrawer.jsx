import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Trash2, ShoppingBag, ArrowRight, Truck, Tag, ShieldCheck, Check, Plus, Minus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useCartStore from '../../store/cartStore';
import { getImageUrl, formatCurrency } from '../../utils/formatters';

export default function CartDrawer() {
  const navigate = useNavigate();
  const { items: cartItems, count, subtotal, isOpen, closeCart, updateQuantity, removeItem, clearCart } = useCartStore();
  const [promoInput, setPromoInput] = useState('');
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoMessage, setPromoMessage] = useState(null);

  const discountAmount = (subtotal * promoDiscount) / 100;
  const freeShippingThreshold = 999; // ₹999 for free shipping
  const amountAwayFromFreeShipping = Math.max(0, freeShippingThreshold - subtotal);
  const isFreeShipping = subtotal >= freeShippingThreshold || cartItems.length === 0;
  const total = Math.max(0, subtotal - discountAmount);

  const handlePromoSubmit = (e) => {
    e.preventDefault();
    if (!promoInput.trim()) return;
    const code = promoInput.trim().toUpperCase();
    if (code === 'WELCOME10') {
      setPromoDiscount(10);
      setPromoMessage({ text: 'Promo code applied! 10% Off', isError: false });
    } else {
      setPromoMessage({ text: 'Invalid promo code. Try: WELCOME10', isError: true });
    }
  };

  // Close on escape key
  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') closeCart(); };
    if (isOpen) document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, closeCart]);

  const handleCheckout = () => {
    closeCart();
    navigate('/checkout');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-stone-950/60 backdrop-blur-sm"
            onClick={closeCart}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-y-0 right-0 max-w-full flex pl-10"
          >
            <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col border-l border-stone-200">
              
              {/* Header */}
              <div className="p-4 sm:p-6 bg-stone-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-amber-400" />
                  <h2 className="text-base font-bold">Your Cart ({cartItems.length})</h2>
                </div>
                <button onClick={closeCart} className="p-1.5 rounded-full hover:bg-stone-800 text-stone-400 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Free Shipping Progress */}
              <div className="bg-amber-50 border-b border-amber-200/80 p-3.5 px-6">
                <div className="flex items-center gap-2 text-xs font-semibold text-amber-900 mb-1.5">
                  <Truck className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  {isFreeShipping ? (
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                      <Check className="w-4 h-4" /> Free Express Shipping!
                    </span>
                  ) : (
                    <span>Add <strong>{formatCurrency(amountAwayFromFreeShipping)}</strong> more for FREE Shipping!</span>
                  )}
                </div>
                <div className="w-full bg-amber-200/70 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (subtotal / freeShippingThreshold) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Cart Items */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 divide-y divide-stone-100">
                {cartItems.length === 0 ? (
                  <div className="text-center py-16 text-stone-400 space-y-3">
                    <ShoppingBag className="w-12 h-12 mx-auto text-stone-300" />
                    <p className="text-sm font-semibold text-stone-700">Your cart is empty</p>
                    <p className="text-xs text-stone-400 max-w-xs mx-auto">Browse our products and add items to your cart.</p>
                    <button onClick={closeCart} className="mt-4 px-5 py-2.5 bg-stone-900 hover:bg-amber-600 text-white text-xs font-bold rounded-full transition-colors">
                      Continue Shopping
                    </button>
                  </div>
                ) : (
                  cartItems.map((item) => {
                    const images = item.productimage || item.images || [];
                    const imgUrl = item.imageUrl || images[0]?.url || images[0] || null;
                    return (
                      <div key={item.cartItemId || item.id} className="pt-4 first:pt-0 flex gap-4 items-center">
                        <img
                          src={getImageUrl(imgUrl)}
                          alt={item.name}
                          className="w-16 h-16 object-cover rounded-xl border border-stone-200 flex-shrink-0 bg-stone-50"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-stone-900 line-clamp-1">{item.name}</h4>
                          <span className="text-xs font-extrabold text-stone-900 block mt-1">{formatCurrency(item.price)}</span>
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center border border-stone-200 rounded-lg overflow-hidden bg-stone-50">
                              <button onClick={() => updateQuantity(item.cartItemId || item.id, Math.max(1, item.quantity - 1))} className="px-2 py-0.5 text-stone-600 hover:bg-stone-200 font-bold text-xs">-</button>
                              <span className="px-2.5 text-xs font-bold text-stone-800">{item.quantity}</span>
                              <button onClick={() => updateQuantity(item.cartItemId || item.id, item.quantity + 1)} className="px-2 py-0.5 text-stone-600 hover:bg-stone-200 font-bold text-xs">+</button>
                            </div>
                            <button onClick={() => removeItem(item.cartItemId || item.id)} className="text-stone-400 hover:text-rose-600 transition-colors p-1">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer Summary */}
              {cartItems.length > 0 && (
                <div className="p-4 sm:p-6 bg-stone-50 border-t border-stone-200 space-y-3">
                  
                  {/* Promo Code */}
                  <form onSubmit={handlePromoSubmit} className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5" />
                      <input type="text" value={promoInput} onChange={(e) => setPromoInput(e.target.value)} placeholder="Promo Code (WELCOME10)"
                        className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 uppercase font-mono" />
                    </div>
                    <button type="submit" className="px-3 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-xl transition-colors">Apply</button>
                  </form>
                  {promoMessage && (
                    <p className={`text-[11px] font-semibold ${promoMessage.isError ? 'text-rose-600' : 'text-emerald-700'}`}>{promoMessage.text}</p>
                  )}

                  {/* Price Breakdown */}
                  <div className="space-y-1.5 text-xs text-stone-600 pt-2 border-t border-stone-200">
                    <div className="flex justify-between"><span>Subtotal</span><span className="font-semibold text-stone-900">{formatCurrency(subtotal)}</span></div>
                    {promoDiscount > 0 && (
                      <div className="flex justify-between text-emerald-700 font-semibold"><span>Discount ({promoDiscount}%)</span><span>-{formatCurrency(discountAmount)}</span></div>
                    )}
                    <div className="flex justify-between"><span>Shipping</span><span className="font-semibold text-stone-900">{isFreeShipping ? <strong className="text-emerald-700">FREE</strong> : 'Calculated at checkout'}</span></div>
                    <div className="flex justify-between text-base font-extrabold text-stone-900 pt-2 border-t border-stone-200">
                      <span>Total</span><span className="text-amber-700">{formatCurrency(total)}</span>
                    </div>
                  </div>

                  {/* Checkout Button */}
                  <button
                    onClick={handleCheckout}
                    className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
                  >
                    Proceed To Checkout <ArrowRight className="w-4 h-4" />
                  </button>

                  <div className="flex items-center justify-center gap-1 text-[10px] text-stone-400 pt-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Secure 256-Bit SSL Checkout</span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
