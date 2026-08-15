import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Star, Heart, ShoppingBag, ShieldCheck, Truck, RotateCcw, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useCartStore from '../../store/cartStore';
import useWishlistStore from '../../store/wishlistStore';
import { getImageUrl, formatCurrency } from '../../utils/formatters';
import { wishlistAPI } from '../../api/wishlist';
import { addedToCart, addedToWishlist, removedFromWishlist } from '../../utils/toast';

export default function QuickViewModal({ product, onClose }) {
  const navigate = useNavigate();
  const { addItem } = useCartStore();
  const { isInWishlist, addItem: addToWL, removeItem: removeFromWL } = useWishlistStore();
  const [selectedImg, setSelectedImg] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  if (!product) return null;

  const images = product.productimage || product.images || [];
  const imgUrl = product.imageUrl || images[0]?.url || images[0] || null;
  const allImages = images.length > 0 ? images.map(i => i?.url || i) : [imgUrl].filter(Boolean);
  const inWishlist = isInWishlist(product.id);

  const handleAdd = () => {
    addItem({ ...product, productId: product.id, quantity });
    setIsAdded(true);
    addedToCart(product.name);
    setTimeout(() => setIsAdded(false), 1500);
  };

  const handleWishlist = async (e) => {
    e.stopPropagation();
    try {
      if (inWishlist) {
        await wishlistAPI.remove(product.id);
        removeFromWL(product.id);
        removedFromWishlist();
      } else {
        await wishlistAPI.add({ productId: product.id });
        addToWL(product);
        addedToWishlist();
      }
    } catch {
      inWishlist ? removeFromWL(product.id) : addToWL(product);
    }
  };

  return (
    <AnimatePresence>
      {product && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-sm overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden border border-stone-200 my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={onClose} className="absolute top-4 right-4 z-20 p-2 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors">
              <X className="w-5 h-5" />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2">
              {/* Image Gallery */}
              <div className="p-6 bg-stone-50 border-r border-stone-100 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="aspect-square bg-white rounded-2xl overflow-hidden border border-stone-200 shadow-inner relative">
                    <img src={getImageUrl(allImages[selectedImg] || allImages[0])} alt={product.name}
                      className="w-full h-full object-cover object-center" />
                    {product.discountPercentage && (
                      <span className="absolute top-3 left-3 bg-rose-600 text-white font-extrabold text-xs px-2.5 py-1 rounded-full shadow">
                        -{product.discountPercentage}% OFF
                      </span>
                    )}
                  </div>
                  {allImages.length > 1 && (
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                      {allImages.map((img, idx) => (
                        <button key={idx} onClick={() => setSelectedImg(idx)}
                          className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 ${selectedImg === idx ? 'border-amber-600 ring-2 ring-amber-500/20' : 'border-stone-200 opacity-70 hover:opacity-100'}`}>
                          <img src={getImageUrl(img)} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {/* Guarantees */}
                <div className="mt-6 pt-4 border-t border-stone-200/80 grid grid-cols-3 gap-2 text-center text-[10px] text-stone-600 font-medium">
                  <div className="flex flex-col items-center gap-1"><Truck className="w-4 h-4 text-amber-600" /><span>Fast Shipping</span></div>
                  <div className="flex flex-col items-center gap-1"><ShieldCheck className="w-4 h-4 text-emerald-600" /><span>Original Warranty</span></div>
                  <div className="flex flex-col items-center gap-1"><RotateCcw className="w-4 h-4 text-amber-600" /><span>7-Day Returns</span></div>
                </div>
              </div>

              {/* Product Details */}
              <div className="p-6 md:p-8 flex flex-col justify-between space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full">
                      {product.categoryLabel || product.category?.name || ''}
                    </span>
                    <span className="text-xs text-stone-400 font-medium">SKU: {product.id}</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-stone-900 tracking-tight leading-snug mb-2">
                    {product.name}
                  </h2>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-4 h-4 ${i < Math.floor(product.rating || 0) ? 'fill-amber-400' : 'text-stone-300'}`} />
                      ))}
                    </div>
                    <span className="text-xs font-bold text-stone-800">{product.rating || 0}</span>
                    <span className="text-xs text-stone-400">({product.reviewCount || 0} reviews)</span>
                  </div>

                  {/* Price */}
                  <div className="flex items-baseline gap-3 mb-4 p-3 bg-stone-50 rounded-2xl border border-stone-100">
                    <span className="text-2xl font-black text-stone-900">{formatCurrency(product.price)}</span>
                    {product.oldPrice && <span className="text-sm text-stone-400 line-through">{formatCurrency(product.oldPrice)}</span>}
                    <span className="ml-auto text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">Free COD</span>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-stone-600 leading-relaxed mb-4">{product.description || ''}</p>

                  {/* Highlights */}
                  {product.highlights && product.highlights.length > 0 && (
                    <ul className="space-y-1 mb-4">
                      {product.highlights.slice(0, 4).map((h, i) => (
                        <li key={i} className="text-xs text-stone-700 flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Actions */}
                <div className="pt-4 border-t border-stone-200 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center border border-stone-300 rounded-2xl overflow-hidden bg-stone-50">
                      <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="px-3.5 py-2.5 text-stone-600 hover:bg-stone-200 font-bold">-</button>
                      <span className="px-4 py-2.5 font-bold text-xs text-stone-900">{quantity}</span>
                      <button onClick={() => setQuantity(q => Math.min(99, q + 1))} className="px-3.5 py-2.5 text-stone-600 hover:bg-stone-200 font-bold">+</button>
                    </div>
                    <button onClick={handleAdd}
                      className={`flex-1 py-3 px-6 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg ${isAdded ? 'bg-emerald-600 text-white' : 'bg-stone-900 hover:bg-amber-600 text-white'}`}>
                      {isAdded ? <><Check className="w-4 h-4" /> Added To Cart!</> : <><ShoppingBag className="w-4 h-4" /> Add To Cart</>}
                    </button>
                  </div>
                  <div className="flex items-center justify-between text-xs text-stone-600 pt-1">
                    <button onClick={handleWishlist} className="flex items-center gap-1.5 hover:text-rose-600 font-semibold transition-colors">
                      <Heart className={`w-4 h-4 ${inWishlist ? 'text-rose-600 fill-rose-600' : ''}`} />
                      {inWishlist ? 'Saved' : 'Add to Wishlist'}
                    </button>
                    <button onClick={() => { onClose(); navigate(`/products/${product.slug || product.id}`); }}
                      className="text-amber-700 font-semibold hover:text-amber-800 transition-colors">
                      View Full Details →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
